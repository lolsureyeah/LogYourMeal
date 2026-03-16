// execution/frontend/src/components/HumanCharacter.jsx
// Sex-aware SVG human character with body fat % visual system + gradual aging
//
// MALE BF% CATEGORIES:
//   Essential:   2–5%
//   Athlete:     6–13%
//   Fitness:    14–17%
//   Average:    18–24%
//   Overweight: 25–29%
//   Obese:      30%+
//
// FEMALE BF% CATEGORIES:
//   Essential:   10–13%
//   Athlete:     14–20%
//   Fitness:     21–24%
//   Average:     25–31%
//   Overweight:  32–37%
//   Obese:       38%+
//
// AGE TIERS:
//   <25:   Youthful, no aging
//   25–34: Very subtle smile lines
//   35–44: Light forehead line, smile lines
//   45–54: Grey-tinted hair, forehead wrinkles, deeper smile lines
//   55+:   Full grey hair, prominent wrinkles, under-eye lines

// No React import needed for Vite JSX transform
import { useId } from "react";

// Returns a 0–1 fatness scalar calibrated to sex-specific BF% ranges
function getFatness(bf, sex) {
  const bfNum = parseFloat(bf) || (sex === "female" ? 25 : 18);
  if (sex === "female") {
    if (bfNum <= 13) return 0.0;
    if (bfNum <= 20) return 0.08;
    if (bfNum <= 24) return 0.18;
    if (bfNum <= 31) return 0.38;
    if (bfNum <= 37) return 0.62;
    return 0.88;
  } else {
    if (bfNum <= 5)  return 0.0;
    if (bfNum <= 13) return 0.06;
    if (bfNum <= 17) return 0.18;
    if (bfNum <= 24) return 0.36;
    if (bfNum <= 29) return 0.60;
    return 0.85;
  }
}

function getBFCategory(bf, sex) {
  const bfNum = parseFloat(bf) || 0;
  if (sex === "female") {
    if (bfNum <= 13) return { label: "Essential Fat", color: "#60a5fa" };
    if (bfNum <= 20) return { label: "Athlete", color: "#4ade80" };
    if (bfNum <= 24) return { label: "Fitness", color: "#a3e635" };
    if (bfNum <= 31) return { label: "Average", color: "#fbbf24" };
    if (bfNum <= 37) return { label: "Overweight", color: "#fb923c" };
    return { label: "Obese", color: "#f87171" };
  } else {
    if (bfNum <= 5)  return { label: "Essential Fat", color: "#60a5fa" };
    if (bfNum <= 13) return { label: "Athlete", color: "#4ade80" };
    if (bfNum <= 17) return { label: "Fitness", color: "#a3e635" };
    if (bfNum <= 24) return { label: "Average", color: "#fbbf24" };
    if (bfNum <= 29) return { label: "Overweight", color: "#fb923c" };
    return { label: "Obese", color: "#f87171" };
  }
}

// Returns age tier info for gradual aging
function getAgeTier(age) {
  const a = parseInt(age, 10) || 25;
  if (a < 25)  return { tier: 0, greyMix: 0,    wrinkleOpacity: 0,    smileLineOpacity: 0,    foreheadLines: 0, underEye: false };
  if (a < 35)  return { tier: 1, greyMix: 0,    wrinkleOpacity: 0,    smileLineOpacity: 0.12, foreheadLines: 0, underEye: false };
  if (a < 45)  return { tier: 2, greyMix: 0,    wrinkleOpacity: 0.08, smileLineOpacity: 0.22, foreheadLines: 1, underEye: false };
  if (a < 55)  return { tier: 3, greyMix: 0.35, wrinkleOpacity: 0.14, smileLineOpacity: 0.32, foreheadLines: 2, underEye: true  };
  return               { tier: 4, greyMix: 0.75, wrinkleOpacity: 0.22, smileLineOpacity: 0.42, foreheadLines: 2, underEye: true  };
}

