// execution/frontend/src/components/History.jsx
// Full history tab — Apple iOS Health aesthetic with calendar strip

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useTheme } from "../theme";

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
  const [mealLog,   setMealLog]   = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const mq = query(collection(db, "users", user.uid, "food_logs"),   orderBy("date", "desc"));
    const wq = query(collection(db, "users", user.uid, "weight_logs"), orderBy("loggedAt", "desc"));

    const mUnsub = onSnapshot(mq, (snap) => {
      setMealLog(snap.docs.map(d => d.data()));
      setLoading(false);
    }, (err) => {
      console.error("Meal history load failed:", err.message);
      setLoading(false);
    });

    const wUnsub = onSnapshot(wq, (snap) => {
      setWeightLog(snap.docs.map(d => d.data()));
      setLoading(false);
    }, (err) => {
      console.error("Weight history load failed:", err.message);
      setLoading(false);
    });

    return () => { mUnsub(); wUnsub(); };
  }, [user]);

  const datesWithData = useMemo(() => {
    const s = new Set();
    mealLog.forEach(e => { if (e.date) s.add(e.date); });
    weightLog.forEach(e => { if (e.loggedAt) s.add(e.loggedAt); });
    return s;
  }, [mealLog, weightLog]);

  const selKey = toDateKey(selectedDate);
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
        t.cal += item.cal || 0;
        t.protein += item.protein || 0;
        t.carbs += item.carbs || 0;
        t.fat += item.fat || 0;
      });
    });
    return t;
  }, [dayMeals]);

  const monthDays = getMonthDays(viewMonth.year, viewMonth.month);
  const now = new Date();
  const todayKey = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

  const prevMonth = () => setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const nextMonth = () => setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const card = {
    background: T.card,
    borderRadius: 20,
    boxShadow: T.cardShadow,
    padding: 20,
    marginBottom: 16,
  };
  const labelS = { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: T.textSec, display: "block", marginBottom: 12 };

  if (loading) return (
    <div style={{ ...card, marginTop: 14, color: T.textSec, fontSize: 15, textAlign: "center", padding: "32px 20px" }}>
      Loading history...
    </div>
  );

  const selDisplay = selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {/* Calendar strip */}
      <div style={{ ...card, marginTop: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.accent, padding: "4px 8px" }}>‹</button>
          <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
            {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
          </span>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.accent, padding: "4px 8px" }}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: T.textSec, letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {Array.from({ length: monthDays[0]?.getDay() || 0 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {monthDays.map(day => {
            const dk = toDateKey(day);
            const isSelected = dk === selKey;
            const isToday = dk === todayKey;
            const hasData = datesWithData.has(dk);
            return (
              <button
                key={dk}
                onClick={() => setSelectedDate(new Date(day))}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  background: isSelected ? T.accent : isToday ? T.inputBg : "transparent",
                  color: isSelected ? "#fff" : T.text,
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: isSelected || isToday ? 700 : 400,
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {day.getDate()}
                {hasData && (
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: isSelected ? "#fff" : T.accent,
                    position: "absolute",
                    bottom: 4,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date header */}
      <div style={{ ...card, padding: "14px 20px" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>{selDisplay}</div>
        {dayMeals.length === 0 && dayWeights.length === 0 ? (
          <div style={{ fontSize: 14, color: T.textSec }}>No entries on this date</div>
        ) : (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
            <div style={{ fontSize: 14, color: "#FF9500", fontWeight: 600 }}>{dayTotals.cal.toFixed(0)} kcal</div>
            <div style={{ fontSize: 13, color: T.textSec }}>P:{dayTotals.protein.toFixed(0)}g · C:{dayTotals.carbs.toFixed(0)}g · F:{dayTotals.fat.toFixed(0)}g</div>
            {dayWeights.length > 0 && (
              <div style={{ fontSize: 14, color: T.accent, fontWeight: 600 }}>{dayWeights[0].weight} kg</div>
            )}
          </div>
        )}
      </div>

      {/* Weight entries */}
      {dayWeights.length > 0 && (
        <div style={card}>
          <span style={labelS}>WEIGHT LOG</span>
          {dayWeights.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.divider}` }}>
              <div>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 600 }}>{e.date}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                  {e.waist ? `Waist: ${e.waist}cm` : ""}
                  {e.chest ? `  Chest: ${e.chest}cm` : ""}
                  {e.hips  ? `  Hips: ${e.hips}cm`  : ""}
                  {e.arms  ? `  Arms: ${e.arms}cm`  : ""}
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
                {e.weight}<span style={{ fontSize: 13, color: T.textSec, fontWeight: 400 }}> kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal entries */}
      {dayMeals.length > 0 && (
        <div style={card}>
          <span style={labelS}>MEALS</span>
          {dayMeals.map((entry, i) => (
            <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.divider}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{entry.label}</span>
                <span style={{ fontSize: 13, color: T.textSec }}>{entry.time}</span>
              </div>
              {(entry.items || []).map((item, j) => (
                <div key={j} style={{ marginBottom: 6, paddingLeft: 12, borderLeft: `3px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 15, color: T.text }}>{item.grams}g {item.name}</span>
                    <span style={{ fontSize: 15, color: "#FF9500", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{item.cal} kcal</span>
                  </div>
                  <div style={{ fontSize: 13, color: T.textSec, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g</div>
                </div>
              ))}
              <div style={{ fontSize: 14, color: "#FF9500", fontWeight: 700, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                {(entry.items || []).reduce((a, m) => a + (m.cal || 0), 0).toFixed(0)} kcal total
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
