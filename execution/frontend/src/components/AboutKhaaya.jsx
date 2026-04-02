// execution/frontend/src/components/AboutKhaaya.jsx
// Full-screen info overlay accessed via the ℹ️ button in the header.
// Explains what Khaaya is, its data source, and key differentiators.

import { useTheme } from "../theme";

export default function AboutKhaaya({ onClose }) {
  const { T } = useTheme();

  const features = [
    {
      icon: "🇮🇳",
      title: "Not US data. Indian data.",
      desc: "Most apps use US nutrition databases. Khaaya uses Indian government nutrition data, the most comprehensive database of Indian foods.",
    },
    {
      icon: "⚡",
      title: "Log meals instantly",
      desc: "Type what you ate in any language. Khaaya figures out the calories and macros for you.",
    },
    {
      icon: "🎯",
      title: "Goals that fit your body",
      desc: "Personalised targets based on your stats, activity level, and goal timeline.",
    },
    {
      icon: "🍛",
      title: "Roti isn't bread. Dal isn't soup.",
      desc: "Real Indian nutrition data so what you log actually matches what you eat.",
    },
  ];

  const steps = [
    {
      step: "1",
      label: "Type your meal",
      detail: "2 eggs, roti, chai. Anything works.",
    },
    {
      step: "2",
      label: "Get instant macros",
      detail: "Calories + protein + carbs + fat in seconds",
    },
    {
      step: "3",
      label: "Stay on track daily",
      detail: "See your daily progress build in real time",
    },
  ];

  const S = {
    overlay: {
      position: "fixed", inset: 0, background: T.bg, zIndex: 100,
      overflowY: "auto", fontFamily: "system-ui, -apple-system, sans-serif",
    },
    header: {
      background: T.card, borderBottom: `1px solid ${T.headerBorder}`,
      padding: "12px 20px", position: "sticky", top: 0, zIndex: 10,
    },
    headerInner: {
      maxWidth: 480, margin: "0 auto",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },
    body: { maxWidth: 480, margin: "0 auto", padding: "24px 16px 56px" },
    sectionLabel: {
      fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: T.textSec,
      textTransform: "uppercase", marginBottom: 12, paddingLeft: 4,
    },
    card: {
      background: T.card, borderRadius: 20, overflow: "hidden",
      boxShadow: T.cardShadow || "0 2px 12px rgba(0,0,0,0.06)",
      marginBottom: 36,
    },
    row: (i) => ({
      display: "flex", gap: 14, padding: "18px 16px",
      borderTop: i > 0 ? `1px solid ${T.divider}` : "none",
      alignItems: "flex-start",
    }),
  };

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={{ fontWeight: 600, fontSize: 16, color: T.textSec, letterSpacing: -0.2 }}>
            About Khaaya
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.inputBg, border: "none", borderRadius: 10,
              width: 36, height: 36, color: T.textSec, cursor: "pointer",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={S.body}>
        {/* Hero */}
        <div style={{
          background: T.card, borderRadius: 22, padding: "36px 24px",
          textAlign: "center", marginBottom: 40,
          boxShadow: T.cardShadow || "0 2px 16px rgba(0,0,0,0.07)",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, rgba(0,122,255,0.12), rgba(52,199,89,0.12))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 20px",
          }}>
            🥗
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: -0.5, marginBottom: 10 }}>
            Khaaya
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, lineHeight: 1.35, maxWidth: 280, margin: "0 auto 10px" }}>
            Track Indian meals. Not Western guesses.
          </div>
          <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
            Log meals instantly with real Indian nutrition data.
          </div>
        </div>

        {/* Features */}
        <div style={S.sectionLabel}>What makes Khaaya different</div>
        <div style={S.card}>
          {features.map((f, i) => (
            <div key={i} style={S.row(i)}>
              <span style={{
                fontSize: 20, flexShrink: 0,
                width: 40, height: 40, borderRadius: 12,
                background: T.inputBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.55 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={S.sectionLabel}>How it works</div>
        <div style={S.card}>
          {steps.map((s, i) => (
            <div key={i} style={S.row(i)}>
              <span style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 10,
                background: T.accent, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800,
              }}>
                {s.step}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 3 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.55 }}>
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Version footer */}
        <div style={{
          textAlign: "center", fontSize: 12, color: T.textSec,
          padding: "8px 0 0",
        }}>
          Khaaya v3.0 · Made with ❤️ for Indian food
        </div>
      </div>
    </div>
  );
}
