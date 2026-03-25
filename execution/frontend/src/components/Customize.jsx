// execution/frontend/src/components/Customize.jsx
// Character appearance customiser — Apple iOS Health aesthetic

import { useState } from "react";
import { useTheme } from "../theme";
import HumanCharacter from "./HumanCharacter";

const SKIN_TONES   = [{ v: "#FDDBB4", l: "Light" }, { v: "#F5C5A3", l: "Fair" }, { v: "#E8A87C", l: "Medium" }, { v: "#C68642", l: "Tan" }, { v: "#8D5524", l: "Brown" }, { v: "#4A2912", l: "Deep" }];
const HAIR_COLORS  = [{ v: "#1a1a1a", l: "Black" }, { v: "#3D2B1F", l: "Dark Brown" }, { v: "#7B4F2E", l: "Brown" }, { v: "#C8A165", l: "Blonde" }, { v: "#B5451B", l: "Auburn" }, { v: "#e2e8f0", l: "White" }, { v: "#E63946", l: "Red" }, { v: "#6366f1", l: "Purple" }];
const HAIR_STYLES  = [{ v: "short", l: "Short" }, { v: "long", l: "Long" }, { v: "curly", l: "Curly" }, { v: "ponytail", l: "Ponytail" }, { v: "buzz", l: "Buzz" }, { v: "bald", l: "Bald" }];
const SHIRT_COLORS = [{ v: "#6366f1", l: "Purple" }, { v: "#3b82f6", l: "Blue" }, { v: "#10b981", l: "Green" }, { v: "#ef4444", l: "Red" }, { v: "#f59e0b", l: "Yellow" }, { v: "#ec4899", l: "Pink" }, { v: "#374151", l: "Grey" }, { v: "#e2e8f0", l: "White" }];
const PANTS_COLORS = [{ v: "#1e293b", l: "Navy" }, { v: "#1e40af", l: "Denim" }, { v: "#14532d", l: "Green" }, { v: "#374151", l: "Grey" }, { v: "#111", l: "Black" }, { v: "#7c2d12", l: "Rust" }];

function ColorDots({ label, value, onChange, options, T }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {options.map(o => (
          <div key={o.v} onClick={() => onChange(o.v)} title={o.l}
            style={{
              width: 32, height: 32, borderRadius: "50%", background: o.v, cursor: "pointer",
              border: value === o.v ? `3px solid ${T.accent}` : "3px solid transparent",
              boxShadow: value === o.v ? `0 0 0 2px ${T.accent}44` : "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }} />
        ))}
      </div>
    </div>
  );
}

function Chips({ label, value, onChange, options, T }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)}
            style={{
              padding: "8px 16px", borderRadius: 20, border: "none",
              background: value === o.v ? T.chipActive : T.chipInactive,
              color: value === o.v ? T.chipActiveText : T.chipInactiveText,
              cursor: "pointer", fontSize: 14, fontWeight: 600,
              transition: "all 0.2s",
            }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Customize({ stats, initialAppearance, onComplete }) {
  const { T, isDark, toggle } = useTheme();
  const [appearance, setAppearance] = useState(initialAppearance || {
    skinTone: "#F5C5A3", hairColor: "#3D2B1F", hairStyle: "short",
    shirtColor: "#6366f1", pantsColor: "#1e293b"
  });
  const set = (k, v) => setAppearance(a => ({ ...a, [k]: v }));

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.headerBorder}`, padding: "20px 20px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: T.accent }}>STEP 2</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>Customise Your Avatar</h1>
          </div>
          <button onClick={toggle} style={{
            background: T.inputBg, border: "none", borderRadius: 10,
            padding: "8px 12px", fontSize: 16, cursor: "pointer",
          }}>
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        {/* Live preview */}
        <div style={{
          background: T.card, borderRadius: 20, boxShadow: T.cardShadow,
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: 12, padding: "14px 20px", marginBottom: 16,
        }}>
          <HumanCharacter bf={parseFloat(stats?.bf) || 20} sex={stats?.sex || "male"} age={parseInt(stats?.age) || 25} progress={55} appearance={appearance} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 6 }}>{stats?.name || "Your Character"}</div>
            <div style={{ fontSize: 15, color: T.textSec, lineHeight: 1.9 }}>
              {stats?.weight && <div>{stats.weight} kg</div>}
              {stats?.bf && <div>{stats.bf}% body fat</div>}
              {stats?.goal && <div>Goal: {stats.goal}</div>}
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ background: T.card, borderRadius: 20, boxShadow: T.cardShadow, padding: 24 }}>
          <ColorDots label="SKIN TONE"  value={appearance.skinTone}   onChange={v => set("skinTone", v)}   options={SKIN_TONES}   T={T} />
          <ColorDots label="HAIR COLOR" value={appearance.hairColor}  onChange={v => set("hairColor", v)}  options={HAIR_COLORS}  T={T} />
          <Chips     label="HAIR STYLE" value={appearance.hairStyle}  onChange={v => set("hairStyle", v)}  options={HAIR_STYLES}  T={T} />
          <ColorDots label="SHIRT"      value={appearance.shirtColor} onChange={v => set("shirtColor", v)} options={SHIRT_COLORS} T={T} />
          <ColorDots label="PANTS"      value={appearance.pantsColor} onChange={v => set("pantsColor", v)} options={PANTS_COLORS} T={T} />
          <button
            style={{
              width: "100%", background: T.btnPrimary, border: "none", borderRadius: 14, padding: 16,
              color: T.btnPrimaryText, fontWeight: 700, fontSize: 17, cursor: "pointer", marginTop: 8,
            }}
            onClick={() => onComplete(appearance)}
          >
            START TRACKING →
          </button>
        </div>
      </div>
    </div>
  );
}
