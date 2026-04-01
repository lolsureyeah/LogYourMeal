// execution/frontend/src/components/MicroEducation.jsx
// One-time bottom sheet shown after the user's first verified food log.
// Uses localStorage key "khaaya-edu-shown" so it only fires once, ever.

import { useTheme } from "../theme";

export default function MicroEducation({ onDismiss }) {
  const { T } = useTheme();

  const points = [
    { icon: "🌍", text: "Most apps use US food data" },
    { icon: "🇮🇳", text: "Khaaya uses Indian nutrition data from NIN" },
    { icon: "🍛", text: "That means better estimates for roti, dal, sabzi, etc." },
  ];

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "eduFadeIn 0.25s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: T.bg,
          borderRadius: "28px 28px 0 0",
          padding: "0 20px 36px",
          boxSizing: "border-box",
          animation: "eduSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 6px" }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: T.border }} />
        </div>

        {/* Accent badge */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, rgba(52,199,89,0.18), rgba(0,122,255,0.14))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "8px auto 16px",
        }}>
          ✅
        </div>

        {/* Title */}
        <div style={{
          textAlign: "center", fontSize: 21, fontWeight: 800,
          color: T.text, letterSpacing: -0.3, marginBottom: 4,
        }}>
          Why this is more accurate
        </div>

        {/* Subtitle */}
        <div style={{
          textAlign: "center", fontSize: 13, color: T.textSec,
          marginBottom: 24, fontWeight: 500,
        }}>
          Your first meal was just logged 🎉
        </div>

        {/* Points */}
        <div style={{
          background: T.card, borderRadius: 18, overflow: "hidden",
          border: `1px solid ${T.border}`,
          marginBottom: 28,
        }}>
          {points.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 18px",
                borderTop: i > 0 ? `1px solid ${T.divider}` : "none",
              }}
            >
              <span style={{
                fontSize: 22, flexShrink: 0,
                width: 40, height: 40, borderRadius: 12,
                background: T.inputBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {p.icon}
              </span>
              <span style={{ fontSize: 15, color: T.text, fontWeight: 600, lineHeight: 1.4 }}>
                {p.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          style={{
            width: "100%",
            background: T.btnPrimary,
            color: T.btnPrimaryText,
            border: "none",
            borderRadius: 16,
            padding: "16px 0",
            fontWeight: 700,
            fontSize: 17,
            cursor: "pointer",
            letterSpacing: 0.2,
            transition: "transform 0.15s",
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Got it
        </button>
      </div>

      <style>{`
        @keyframes eduFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes eduSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
