import { useState, useEffect } from "react";
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import HumanCharacter from "./HumanCharacter";
import MacroBar from "./MacroBar";
import NINInfo from "./NINInfo";
import History from "./History";
import SavedMeals from "./SavedMeals";
import { calcGoals } from "../utils/calculations";
import { useTheme } from "../theme";

const DEFAULT_MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

function buildSuggestions(todayLabels) {
  const seen = new Set();
  const result = [];
  for (const n of [...DEFAULT_MEALS, ...todayLabels]) {
    const k = n.toLowerCase();
    if (!seen.has(k)) { seen.add(k); result.push(n); }
  }
  return result;
}


export default function MacroTracker({ user, stats, appearance, onCharUpdate, animChar, aiMsg, externalProgress, goals: propGoals, goalsSource }) {
  const { T } = useTheme();
  const [meals, setMeals] = useState([]);
  const [mealLog, setMealLog] = useState([]);
  const [foodInput, setFoodInput] = useState("");
  const [mealName, setMealName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [localMsg, setLocalMsg] = useState("");
  const [showNINInfo, setShowNINInfo] = useState(false);
  const [toast, setToast] = useState(null);

  const goals = propGoals || calcGoals(stats);

  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + (m.cal || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 });

  Object.keys(totals).forEach(k => totals[k] = +totals[k].toFixed(1));

  const progress = Math.min(100, (totals.cal / goals.cal) * 100);
useEffect(() => {
    if (!user) return;
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    const q = query(collection(db, "users", user.uid, "food_logs"), where("date", "==", today));
    const unsub = onSnapshot(q, (snap) => {
      const allMeals = [], allLog = [];
      snap.forEach(d => {
        const data = d.data();
        allLog.push({ id: d.id, ...data });
        allMeals.push(...(data.items || []));
      });
      allLog.sort((a, b) => (a.isoTime || "").localeCompare(b.isoTime || ""));
      setMeals(allMeals);
      setMealLog(allLog);
    });
    return unsub;
  }, [user]);

  const handleLog = async () => {
    if (!foodInput.trim()) return;
    setParsing(true);
    setLocalMsg("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/parse-food", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ text: foodInput }) });
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) { setLocalMsg("Couldn't recognise that food. Try again!"); setParsing(false); return; }

      const now = new Date();
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

      // Normalise the new meal name for case-insensitive matching
      const rawName = (mealName || "Meal").trim();
      const newMealName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const normalizedNew = newMealName.toLowerCase();

      // Check if a meal with the same normalised name already exists
      const existingEntry = mealLog.find(e => e.label.trim().toLowerCase() === normalizedNew);

      if (existingEntry) {
        // Merge: append new items into the existing meal
        const mergedItems = [...(existingEntry.items || []), ...items];
        const updatedFields = {
          items: mergedItems,
          cal: mergedItems.reduce((sum, item) => sum + (item.cal || 0), 0),
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isoTime: now.toISOString(),
        };
        if (user && existingEntry.id) {
          await updateDoc(doc(db, "users", user.uid, "food_logs", existingEntry.id), updatedFields);
        } else {
          setMealLog(p => p.map(e => e === existingEntry ? { ...e, ...updatedFields } : e));
          setMeals(p => [...p, ...items]);
        }
      } else {
        // No match - create a new meal entry
        const entry = {
          label: newMealName,
          items,
          date: localDate,
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isoTime: now.toISOString(),
          cal: items.reduce((sum, item) => sum + (item.cal || 0), 0),
        };
        if (user) {
          await addDoc(collection(db, "users", user.uid, "food_logs"), entry);
        } else {
          setMeals(p => [...p, ...items]);
          setMealLog(p => [...p, entry]);
        }
      }

      setFoodInput(""); setMealName("");

      const addedCal = items.reduce((sum, item) => sum + (item.cal || 0), 0);
      setToast(`Logged (+${Math.round(addedCal)} kcal)`);
      setTimeout(() => setToast(null), 2500);

      const newTotals = { ...totals };
      items.forEach(m => { newTotals.cal += m.cal; newTotals.protein += m.protein; newTotals.carbs += m.carbs; newTotals.fat += m.fat; });

      const coachToken = await auth.currentUser.getIdToken();
      const cr = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${coachToken}` }, body: JSON.stringify({ meals: items, totals: newTotals, goals, stats }) });
      const cd = await cr.json();
      onCharUpdate(cd.comment || "Great fuel!", Math.min(100, (newTotals.cal / goals.cal) * 100));
    } catch (e) {
      setLocalMsg("Error parsing food.");
    }
    setParsing(false);
  };

  const cardS = { background: T.card, borderRadius: 16, boxShadow: T.cardShadow, padding: 16, marginBottom: 24, border: `1px solid rgba(128,128,128,0.12)` };
  const labelS = { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: T.textSec, display: "block", marginBottom: 10, textTransform: "uppercase" };
  const inputS = { width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 16px", color: T.text, fontSize: 17, marginBottom: 12, boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ paddingBottom: 80, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {showNINInfo && <NINInfo onClose={() => setShowNINInfo(false)} />}

      {/* History calendar */}
      <History user={user} />

      {/* Macros Card */}
      <div style={cardS}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <span style={labelS}>Today</span>
          <span style={{ fontSize: 40, fontWeight: 700, color: T.text }}>
            {Math.round(totals.cal)} <span style={{ fontSize: 15, color: T.textSec, fontWeight: 400, opacity: 0.6 }}>/ {goals.cal} kcal</span>
          </span>
        </div>
        <MacroBar label="PROTEIN" value={totals.protein} goal={goals.protein} color="#4CAF50" />
        <MacroBar label="CARBS" value={totals.carbs} goal={goals.carbs} color="#2196F3" />
        <MacroBar label="FAT" value={totals.fat} goal={goals.fat} color="#FF9800" />
      </div>

      {/* Saved Meals */}
      <SavedMeals user={user} todayLabels={mealLog.map(e => e.label).filter(Boolean)} />

      {/* Log a Meal — at the bottom */}
      <div style={cardS}>
        <span style={labelS}>Log a Meal</span>
        <input style={inputS} value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Meal name (e.g. Lunch)" />
        {/* Quick-pick meal name chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: -6, marginBottom: 12 }}>
          {buildSuggestions(mealLog.map(e => e.label).filter(Boolean)).map(s => (
            <button key={s} onClick={() => setMealName(s)} style={{
              background: mealName === s ? T.accent : T.inputBg,
              color: mealName === s ? "#fff" : T.textSec,
              border: `1px solid ${mealName === s ? T.accent : T.border}`,
              borderRadius: 20, padding: "5px 12px", fontSize: 13,
              fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>{s}</button>
          ))}
        </div>
        <textarea
          style={{ ...inputS, height: 80, resize: "none" }}
          value={foodInput}
          onChange={e => setFoodInput(e.target.value)}
          placeholder="e.g. 2 eggs, 1 toast, chai"
        />
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Powered by AI · Log meals in any language</div>
        {localMsg && <div style={{ fontSize: 13, color: "#FF3B30", marginBottom: 10 }}>{localMsg}</div>}
        <button
          style={{ width: "100%", background: T.btnPrimary, color: T.card, border: "none", borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 17, cursor: "pointer" }}
          onClick={handleLog}
          disabled={parsing}
        >
          {parsing ? "LOGGING..." : "LOG IT"}
        </button>
      </div>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#fff", padding: "12px 24px",
          borderRadius: 16, fontSize: 15, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "slideUp 0.25s ease",
          zIndex: 9999, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
