// execution/frontend/src/components/WeightTracker.jsx
// Weight + measurements tracker — Apple iOS Health aesthetic

import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTheme } from "../theme";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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

export default function WeightTracker({ user, stats }) {
  const { T } = useTheme();
  const [weightLog, setWeightLog] = useState([]);
  const [entry, setEntry]   = useState({ weight: "", waist: "", chest: "", hips: "", arms: "" });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editEntry, setEditEntry] = useState({ weight: "", waist: "", chest: "", hips: "", arms: "" });
  const [unit, setUnit]             = useState("cm");  // measurements: "cm" | "in"
  const [weightUnit, setWeightUnit] = useState("kg");  // weight: "kg" | "lbs"

  // Calendar state
  const now = new Date();
  const todayKey = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calExpanded, setCalExpanded]   = useState(false);
  const [viewMonth, setViewMonth] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }));

  const selKey   = toDateKey(selectedDate);
  const isToday  = selKey === todayKey;
  const isFuture = selKey > todayKey;

  useEffect(() => { setEditing(false); }, [selKey]);

  const cmToIn    = (v) => v != null ? +(v / 2.54).toFixed(1) : null;
  const inToCm    = (v) => v != null ? +(v * 2.54).toFixed(1) : null;
  const dispMeas  = (v) => (unit === "in" && v) ? cmToIn(v) : v;
  const storeMeas = (v) => { const f = parseFloat(v); return isNaN(f) ? null : unit === "in" ? inToCm(f) : f; };

  const kgToLbs    = (v) => v != null ? +(v * 2.20462).toFixed(1) : null;
  const lbsToKg    = (v) => v != null ? +(v / 2.20462).toFixed(2) : null;
  const dispWeight = (v) => (weightUnit === "lbs" && v) ? kgToLbs(v) : v;
  const storeWeight = (v) => { const f = parseFloat(v); return isNaN(f) ? null : weightUnit === "lbs" ? lbsToKg(f) : f; };

  const targetW = parseFloat(stats?.targetWeight);
  const startW  = parseFloat(stats?.weight);
  const latest  = weightLog.length ? weightLog[weightLog.length - 1].weight : null;
  const weightProgress = (startW && targetW && latest)
    ? Math.min(100, Math.max(0, ((startW - latest) / (startW - targetW)) * 100))
    : 0;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "weight_logs"), orderBy("loggedAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setWeightLog(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Failed to load weight logs:", err.message);
    });
    return unsub;
  }, [user]);

  const datesWithData = useMemo(() => {
    const s = new Set();
    weightLog.forEach(e => { if (e.loggedAt) s.add(e.loggedAt); });
    return s;
  }, [weightLog]);

  const selectedEntry = useMemo(() => weightLog.find(e => e.loggedAt === selKey) || null, [weightLog, selKey]);

  const stripDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const chartData = useMemo(() =>
    weightUnit === "lbs"
      ? weightLog.map(e => ({ ...e, weight: e.weight ? kgToLbs(e.weight) : null }))
      : weightLog,
  [weightLog, weightUnit]);

  const measChartData = useMemo(() =>
    unit === "in"
      ? weightLog.map(e => ({
          ...e,
          waist: e.waist ? cmToIn(e.waist) : null,
          chest: e.chest ? cmToIn(e.chest) : null,
          hips:  e.hips  ? cmToIn(e.hips)  : null,
          arms:  e.arms  ? cmToIn(e.arms)  : null,
        }))
      : weightLog,
  [weightLog, unit]);

  const displayTargetW = targetW && weightUnit === "lbs" ? kgToLbs(targetW) : targetW;

  const monthDays = getMonthDays(viewMonth.year, viewMonth.month);
  const prevMonth = () => setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const nextMonth = () => setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const handleUpdate = async () => {
    if (!user || !selectedEntry?.id || !editEntry.weight) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "weight_logs", selectedEntry.id), {
        weight: storeWeight(editEntry.weight),
        waist:  storeMeas(editEntry.waist),
        chest:  storeMeas(editEntry.chest),
        hips:   storeMeas(editEntry.hips),
        arms:   storeMeas(editEntry.arms),
      });
      setEditing(false);
    } catch (err) {
      console.error("Failed to update weight entry:", err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (entry) => {
    if (!user || !entry.id) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "weight_logs", entry.id));
    } catch (err) {
      console.error("Failed to delete weight entry:", err.message);
    }
  };

  const handleSave = async () => {
    if (!entry.weight) return;
    setSaving(true);
    const dateObj = new Date(selKey + "T12:00:00");
    const record = {
      date:     dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      loggedAt: selKey,
      weight:   storeWeight(entry.weight),
      waist:    storeMeas(entry.waist),
      chest:    storeMeas(entry.chest),
      hips:     storeMeas(entry.hips),
      arms:     storeMeas(entry.arms),
    };

    setEntry({ weight: "", waist: "", chest: "", hips: "", arms: "" });

    if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "weight_logs"), record);
      } catch (err) {
        console.error("Failed to save weight entry to cloud:", err.message);
      }
    }
    setSaving(false);
  };

  const card = {
    background: T.card,
    borderRadius: 20,
    boxShadow: T.cardShadow,
    padding: 20,
    marginBottom: 16,
  };
  const labelS = { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: T.textSec, display: "block", marginBottom: 10 };
  const inputS = {
    width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: "13px 16px", color: T.text, fontSize: 17, boxSizing: "border-box", outline: "none",
  };
  const tipStyle = {
    contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, boxShadow: T.cardShadow },
    labelStyle: { color: T.accent },
  };

  return (
    <>
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
                const isSel   = dk === selKey;
                const isTod   = dk === todayKey;
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
                const isSel   = dk === selKey;
                const isTod   = dk === todayKey;
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

      {/* Goal progress */}
      {stats?.targetWeight && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={labelS}>WEIGHT GOAL</span>
            <div style={{ display: "flex", background: T.inputBg, borderRadius: 8, padding: 2, gap: 2 }}>
              {["kg", "lbs"].map(u => (
                <button key={u} onClick={() => setWeightUnit(u)} style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: weightUnit === u ? T.accent : "transparent", color: weightUnit === u ? "#fff" : T.textSec, transition: "all 0.15s" }}>{u}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: T.textSec }}>Start: <b style={{ color: T.text }}>{dispWeight(parseFloat(stats.weight))} {weightUnit}</b></span>
            <span style={{ color: T.textSec }}>Target: <b style={{ color: T.accent }}>{dispWeight(parseFloat(stats.targetWeight))} {weightUnit}</b></span>
            {latest && <span style={{ color: T.textSec }}>Now: <b style={{ color: "#34C759" }}>{dispWeight(latest)} {weightUnit}</b></span>}
          </div>
          <div style={{ background: T.inputBg, borderRadius: 6, height: 10, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ width: `${weightProgress}%`, background: T.accent, height: "100%", borderRadius: 6, transition: "width 1s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <div style={{ fontSize: 13, color: T.textSec, fontVariantNumeric: "tabular-nums" }}>
              {(() => {
                if (!latest) return "No entries yet";
                const gap = Math.abs(latest - targetW);
                if (gap < 0.05) return "Goal reached 🎉";
                const isBulk = targetW > startW;
                const rate = isBulk ? 0.3 : 0.5;
                const weeks = Math.max(1, Math.round(gap / rate));
                const gapDisp = weightUnit === "lbs" ? kgToLbs(gap) : gap.toFixed(1);
                return `${isBulk ? "↑" : "↓"} ${gapDisp} ${weightUnit} to go (~${weeks}w)`;
              })()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{weightProgress.toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Selected date: show existing entry or log form */}
      {selectedEntry ? (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={labelS}>{isToday ? "TODAY'S ENTRY" : `ENTRY — ${selectedEntry.date}`}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {!editing && !isFuture && (
                <button onClick={() => { setEditEntry({ weight: dispWeight(selectedEntry.weight) ?? "", waist: dispMeas(selectedEntry.waist) ?? "", chest: dispMeas(selectedEntry.chest) ?? "", hips: dispMeas(selectedEntry.hips) ?? "", arms: dispMeas(selectedEntry.arms) ?? "" }); setEditing(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.accent, padding: "4px 8px", fontWeight: 600 }}>
                  Edit
                </button>
              )}
              <button onClick={() => handleDelete(selectedEntry)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.textSec, padding: "4px 8px" }}>
                🗑️
              </button>
            </div>
          </div>
          {editing ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>WEIGHT ({weightUnit})</div>
                  <div style={{ display: "flex", background: T.inputBg, borderRadius: 8, padding: 2, gap: 2 }}>
                    {["kg", "lbs"].map(u => (
                      <button key={u} onClick={() => { const cur = storeWeight(editEntry.weight); setWeightUnit(u); setEditEntry(p => ({ ...p, weight: cur ? (u === "lbs" ? kgToLbs(cur) : cur) : "" })); }} style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: weightUnit === u ? T.accent : "transparent", color: weightUnit === u ? "#fff" : T.textSec, transition: "all 0.15s" }}>{u}</button>
                    ))}
                  </div>
                </div>
                <input style={inputS} type="number" step="0.1" value={editEntry.weight} onChange={e => setEditEntry(p => ({ ...p, weight: e.target.value }))} placeholder={weightUnit === "lbs" ? "160" : "72.4"} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, letterSpacing: 0.5 }}>MEASUREMENTS (optional)</div>
                <div style={{ display: "flex", background: T.inputBg, borderRadius: 8, padding: 2, gap: 2 }}>
                  {["cm", "in"].map(u => (
                    <button key={u} onClick={() => setUnit(u)} style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: unit === u ? T.accent : "transparent", color: unit === u ? "#fff" : T.textSec, transition: "all 0.15s" }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[["waist", "Waist"], ["chest", "Chest"], ["hips", "Hips"], ["arms", "Arms"]].map(([k, l]) => (
                  <div key={k}>
                    <div style={{ fontSize: 13, color: T.textSec, marginBottom: 6 }}>{l}</div>
                    <input type="number" value={editEntry[k]} onChange={e => setEditEntry(p => ({ ...p, [k]: e.target.value }))} placeholder={unit} style={inputS} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ flex: 1, background: T.inputBg, border: "none", borderRadius: 14, padding: 14, color: T.text, fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                  onClick={() => setEditing(false)}>Cancel</button>
                <button style={{ flex: 2, background: T.btnPrimary, border: "none", borderRadius: 14, padding: 14, color: T.btnPrimaryText, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                  onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 4 }}>{dispWeight(selectedEntry.weight)} {weightUnit}</div>
              {(selectedEntry.waist || selectedEntry.chest || selectedEntry.hips || selectedEntry.arms) && (
                <div style={{ fontSize: 13, color: T.textSec, display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
                  {selectedEntry.waist && <span>Waist: <b style={{ color: T.text }}>{dispMeas(selectedEntry.waist)} {unit}</b></span>}
                  {selectedEntry.chest && <span>Chest: <b style={{ color: T.text }}>{dispMeas(selectedEntry.chest)} {unit}</b></span>}
                  {selectedEntry.hips  && <span>Hips: <b style={{ color: T.text }}>{dispMeas(selectedEntry.hips)} {unit}</b></span>}
                  {selectedEntry.arms  && <span>Arms: <b style={{ color: T.text }}>{dispMeas(selectedEntry.arms)} {unit}</b></span>}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={card}>
          {isFuture ? (
            <div style={{ textAlign: "center", color: T.textSec, fontSize: 15, padding: "12px 0" }}>
              Can't log for future dates.
            </div>
          ) : (
            <>
              <span style={labelS}>{isToday ? "LOG TODAY'S STATS" : `LOG FOR ${new Date(selKey + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`}</span>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>WEIGHT ({weightUnit})</div>
                  <div style={{ display: "flex", background: T.inputBg, borderRadius: 8, padding: 2, gap: 2 }}>
                    {["kg", "lbs"].map(u => (
                      <button key={u} onClick={() => setWeightUnit(u)} style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: weightUnit === u ? T.accent : "transparent", color: weightUnit === u ? "#fff" : T.textSec, transition: "all 0.15s" }}>{u}</button>
                    ))}
                  </div>
                </div>
                <input style={inputS} type="number" step="0.1" value={entry.weight} onChange={e => setEntry(p => ({ ...p, weight: e.target.value }))} placeholder={weightUnit === "lbs" ? "160" : "72.4"} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, letterSpacing: 0.5 }}>MEASUREMENTS (optional)</div>
                <div style={{ display: "flex", background: T.inputBg, borderRadius: 8, padding: 2, gap: 2 }}>
                  {["cm", "in"].map(u => (
                    <button key={u} onClick={() => setUnit(u)} style={{ padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: unit === u ? T.accent : "transparent", color: unit === u ? "#fff" : T.textSec, transition: "all 0.15s" }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[["waist", "Waist"], ["chest", "Chest"], ["hips", "Hips"], ["arms", "Arms"]].map(([k, l]) => (
                  <div key={k}>
                    <div style={{ fontSize: 13, color: T.textSec, marginBottom: 6 }}>{l}</div>
                    <input type="number" value={entry[k]} onChange={e => setEntry(p => ({ ...p, [k]: e.target.value }))} placeholder={unit} style={inputS} />
                  </div>
                ))}
              </div>
              <button style={{
                width: "100%", background: T.btnPrimary, border: "none", borderRadius: 14, padding: 16,
                color: T.btnPrimaryText, fontWeight: 700, fontSize: 17, cursor: "pointer",
              }} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Weight"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Weight chart */}
      {weightLog.length > 0 && (
        <div style={card}>
          <span style={labelS}>WEIGHT OVER TIME ({weightUnit})</span>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
              <Tooltip {...tipStyle} />
              {displayTargetW && <ReferenceLine y={displayTargetW} stroke={T.accent} strokeDasharray="4 3" label={{ value: "Target", fill: T.accent, fontSize: 11 }} />}
              <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2.5} dot={{ fill: T.accent, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measurements chart */}
      {weightLog.filter(e => e.waist).length > 0 && (
        <div style={card}>
          <span style={labelS}>MEASUREMENTS ({unit})</span>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={measChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
              <Tooltip {...tipStyle} />
              {[["waist", "#FF9500"], ["chest", T.accent], ["hips", "#FF2D55"], ["arms", "#34C759"]].map(([k, c]) => (
                <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={{ fill: c, r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
            {[["waist","#FF9500","Waist"],["chest",T.accent,"Chest"],["hips","#FF2D55","Hips"],["arms","#34C759","Arms"]].map(([k,c,l]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.textSec }}>
                <div style={{ width: 12, height: 3, background: c, borderRadius: 2 }} />{l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry log with delete */}
      {weightLog.length > 0 && (
        <div style={card}>
          <span style={labelS}>ALL ENTRIES</span>
          {[...weightLog].reverse().map((e) => (
            <div key={e.id || e.loggedAt} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${T.divider}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{e.date}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>
                  {dispWeight(e.weight)}{weightUnit}{e.waist ? ` · W ${dispMeas(e.waist)}${unit}` : ""}{e.chest ? ` · C ${dispMeas(e.chest)}${unit}` : ""}{e.hips ? ` · H ${dispMeas(e.hips)}${unit}` : ""}{e.arms ? ` · A ${dispMeas(e.arms)}${unit}` : ""}
                </div>
              </div>
              <button
                onClick={() => handleDelete(e)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.textSec, padding: "4px 8px" }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {weightLog.length === 0 && (
        <div style={{ ...card, textAlign: "center", color: T.textSec, fontSize: 15, padding: "32px 20px" }}>
          No weight entries yet.<br />Log your first entry above!
        </div>
      )}
    </>
  );
}
