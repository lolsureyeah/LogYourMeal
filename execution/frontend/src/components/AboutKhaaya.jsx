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
      desc: "Most apps use US nutrition databases. Khaaya uses Indian data from NIN, India's official nutrition research institute.",
    },
    {
      icon: "🤖",
      title: "AI Powered Logging",
      desc: "Just type what you ate. Khaaya works out the calories and macros for you, instantly.",
    },
    {
      icon: "🎯",
      title: "Goals that fit your body",
      desc: "Personalised calorie and macro targets based on your stats, activity level, and goal timeline.",
    },
    {
      icon: "🍛",
      title: "Roti isn't bread. Dal isn't soup.",
      desc: "Khaaya uses Indian nutrition data so what you log actually matches what you eat.",
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
    body: { maxWidth: 480, margin: "0 auto", padding: "20px 16px 48px" },
  };

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: -0.3 }}>
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
          background: T.card, borderRadius: 22, padding: "32px 24px",
          textAlign: "center", marginBottom: 24,
          border: `1px solid ${T.border}`,
          boxShadow: T.cardShadow,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, rgba(0,122,255,0.15), rgba(52,199,89,0.15))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 16px",
          }}>
            🥗
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.3, marginBottom: 6 }}>
            Khaaya
          </div>
          <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.55, maxWidth: 320, margin: "0 auto" }}>
            A nutrition tracker built for how Indians actually eat.
            Real data, AI logging, and goals that make sense.
          </div>
        </div>

        {/* Features */}
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: T.textSec,
          textTransform: "uppercase", marginBottom: 10, paddingLeft: 4,
        }}>
          What makes Khaaya different
        </div>

        <div style={{
          background: T.card, borderRadius: 18, overflow: "hidden",
          border: `1px solid ${T.border}`, marginBottom: 24,
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 14, padding: "16px 16px",
                borderTop: i > 0 ? `1px solid ${T.divider}` : "none",
                alignItems: "flex-start",
              }}
            >
              <span style={{
                fontSize: 22, flexShrink: 0,
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
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: T.textSec,
          textTransform: "uppercase", marginBottom: 10, paddingLeft: 4,
        }}>
          How it works
        </div>

        <div style={{
          background: T.card, borderRadius: 18, overflow: "hidden",
          border: `1px solid ${T.border}`, marginBottom: 24,
        }}>
          {[
            { step: "1", label: "Type what you ate", detail: "Hindi, English, Hinglish, or a mix. Whatever feels natural." },
            { step: "2", label: "Get your numbers", detail: "Khaaya looks up the calories, protein, carbs, and fat using Indian nutrition data." },
            { step: "3", label: "See your day at a glance", detail: "Watch your totals build up as you eat. Know exactly where you stand." },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 14, padding: "16px 16px",
                borderTop: i > 0 ? `1px solid ${T.divider}` : "none",
                alignItems: "flex-start",
              }}
            >
              <span style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 10,
                background: T.accent, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800,
              }}>
                {s.step}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
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
