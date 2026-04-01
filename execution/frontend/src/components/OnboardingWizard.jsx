// execution/frontend/src/components/OnboardingWizard.jsx
// First-login-only welcome wizard: 3 steps — welcome, feature tour, basic info
// Shown only when user.metadata.creationTime ≈ lastSignInTime (within 2 min)

import { useState } from "react";
import { useTheme } from "../theme";
import { calcGoals } from "../utils/calculations";

const FEATURE_CARDS = [
  {
    icon: "🤖",
    title: "AI Meal Logging",
    desc: "Just type what you ate in plain English. Our AI figures out the rest.",
  },
  {
    icon: "📊",
    title: "Macro Tracking",
    desc: "See your calories, protein, carbs and fat update in real time.",
  },
  {
    icon: "⚖️",
    title: "Weight & Goals",
    desc: "Log your weight, set a target, and track your progress over time.",
  },
];

const ACTIVITY_OPTIONS = [
  { v: "sedentary",   l: "Sedentary" },
  { v: "light walk",  l: "Light (1 2x/wk)" },
  { v: "moderate",    l: "Moderate (3 4x/wk)" },
  { v: "very active", l: "Active (5+x/wk)" },
];

const GOALS = [
  { v: "cut",      l: "Cut" },
  { v: "maintain", l: "Maintain" },
  { v: "bulk",     l: "Bulk" },
];

