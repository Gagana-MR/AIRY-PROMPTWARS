/**
 * AIRY - AQI Calculation & Gen-Z Interpretation Engine
 * Evaluates real-time air pollution data and maps it to scientific metrics
 * as well as culturally relevant Gen-Z wellness vibes.
 */

export const AQI_LEVELS = [
  {
    min: 0,
    max: 50,
    tag: 'Fresh vibes ✨',
    shortStatus: 'Immaculate',
    vibeText: 'Air is literally chef\'s kiss. Lungs are thriving, aura is 10/10 no cap. Go outside, touch grass, and enjoy the pristine vibes.',
    healthExplanation: 'Air quality is satisfactory and poses little or no health risk. Ideal for all outdoor exercises, open-window airflow, and patio hangs.',
    color: '#ccff00',
    colorRgb: '204, 255, 0',
    severity: 'good',
    badgeClass: 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30',
    outdoorRating: 'Perfect for Running & Sports 🏃‍♂️',
    maskAdvice: 'No mask needed. Breathe that fresh oxygen!',
    ventilationAdvice: 'Open all windows! Let the fresh breeze in 🪟',
    purifierAdvice: 'Purifier can take a chill nap 💤'
  },
  {
    min: 51,
    max: 100,
    tag: 'Pretty okay 😌',
    shortStatus: 'Acceptable',
    vibeText: 'Air is lowkey mid, but totally chill for 95% of us. Not alpine mountain status, but your plans don\'t need to be cancelled.',
    healthExplanation: 'Air quality is acceptable. However, highly sensitive individuals with asthma or respiratory conditions may notice mild symptoms during prolonged exertion.',
    color: '#facc15',
    colorRgb: '250, 204, 21',
    severity: 'moderate',
    badgeClass: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
    outdoorRating: 'Good for Outdoor Activities 🚴',
    maskAdvice: 'Not needed unless you have asthma or severe allergies',
    ventilationAdvice: 'Safe to ventilate during midday hours 🪟',
    purifierAdvice: 'Low / Auto mode on purifier is plenty'
  },
  {
    min: 101,
    max: 150,
    tag: 'A bit sketchy 🤨',
    shortStatus: 'Sensitive Alert',
    vibeText: 'Atmosphere is giving minor attitude today. Asthma gang & allergy besties should definitely tone down the intense cardio outdoors.',
    healthExplanation: 'Unhealthy for sensitive groups. Members of sensitive groups (children, elderly, asthmatics) may experience health effects. The general public is less likely to be affected.',
    color: '#fb923c',
    colorRgb: '251, 146, 60',
    severity: 'sensitive',
    badgeClass: 'bg-orange-400/15 text-orange-400 border-orange-400/30',
    outdoorRating: 'Take Frequent Breaks Outdoors 🚶',
    maskAdvice: 'Sensitive individuals consider a light mask or N95 in traffic',
    ventilationAdvice: 'Keep windows shut during peak commute hours ⚠️',
    purifierAdvice: 'Turn indoor purifier to Medium speed'
  },
  {
    min: 151,
    max: 200,
    tag: 'Not it 🫠',
    shortStatus: 'Unhealthy',
    vibeText: 'The air is genuinely in its toxic ex era. Scratchy throat, heavy lungs, immediate vibe killer. Keep it indoors and mask up if you step out.',
    healthExplanation: 'Unhealthy for everyone. Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    color: '#f43f5e',
    colorRgb: '244, 63, 94',
    severity: 'unhealthy',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    outdoorRating: 'Avoid Outdoor Workouts (Go Gym/Indoor) 🏋️',
    maskAdvice: 'Certified N95 / FFP2 mask recommended outside 😷',
    ventilationAdvice: 'Seal windows and doors. Avoid outside draft 🚫',
    purifierAdvice: 'Run HEPA air purifier on High continuously'
  },
  {
    min: 201,
    max: 300,
    tag: 'Major red flag 🚩',
    shortStatus: 'Very Unhealthy',
    vibeText: 'Certified cooked! Outdoor air is an absolute hazard right now. Running outside today is basically inhaling secondhand exhaust pipe. Stay inside fr.',
    healthExplanation: 'Health alert: The risk of health effects is increased for everyone. Strenuous outdoor physical exertion should be avoided.',
    color: '#c084fc',
    colorRgb: '192, 132, 252',
    severity: 'very-unhealthy',
    badgeClass: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
    outdoorRating: 'Stay Indoors! Outdoor Cardio is Cancelled 🛑',
    maskAdvice: 'N95 / KN95 is strictly required if you step foot outside 😷',
    ventilationAdvice: 'Keep everything locked tight. Smog intrusion is real 🛑',
    purifierAdvice: 'HEPA purifier on Maximum Turbo mode 🌪️'
  },
  {
    min: 301,
    max: 999,
    tag: 'Apocalyptic crisis 💀',
    shortStatus: 'Hazardous',
    vibeText: 'It is literally dystopian Silent Hill outside. Pure hazardous particulate soup. Do NOT raw-dog this air under any circumstance.',
    healthExplanation: 'Emergency conditions! The entire population is likely to be affected. Immediate risk of acute airway distress.',
    color: '#a855f7',
    colorRgb: '168, 85, 247',
    severity: 'hazardous',
    badgeClass: 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/40',
    outdoorRating: 'EMERGENCY: Do not exercise or wander outside 🚨',
    maskAdvice: 'N99 / N95 tightly fitted or stay indoors strictly ⚠️',
    ventilationAdvice: 'Active seal, tape window cracks if drafty 🔒',
    purifierAdvice: 'Run multiple HEPA units in enclosed living space'
  }
];