// Blend two hex colors: mix 0 = color1, mix 1 = color2
function blendColors(hex1, hex2, mix) {
  const parse = (h) => {
    const c = h.replace("#", "");
    return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(r1 + (r2 - r1) * mix);
  const g = Math.round(g1 + (g2 - g1) * mix);
  const b = Math.round(b1 + (b2 - b1) * mix);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function HumanCharacter({
  bf = 20,
  sex = "male",
  age = 25,
  progress = 0,
  appearance = {},
  animate = false,
}) {
  const {
    skinTone = "#F5C5A3",
    hairColor = "#3D2B1F",
    hairStyle = "short",
    shirtColor = "#6366f1",
    pantsColor = "#1e293b",
  } = appearance;

  const uniq = useId().replace(/:/g, "");
  const gA = `gA-${uniq}`;
  const sG = `sG-${uniq}`;

  const fat = getFatness(bf, sex);
  const category = getBFCategory(bf, sex);
  const isFemale = sex === "female";
  const ageTier = getAgeTier(age);

  // ── Body shape values — balanced proportions ──
  const shoulderW = isFemale ? 42 + fat * 14 : 46 + fat * 16;
  const waistW    = isFemale ? 28 + fat * 26 : 32 + fat * 30;
  const hipW      = isFemale ? 36 + fat * 28 : 36 + fat * 22;
  const belly     = fat * (isFemale ? 10 : 18);
  const neckW     = 8 + fat * 6;
  const faceW     = 34 + fat * 12;
  const faceH     = 38 + fat * 10;
  const thighW    = isFemale ? 14 + fat * 14 : 13 + fat * 12;
  const calfW     = isFemale ? 10 + fat * 6  : 9 + fat * 6;

  // ── Age-based hair color ──
  const displayHairColor = ageTier.greyMix > 0
    ? blendColors(hairColor, "#C8CCD0", ageTier.greyMix)
    : hairColor;

  // Bust/chest shape for female
  const bustY  = 108;
  const bustR  = isFemale ? 7 + fat * 4 : 0;

  // Energy/pose driven by progress
  const eyeOpen  = progress > 12;
  const bigSmile = progress > 70;
  const flexing  = progress > 85;
  const glowing  = progress >= 95;
  const lA = flexing ? -35 : progress > 50 ? -15 : 10;
  const rA = flexing ? 35  : progress > 50 ? 15  : -10;

  // Lean body — show muscle definition
  const isLean = (isFemale && parseFloat(bf) <= 20) || (!isFemale && parseFloat(bf) <= 13);
  const showAbs = isLean && progress > 50 && !isFemale;
  const muscleR = 3 + progress * 0.05;

  // ── Arm dimensions ──
  const armW = isFemale ? 11 : 13;
  const forearmW = isFemale ? 10 : 11;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg
        viewBox="0 0 160 230"
        width="160"
        height="220"
        style={{
          filter: glowing
            ? "drop-shadow(0 0 16px #fbbf24bb)"
            : "drop-shadow(0 2px 8px #0008)",
          transition: "all 0.5s ease",
          transform: animate ? "scale(1.07) translateY(-4px)" : "scale(1)",
        }}
      >
        <defs>
          <radialGradient id={gA} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={sG} cx="35%" cy="25%">
            <stop offset="0%" stopColor={skinTone} />
            <stop offset="100%" stopColor={skinTone + "bb"} />
          </radialGradient>
        </defs>

        {glowing && <ellipse cx="80" cy="115" rx="65" ry="92" fill={`url(#${gA})`} />}

        {/* ── LEGS ── */}
        {/* Left thigh */}
        <rect x={80 - hipW/2 + 3} y={154} width={thighW} height={36} rx={thighW/2} fill={pantsColor} />
        {/* Right thigh */}
        <rect x={80 + hipW/2 - thighW - 3} y={154} width={thighW} height={36} rx={thighW/2} fill={pantsColor} />
        {/* Left calf */}
        <rect x={80 - hipW/2 + (thighW-calfW)/2 + 3} y={188} width={calfW} height={28} rx={calfW/2} fill={pantsColor} />
        {/* Right calf */}
        <rect x={80 + hipW/2 - calfW - (thighW-calfW)/2 - 3} y={188} width={calfW} height={28} rx={calfW/2} fill={pantsColor} />
        {/* Shoes */}
        <ellipse cx={80 - hipW/2 + (thighW-calfW)/2 + 3 + calfW/2} cy={216} rx={calfW + 3} ry={5} fill="#111" />
        <ellipse cx={80 + hipW/2 - calfW/2 - (thighW-calfW)/2 - 3} cy={216} rx={calfW + 3} ry={5} fill="#111" />

        {/* ── HIPS / PELVIS ── */}
        <ellipse cx={80} cy={155 + fat * 3} rx={hipW/2} ry={7 + fat * 5} fill={pantsColor} />

        {/* ── TORSO ── */}
        <path
          d={`M ${80-shoulderW/2} 97
              Q ${80-waistW/2-belly} 126 ${80-hipW/2+3} 156
              Q 80 ${156 + fat * 16} ${80+hipW/2-3} 156
              Q ${80+waistW/2+belly} 126 ${80+shoulderW/2} 97 Z`}
          fill={shirtColor}
        />
        {/* Shoulders — rounded cap */}
        <rect x={80-shoulderW/2} y={88} width={shoulderW} height={16} rx={8} fill={shirtColor} />

        {/* Female bust */}
        {isFemale && bustR > 0 && (
          <>
            <ellipse cx={80 - 7} cy={bustY} rx={bustR} ry={bustR * 0.75} fill={shirtColor} opacity="0.85" />
            <ellipse cx={80 + 7} cy={bustY} rx={bustR} ry={bustR * 0.75} fill={shirtColor} opacity="0.85" />
          </>
        )}

        {/* Waist curve highlight */}
        {fat < 0.3 && (
          <path
            d={`M ${80-waistW/2+3} 110 Q ${80-waistW/2-2} 128 ${80-waistW/2+3} 146`}
            stroke={shirtColor + "44"} strokeWidth="3" fill="none"
          />
        )}

        {/* ── ARMS ── */}
        <g transform={`rotate(${lA} ${80-shoulderW/2+6} 96)`}>
          <rect x={80-shoulderW/2} y={88} width={armW} height={38} rx={5} fill={shirtColor} />
          <rect x={80-shoulderW/2+1} y={124} width={forearmW} height={20} rx={4} fill={`url(#${sG})`} />
          {!isFemale && progress > 45 && (
            <ellipse cx={80-shoulderW/2+armW/2} cy={107} rx={muscleR} ry={4.5} fill={shirtColor + "cc"} />
          )}
          <ellipse cx={80-shoulderW/2+armW/2} cy={145} rx={5} ry={4.5} fill={`url(#${sG})`} />
        </g>
        <g transform={`rotate(${rA} ${80+shoulderW/2-6} 96)`}>
          <rect x={80+shoulderW/2-armW} y={88} width={armW} height={38} rx={5} fill={shirtColor} />
          <rect x={80+shoulderW/2-armW} y={124} width={forearmW} height={20} rx={4} fill={`url(#${sG})`} />
          {!isFemale && progress > 45 && (
            <ellipse cx={80+shoulderW/2-armW/2} cy={107} rx={muscleR} ry={4.5} fill={shirtColor + "cc"} />
          )}
          <ellipse cx={80+shoulderW/2-armW/2} cy={145} rx={5} ry={4.5} fill={`url(#${sG})`} />
        </g>

        {/* ── NECK ── */}
        <rect x={80-neckW/2} y={68} width={neckW} height={22} rx={4} fill={`url(#${sG})`} />

        {/* ── HEAD ── */}
        <ellipse cx={80} cy={50} rx={faceW/2} ry={faceH/2} fill={`url(#${sG})`} />
        {/* Ears */}
        <ellipse cx={80-faceW/2+1} cy={52} rx={4} ry={6} fill={skinTone + "cc"} />
        <ellipse cx={80+faceW/2-1} cy={52} rx={4} ry={6} fill={skinTone + "cc"} />

        {/* ── AGING — Gradual wrinkles ── */}
        {/* Forehead wrinkles */}
        {ageTier.foreheadLines >= 1 && (
          <path d={`M ${80-faceW/4} 40 Q 80 42 ${80+faceW/4} 40`}
            stroke="#000" strokeWidth="1" fill="none" opacity={ageTier.wrinkleOpacity} />
        )}
        {ageTier.foreheadLines >= 2 && (
          <path d={`M ${80-faceW/3} 44 Q 80 46 ${80+faceW/3} 44`}
            stroke="#000" strokeWidth="1" fill="none" opacity={ageTier.wrinkleOpacity} />
        )}
        {/* Smile / nasolabial lines */}
        {ageTier.smileLineOpacity > 0 && (
          <g stroke="#000" fill="none">
            <path d={`M ${80-7} 55 Q ${80-10} 58 ${80-9} 62`}
              strokeWidth="1" opacity={ageTier.smileLineOpacity} />
            <path d={`M ${80+7} 55 Q ${80+10} 58 ${80+9} 62`}
              strokeWidth="1" opacity={ageTier.smileLineOpacity} />
          </g>
        )}
        {/* Under-eye lines */}
        {ageTier.underEye && (
          <g stroke="#000" fill="none" opacity={ageTier.wrinkleOpacity * 0.7}>
            <path d={`M ${80-10} 51 Q ${80-7} 53 ${80-4} 51`} strokeWidth="0.8" />
            <path d={`M ${80+4} 51 Q ${80+7} 53 ${80+10} 51`} strokeWidth="0.8" />
          </g>
        )}

        {/* ── HAIR ── */}
        {hairStyle === "short" && (
          <>
            <ellipse cx={80} cy={34} rx={faceW/2+1} ry={12} fill={displayHairColor} />
            <rect x={80-faceW/2} y={34} width={faceW} height={8} fill={displayHairColor} />
          </>
        )}
        {hairStyle === "long" && (
          <>
            <ellipse cx={80} cy={33} rx={faceW/2+2} ry={13} fill={displayHairColor} />
            <rect x={80-faceW/2-3} y={38} width={9} height={42} rx={4.5} fill={displayHairColor} />
            <rect x={80+faceW/2-6} y={38} width={9} height={42} rx={4.5} fill={displayHairColor} />
          </>
        )}
        {hairStyle === "curly" &&
          [-16,-8,0,8,16,-12,-4,4,12,20].map((ox, i) => (
            <circle key={i} cx={80+ox} cy={32+(i%3)*3} r={7} fill={displayHairColor} />
          ))
        }
        {hairStyle === "ponytail" && (
          <>
            <ellipse cx={80} cy={33} rx={faceW/2+1} ry={12} fill={displayHairColor} />
            <rect x={90} y={26} width={8} height={30} rx={4} fill={displayHairColor} />
          </>
        )}
        {hairStyle === "buzz" && (
          <ellipse cx={80} cy={35} rx={faceW/2} ry={10} fill={displayHairColor} opacity="0.7" />
        )}

        {/* ── EYES ── */}
        {eyeOpen ? (
          <>
            <ellipse cx={72} cy={50} rx={4.5} ry={5} fill="#fff" />
            <ellipse cx={88} cy={50} rx={4.5} ry={5} fill="#fff" />
            <circle cx={73} cy={51} r={2.8} fill="#2d4a8a" />
            <circle cx={89} cy={51} r={2.8} fill="#2d4a8a" />
            <circle cx={73.5} cy={51.5} r={1.4} fill="#111" />
            <circle cx={89.5} cy={51.5} r={1.4} fill="#111" />
            <circle cx={74.2} cy={50} r={0.8} fill="#fff" />
            <circle cx={90.2} cy={50} r={0.8} fill="#fff" />
            <circle cx={75} cy={49} r={0.6} fill="#fff" opacity="0.8" />
            <circle cx={91} cy={49} r={0.6} fill="#fff" opacity="0.8" />
            {/* Eyebrows */}
            <path d={`M 67 ${progress>60?43:45} Q 72 ${progress>60?40:42} 77 ${progress>60?43:45}`} stroke={displayHairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d={`M 83 ${progress>60?43:45} Q 88 ${progress>60?40:42} 93 ${progress>60?43:45}`} stroke={displayHairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M 68 50 Q 72 46 76 50" stroke={displayHairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 84 50 Q 88 46 92 50" stroke={displayHairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            <text x={90} y={38} fontSize="8" fill="#a78bfa88" fontWeight="bold">z z</text>
          </>
        )}

        {/* ── NOSE ── */}
        <path d="M 79 54 Q 77 59 80 61 Q 83 59 81 54" stroke={skinTone + "88"} strokeWidth="1" fill="none" />

        {/* ── MOUTH ── Always smiling! */}
        {bigSmile
          ? <path d="M 71 63 Q 80 72 89 63" stroke={displayHairColor} strokeWidth="2" fill={skinTone + "55"} strokeLinecap="round" />
          : <path d="M 72 63 Q 80 70 88 63" stroke={displayHairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        }

        {/* Blush — Always blushing for happy look! */}
        <>
          <ellipse cx={65} cy={58} rx={5} ry={3} fill="#f9a8d4" opacity={0.3 + progress * 0.004} />
          <ellipse cx={95} cy={58} rx={5} ry={3} fill="#f9a8d4" opacity={0.3 + progress * 0.004} />
        </>


        {/* Sweat drop when low */}
        {progress > 0 && progress < 18 && (
          <path d="M 95 44 Q 97 48 95 52 Q 92 48 95 44 Z" fill="#93c5fd" opacity="0.85" />
        )}

        {/* Male abs when lean + fueled */}
        {showAbs && (
          <>
            <line x1={78} y1={108} x2={78} y2={148} stroke={shirtColor + "55"} strokeWidth="1.2" />
            {[116, 128, 140].map(y => (
              <line key={y} x1={69} y1={y} x2={84} y2={y} stroke={shirtColor + "44"} strokeWidth="1" />
            ))}
          </>
        )}

        {/* Peak sparkles */}
        {glowing && (
          <>
            <text x={14} y={50} fontSize="13" fill="#fbbf24">✦</text>
            <text x={128} y={43} fontSize="10" fill="#fbbf24">✦</text>
            <text x={18} y={78} fontSize="8" fill="#a78bfa">✦</text>
          </>
        )}
      </svg>

      {/* BF% category badge */}
      <div style={{
        fontSize: 10,
        fontFamily: "monospace",
        color: category.color,
        background: category.color + "22",
        border: `1px solid ${category.color}44`,
        borderRadius: 12,
        padding: "2px 10px",
        letterSpacing: 1,
      }}>
        {parseFloat(bf) || "?"}% · {category.label}
      </div>
    </div>
  );
}
