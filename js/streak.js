/**
 * AIRY - Eco Streak & Daily Micro-Habit Tracker
 * Stores eco-friendly actions and tracks user streaks in localStorage.
 */

export const DAILY_ACTIONS = [
  {
    id: 'active_travel',
    title: 'Walked or Cycled for a Trip',
    desc: 'Swapped a car ride for walking, running, or biking (< 5km)',
    icon: '🚲',
    impact: '~450g CO₂ saved'
  },
  {
    id: 'public_transit',
    title: 'Took Metro / Public Bus',
    desc: 'Chose shared mass transit over a solo cab or private car',
    icon: '🚇',
    impact: '~1.2kg CO₂ saved'
  },
  {
    id: 'clean_air_defense',
    title: 'Wore N95 / Mask During Smog',
    desc: 'Protected lungs against fine inhalable particulate matter',
    icon: '😷',
    impact: 'Protected lungs from ~500µg PM2.5'
  },
  {
    id: 'indoor_purifier',
    title: 'Ran Air Purifier / Plant Care',
    desc: 'Kept indoor air filtered with HEPA or cared for air-purifying foliage',
    icon: '🌱',
    impact: '99.97% indoor particulate reduction'
  },
  {
    id: 'smog_defense_window',
    title: 'Timed Windows with AQI',
    desc: 'Sealed windows during traffic spikes or ventilated during clean hours',
    icon: '🪟',
    impact: 'Prevented dirty indoor air build-up'
  }
];

export const STREAK_BADGES = [
  { days: 1, title: 'Air Rookie ✨', vibe: 'Vibe check passed. Welcome to clean air gang!' },
  { days: 3, title: 'Smog Dodger 🏃‍♂️', vibe: '3 days strong! The city smog has nothing on you.' },
  { days: 7, title: 'Carbon Slayer ⚡', vibe: '1 full week! Immaculate energy, planet thanks you.' },
  { days: 14, title: 'Atmosphere Royalty 👑', vibe: '2 straight weeks! Pure main character wellness.' },
  { days: 30, title: 'Clean Air GOAT 🌍', vibe: '30 days legendary! Certified climate hero.' }
];

const STORAGE_KEY = 'airy_eco_streak_state_v1';

export class EcoStreakManager {
  constructor() {
    this.state = this.loadState();
    this.verifyStreak();
  }

  getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse streak storage', e);
    }
    return {
      currentStreak: 1,
      bestStreak: 1,
      lastActiveDate: this.getTodayString(),
      history: {}, // { '2026-11-24': ['active_travel', 'indoor_purifier'] }
      totalActionsCompleted: 2
    };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save streak storage', e);
    }
  }

  verifyStreak() {
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    if (!this.state.history[today]) {
      this.state.history[today] = [];
    }

    // Check last active date
    if (this.state.lastActiveDate !== today && this.state.lastActiveDate !== yesterday) {
      // Missed more than 1 day
      this.state.currentStreak = 0;
    }

    this.saveState();
  }

  toggleAction(actionId) {
    const today = this.getTodayString();
    if (!this.state.history[today]) {
      this.state.history[today] = [];
    }

    const index = this.state.history[today].indexOf(actionId);
    let isCompleted = false;

    if (index > -1) {
      this.state.history[today].splice(index, 1);
      this.state.totalActionsCompleted = Math.max(0, this.state.totalActionsCompleted - 1);
    } else {
      this.state.history[today].push(actionId);
      this.state.totalActionsCompleted += 1;
      isCompleted = true;

      // Update streak if today has at least 1 action completed
      if (this.state.lastActiveDate !== today) {
        const yesterday = this.getYesterdayString();
        if (this.state.lastActiveDate === yesterday) {
          this.state.currentStreak += 1;
        } else {
          this.state.currentStreak = 1;
        }
        this.state.lastActiveDate = today;
        if (this.state.currentStreak > this.state.bestStreak) {
          this.state.bestStreak = this.state.currentStreak;
        }
      }
    }

    this.saveState();
    return { isCompleted, state: this.getState() };
  }

  getState() {
    const today = this.getTodayString();
    const todayActions = this.state.history[today] || [];
    const completionPercent = Math.round((todayActions.length / DAILY_ACTIONS.length) * 100);

    // Current badge
    const earnedBadges = STREAK_BADGES.filter(b => this.state.currentStreak >= b.days);
    const activeBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : STREAK_BADGES[0];
    const nextBadge = STREAK_BADGES.find(b => b.days > this.state.currentStreak) || null;

    return {
      currentStreak: this.state.currentStreak,
      bestStreak: this.state.bestStreak,
      todayActions,
      todayCount: todayActions.length,
      totalCount: DAILY_ACTIONS.length,
      completionPercent,
      activeBadge,
      nextBadge,
      totalActionsCompleted: this.state.totalActionsCompleted
    };
  }
}