export const POLLUTANT_THRESHOLDS = {
  pm2_5: {
    name: 'PM2.5',
    fullName: 'Fine Particulate Matter (≤ 2.5 µm)',
    unit: 'µg/m³',
    description: 'Microscopic particles from combustion, smoke, and vehicle engines. Can penetrate deep into lung alveoli and enter the bloodstream.',
    good: 15,
    moderate: 35,
    unhealthy: 75,
    severe: 150
  },
  pm10: {
    name: 'PM10',
    fullName: 'Coarse Particulates (≤ 10 µm)',
    unit: 'µg/m³',
    description: 'Inhalable dust, pollen, and mold spores that cause throat dryness, coughing, and upper airway irritation.',
    good: 45,
    moderate: 100,
    unhealthy: 200,
    severe: 350
  },
  carbon_monoxide: {
    name: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'µg/m³',
    description: 'Colorless, odorless gas from incomplete fuel combustion. Inhibits blood oxygen transport.',
    good: 4000,
    moderate: 9000,
    unhealthy: 15000,
    severe: 30000
  },
  nitrogen_dioxide: {
    name: 'NO₂',
    fullName: 'Nitrogen Dioxide',
    unit: 'µg/m³',
    description: 'Produced by road traffic and thermal power plants. Causes inflammation of the airways and worsens asthma.',
    good: 40,
    moderate: 90,
    unhealthy: 180,
    severe: 280
  },
  sulphur_dioxide: {
    name: 'SO₂',
    fullName: 'Sulphur Dioxide',
    unit: 'µg/m³',
    description: 'Gas emitted by industrial burning of coal and fossil fuels. Can cause bronchoconstriction within minutes.',
    good: 40,
    moderate: 100,
    unhealthy: 250,
    severe: 400
  },
  ozone: {
    name: 'O₃',
    fullName: 'Ground-level Ozone',
    unit: 'µg/m³',
    description: 'Created by sunlight reacting with NOx and VOCs. Peaks during hot sunny afternoons, triggering chest tightness.',
    good: 100,
    moderate: 140,
    unhealthy: 200,
    severe: 300
  }
};

/**
 * Get Gen-Z status object based on US AQI
 */
export function getAQIStatus(aqiValue) {
  const val = Math.round(Number(aqiValue) || 0);
  const found = AQI_LEVELS.find(lvl => val >= lvl.min && val <= lvl.max);
  return found || AQI_LEVELS[AQI_LEVELS.length - 1];
}

/**
 * Get pollutant evaluation
 */
export function evaluatePollutant(key, value) {
  const meta = POLLUTANT_THRESHOLDS[key];
  if (!meta) return { status: 'Normal', color: '#94a3b8', percentage: 50 };

  const val = Number(value) || 0;
  let status = 'Good';
  let color = '#ccff00';
  let percentage = Math.min(100, Math.round((val / meta.good) * 35));

  if (val > meta.severe) {
    status = 'Hazardous';
    color = '#c084fc';
    percentage = 100;
  } else if (val > meta.unhealthy) {
    status = 'High';
    color = '#f43f5e';
    percentage = Math.min(95, 70 + Math.round(((val - meta.unhealthy) / (meta.severe - meta.unhealthy)) * 25));
  } else if (val > meta.moderate) {
    status = 'Moderate';
    color = '#facc15';
    percentage = Math.min(70, 40 + Math.round(((val - meta.moderate) / (meta.unhealthy - meta.moderate)) * 30));
  } else if (val > meta.good) {
    status = 'Fair';
    color = '#a3e635';
    percentage = Math.min(45, 25 + Math.round(((val - meta.good) / (meta.moderate - meta.good)) * 20));
  }

  return { status, color, percentage, val, meta };
}
