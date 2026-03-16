// execution/frontend/src/utils/calculations.js

export function activityMultiplier(desc) {
  const d = (desc || "").toLowerCase();
  
  // Direct matches for our new onboarding buttons
  if (d === "sedentary") return 1.2;
  if (d === "light walk") return 1.375;
  if (d === "moderate") return 1.55;
  if (d === "very active") return 1.725;

  // Fallbacks for free-text or historical data
  if (!d || d.includes("no exercise") || d.includes("sedentary") || d.includes("no gym")) return 1.2;
  if (d.includes("1x") || d.includes("once") || d.includes("light walk")) return 1.375;
  
  const timesMatch = d.match(/(\d+)\s*x/);
  const times = timesMatch ? parseInt(timesMatch[1]) : 0;
  
  if (times >= 5 || d.includes("daily") || d.includes("twice a day") || d.includes("2x a day")) return 1.9;
  if (times >= 4 || d.includes("very active") || d.includes("athlete") || d.includes("intense")) return 1.725;
  if (times >= 3 || d.includes("moderate") || d.includes("3x") || d.includes("gym")) return 1.55;
  if (times >= 2 || d.includes("2x") || d.includes("twice")) return 1.375;
  
  return 1.55; // default: assume moderate if anything is mentioned
}

export function calcGoals(stats) {
  const w = parseFloat(stats?.weight) || 75;
  const h = parseFloat(stats?.height) || 175;
  const a = parseFloat(stats?.age)    || 25;
  const bf = parseFloat(stats?.bf)    || (stats?.sex === "female" ? 25 : 18);
  
  const bmr = stats?.sex === "female"
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
    
  const multiplier = activityMultiplier(stats?.activityDescription);
  const tdee = Math.round(bmr * multiplier);
  
  let calDelta = stats?.goal === "cut" ? 400 : stats?.goal === "bulk" ? -300 : 0;
  let weeksToGoal = 0;
  let weightGap = 0;
  let isCapped = false;
  let timelineRealisticWeeks = 0;

  if (stats?.targetDate && stats?.targetWeight && stats?.goal !== "maintain") {
    const start = new Date();
    const target = new Date(stats.targetDate);
    const diffWeeks = (target - start) / (7 * 24 * 60 * 60 * 1000);
    
    if (diffWeeks >= 1) {
      weeksToGoal = Math.round(diffWeeks);
      const tw = parseFloat(stats.targetWeight);
      weightGap = w - tw; // cut: 77-70=7, bulk: 70-75=-5
      const totalKcal = weightGap * 7700;
      let rawDelta = totalKcal / (diffWeeks * 7);
      
      const MAX_CUT = 1000;
      const MAX_BULK = -500; // rawDelta is negative for bulk

      if (weightGap > 0 && rawDelta > MAX_CUT) {
        rawDelta = MAX_CUT;
        isCapped = true;
      } else if (weightGap < 0 && rawDelta < MAX_BULK) {
        rawDelta = MAX_BULK;
        isCapped = true;
      }
      
      calDelta = rawDelta;
      timelineRealisticWeeks = Math.round(totalKcal / (rawDelta * 7));
    }
  }

  const cal = Math.round(tdee - calDelta);
  
  // Safety floor
  const floor = stats?.sex === "female" ? 1400 : 1500;
  const finalCal = Math.max(floor, cal);
  
  const lbm  = w * (1 - bf / 100);
  const protein = Math.round(lbm * 2.2);
  const fat  = Math.round(finalCal * 0.25 / 9);
  const carbs = Math.max(50, Math.round((finalCal - protein * 4 - fat * 9) / 4));
  
  return { 
    cal: finalCal, protein, fat, carbs, tdee,
    weeksToGoal,
    weightGap: Math.abs(weightGap),
    isCapped,
    realisticWeeks: timelineRealisticWeeks || weeksToGoal,
    projectedDate: stats?.targetDate,
    rawDelta: Math.abs(Math.round(calDelta))
  };
}
