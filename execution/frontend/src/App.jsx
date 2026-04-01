// execution/frontend/src/App.jsx
// Root component - handles auth state, routing between screens, Firestore reads/writes

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { ThemeContext, light, dark } from "./theme";
import { calcGoals } from "./utils/calculations";

import Login            from "./components/Login";
import Onboarding       from "./components/Onboarding";
import OnboardingWizard from "./components/OnboardingWizard";
import Customize        from "./components/Customize";
import MacroTracker  from "./components/MacroTracker";
import WeightTracker from "./components/WeightTracker";
import Settings      from "./components/Settings";
import AboutKhaaya   from "./components/AboutKhaaya";

const TABS = ["Log", "Weight"];

export default function App() {
  const [user,       setUser]       = useState(null);
  const [authReady,  setAuthReady]  = useState(false);
  const [screen,     setScreen]     = useState("login"); // login | onboard | customize | app
  const [isNewUser,  setIsNewUser]  = useState(false);
  const [tab,        setTab]        = useState("Log");
  const [stats,      setStats]      = useState(null);
  const [appearance, setAppearance] = useState(null);
  const [aiGoals,    setAiGoals]    = useState(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => localStorage.getItem("logyourmeal-theme") === "dark");
  const T = isDark ? dark : light;
  const toggle = () => setIsDark(d => {
    const next = !d;
    localStorage.setItem("logyourmeal-theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    return next;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []); // apply saved theme on first mount

  // ── AI goals fetch ────────────────────────────────────────────────────────
  const fetchAiGoals = async (s) => {
    if (!s) return;
    setAiGoals(null); // Show 'Calculating...' state immediately
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/calculate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          age: s.age, weight: s.weight, height: s.height,
          bf: s.bf, sex: s.sex, goal: s.goal,
          activityDescription: s.activityDescription || "",
          targetDate: s.targetDate || null,
          targetWeight: s.targetWeight || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiGoals(data);
    } catch (e) {
      console.error("AI goals fetch failed:", e.message);
    }
  };

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        // First-login detection: creationTime and lastSignInTime within 2 minutes
        const created    = new Date(firebaseUser.metadata.creationTime).getTime();
        const lastSignIn = new Date(firebaseUser.metadata.lastSignInTime).getTime();
        setIsNewUser(Math.abs(lastSignIn - created) < 2 * 60 * 1000);
        try {
          const ref = doc(db, "users", firebaseUser.uid, "profile", "data");
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setStats(data.stats);
            setAppearance(data.appearance);
            if (!data.stats?.customCal) fetchAiGoals(data.stats);
            setScreen("app");
          } else {
            setScreen("onboard");
          }
        } catch (err) {
          console.error("Firestore profile read failed:", err.message);
          setScreen("onboard");
        }
      } else {
        setScreen("login");
      }
    });
    return unsub;
  }, []);

  // ── Save profile to Firestore ─────────────────────────────────────────────
  const saveProfile = async (newStats, newAppearance) => {
    if (!user) return;
    setStats(newStats);
    setAppearance(newAppearance);
    try {
      const ref = doc(db, "users", user.uid, "profile", "data");
      await setDoc(ref, { stats: newStats, appearance: newAppearance });
    } catch (err) {
      console.error("Firestore profile save failed:", err.message);
    }
  };

  const handleOnboardComplete = (newStats) => {
    setStats(newStats);
    setScreen("customize");
  };

  const handleWizardComplete = async (newStats) => {
    setStats(newStats);
    setAppearance(null);
    try {
      const ref = doc(db, "users", user.uid, "profile", "data");
      await setDoc(ref, { stats: newStats, appearance: null });
    } catch (err) {
      console.error("Wizard profile save failed:", err.message);
    }
    fetchAiGoals(newStats);
    setScreen("app");
  };

  const handleCustomizeComplete = async (newAppearance) => {
    setAppearance(newAppearance);
    await saveProfile(stats, newAppearance);
    if (!stats?.customCal) fetchAiGoals(stats);
    setScreen("app");
  };

  const handleEditStatsComplete = async (newStats) => {
    setStats(newStats);
    await saveProfile(newStats, appearance);
    if (!newStats.customCal) fetchAiGoals(newStats);
    setScreen("app");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setStats(null);
    setAppearance(null);
    setAiGoals(null);
    setScreen("login");
  };

  const handleUpdateName = async (newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === stats?.name) return;
    const newStats = { ...stats, name: trimmed };
    await saveProfile(newStats, appearance);
    setStats(newStats);
  };

  const handleDeleteAccount = async () => {
    const ref = doc(db, "users", user.uid, "profile", "data");
    await deleteDoc(ref);
    await deleteUser(auth.currentUser); // throws auth/requires-recent-login if session is stale
    setStats(null);
    setAppearance(null);
    setAiGoals(null);
    setScreen("login");
  };

  const triggerCharAnim = () => {};

  // ── Goals priority merge ──────────────────────────────────────────────────
  // Always compute local goals first so timeline fields (weightGap, weeksToGoal,
  // rawDelta, isCapped, realisticWeeks) are always present regardless of which
  // calorie source wins.
  let goals = null;
  if (stats) {
    const localGoals = calcGoals(stats);
    if (stats?.customCal) {
      goals = { ...localGoals, cal: stats.customCal, protein: stats.customProtein, carbs: stats.customCarbs, fat: stats.customFat };
    } else if (aiGoals && aiGoals.cal) {
      goals = { ...localGoals, ...aiGoals };
    } else {
      goals = localGoals;
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!authReady) return (
    <ThemeContext.Provider value={{ T, isDark, toggle }}>
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 17, fontWeight: 600 }}>
        Loading Khaaya...
      </div>
    </ThemeContext.Provider>
  );

  if (screen === "login") return <ThemeContext.Provider value={{ T, isDark, toggle }}><Login /></ThemeContext.Provider>;
  if (screen === "onboard") return (
    <ThemeContext.Provider value={{ T, isDark, toggle }}>
      {isNewUser
        ? <OnboardingWizard onComplete={handleWizardComplete} />
        : <Onboarding onComplete={handleOnboardComplete} />}
    </ThemeContext.Provider>
  );

  // ── MAIN APP & OVERLAYS ─────────────────────────────────────────────────────
  return (
    <ThemeContext.Provider value={{ T, isDark, toggle }}>
      <>
        <div style={{ display: screen === "app" ? "block" : "none" }}>
          <div style={{ minHeight: "100vh", background: T.bg, color: T.text, paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ background: T.card, borderBottom: `1px solid ${T.headerBorder}`, padding: "12px 20px" }}>
              <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.accent }}>Khaaya</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: -0.3, lineHeight: 1.15 }}>
                    {stats?.name ? `Hey, ${stats.name}` : "Welcome back"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => setScreen("edit_stats")}
                    style={{ background: T.inputBg, border: "none", borderRadius: 10, padding: "7px 12px", color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                    ✏️ Stats
                  </button>
                  <button onClick={() => setScreen("about")}
                    style={{ background: T.inputBg, border: "none", borderRadius: 10, width: 36, height: 36, color: T.textSec, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="About Khaaya">
                    ℹ️
                  </button>
                  <button onClick={() => setScreen("settings")}
                    style={{ background: T.inputBg, border: "none", borderRadius: 10, width: 36, height: 36, color: T.textSec, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Settings">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs - Apple segmented control */}
            <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 16px 0" }}>
              <div style={{ display: "flex", gap: 0, background: T.segBg, borderRadius: 10, padding: 3 }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                      background: tab === t ? T.segActive : "transparent",
                      color: tab === t ? T.segActiveText : T.segText,
                      cursor: "pointer", fontSize: 15, fontWeight: tab === t ? 600 : 400,
                      transition: "all 0.2s",
                      boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>
              <div style={{ display: tab === "Log" ? "block" : "none" }}>
                <MacroTracker
                  user={user}
                  stats={stats}
                  onCharUpdate={triggerCharAnim}
                  goals={goals}
                />
              </div>
              <div style={{ display: tab === "Weight" ? "block" : "none" }}>
                <WeightTracker user={user} stats={stats} />
              </div>
            </div>
          </div>
        </div>

        {/* OVERLAYS */}
        {screen === "customize" && <Customize stats={stats} initialAppearance={appearance} onComplete={handleCustomizeComplete} />}
        {screen === "edit_stats" && <Onboarding initialStats={stats} onComplete={handleEditStatsComplete} onCancel={() => setScreen("app")} />}
        {screen === "settings" && (
          <Settings
            user={user}
            stats={stats}
            isDark={isDark}
            onToggleTheme={toggle}
            onUpdateName={handleUpdateName}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onClose={() => setScreen("app")}
          />
        )}
        {screen === "about" && (
          <AboutKhaaya onClose={() => setScreen("app")} />
        )}
      </>
    </ThemeContext.Provider>
  );
}
