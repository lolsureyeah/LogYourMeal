import { useState, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import HumanCharacter from "./HumanCharacter";
import MacroBar from "./MacroBar";
import { calcGoals } from "../utils/calculations";
import { useTheme } from "../theme";


export default function MacroTracker({ user, stats, appearance, onCharUpdate, animChar, aiMsg, externalProgress, goals: propGoals, goalsSource }) {
  const { T } = useTheme();
  const [meals, setMeals] = useState([]);
  const [mealLog, setMealLog] = useState([]);
  const [foodInput, setFoodInput] = useState("");
  const [mealName, setMealName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [localMsg, setLocalMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

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
      if (!items.length) { setLocalMsg("Couldn't recognise that food — try again!"); setParsing(false); return; }

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
        // No match — create a new meal entry
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

  const handleDelete = async (entry) => {
    if (!user || !entry.id) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "food_logs", entry.id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleEditSave = async (entry) => {
    if (!editText.trim() || !user || !entry.id) return;
    setParsing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/parse-food", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ text: editText }) });
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) { setParsing(false); return; }

      await deleteDoc(doc(db, "users", user.uid, "food_logs", entry.id));
      const newEntry = {
        ...entry,
        items,
        cal: items.reduce((s, i) => s + (i.cal || 0), 0),
        isoTime: new Date().toISOString(),
      };
      delete newEntry.id;
      await addDoc(collection(db, "users", user.uid, "food_logs"), newEntry);
      setEditingId(null);
      setEditText("");
    } catch (e) {
      console.error("Edit failed", e);
    }
    setParsing(false);
  };

  const cardS = { background: T.card, borderRadius: 20, boxShadow: T.cardShadow, padding: 20, marginBottom: 16 };
  const labelS = { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: T.textSec, display: "block", marginBottom: 10, textTransform: "uppercase" };
  const inputS = { width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 16px", color: T.text, fontSize: 17, marginBottom: 12, boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ paddingBottom: 80, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Character Card */}
      <div style={{ ...cardS, display: "flex", gap: 16, alignItems: "center", marginTop: 14 }}>
        <div style={{ flexShrink: 0 }}>
          <HumanCharacter
            bf={parseFloat(stats?.bf) || 20}
            sex={stats?.sex || "male"}
            age={parseInt(stats?.age) || 25}
            progress={externalProgress || progress}
            appearance={appearance || {}}
            animate={animChar}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {stats?.targetDate && stats?.targetWeight && stats?.goal !== "maintain" ? (
            <>
              <div style={{ fontSize: 12, color: T.textSec }}>Goal Timeline</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: T.text, marginTop: 2 }}>
                {stats.goal === "cut" ? "Lose" : "Gain"} {goals.weightGap}kg in {goals.weeksToGoal} weeks
              </div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>
                Daily {stats.goal === "cut" ? "deficit" : "surplus"}: {goals.rawDelta} kcal
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
              Set a target date in Stats to see your timeline
            </div>
          )}
          <div style={{ background: T.inputBg, borderRadius: 6, height: 8, marginTop: 12, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, background: T.accent, height: "100%", transition: "width 0.5s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>{Math.round(progress)}% of daily goal</div>
        </div>
      </div>

      {/* Macros Card */}
      <div style={cardS}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <span style={labelS}>Today</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: T.text }}>
            {Math.round(totals.cal)} <span style={{ fontSize: 15, color: T.textSec, fontWeight: 400 }}>/ {goals.cal} kcal</span>
          </span>
        </div>
        <MacroBar label="PROTEIN" value={totals.protein} goal={goals.protein} color="#FF9500" />
        <MacroBar label="CARBS" value={totals.carbs} goal={goals.carbs} color={T.accent} />
        <MacroBar label="FAT" value={totals.fat} goal={goals.fat} color="#34C759" />
      </div>

      {/* Food Input Card */}
      <div style={cardS}>
        <span style={labelS}>Log a Meal</span>
        <input style={inputS} value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Meal name (e.g. Lunch)" />
        <textarea
          style={{ ...inputS, height: 80, resize: "none" }}
          value={foodInput}
          onChange={e => setFoodInput(e.target.value)}
          placeholder="What did you eat? (e.g. 2 eggs, 1 toast)"
        />
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Powered by AI · Log meals in any language</div>
        <button
          style={{ width: "100%", background: T.btnPrimary, color: T.card, border: "none", borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 17, cursor: "pointer" }}
          onClick={handleLog}
          disabled={parsing}
        >
          {parsing ? "LOGGING..." : "LOG IT"}
        </button>
      </div>

      {/* Meal Log Card */}
      {mealLog.length > 0 && (
        <div style={cardS}>
          <span style={labelS}>Meal Log</span>
          {mealLog.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.divider}` }}>
              {/* Meal header: name + time + action buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{entry.label}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{entry.time}</span>
                  <button onClick={() => { setEditingId(entry.id); setEditText((entry.items || []).map(it => `${it.grams}g ${it.name}`).join(", ")); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✏️</button>
                  <button onClick={() => handleDelete(entry)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>🗑️</button>
                </div>
              </div>

              {editingId === entry.id ? (
                <div style={{ background: T.inputBg, padding: 12, borderRadius: 12, marginBottom: 10 }}>
                  <textarea style={{ ...inputS, height: 60, marginBottom: 8 }} value={editText} onChange={e => setEditText(e.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: 8, fontWeight: 600 }} onClick={() => handleEditSave(entry)}>Save</button>
                    <button style={{ flex: 1, background: T.border, color: T.textSec, border: "none", borderRadius: 8, padding: 8, fontWeight: 600 }} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Individual food items */}
                  {(entry.items || []).map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 4 }}>
                      <span style={{ color: T.textSec }}>{it.grams}g {it.name}</span>
                      <span style={{ fontWeight: 600, color: T.text }}>{Math.round(it.cal)} kcal</span>
                    </div>
                  ))}
                  {/* Total row with macro breakdown */}
                  {(() => {
                    const mealTotals = (entry.items || []).reduce((acc, it) => ({
                      cal: acc.cal + (it.cal || 0),
                      protein: acc.protein + (it.protein || 0),
                      carbs: acc.carbs + (it.carbs || 0),
                      fat: acc.fat + (it.fat || 0),
                    }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
                    return (
                      <div style={{ borderTop: `1px solid ${T.divider}`, marginTop: 8, paddingTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: T.text }}>Total</span>
                          <span style={{ fontWeight: 700, color: T.text }}>{Math.round(mealTotals.cal)} kcal</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}>
                          <span style={{ color: T.textSec }}>P: <span style={{ fontWeight: 600, color: "#FF9500" }}>{Math.round(mealTotals.protein)}g</span></span>
                          <span style={{ color: T.textSec }}>C: <span style={{ fontWeight: 600, color: T.accent }}>{Math.round(mealTotals.carbs)}g</span></span>
                          <span style={{ color: T.textSec }}>F: <span style={{ fontWeight: 600, color: "#34C759" }}>{Math.round(mealTotals.fat)}g</span></span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
