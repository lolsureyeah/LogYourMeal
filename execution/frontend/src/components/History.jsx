// execution/frontend/src/components/History.jsx
// Calendar + rich meal log (edit/delete/expand for today, read-only for past)

import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "../firebase";
import NINInfo from "./NINInfo";
import { useTheme } from "../theme";

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      background: "#1c1c1e", color: "#fff", borderRadius: 14,
      padding: "12px 22px", fontSize: 15, fontWeight: 600,
      zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.22)", pointerEvents: "none",
    }}>
      {msg}
    </div>
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getMonthDays(year, month) {
  const days = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function toDateKey(d) {
  if (!d) return "";
  if (typeof d === "string") return d;
  return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
}

export default function History({ user }) {
  const { T } = useTheme();
  const [mealLog,      setMealLog]      = useState([]);
  const [weightLog,    setWeightLog]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth,    setViewMonth]    = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Rich meal log state (today only)
  const [calExpanded,  setCalExpanded]  = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [editText,     setEditText]     = useState("");
  const [expandedItem, setExpandedItem] = useState(null);
  const [showNINInfo,  setShowNINInfo]  = useState(false);
  const [parsing,      setParsing]      = useState(false);

  // Save as Meal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState("");
  const [saveMealSaving, setSaveMealSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");

  const showSaveToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(""), 2500);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const mq = query(collection(db, "users", user.uid, "food_logs"),   orderBy("date", "desc"));
    const wq = query(collection(db, "users", user.uid, "weight_logs"), orderBy("loggedAt", "desc"));

    const mUnsub = onSnapshot(mq, (snap) => {
      setMealLog(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error("Meal history load failed:", err.message); setLoading(false); });

    const wUnsub = onSnapshot(wq, (snap) => {
      setWeightLog(snap.docs.map(d => d.data()));
      setLoading(false);
    }, (err) => { console.error("Weight history load failed:", err.message); setLoading(false); });

    return () => { mUnsub(); wUnsub(); };
  }, [user]);

  const now = new Date();
  const todayKey = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  const selKey = toDateKey(selectedDate);
  const isToday = selKey === todayKey;

  const datesWithData = useMemo(() => {
    const s = new Set();
    mealLog.forEach(e => { if (e.date) s.add(e.date); });
    weightLog.forEach(e => { if (e.loggedAt) s.add(e.loggedAt); });
    return s;
  }, [mealLog, weightLog]);

  const dayMeals = useMemo(() => {
    const list = mealLog.filter(e => e.date === selKey);
    list.sort((a, b) => {
      if (a.isoTime && b.isoTime) return a.isoTime.localeCompare(b.isoTime);
      return (a.time || "").localeCompare(b.time || "");
    });
    return list;
  }, [mealLog, selKey]);

  const dayWeights = useMemo(() => weightLog.filter(e => e.loggedAt === selKey), [weightLog, selKey]);

  const dayTotals = useMemo(() => {
    const t = { cal: 0, protein: 0, carbs: 0, fat: 0 };
    dayMeals.forEach(entry => {
      (entry.items || []).forEach(item => {
        t.cal += item.cal || 0; t.protein += item.protein || 0;
        t.carbs += item.carbs || 0; t.fat += item.fat || 0;
      });
    });
    return t;
  }, [dayMeals]);

  const handleDelete = async (entry) => {
    if (!user || !entry.id) return;
    try { await deleteDoc(doc(db, "users", user.uid, "food_logs", entry.id)); }
    catch (e) { console.error("Delete failed", e); }
  };

  const handleEditSave = async (entry) => {
    if (!editText.trim() || !user || !entry.id) return;
    setParsing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text: editText }),
      });
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) { setParsing(false); return; }
      await deleteDoc(doc(db, "users", user.uid, "food_logs", entry.id));
      const newEntry = { ...entry, items, cal: items.reduce((s, i) => s + (i.cal || 0), 0), isoTime: new Date().toISOString() };
      delete newEntry.id;
      await addDoc(collection(db, "users", user.uid, "food_logs"), newEntry);
      setEditingId(null); setEditText("");
    } catch (e) { console.error("Edit failed", e); }
    setParsing(false);
  };

  const handleSaveMeal = async () => {
    const trimmedName = saveModalName.trim();
    if (!trimmedName || !user) return;
    const allFoods = dayMeals.flatMap(e => (e.items || []));
    if (!allFoods.length) return;
    setSaveMealSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/save-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: trimmedName, foods: allFoods }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShowSaveModal(false);
      setSaveModalName("");
      showSaveToast(`"${trimmedName}" saved!`);
    } catch (e) {
      console.error("save meal failed:", e.message);
      showSaveToast("Failed to save meal.");
    } finally {
      setSaveMealSaving(false);
    }
  };

  const monthDays = getMonthDays(viewMonth.year, viewMonth.month);
  const prevMonth = () => setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const nextMonth = () => setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const stripDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const card  = { background: T.card, borderRadius: 20, boxShadow: T.cardShadow, padding: 20, marginBottom: 16 };
  const labelS = { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: T.textSec, display: "block", marginBottom: 12, textTransform: "uppercase" };
  const inputS = { width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 16px", color: T.text, fontSize: 17, marginBottom: 12, boxSizing: "border-box", outline: "none" };

  if (loading) return (
    <div style={{ ...card, marginTop: 14, color: T.textSec, fontSize: 15, textAlign: "center", padding: "32px 20px" }}>
      Loading history...
    </div>
  );

  const selDisplay = selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {showNINInfo && <NINInfo onClose={() => setShowNINInfo(false)} />}
      <Toast msg={saveToast} />

      {/* Save as Meal modal */}
      {showSaveModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "0 20px",
        }} onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div style={{
            background: T.card, borderRadius: 20, padding: 24,
            width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 16 }}>Save as Meal</div>

            <input
              autoFocus
              style={{
                width: "100%", background: T.inputBg, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "13px 16px", color: T.text, fontSize: 16,
                marginBottom: 16, boxSizing: "border-box", outline: "none",
              }}
              placeholder="e.g. My Post Workout"
              value={saveModalName}
              onChange={e => setSaveModalName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSaveMeal(); }}
            />

            {/* Foods summary */}
            <div style={{
              background: T.inputBg, borderRadius: 12, padding: "12px 14px",
              marginBottom: 16, maxHeight: 200, overflowY: "auto",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Today's foods
              </div>
              {dayMeals.flatMap(e => e.items || []).map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSec, padding: "3px 0" }}>
                  <span>{it.grams}g {it.name}</span>
                  <span style={{ fontWeight: 600, color: T.text }}>{Math.round(it.cal)} kcal</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowSaveModal(false); setSaveModalName(""); }}
                style={{
                  flex: 1, background: T.inputBg, color: T.textSec,
                  border: "none", borderRadius: 12, padding: 14,
                  fontWeight: 600, fontSize: 15, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeal}
                disabled={!saveModalName.trim() || saveMealSaving}
                style={{
                  flex: 2, background: T.accent, color: "#fff",
                  border: "none", borderRadius: 12, padding: 14,
                  fontWeight: 700, fontSize: 15, cursor: "pointer",
                  opacity: !saveModalName.trim() || saveMealSaving ? 0.5 : 1,
                }}
              >
                {saveMealSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div style={{ ...card, marginTop: 14, padding: 16 }}>
        {calExpanded ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.accent, padding: "4px 8px" }}>‹</button>
              <button onClick={() => setCalExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, fontWeight: 700, color: T.text }}>
                {MONTH_NAMES[viewMonth.month]} {viewMonth.year} ▴
              </button>
              <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.accent, padding: "4px 8px" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: T.textSec, letterSpacing: 0.5 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {Array.from({ length: monthDays[0]?.getDay() || 0 }).map((_, i) => <div key={`e-${i}`} />)}
              {monthDays.map(day => {
                const dk = toDateKey(day);
                const isSel  = dk === selKey;
                const isTod  = dk === todayKey;
                const hasData = datesWithData.has(dk);
                return (
                  <button key={dk} onClick={() => { setSelectedDate(new Date(day)); setCalExpanded(false); }} style={{
                    width: "100%", aspectRatio: "1", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 2,
                    background: isSel ? T.accent : isTod ? T.inputBg : "transparent",
                    color: isSel ? "#fff" : T.text, border: "none", borderRadius: 12,
                    cursor: "pointer", fontSize: 15, fontWeight: isSel || isTod ? 700 : 400,
                    transition: "all 0.15s", position: "relative",
                  }}>
                    {day.getDate()}
                    {hasData && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "#fff" : T.accent, position: "absolute", bottom: 4 }} />}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div onClick={() => setCalExpanded(true)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, cursor: "pointer" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{MONTH_NAMES[viewMonth.month]} {viewMonth.year}</span>
              <span style={{ fontSize: 12, color: T.accent }}>▾</span>
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
              {stripDays.map(day => {
                const dk = toDateKey(day);
                const isSel  = dk === selKey;
                const isTod  = dk === todayKey;
                const hasData = datesWithData.has(dk);
                return (
                  <button key={dk} onClick={() => setSelectedDate(new Date(day))} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "8px 0", gap: 3,
                    background: isSel ? T.accent : isTod ? T.inputBg : "transparent",
                    color: isSel ? "#fff" : T.text, border: "none", borderRadius: 12,
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? "rgba(255,255,255,0.8)" : T.textSec }}>{DAY_NAMES[day.getDay()]}</span>
                    <span style={{ fontSize: 15, fontWeight: isSel || isTod ? 700 : 400 }}>{day.getDate()}</span>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: hasData ? (isSel ? "#fff" : T.accent) : "transparent" }} />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Weight entries */}
      {dayWeights.length > 0 && (
        <div style={card}>
          <span style={labelS}>Weight Log</span>
          {dayWeights.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.divider}` }}>
              <div>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 600 }}>{e.date}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>
                  {e.waist ? `Waist: ${e.waist}cm` : ""}{e.chest ? `  Chest: ${e.chest}cm` : ""}{e.hips ? `  Hips: ${e.hips}cm` : ""}{e.arms ? `  Arms: ${e.arms}cm` : ""}
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.accent }}>
                {e.weight}<span style={{ fontSize: 13, color: T.textSec, fontWeight: 400 }}> kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal entries — rich UI for today, read-only for past */}
      {dayMeals.length > 0 && (
        <div style={card}>
          <span style={labelS}>Meals</span>
          {dayMeals.map((entry) => (

            <div key={entry.id || entry.isoTime} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.divider}` }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{entry.label}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{entry.time}</span>
                  {isToday && entry.id && <>
                    <button onClick={() => { setEditingId(entry.id); setEditText((entry.items || []).map(it => `${it.grams}g ${it.name}`).join(", ")); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✏️</button>
                    <button onClick={() => handleDelete(entry)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>🗑️</button>
                  </>}
                </div>
              </div>

              {/* Edit form (today only) */}
              {editingId === entry.id ? (
                <div style={{ background: T.inputBg, padding: 12, borderRadius: 12, marginBottom: 10 }}>
                  <textarea style={{ ...inputS, height: 60, marginBottom: 8 }} value={editText} onChange={e => setEditText(e.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: 8, fontWeight: 600 }}
                      onClick={() => handleEditSave(entry)} disabled={parsing}>{parsing ? "Saving..." : "Save"}</button>
                    <button style={{ flex: 1, background: T.border, color: T.textSec, border: "none", borderRadius: 8, padding: 8, fontWeight: 600 }}
                      onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Food items — expandable */}
                  {(entry.items || []).map((it, i) => {
                    const itemKey = `${entry.id}-${i}`;
                    const isOpen = expandedItem === itemKey;
                    return (
                      <div key={i} style={{ marginTop: 4 }}>
                        <div onClick={() => setExpandedItem(isOpen ? null : itemKey)}
                          style={{ display: "flex", justifyContent: "space-between", fontSize: 14, cursor: "pointer", userSelect: "none" }}>
                          <span style={{ color: T.textSec }}>{it.grams}g {it.name}</span>
                          <span style={{ fontWeight: 600, color: T.text }}>{Math.round(it.cal)} kcal</span>
                        </div>
                        {isOpen && (
                          <div style={{ background: T.inputBg, borderRadius: 10, padding: "10px 12px", marginTop: 6, fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ color: T.textSec }}>Source</span>
                              {it.source === "NIN-verified" ? (
                                <button onClick={e => { e.stopPropagation(); setShowNINInfo(true); }}
                                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, color: "#16a34a", fontSize: 13 }}>
                                  NIN Certified ⓘ
                                </button>
                              ) : (
                                <span style={{ fontWeight: 600, color: T.textSec }}>AI Estimated</span>
                              )}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ color: T.textSec }}>Calories</span>
                              <span style={{ fontWeight: 600, color: T.text }}>{Math.round(it.cal)} kcal</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ color: T.textSec }}>Protein</span>
                              <span style={{ fontWeight: 600, color: "#FF9500" }}>{it.protein}g</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ color: T.textSec }}>Carbs</span>
                              <span style={{ fontWeight: 600, color: T.accent }}>{it.carbs}g</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: T.textSec }}>Fat</span>
                              <span style={{ fontWeight: 600, color: "#34C759" }}>{it.fat}g</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Meal total row */}
                  {(() => {
                    const mt = (entry.items || []).reduce((acc, it) => ({
                      cal: acc.cal + (it.cal || 0), protein: acc.protein + (it.protein || 0),
                      carbs: acc.carbs + (it.carbs || 0), fat: acc.fat + (it.fat || 0),
                    }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
                    return (
                      <div style={{ borderTop: `1px solid ${T.divider}`, marginTop: 8, paddingTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: T.text }}>Total</span>
                          <span style={{ fontWeight: 700, color: T.text }}>{Math.round(mt.cal)} kcal</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}>
                          <span style={{ color: T.textSec }}>P: <span style={{ fontWeight: 600, color: "#FF9500" }}>{Math.round(mt.protein)}g</span></span>
                          <span style={{ color: T.textSec }}>C: <span style={{ fontWeight: 600, color: T.accent }}>{Math.round(mt.carbs)}g</span></span>
                          <span style={{ color: T.textSec }}>F: <span style={{ fontWeight: 600, color: "#34C759" }}>{Math.round(mt.fat)}g</span></span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ))}

          {/* Save as Meal — only shown for today */}
          {isToday && (
            <button
              onClick={() => { setSaveModalName(""); setShowSaveModal(true); }}
              style={{
                width: "100%", marginTop: 4,
                background: T.inputBg, color: T.accent,
                border: `1px dashed ${T.accent}`, borderRadius: 12,
                padding: "12px 0", fontWeight: 700, fontSize: 15,
                cursor: "pointer",
              }}
            >
              + Save as Meal
            </button>
          )}
        </div>
      )}
    </>
  );
}
