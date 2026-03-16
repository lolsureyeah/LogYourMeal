import { useState } from "react";
import { calcGoals } from "../utils/calculations";

// Hardcoded theme to avoid useTheme dependency as requested by USER
const T = {
  bg:              "#F2F2F7",
  card:            "#FFFFFF",
  cardShadow:      "0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  text:            "#000000",
  textSec:         "#8E8E93",
  border:          "#E5E5EA",
  inputBg:         "#F2F2F7",
  accent:          "#007AFF",
  divider:         "rgba(0,0,0,0.06)",
  btnPrimary:      "#000000",
  btnPrimaryText:  "#FFFFFF",
  chipActive:      "#000000",
  chipActiveText:  "#FFFFFF",
  chipInactive:    "#F2F2F7",
  chipInactiveText:"#8E8E93",
};

const MACRO_FIELDS  = ["customProtein", "customCarbs", "customFat"];
const MACRO_MULT    = { customProtein: 4, customCarbs: 4, customFat: 9 };
const MACRO_LABEL   = { customProtein: "Protein (g)", customCarbs: "Carbs (g)", customFat: "Fat (g)" };
const MACRO_LIVEKEY = { customProtein: "protein",     customCarbs: "carbs",     customFat: "fat" };

export default function Onboarding({ initialStats, onComplete }) {
  const [stats, setStats] = useState(initialStats || {
    name: "", age: "", weight: "", height: "",
    bf: "", sex: "male", goal: "maintain", targetWeight: "",
    activityDescription: "sedentary",
    customCal: "", customProtein: "", customCarbs: "", customFat: "",
    targetDate: "",
  });

  // touchedOrder: macro field names ordered from oldest-touched (index 0) to newest-touched (last)
  const [touchedOrder, setTouchedOrder] = useState([]);
  // lockedMacro: the one macro that is always auto-calculated; user can change via lock icon
  const [lockedMacro, setLockedMacro] = useState("customFat");

  const set = (k, v) => setStats(s => ({ ...s, [k]: v }));

  const liveGoals = calcGoals(stats);

  // ── Macro derived state ──────────────────────────────────────────────────────
  const customCalVal  = parseFloat(stats.customCal) || 0;
  const calGoalEff    = customCalVal > 0 ? customCalVal : liveGoals.cal;
  const anyMacrosTouched = touchedOrder.length > 0;

  // "Only cal set, no macros touched" → show default-split suggestions
  const showDefaultSplit = customCalVal > 0 && !anyMacrosTouched;

  const defaultSplitVals = {
    customProtein: Math.round(calGoalEff * 0.30 / 4),
    customCarbs:   Math.round(calGoalEff * 0.45 / 4),
    customFat:     Math.round(calGoalEff * 0.25 / 9),
  };

  // Which macro is auto-calculated? Controlled by user lock selection.
  const autoField = lockedMacro;

  // Computed auto value
  const autoValue = anyMacrosTouched ? (() => {
    const otherCals = MACRO_FIELDS
      .filter(f => f !== autoField)
      .reduce((sum, f) => sum + (parseFloat(stats[f]) || 0) * MACRO_MULT[f], 0);
    return Math.round((calGoalEff - otherCals) / MACRO_MULT[autoField]);
  })() : null;

  // Excess-calorie error: auto would go negative
  const excessKcal = (anyMacrosTouched && autoValue !== null && autoValue < 0)
    ? Math.round(
        MACRO_FIELDS
          .filter(f => f !== autoField)
          .reduce((s, f) => s + (parseFloat(stats[f]) || 0) * MACRO_MULT[f], 0)
        - calGoalEff
      )
    : 0;
  const calError = excessKcal > 0;

  // Effective macro values for the live calorie counter
  const effectiveVals = {};
  MACRO_FIELDS.forEach(f => {
    if (showDefaultSplit)                        effectiveVals[f] = defaultSplitVals[f];
    else if (anyMacrosTouched && f === autoField) effectiveVals[f] = Math.max(0, autoValue || 0);
    else                                          effectiveVals[f] = parseFloat(stats[f]) || 0;
  });
  // Touch handler: when a macro field is edited
  const touchMacro = (field, value) => {
    // If leaving AI-suggested mode, pre-fill the other fields so they retain their values
    if (showDefaultSplit) {
      setStats(prev => ({
        ...prev,
        customProtein: String(defaultSplitVals.customProtein),
        customCarbs:   String(defaultSplitVals.customCarbs),
        customFat:     String(defaultSplitVals.customFat),
        [field]: value,
      }));
    } else {
      set(field, value);
    }
    setTouchedOrder(prev => [...prev.filter(f => f !== field), field]);
  };

  // ── Other existing state ─────────────────────────────────────────────────────
  const bfHint = stats.sex === "female"
    ? "Female ranges: Essential 10–13% · Athlete 14–20% · Fitness 21–24% · Average 25–31% · Overweight 32–37% · Obese 38%+"
    : "Male ranges: Essential 2–5% · Athlete 6–13% · Fitness 14–17% · Average 18–24% · Overweight 25–29% · Obese 30%+";

  const weeksAway = stats.targetDate
    ? Math.round((new Date(stats.targetDate) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const S = {
    page:  { minHeight: "100vh", background: T.bg, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "system-ui, -apple-system, sans-serif" },
    card:  { width: "100%", maxWidth: 440, background: T.card, borderRadius: 24, padding: "32px 28px", boxShadow: T.cardShadow },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },
    input: { width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 16px", color: T.text, fontSize: 17, marginBottom: 16, boxSizing: "border-box", outline: "none" },
    hint:  { fontSize: 12, color: T.textSec, marginTop: -12, marginBottom: 16, lineHeight: 1.6 },
    chip:  (active) => ({
      flex: 1, padding: "12px 4px", borderRadius: 12, border: "none",
      background: active ? T.chipActive : T.chipInactive,
      color: active ? T.chipActiveText : T.chipInactiveText,
      cursor: "pointer", fontSize: 15, fontWeight: 600,
      transition: "all 0.2s",
    }),
    btn: {
      width: "100%", background: T.btnPrimary, border: "none", borderRadius: 14, padding: 16,
      color: T.btnPrimaryText, fontWeight: 700, fontSize: 17, cursor: "pointer", marginTop: 8,
    },
    previewBox: {
      background: T.inputBg, borderRadius: 16, padding: "14px 18px", marginBottom: 20,
      border: `1px dashed ${T.accent}`, display: "flex", justifyContent: "space-between", alignItems: "center"
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: T.accent, marginBottom: 8 }}>LOGYOURMEAL</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>Build Your Character</h1>
          <p style={{ color: T.textSec, fontSize: 15, marginTop: 8, lineHeight: 1.5 }}>Your stats shape your character's body and calculate personalised macros.</p>
        </div>

        <label style={S.label}>Name</label>
        <input style={S.input} value={stats.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Arjun" />

        <label style={S.label}>Age</label>
        <input style={S.input} type="number" value={stats.age} onChange={e => set("age", e.target.value)} placeholder="25" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={S.label}>Weight (kg)</label>
            <input style={S.input} type="number" value={stats.weight} onChange={e => set("weight", e.target.value)} placeholder="72" />
          </div>
          <div>
            <label style={S.label}>Height (cm)</label>
            <input style={S.input} type="number" value={stats.height} onChange={e => set("height", e.target.value)} placeholder="175" />
          </div>
        </div>

        <label style={S.label}>Sex</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["male", "female"].map(sx => (
            <button key={sx} style={S.chip(stats.sex === sx)} onClick={() => set("sex", sx)}>
              {sx[0].toUpperCase() + sx.slice(1)}
            </button>
          ))}
        </div>

        <label style={S.label}>Body Fat % — optional</label>
        <input style={S.input} type="number" step="0.5" value={stats.bf} onChange={e => set("bf", e.target.value)} placeholder={stats.sex === "female" ? "e.g. 25" : "e.g. 18"} />
        <div style={S.hint}>{bfHint}</div>

        <label style={S.label}>Activity / Training</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { v: "sedentary",   l: "Sedentary" },
            { v: "light walk",  l: "Light (1-2x/wk)" },
            { v: "moderate",    l: "Moderate (3-4x/wk)" },
            { v: "very active", l: "Active (5+x/wk)" }
          ].map(a => (
            <button key={a.v} style={S.chip(stats.activityDescription === a.v)} onClick={() => set("activityDescription", a.v)}>
              {a.l}
            </button>
          ))}
        </div>

        <label style={S.label}>Goal</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{ v: "cut", l: "Cut 🔪" }, { v: "maintain", l: "Maintain ⚖️" }, { v: "bulk", l: "Bulk 📈" }].map(g => (
            <button key={g.v} style={S.chip(stats.goal === g.v)} onClick={() => set("goal", g.v)}>{g.l}</button>
          ))}
        </div>

        <label style={S.label}>Target Weight (kg) — optional</label>
        <input style={S.input} type="number" value={stats.targetWeight} onChange={e => set("targetWeight", e.target.value)} placeholder="e.g. 68" />

        <label style={{ ...S.label, opacity: stats.goal === "maintain" ? 0.5 : 1 }}>Goal Date — optional</label>
        <input
          style={{ ...S.input, opacity: stats.goal === "maintain" ? 0.5 : 1, cursor: stats.goal === "maintain" ? "default" : "pointer" }}
          type="date"
          value={stats.targetDate || ""}
          onChange={e => set("targetDate", e.target.value)}
          disabled={stats.goal === "maintain"}
          min={new Date().toISOString().split("T")[0]}
          max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0]}
          onClick={(e) => { if (!e.target.disabled && e.target.showPicker) e.target.showPicker(); }}
        />
        {weeksAway !== null && stats.goal !== "maintain" && (
          <div style={{ fontSize: 12, color: T.textSec, fontStyle: "italic", marginTop: -12, marginBottom: 16 }}>
            That's {weeksAway} weeks away
          </div>
        )}

        {/* ── Daily Goals ─────────────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${T.divider}`, marginTop: 8, paddingTop: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Daily Goals</div>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>
            Leave blank for AI calculation based on your stats. Enter calories only for a default macro split.
          </div>

          {/* Estimated target preview */}
          <div style={S.previewBox}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1, marginBottom: 2 }}>ESTIMATED TARGET</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{liveGoals.cal} <span style={{ fontSize: 14, fontWeight: 400, color: T.textSec }}>kcal / day</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>P: {liveGoals.protein}g · C: {liveGoals.carbs}g · F: {liveGoals.fat}g</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>TDEE: {liveGoals.tdee} kcal</div>
            </div>
          </div>

          {/* Calories — anchor field */}
          <label style={S.label}>Calories (kcal)</label>
          <input
            style={{
              ...S.input,
              marginBottom: calError ? 6 : 16,
              borderColor: calError ? "#FF3B30" : T.border,
            }}
            type="number"
            value={stats.customCal || ""}
            onChange={e => set("customCal", e.target.value)}
            placeholder={String(liveGoals.cal)}
          />
          {calError && (
            <div style={{ fontSize: 12, color: "#FF3B30", marginBottom: 16, lineHeight: 1.5 }}>
              Macros exceed calorie goal by {excessKcal}kcal — increase calories or reduce a macro
            </div>
          )}

          {/* Auto-calculate chip row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: T.textSec, fontWeight: 500, whiteSpace: "nowrap" }}>Auto-calculate:</span>
            {MACRO_FIELDS.map(field => {
              const label = { customProtein: "Protein", customCarbs: "Carbs", customFat: "Fat" }[field];
              const active = field === lockedMacro;
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => setLockedMacro(field)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    background: active ? T.accent : T.chipInactive,
                    color: active ? "#FFFFFF" : T.chipInactiveText,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Macro fields — 3-column grid, equal width */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {MACRO_FIELDS.map((field) => {
              const isAuto        = field === autoField;
              const isDefaultSugg = showDefaultSplit;
              const isGreyed      = isAuto || isDefaultSugg;

              const displayValue = (() => {
                if (isAuto && anyMacrosTouched && autoValue !== null) return autoValue > 0 ? String(autoValue) : "";
                if (isDefaultSugg) return String(defaultSplitVals[field]);
                return stats[field] || "";
              })();

              return (
                <div key={field}>
                  <label style={{ ...S.label, opacity: isGreyed ? 0.55 : 1 }}>
                    {MACRO_LABEL[field]}
                  </label>
                  <input
                    type="number"
                    value={displayValue}
                    disabled={isAuto}
                    style={{
                      ...S.input,
                      marginBottom: 4,
                      ...(isGreyed ? { opacity: 0.55, cursor: "default" } : {}),
                    }}
                    onChange={e => !isAuto && touchMacro(field, e.target.value)}
                    placeholder={isAuto ? "Auto" : String(liveGoals[MACRO_LIVEKEY[field]])}
                  />
                  {isAuto ? (
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>
                      Auto-calculated
                    </div>
                  ) : isDefaultSugg ? (
                    <div style={{ fontSize: 11, color: T.accent, marginBottom: 12 }}>
                      AI suggested
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          style={{ ...S.btn, ...(calError ? { opacity: 0.45, cursor: "not-allowed" } : {}) }}
          disabled={calError}
          onClick={() => {
            if (calError) return;
            const out = { ...stats };

            // Include the auto-calculated macro value
            if (anyMacrosTouched && autoValue !== null && autoValue > 0) {
              out[autoField] = String(autoValue);
            }

            // If only cal was set (default split), persist all three suggested macros
            if (showDefaultSplit && customCalVal > 0) {
              out.customProtein = String(defaultSplitVals.customProtein);
              out.customCarbs   = String(defaultSplitVals.customCarbs);
              out.customFat     = String(defaultSplitVals.customFat);
            }

            // Coerce to number or null
            ["customCal", "customProtein", "customCarbs", "customFat"].forEach(k => {
              if (!out[k] || parseFloat(out[k]) === 0) out[k] = null;
              else out[k] = parseFloat(out[k]);
            });

            onComplete(out);
          }}
        >Save Goals</button>
      </div>
    </div>
  );
}
