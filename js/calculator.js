/**
 * AIRY - Smog Impact Calculator
 * Compares transport emissions (Car, Bus, Metro, Bicycle, Walking)
 * Provides transparent CO2 savings models with clear emission factor citations.
 */

export const TRANSPORT_MODES = [
  {
    id: 'car',
    name: 'Car (Solo)',
    icon: '🚗',
    gCo2PerKm: 171, // DEFRA average petrol/diesel car
    description: 'Average passenger vehicle, single occupant',
    color: '#f43f5e',
    isBaseline: true
  },
  {
    id: 'bus',
    name: 'City Bus',
    icon: '🚌',
    gCo2PerKm: 82, // Average urban transit bus per passenger km
    description: 'Shared municipal diesel/hybrid transit',
    color: '#fb923c',
    isBaseline: false
  },
  {
    id: 'metro',
    name: 'Electric Metro',
    icon: '🚇',
    gCo2PerKm: 35, // High-efficiency electric rail per passenger km
    description: 'Subway, light rail, rapid transit',
    color: '#c084fc',
    isBaseline: false
  },
  {
    id: 'bike',
    name: 'Bicycle / E-Bike',
    icon: '🚲',
    gCo2PerKm: 0, // Direct tailpipe emissions
    description: 'Zero tailpipe emissions, active mobility',
    color: '#ccff00',
    isBaseline: false
  },
  {
    id: 'walk',
    name: 'Walking',
    icon: '🚶',
    gCo2PerKm: 0, // Direct emissions
    description: '100% human-powered, pure clean air energy',
    color: '#a3e635',
    isBaseline: false
  }
];

export const COMMUTE_FREQUENCIES = [
  { id: 'single', label: '1 Trip', multiplier: 1 },
  { id: 'roundtrip', label: 'Daily Round-Trip (x2)', multiplier: 2 },
  { id: 'weekly', label: 'Work Week (x10)', multiplier: 10 },
  { id: 'monthly', label: 'Monthly Commute (x40)', multiplier: 40 }
];

export class SmogCalculator {
  constructor() {
    this.distanceKm = 12; // default 12 km
    this.frequencyId = 'roundtrip';
    this.selectedAlternative = 'metro';
  }

  setDistance(km) {
    this.distanceKm = Math.max(1, Math.min(100, Number(km) || 1));
  }

  setFrequency(freqId) {
    if (COMMUTE_FREQUENCIES.some(f => f.id === freqId)) {
      this.frequencyId = freqId;
    }
  }

  setSelectedAlternative(modeId) {
    if (TRANSPORT_MODES.some(m => m.id === modeId && !m.isBaseline)) {
      this.selectedAlternative = modeId;
    }
  }

  calculate() {
    const freq = COMMUTE_FREQUENCIES.find(f => f.id === this.frequencyId) || COMMUTE_FREQUENCIES[1];
    const totalKm = this.distanceKm * freq.multiplier;

    // Calculate emissions per mode
    const modesResults = TRANSPORT_MODES.map(mode => {
      const totalGrams = mode.gCo2PerKm * totalKm;
      const totalKg = totalGrams / 1000;
      return {
        ...mode,
        totalGrams,
        totalKg: totalKg.toFixed(2),
        totalKm
      };
    });

    const carMode = modesResults.find(m => m.id === 'car');
    const chosenAlt = modesResults.find(m => m.id === this.selectedAlternative) || modesResults.find(m => m.id === 'metro');

    const gramsSaved = Math.max(0, carMode.totalGrams - chosenAlt.totalGrams);
    const kgSaved = (gramsSaved / 1000).toFixed(2);
    const percentReduction = carMode.totalGrams > 0 
      ? Math.round((gramsSaved / carMode.totalGrams) * 100)
      : 0;

    // Tangible equivalents
    // 1 Smartphone full charge ≈ 8.22 g CO2
    const phoneCharges = Math.round(gramsSaved / 8.22);
    // 1 Urban tree absorbs ~60g CO2 per day (≈ 21.77 kg/year)
    const treeDays = (gramsSaved / 60).toFixed(1);
    // 1 Liter of gasoline combustion ≈ 2,310 g CO2
    const fuelLiters = (gramsSaved / 2310).toFixed(2);

    return {
      distanceKm: this.distanceKm,
      frequency: freq,
      totalKm,
      modesResults,
      chosenAlt,
      carMode,
      savings: {
        gramsSaved,
        kgSaved,
        percentReduction,
        phoneCharges,
        treeDays,
        fuelLiters
      }
    };
  }
}