export default function OnboardingWizard({ onComplete }) {
  const { T } = useTheme();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", age: "", weight: "", height: "",
    sex: "male", bf: "", activityDescription: "sedentary",
    goal: "maintain", targetWeight: "", targetDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightUnit, setHeightUnit] = useState("cm");

  const kgToLbs   = (v) => v ? +(parseFloat(v) * 2.20462).toFixed(1) : "";
  const lbsToKg   = (v) => { const n = parseFloat(v); return isNaN(n) ? "" : String(+(n / 2.20462).toFixed(2)); };
  const cmToFtIn  = (cm) => { const totalIn = parseFloat(cm) / 2.54; return { ft: Math.floor(totalIn / 12), in: Math.floor(totalIn % 12) }; };
  const ftInToCm  = (ft, inch) => String(+((parseFloat(ft)||0) * 12 * 2.54 + (parseFloat(inch)||0) * 2.54).toFixed(1));

  const weightDisp  = weightUnit === "lbs" && form.weight ? String(kgToLbs(form.weight)) : form.weight;
  const targetWDisp = weightUnit === "lbs" && form.targetWeight ? String(kgToLbs(form.targetWeight)) : form.targetWeight;
  const heightFtIn  = form.height ? cmToFtIn(form.height) : { ft: "", in: "" };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Live calorie estimate for the preview box
  const liveGoals = calcGoals(form);

  const weeksAway = form.targetDate
    ? Math.round((new Date(form.targetDate) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const bfHint = form.sex === "female"
    ? "Female: Essential 10 13% · Athlete 14 20% · Fitness 21 24% · Average 25 31% · Obese 38%+"
    : "Male: Essential 2 5% · Athlete 6 13% · Fitness 14 17% · Average 18 24% · Obese 30%+";

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Please enter your name."); return; }
    if (!form.age)          { setError("Please enter your age."); return; }
    if (!form.weight)       { setError("Please enter your weight."); return; }
    setError("");
    setSaving(true);

    const stats = {
      name:                form.name.trim(),
      age:                 parseFloat(form.age),
      weight:              parseFloat(form.weight),
      height:              form.height         ? parseFloat(form.height)       : null,
      bf:                  form.bf             ? form.bf                       : "",
      sex:                 form.sex,
      activityDescription: form.activityDescription,
      goal:                form.goal,
      targetWeight:        form.targetWeight   ? parseFloat(form.targetWeight) : null,
      targetDate:          form.targetDate     || null,
      customCal:           null,
      customProtein:       null,
      customCarbs:         null,
      customFat:           null,
    };

    try {
      await onComplete(stats);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const S = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 9999,
      background: T.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 16,
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    card: {
      width: "100%", maxWidth: 440,
      background: T.card, borderRadius: 24,
      padding: "32px 28px", boxShadow: T.cardShadow,
      overflowY: "auto", maxHeight: "calc(100dvh - 32px)",
    },
    label: {
      display: "block", fontSize: 13, fontWeight: 600,
      color: T.textSec, marginBottom: 6,
      letterSpacing: 0.5, textTransform: "uppercase",
    },
    input: {
      width: "100%", background: T.inputBg,
      border: `1px solid ${T.border}`, borderRadius: 12,
      padding: "13px 16px", color: T.text, fontSize: 17,
      marginBottom: 16, boxSizing: "border-box", outline: "none",
    },
    hint: {
      fontSize: 12, color: T.textSec,
      marginTop: -12, marginBottom: 16, lineHeight: 1.6,
    },
    btn: {
      width: "100%", background: T.btnPrimary,
      border: "none", borderRadius: 14, padding: 16,
      color: T.btnPrimaryText, fontWeight: 700, fontSize: 17,
      cursor: "pointer", marginTop: 8,
    },
    chip: (active) => ({
      flex: 1, padding: "12px 4px", borderRadius: 12, border: "none",
      background: active ? T.chipActive : T.chipInactive,
      color: active ? T.chipActiveText : T.chipInactiveText,
      cursor: "pointer", fontSize: 15, fontWeight: 600,
      transition: "all 0.2s",
    }),
    backBtn: {
      background: "none", border: "none", color: T.textSec,
      fontSize: 15, cursor: "pointer", padding: "0 4px",
      fontWeight: 500, marginBottom: 20, display: "inline-block",
    },
    previewBox: {
      background: T.inputBg, borderRadius: 16, padding: "14px 18px",
      marginBottom: 20, border: `1px dashed ${T.accent}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },
  };

  // ── Progress bar ──────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 28 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{
          height: 6, borderRadius: 3,
          width: s === step ? 28 : 8,
          background: s <= step ? T.accent : T.border,
          transition: "all 0.3s ease",
        }} />
      ))}
      <span style={{ fontSize: 12, color: T.textSec, marginLeft: 6, fontWeight: 500 }}>
        {step} / 3
      </span>
    </div>
  );

  // ── Step 1 — Welcome ──────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={S.overlay}>
      <div style={S.card}>
        <ProgressBar />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20, lineHeight: 1 }}>👋</div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 2,
            color: T.accent, marginBottom: 10, textTransform: "uppercase",
          }}>
            Khaaya
          </div>
          <h1 style={{
            margin: 0, fontSize: 30, fontWeight: 800,
            color: T.text, letterSpacing: -0.5, lineHeight: 1.2,
          }}>
            Welcome to Khaaya
          </h1>
          <p style={{
            color: T.textSec, fontSize: 16, marginTop: 14,
            lineHeight: 1.6, marginBottom: 36,
          }}>
            Track your food, hit your macros, reach your goals all powered by AI.
          </p>
        </div>
        <button style={S.btn} onClick={() => setStep(2)}>
          Get Started →
        </button>
      </div>
    </div>
  );

  // ── Step 2 — Feature tour ─────────────────────────────────────────────────
  if (step === 2) return (
    <div style={S.overlay}>
      <div style={S.card}>
        <ProgressBar />
        <button style={S.backBtn} onClick={() => setStep(1)}>← Back</button>
        <h2 style={{
          margin: 0, fontSize: 24, fontWeight: 800,
          color: T.text, letterSpacing: -0.3, marginBottom: 20,
        }}>
          Here's what you can do
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {FEATURE_CARDS.map((card, i) => (
            <div key={i} style={{
              background: T.inputBg, borderRadius: 16,
              padding: "16px 18px", border: `1px solid ${T.border}`,
              display: "flex", gap: 14, alignItems: "flex-start",
            }}>
              <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{card.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 4 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.55 }}>
                  {card.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button style={S.btn} onClick={() => setStep(3)}>
          Next →
        </button>
      </div>
    </div>
  );

  // ── Step 3 — Full profile setup ───────────────────────────────────────────
  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <ProgressBar />
        <button style={S.backBtn} onClick={() => setStep(2)}>← Back</button>

        <h2 style={{
          margin: 0, fontSize: 24, fontWeight: 800,
          color: T.text, letterSpacing: -0.3, marginBottom: 6,
        }}>
          Tell us about you
        </h2>
        <p style={{
          color: T.textSec, fontSize: 14, marginTop: 0,
          marginBottom: 24, lineHeight: 1.5,
        }}>
          We'll use this to calculate your personalised calorie and macro targets.
        </p>

        {/* Name */}
        <label style={S.label}>Name *</label>
        <input
          style={S.input}
          value={form.name}
          onChange={e => set("name", e.target.value)}
          placeholder="e.g. Arjun"
          autoFocus
        />

        {/* Age */}
        <label style={S.label}>Age *</label>
        <input
          style={S.input}
          type="number"
          value={form.age}
          onChange={e => set("age", e.target.value)}
          placeholder="25"
          min="10" max="100"
        />

        {/* Weight + Height side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Weight ({weightUnit}) *</label>
              <div style={{ display: "flex", background: T.inputBg, borderRadius: 6, padding: 2, gap: 2 }}>
                {["kg", "lbs"].map(u => (
                  <button key={u} type="button" onClick={() => setWeightUnit(u)} style={{ padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: weightUnit === u ? T.accent : "transparent", color: weightUnit === u ? "#fff" : T.textSec }}>{u}</button>
                ))}
              </div>
            </div>
            <input
              style={S.input}
              type="number" step="0.1"
              value={weightDisp}
              onChange={e => set("weight", weightUnit === "lbs" ? lbsToKg(e.target.value) : e.target.value)}
              placeholder={weightUnit === "lbs" ? "159" : "72"}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Height ({heightUnit})</label>
              <div style={{ display: "flex", background: T.inputBg, borderRadius: 6, padding: 2, gap: 2 }}>
                {["cm", "ft"].map(u => (
                  <button key={u} type="button" onClick={() => setHeightUnit(u)} style={{ padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: heightUnit === u ? T.accent : "transparent", color: heightUnit === u ? "#fff" : T.textSec }}>{u}</button>
                ))}
              </div>
            </div>
            {heightUnit === "cm" ? (
              <input style={S.input} type="number" value={form.height} onChange={e => set("height", e.target.value)} placeholder="175" />
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ ...S.input, width: "50%" }} type="number" value={heightFtIn.ft} onChange={e => set("height", ftInToCm(e.target.value, heightFtIn.in))} placeholder="5" />
                <input style={{ ...S.input, width: "50%" }} type="number" value={heightFtIn.in} onChange={e => set("height", ftInToCm(heightFtIn.ft, e.target.value))} placeholder="9" />
              </div>
            )}
          </div>
        </div>

        {/* Sex */}
        <label style={S.label}>Sex</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["male", "female"].map(sx => (
            <button key={sx} style={S.chip(form.sex === sx)} onClick={() => set("sex", sx)}>
              {sx[0].toUpperCase() + sx.slice(1)}
            </button>
          ))}
        </div>

        {/* Body Fat */}
        <label style={S.label}>Body Fat % (optional)</label>
        <input
          style={S.input}
          type="number" step="0.5"
          value={form.bf}
          onChange={e => set("bf", e.target.value)}
          placeholder={form.sex === "female" ? "e.g. 25" : "e.g. 18"}
        />
        <div style={S.hint}>{bfHint}</div>

        {/* Activity */}
        <label style={S.label}>Activity / Training</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {ACTIVITY_OPTIONS.map(a => (
            <button key={a.v} style={S.chip(form.activityDescription === a.v)} onClick={() => set("activityDescription", a.v)}>
              {a.l}
            </button>
          ))}
        </div>

        {/* Goal */}
        <label style={S.label}>Goal *</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {GOALS.map(g => (
            <button key={g.v} style={S.chip(form.goal === g.v)} onClick={() => set("goal", g.v)}>
              {g.v === "cut" ? "Cut 🔪" : g.v === "maintain" ? "Maintain ⚖️" : "Bulk 📈"}
            </button>
          ))}
        </div>

        {/* Target Weight */}
        <label style={S.label}>Target Weight ({weightUnit}, optional)</label>
        <input
          style={S.input}
          type="number" step="0.1"
          value={targetWDisp}
          onChange={e => set("targetWeight", weightUnit === "lbs" ? lbsToKg(e.target.value) : e.target.value)}
          placeholder={weightUnit === "lbs" ? "e.g. 150" : "e.g. 68"}
        />

        {/* Goal Date */}
        <label style={{ ...S.label, opacity: form.goal === "maintain" ? 0.5 : 1 }}>
          Goal Date (optional)
        </label>
        <input
          style={{
            ...S.input,
            opacity: form.goal === "maintain" ? 0.5 : 1,
            cursor: form.goal === "maintain" ? "default" : "pointer",
          }}
          type="date"
          value={form.targetDate || ""}
          onChange={e => set("targetDate", e.target.value)}
          disabled={form.goal === "maintain"}
          min={new Date().toISOString().split("T")[0]}
          max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0]}
          onClick={e => { if (!e.target.disabled && e.target.showPicker) e.target.showPicker(); }}
        />
        {weeksAway !== null && form.goal !== "maintain" && (
          <div style={{ fontSize: 12, color: T.textSec, fontStyle: "italic", marginTop: -12, marginBottom: 16 }}>
            That's {weeksAway} weeks away
          </div>
        )}

        {/* Estimated Target preview */}
        <div style={{ borderTop: `1px solid ${T.divider}`, marginTop: 4, paddingTop: 20, marginBottom: 4 }}>
          <div style={{ fontSize: 13, color: T.textSec, fontWeight: 600, marginBottom: 12 }}>
            Using AI calculated calories based on your stats.
          </div>
          <div style={S.previewBox}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1, marginBottom: 2 }}>
                ESTIMATED TARGET
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>
                {liveGoals.cal}{" "}
                <span style={{ fontSize: 14, fontWeight: 400, color: T.textSec }}>kcal / day</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>
                P: {liveGoals.protein}g · C: {liveGoals.carbs}g · F: {liveGoals.fat}g
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                TDEE: {liveGoals.tdee} kcal
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            color: "#FF3B30", fontSize: 13, fontWeight: 500,
            marginBottom: 12, lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        <button
          style={{ ...S.btn, ...(saving ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
          disabled={saving}
          onClick={handleSubmit}
        >
          {saving ? "Saving..." : "Let's Go →"}
        </button>
      </div>
    </div>
  );
}
