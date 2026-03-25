// execution/frontend/src/components/WeightTracker.jsx
// Weight + measurements tracker — Apple iOS Health aesthetic

import { useState, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useTheme } from "../theme";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import HumanCharacter from "./HumanCharacter";

export default function WeightTracker({ user, stats, goals, appearance }) {
  const { T } = useTheme();
  const [weightLog, setWeightLog] = useState([]);
  const [entry, setEntry]   = useState({ weight: "", waist: "", chest: "", hips: "", arms: "" });
  const [saving, setSaving] = useState(false);

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
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    const record = {
      date:     new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      loggedAt: today,
      weight:   parseFloat(entry.weight) || null,
      waist:    parseFloat(entry.waist)  || null,
      chest:    parseFloat(entry.chest)  || null,
      hips:     parseFloat(entry.hips)   || null,
      arms:     parseFloat(entry.arms)   || null,
    };

    setWeightLog(p => [...p, record]);
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
      {/* Character + Goal Timeline panel */}
      <div style={{ ...card, marginTop: 14, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flexShrink: 0 }}>
          <HumanCharacter
            bf={parseFloat(stats?.bf) || 20}
            sex={stats?.sex || "male"}
            age={parseInt(stats?.age) || 25}
            progress={weightProgress}
            appearance={appearance || {}}
            animate={false}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 2 }}>{stats?.name || "Your Character"}</div>
          {stats?.bf && <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{stats.bf}% body fat</div>}
          {goals && stats?.targetDate && stats?.targetWeight && stats?.goal !== "maintain" ? (
            <>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>Goal Timeline</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                {stats.goal === "cut" ? "Lose" : "Gain"} {goals.weightGap}kg in {goals.weeksToGoal} weeks
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>
                Daily {stats.goal === "cut" ? "deficit" : "surplus"}: {goals.rawDelta} kcal
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: T.textSec }}>Set a target date in Progress to see your timeline</div>
          )}
        </div>
      </div>

      {/* Goal progress */}
      {stats?.targetWeight && (
        <div style={{ ...card, marginTop: 14 }}>
          <span style={labelS}>WEIGHT GOAL</span>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: T.textSec }}>Start: <b style={{ color: T.text }}>{stats.weight} kg</b></span>
            <span style={{ color: T.textSec }}>Target: <b style={{ color: T.accent }}>{stats.targetWeight} kg</b></span>
            {latest && <span style={{ color: T.textSec }}>Now: <b style={{ color: "#34C759" }}>{latest} kg</b></span>}
          </div>
          <div style={{ background: T.inputBg, borderRadius: 6, height: 10, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ width: `${weightProgress}%`, background: T.accent, height: "100%", borderRadius: 6, transition: "width 1s ease" }} />
          </div>
          <div style={{ fontSize: 13, color: T.textSec, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              if (!latest) return `${weightProgress.toFixed(0)}% toward goal`;
              const gap = Math.abs(latest - targetW);
              if (gap < 0.05) return "Goal reached 🎉";
              const weeks = Math.round(gap / 0.5);
              const isBulk = targetW > latest;
              return `${isBulk ? "↑" : "↓"} ${gap.toFixed(1)} kg to goal (~${weeks} week${weeks !== 1 ? "s" : ""})`;
            })()}
          </div>
        </div>
      )}

      {/* Log entry */}
      <div style={{ ...card, marginTop: stats?.targetWeight ? 0 : 14 }}>
        <span style={labelS}>LOG TODAY'S STATS</span>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 6 }}>WEIGHT (kg)</div>
          <input style={inputS} type="number" step="0.1" value={entry.weight} onChange={e => setEntry(p => ({ ...p, weight: e.target.value }))} placeholder="72.4" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10, letterSpacing: 0.5 }}>MEASUREMENTS (cm, optional)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[["waist", "Waist"], ["chest", "Chest"], ["hips", "Hips"], ["arms", "Arms"]].map(([k, l]) => (
            <div key={k}>
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 6 }}>{l}</div>
              <input type="number" value={entry[k]} onChange={e => setEntry(p => ({ ...p, [k]: e.target.value }))} placeholder="cm"
                style={inputS} />
            </div>
          ))}
        </div>
        <button style={{
          width: "100%", background: T.btnPrimary, border: "none", borderRadius: 14, padding: 16,
          color: T.btnPrimaryText, fontWeight: 700, fontSize: 17, cursor: "pointer",
        }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Weight"}
        </button>
      </div>

      {/* Weight chart */}
      {weightLog.length > 0 && (
        <div style={card}>
          <span style={labelS}>WEIGHT OVER TIME</span>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightLog} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
              <Tooltip {...tipStyle} />
              {targetW && <ReferenceLine y={targetW} stroke={T.accent} strokeDasharray="4 3" label={{ value: "Target", fill: T.accent, fontSize: 11 }} />}
              <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2.5} dot={{ fill: T.accent, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measurements chart */}
      {weightLog.filter(e => e.waist).length > 0 && (
        <div style={card}>
          <span style={labelS}>MEASUREMENTS (cm)</span>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightLog} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
          {weightLog.length >= 2 && (() => {
            const last10 = weightLog.slice(-10);
            return (
              <ResponsiveContainer width="100%" height={120} style={{ marginBottom: 16 }}>
                <LineChart data={last10} margin={{ top: 8, right: 8, left: -32, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} />
                  <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent, r: 3 }} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
          {[...weightLog].reverse().map((e) => (
            <div key={e.id || e.loggedAt} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${T.divider}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{e.date}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>
                  {e.weight}kg{e.waist ? ` · W ${e.waist}` : ""}{e.chest ? ` · C ${e.chest}` : ""}{e.hips ? ` · H ${e.hips}` : ""}{e.arms ? ` · A ${e.arms}` : ""}
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
