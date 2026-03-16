// execution/frontend/src/components/MacroBar.jsx
// Reusable macro progress bar — Apple iOS aesthetic

import { useTheme } from "../theme";

export default function MacroBar({ label, value, goal, color = "#007AFF" }) {
  const { T } = useTheme();
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const isOver = value > goal;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: isOver ? "#FF3B30" : T.text, fontVariantNumeric: "tabular-nums" }}>
          {value}g <span style={{ fontWeight: 400, color: T.textSec }}>/ {goal}g</span>
        </span>
      </div>
      <div style={{ background: T.inputBg, borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`,
          background: isOver ? "#FF3B30" : color,
          height: "100%",
          borderRadius: 6,
          transition: "width 0.8s cubic-bezier(.34,1.56,.64,1)",
        }} />
      </div>
    </div>
  );
}
