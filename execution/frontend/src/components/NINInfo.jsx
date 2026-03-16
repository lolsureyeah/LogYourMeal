// execution/frontend/src/components/NINInfo.jsx
// Modal info sheet explaining what NIN-certified nutrition data means

import { useTheme } from "../theme";

export default function NINInfo({ onClose }) {
  const { T } = useTheme();

  const cardS = {
    background: T.card,
    borderRadius: 20,
    boxShadow: T.cardShadow,
    padding: 20,
    marginBottom: 16,
  };

  const sectionHeadS = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: T.textSec,
    textTransform: "uppercase",
    marginBottom: 10,
  };


  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: T.bg,
          borderRadius: "24px 24px 0 0",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "0 16px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border }} />
        </div>

        {/* Hero */}
        <div style={{ ...cardS, marginTop: 12, textAlign: "center", padding: "28px 20px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "rgba(52,199,89,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto 14px",
          }}>
            🏛️
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 6 }}>
            NIN Certified
          </div>
          <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5 }}>
            Nutrition data verified against the{" "}
            <span style={{ color: T.text, fontWeight: 600 }}>
              National Institute of Nutrition
            </span>
            , India. The gold standard for South Asian food composition.
          </div>
        </div>

        {/* What is NIN */}
        <div style={cardS}>
          <div style={sectionHeadS}>What is NIN?</div>
          <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.65 }}>
            The{" "}
            <span style={{ color: T.text, fontWeight: 600 }}>
              National Institute of Nutrition (NIN)
            </span>{" "}
            is a premier research institute under the Indian Council of Medical Research (ICMR),
            based in Hyderabad, India. Since 1918, NIN has published{" "}
            <span style={{ color: T.text, fontWeight: 600 }}>
              Nutritive Value of Indian Foods
            </span>
            , the definitive database of macro and micronutrient values for hundreds of Indian foods.
            Values are measured in certified laboratories, not estimated by algorithms.
          </div>
        </div>

        {/* Why it matters */}
        <div style={{ ...cardS, background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                Why this matters for South Asian diets
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
                Most Western nutrition databases don't account for how Indian cooking methods
                (pressure cooking, tempering, fermentation) change nutrient density. NIN data
                is measured on foods as they are actually prepared and eaten in India, making
                it far more accurate for dal, roti, rice, sabzis, and other staples.
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: "100%", background: T.btnPrimary, color: T.btnPrimaryText,
            border: "none", borderRadius: 14, padding: 16,
            fontWeight: 700, fontSize: 17, cursor: "pointer", marginTop: 4,
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
