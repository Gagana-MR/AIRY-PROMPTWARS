/**
 * AIRY - Main Application Controller
 * Coordinates API data fetching, Gen-Z status interpretation,
 * AI Assistant, Smog Calculator, and Eco Streak tracker.
 */

import { fetchAirQuality, searchCities, reverseGeocode, POPULAR_CITIES, DEFAULT_CITY } from './api.js';
import { getAQIStatus, getUnavailableStatus, evaluatePollutant, POLLUTANT_THRESHOLDS } from './aqi.js';
import { AiryAssistant } from './ai-assistant.js';
import { SmogCalculator, TRANSPORT_MODES, COMMUTE_FREQUENCIES } from './calculator.js';
import { EcoStreakManager, DAILY_ACTIONS, STREAK_BADGES } from './streak.js';

class AiryApp {
  constructor() {
    this.currentCity = DEFAULT_CITY;
    this.currentAirData = null;
    this.assistant = new AiryAssistant();
    this.calculator = new SmogCalculator();
    this.streakManager = new EcoStreakManager();

    this.searchDebounceTimer = null;
    this.activeTab = 'tab-dashboard';

    this.initElements();
    this.initEventListeners();
    this.initClock();
    this.renderPopularCityPills();
    this.renderStreakTracker();
    this.renderCalculator();
    
    // Initial fetch for Bengaluru
    this.loadCityAirQuality(this.currentCity);
  }

  initElements() {
    // Top Nav & Search
    this.citySearchInput = document.getElementById('citySearchInput');
    this.searchResultsDropdown = document.getElementById('searchResultsDropdown');
    this.btnGeoLocation = document.getElementById('btnGeoLocation');
    this.quickCityPills = document.getElementById('quickCityPills');
    this.liveClock = document.getElementById('liveClock');
    this.liveDate = document.getElementById('liveDate');
    this.brandLogo = document.getElementById('brandLogo');

    // Dashboard
    this.dashboardContent = document.getElementById('dashboardContent');
    this.dashboardLoadingState = document.getElementById('dashboardLoadingState');
    this.dashboardErrorState = document.getElementById('dashboardErrorState');
    this.dashboardErrorMessage = document.getElementById('dashboardErrorMessage');
    this.btnRetryFetch = document.getElementById('btnRetryFetch');
    this.btnRefreshAQI = document.getElementById('btnRefreshAQI');

    this.activeCityTitle = document.getElementById('activeCityTitle');
    this.activeCityCountry = document.getElementById('activeCityCountry');
    this.activeCityCoords = document.getElementById('activeCityCoords');

    this.mainAqiValue = document.getElementById('mainAqiValue');
    this.mainAqiShortStatus = document.getElementById('mainAqiShortStatus');
    this.genZStatusTag = document.getElementById('genZStatusTag');
    this.genZVibeText = document.getElementById('genZVibeText');
    this.euroAqiValue = document.getElementById('euroAqiValue');
    this.euroAqiLabel = document.getElementById('euroAqiLabel');
    this.healthExplanationText = document.getElementById('healthExplanationText');
    this.ambientGlow = document.getElementById('ambientGlow');
    this.glowOrb1 = document.getElementById('glowOrb1');

    this.tipOutdoor = document.getElementById('tipOutdoor');
    this.tipMask = document.getElementById('tipMask');
    this.tipVentilation = document.getElementById('tipVentilation');
    this.tipPurifier = document.getElementById('tipPurifier');
    this.pollutantsGrid = document.getElementById('pollutantsGrid');
    this.hourlyTrendSvg = document.getElementById('hourlyTrendSvg');

    // Assistant
    this.chatMessages = document.getElementById('chatMessages');
    this.chatForm = document.getElementById('chatForm');
    this.chatInput = document.getElementById('chatInput');
    this.chatContextCity = document.getElementById('chatContextCity');
    this.chatContextAqi = document.getElementById('chatContextAqi');
    this.btnClearChat = document.getElementById('btnClearChat');
    this.btnJumpToAI = document.getElementById('btnJumpToAI');
    this.suggestedPromptsList = document.getElementById('suggestedPromptsList');

    // Calculator
    this.commuteDistanceSlider = document.getElementById('commuteDistanceSlider');
    this.distanceBubble = document.getElementById('distanceBubble');
    this.commuteFrequencyPills = document.getElementById('commuteFrequencyPills');
    this.transportModesGrid = document.getElementById('transportModesGrid');
    this.savingsKgDisplay = document.getElementById('savingsKgDisplay');
    this.savingsPercentDisplay = document.getElementById('savingsPercentDisplay');
    this.chosenAltName = document.getElementById('chosenAltName');
    this.phoneChargesEquivalent = document.getElementById('phoneChargesEquivalent');
    this.treeDaysEquivalent = document.getElementById('treeDaysEquivalent');
    this.fuelLitersEquivalent = document.getElementById('fuelLitersEquivalent');
    this.btnShowCalcMethodology = document.getElementById('btnShowCalcMethodology');
    this.methodologyModal = document.getElementById('methodologyModal');
    this.btnCloseMethodology = document.getElementById('btnCloseMethodology');

    // Streak
    this.streakCountHero = document.getElementById('streakCountHero');
    this.streakBadgeHero = document.getElementById('streakBadgeHero');
    this.bestStreakCount = document.getElementById('bestStreakCount');
    this.totalActionsHero = document.getElementById('totalActionsHero');
    this.todayProgressText = document.getElementById('todayProgressText');
    this.todayProgressBar = document.getElementById('todayProgressBar');
    this.dailyActionsList = document.getElementById('dailyActionsList');
    this.badgesShowcaseGrid = document.getElementById('badgesShowcaseGrid');
    this.navStreakBadge = document.getElementById('navStreakBadge');

    // Settings Modal
    this.settingsModal = document.getElementById('settingsModal');
    this.btnSettings = document.getElementById('btnSettings');
    this.btnSettingsMob = document.getElementById('btnSettingsMob');
    this.btnCloseSettings = document.getElementById('btnCloseSettings');
    this.btnSaveSettings = document.getElementById('btnSaveSettings');
    this.inputGeminiKey = document.getElementById('inputGeminiKey');
  }

  initEventListeners() {
    // Tab Switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        this.switchTab(target);
      });
    });

    if (this.btnJumpToAI) {
      this.btnJumpToAI.addEventListener('click', () => {
        this.switchTab('tab-assistant');
      });
    }

    if (this.brandLogo) {
      this.brandLogo.addEventListener('click', () => {
        this.switchTab('tab-dashboard');
      });
    }

    // City Search Input
    this.citySearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => this.handleCitySearch(q), 280);
    });

    // Enter key support for instant search selection
    this.citySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstItem = this.searchResultsDropdown.querySelector('.search-result-item');
        if (firstItem) {
          firstItem.click();
        } else if (this.citySearchInput.value.trim().length >= 2) {
          this.handleCitySearch(this.citySearchInput.value.trim()).then(() => {
            const item = this.searchResultsDropdown.querySelector('.search-result-item');
            if (item) item.click();
          });
        }
      }
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!this.citySearchInput.contains(e.target) && !this.searchResultsDropdown.contains(e.target)) {
        this.searchResultsDropdown.classList.add('hidden');
      }
    });

    // Geolocation
    this.btnGeoLocation.addEventListener('click', () => this.handleCurrentLocation());

    // Refresh AQI button (bypasses cache)
    if (this.btnRefreshAQI) {
      this.btnRefreshAQI.addEventListener('click', () => {
        this.btnRefreshAQI.classList.add('animate-spin');
        this.loadCityAirQuality(this.currentCity, true).finally(() => {
          setTimeout(() => this.btnRefreshAQI.classList.remove('animate-spin'), 600);
        });
      });
    }

    // Retry button on error banner
    if (this.btnRetryFetch) {
      this.btnRetryFetch.addEventListener('click', () => {
        this.btnRetryFetch.innerHTML = '<span class="inline-block animate-spin mr-1">↻</span> Reconnecting...';
        this.btnRetryFetch.disabled = true;
        this.loadCityAirQuality(this.currentCity, true).finally(() => {
          this.btnRetryFetch.innerHTML = 'Retry Connection';
          this.btnRetryFetch.disabled = false;
        });
      });
    }

    // Health Accordion
    const btnHealth = document.getElementById('btnToggleHealthExpl');
    const iconHealth = document.getElementById('iconHealthAccordion');
    if (btnHealth && iconHealth) {
      btnHealth.addEventListener('click', () => {
        this.healthExplanationText.classList.toggle('hidden');
        iconHealth.classList.toggle('rotate-180');
      });
    }

    // Assistant Chat
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUserChatMessage(this.chatInput.value);
    });

    if (this.btnClearChat) {
      this.btnClearChat.addEventListener('click', () => {
        this.assistant.initWelcomeMessage();
        this.renderChatMessages();
      });
    }

    // Prompt pills
    if (this.suggestedPromptsList) {
      this.suggestedPromptsList.addEventListener('click', (e) => {
        const pill = e.target.closest('.chat-prompt-pill');
        if (pill) {
          const text = pill.innerText.replace(/[🏃🔬🚴😷🌿📅🫁⏱️]/g, '').trim();
          this.handleUserChatMessage(text);
        }
      });
    }

    // Calculator distance slider
    this.commuteDistanceSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      this.distanceBubble.innerText = val;
      this.calculator.setDistance(val);
      this.renderCalculator();
    });

    // Calculator methodology modal
    if (this.btnShowCalcMethodology) {
      this.btnShowCalcMethodology.addEventListener('click', () => this.methodologyModal.classList.remove('hidden'));
    }
    if (this.btnCloseMethodology) {
      this.btnCloseMethodology.addEventListener('click', () => this.methodologyModal.classList.add('hidden'));
    }

    // Settings Modal
    const openSettings = () => {
      this.inputGeminiKey.value = this.assistant.getApiKey();
      this.settingsModal.classList.remove('hidden');
    };
    if (this.btnSettings) this.btnSettings.addEventListener('click', openSettings);
    if (this.btnSettingsMob) this.btnSettingsMob.addEventListener('click', openSettings);
    if (this.btnCloseSettings) {
      this.btnCloseSettings.addEventListener('click', () => this.settingsModal.classList.add('hidden'));
    }
    if (this.btnSaveSettings) {
      this.btnSaveSettings.addEventListener('click', () => {
        this.assistant.setApiKey(this.inputGeminiKey.value);
        this.settingsModal.classList.add('hidden');
      });
    }
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      this.liveClock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.liveDate.innerText = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  switchTab(targetId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
      targetContent.classList.remove('hidden');
    }

    document.querySelectorAll('.nav-tab').forEach(btn => {
      if (btn.getAttribute('data-target') === targetId) {
        btn.classList.add('active-tab', 'text-white', 'bg-white/10');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active-tab', 'text-white', 'bg-white/10');
        btn.classList.add('text-slate-400');
      }
    });

    this.activeTab = targetId;

    if (targetId === 'tab-assistant') {
      this.renderChatMessages();
      this.chatInput.focus();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderPopularCityPills() {
    this.quickCityPills.querySelectorAll('.city-quick-pill').forEach(el => el.remove());

    POPULAR_CITIES.forEach(city => {
      const btn = document.createElement('button');
      const isActive = city.name === this.currentCity.name;
      btn.className = `city-quick-pill shrink-0 px-3 py-1 rounded-full text-xs font-mono font-medium border transition ${
        isActive 
          ? 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/40' 
          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
      }`;
      btn.innerText = city.name;
      btn.addEventListener('click', () => {
        this.loadCityAirQuality(city);
      });
      this.quickCityPills.appendChild(btn);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async handleCitySearch(query) {
    if (!query || query.trim().length < 2) {
      this.searchResultsDropdown.classList.add('hidden');
      return;
    }

    const results = await searchCities(query);
    this.searchResultsDropdown.innerHTML = '';

    if (results.length === 0) {
      this.searchResultsDropdown.innerHTML = `
        <div class="p-3 text-xs text-slate-500 font-mono text-center">
          No cities found matching "${query}"
        </div>
      `;
      this.searchResultsDropdown.classList.remove('hidden');
      return;
    }

    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'search-result-item px-3 py-2 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between transition';
      item.innerHTML = `
        <div>
          <div class="text-xs font-bold text-white">${res.name}</div>
          <div class="text-[10px] text-slate-400 font-mono">${res.admin ? res.admin + ', ' : ''}${res.country}</div>
        </div>
        <span class="text-[10px] font-mono text-[#ccff00] bg-[#ccff00]/10 px-2 py-0.5 rounded">Select</span>
      `;
      item.addEventListener('click', () => {
        this.searchResultsDropdown.classList.add('hidden');
        this.citySearchInput.value = '';
        this.loadCityAirQuality(res);
      });
      this.searchResultsDropdown.appendChild(item);
    });

    this.searchResultsDropdown.classList.remove('hidden');
  }

  handleCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.btnGeoLocation.classList.add('animate-spin');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const loc = await reverseGeocode(lat, lon);
        this.btnGeoLocation.classList.remove('animate-spin');
        this.loadCityAirQuality(loc);
      },
      (err) => {
        this.btnGeoLocation.classList.remove('animate-spin');
        console.warn('Geolocation error:', err);
        alert('Could not access GPS location. Check your browser permissions.');
      },
      { timeout: 8000 }
    );
  }

  async loadCityAirQuality(city, forceRefresh = false) {
    this.currentCity = city;
    this.renderPopularCityPills();

    // Show loading shimmer
    this.dashboardLoadingState.classList.remove('hidden');
    this.dashboardErrorState.classList.add('hidden');
    this.dashboardContent.classList.add('opacity-40', 'pointer-events-none');

    try {
      const res = await fetchAirQuality(city.lat, city.lon, forceRefresh);
      this.currentAirData = res.data;
      this.renderAirQualityDashboard();

      this.dashboardLoadingState.classList.add('hidden');
      this.dashboardErrorState.classList.add('hidden');
      this.dashboardContent.classList.remove('opacity-40', 'pointer-events-none');
    } catch (err) {
      console.error('Failed to load air quality:', err);
      this.dashboardLoadingState.classList.add('hidden');
      this.dashboardErrorState.classList.remove('hidden');
      this.dashboardErrorMessage.innerText = err.message || 'Network error fetching data.';
      this.dashboardContent.classList.remove('opacity-40', 'pointer-events-none');
      
      // Update dashboard to safe offline/unavailable state instead of misleading "Fresh vibes"
      this.renderUnavailableDashboard(err.message);
    }
  }

  renderAirQualityDashboard() {
    if (!this.currentAirData || !this.currentAirData.current) return;

    const cur = this.currentAirData.current;
    const usAqi = Math.round(cur.us_aqi !== undefined ? cur.us_aqi : (cur.european_aqi * 1.1));
    const euroAqi = cur.european_aqi !== undefined ? cur.european_aqi : '--';

    const status = getAQIStatus(usAqi);

    // City headers
    this.activeCityTitle.innerText = this.currentCity.name;
    this.activeCityCountry.innerText = this.currentCity.country || 'GLOBAL';
    this.activeCityCoords.innerText = `${Number(this.currentCity.lat).toFixed(2)}° N, ${Number(this.currentCity.lon).toFixed(2)}° E`;

    // AQI Gauge
    this.mainAqiValue.innerText = usAqi;
    this.mainAqiValue.style.color = status.color;
    this.mainAqiShortStatus.innerText = status.shortStatus;

    // Gen-Z Vibe Tag & text
    this.genZStatusTag.innerText = status.tag;
    this.genZStatusTag.className = `vibe-tag ${status.badgeClass} font-display`;
    this.genZVibeText.innerText = status.vibeText;

    this.euroAqiValue.innerText = euroAqi;
    this.euroAqiLabel.innerText = status.shortStatus;
    this.healthExplanationText.innerText = status.healthExplanation;

    // Dynamic Atmospheric Glow
    if (this.ambientGlow) {
      document.documentElement.style.setProperty('--active-glow', `rgba(${status.colorRgb}, 0.35)`);
    }

    // Action Tips
    this.tipOutdoor.innerText = status.outdoorRating;
    this.tipMask.innerText = status.maskAdvice;
    this.tipVentilation.innerText = status.ventilationAdvice;
    this.tipPurifier.innerText = status.purifierAdvice;

    // Pollutants breakdown grid
    this.renderPollutantsGrid(cur);

    // 24-hr Hourly trend chart
    this.renderHourlyTrendChart();

    // Update Assistant context with live reading & forecast trajectory
    this.assistant.setContext({
      cityName: this.currentCity.name,
      aqi: usAqi,
      statusTag: status.tag,
      severity: status.severity,
      healthExplanation: status.healthExplanation,
      pm2_5: cur.pm2_5,
      pm10: cur.pm10,
      co: cur.carbon_monoxide,
      no2: cur.nitrogen_dioxide,
      so2: cur.sulphur_dioxide,
      o3: cur.ozone,
      tomorrowForecast: this.currentAirData.tomorrowForecast || null,
      isUnavailable: false
    });

    this.chatContextCity.innerText = this.currentCity.name;
    this.chatContextAqi.innerText = usAqi;
    this.chatContextAqi.style.color = status.color;

    if (window.lucide) window.lucide.createIcons();
  }

  renderUnavailableDashboard(errorMessage) {
    const unavail = getUnavailableStatus();

    this.activeCityTitle.innerText = this.currentCity.name;
    this.activeCityCountry.innerText = this.currentCity.country || 'GLOBAL';
    this.activeCityCoords.innerText = `${Number(this.currentCity.lat).toFixed(2)}° N, ${Number(this.currentCity.lon).toFixed(2)}° E`;

    // AQI Gauge showing offline status
    this.mainAqiValue.innerText = '--';
    this.mainAqiValue.style.color = unavail.color;
    this.mainAqiShortStatus.innerText = unavail.shortStatus;

    // Gen-Z Tag showing offline cautious warning
    this.genZStatusTag.innerText = unavail.tag;
    this.genZStatusTag.className = `vibe-tag ${unavail.badgeClass} font-display`;
    this.genZVibeText.innerText = unavail.vibeText;

    this.euroAqiValue.innerText = '--';
    this.euroAqiLabel.innerText = 'Offline';
    this.healthExplanationText.innerText = unavail.healthExplanation;

    if (this.ambientGlow) {
      document.documentElement.style.setProperty('--active-glow', `rgba(${unavail.colorRgb}, 0.15)`);
    }

    // Action Tips cautious offline advice
    this.tipOutdoor.innerText = unavail.outdoorRating;
    this.tipMask.innerText = unavail.maskAdvice;
    this.tipVentilation.innerText = unavail.ventilationAdvice;
    this.tipPurifier.innerText = unavail.purifierAdvice;

    // Render offline pollutant cards
    const keys = ['pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone'];
    this.pollutantsGrid.innerHTML = '';
    keys.forEach(key => {
      const evalRes = evaluatePollutant(key, null);
      const meta = evalRes.meta;

      const card = document.createElement('div');
      card.className = 'glass-panel p-4 flex flex-col justify-between space-y-3 border-white/5 opacity-60';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="font-bold text-white">${meta.name}</span>
            <span class="text-[10px] uppercase px-1.5 py-0.5 rounded font-mono font-bold text-slate-400 bg-white/5">
              Offline
            </span>
          </div>
          <p class="text-[10px] text-slate-500 font-sans line-clamp-1 mt-0.5">${meta.fullName}</p>
        </div>

        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl sm:text-2xl font-black font-mono text-slate-500">--</span>
            <span class="text-[10px] text-slate-600 font-mono">${meta.unit}</span>
          </div>
          <div class="w-full h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden border border-white/5">
            <div class="h-full rounded-full bg-slate-700" style="width: 0%;"></div>
          </div>
          <div class="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
            <span>WHO: ${meta.good}</span>
            <span>Data Pending</span>
          </div>
        </div>
      `;
      this.pollutantsGrid.appendChild(card);
    });

    // Trend chart placeholder
    this.hourlyTrendSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="12" font-family="monospace">Live 24-hour telemetry temporarily unavailable</text>';

    // Update assistant context
    this.assistant.setContext({
      cityName: this.currentCity.name,
      aqi: '--',
      isUnavailable: true,
      statusTag: unavail.tag,
      healthExplanation: unavail.healthExplanation
    });

    this.chatContextCity.innerText = this.currentCity.name;
    this.chatContextAqi.innerText = '--';
    this.chatContextAqi.style.color = unavail.color;

    if (window.lucide) window.lucide.createIcons();
  }

  renderPollutantsGrid(cur) {
    const keys = ['pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone'];
    this.pollutantsGrid.innerHTML = '';

    keys.forEach(key => {
      const val = cur[key] !== undefined ? cur[key] : 0;
      const evalRes = evaluatePollutant(key, val);
      const meta = evalRes.meta;

      const card = document.createElement('div');
      card.className = 'glass-panel p-4 flex flex-col justify-between space-y-3 border-white/10 hover:border-white/20 transition';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="font-bold text-white">${meta.name}</span>
            <span class="text-[10px] uppercase px-1.5 py-0.5 rounded font-mono font-bold" style="color: ${evalRes.color}; background: ${evalRes.color}22">
              ${evalRes.status}
            </span>
          </div>
          <p class="text-[10px] text-slate-500 font-sans line-clamp-1 mt-0.5" title="${meta.fullName}">${meta.fullName}</p>
        </div>

        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl sm:text-2xl font-black font-mono text-white">${Number(val).toFixed(1)}</span>
            <span class="text-[10px] text-slate-400 font-mono">${meta.unit}</span>
          </div>

          <!-- Progress bar vs safe threshold -->
          <div class="w-full h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden border border-white/5">
            <div class="h-full rounded-full transition-all duration-700" style="width: ${evalRes.percentage}%; background-color: ${evalRes.color};"></div>
          </div>
          <div class="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>WHO: ${meta.good}</span>
            <span>${evalRes.percentage}%</span>
          </div>
        </div>
      `;
      this.pollutantsGrid.appendChild(card);
    });
  }

  renderHourlyTrendChart() {
    if (!this.currentAirData || !this.currentAirData.hourly) {
      this.hourlyTrendSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="12" font-family="monospace">Hourly trend unavailable</text>';
      return;
    }

    const hourly = this.currentAirData.hourly;
    const times = hourly.time || [];
    const aqiVals = (hourly.us_aqi || hourly.pm2_5 || []).slice(0, 24);

    if (aqiVals.length < 2) return;

    const width = 800;
    const height = 180;
    const padX = 30;
    const padY = 20;

    const maxAqi = Math.max(120, ...aqiVals);
    const minAqi = 0;

    const points = aqiVals.map((val, idx) => {
      const x = padX + (idx / (aqiVals.length - 1)) * (width - 2 * padX);
      const y = height - padY - ((val - minAqi) / (maxAqi - minAqi)) * (height - 2 * padY);
      return { x, y, val, time: times[idx] };
    });

    const pathData = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
    const areaData = `${pathData} L ${points[points.length - 1].x.toFixed(1)},${height - padY} L ${points[0].x.toFixed(1)},${height - padY} Z`;

    let dotsSvg = '';
    points.forEach((p, idx) => {
      if (idx % 3 === 0 || idx === points.length - 1) {
        const timeLabel = p.time ? p.time.split('T')[1] || `${idx}:00` : `${idx}:00`;
        dotsSvg += `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#ccff00" stroke="#08090d" stroke-width="2" />
          <text x="${p.x.toFixed(1)}" y="${height - 4}" text-anchor="middle" fill="#64748b" font-size="9" font-family="monospace">${timeLabel}</text>
          <text x="${p.x.toFixed(1)}" y="${(p.y - 8).toFixed(1)}" text-anchor="middle" fill="#f8fafc" font-size="9" font-family="monospace" font-weight="bold">${Math.round(p.val)}</text>
        `;
      }
    });

    this.hourlyTrendSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.hourlyTrendSvg.innerHTML = `
      <defs>
        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ccff00" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ccff00" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#222" stroke-width="1" />
      <path d="${areaData}" fill="url(#aqiGrad)" />
      <path d="${pathData}" fill="none" stroke="#ccff00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${dotsSvg}
    `;
  }

  // AI Assistant Handlers
  async handleUserChatMessage(msgText) {
    if (!msgText || !msgText.trim()) return;

    this.chatInput.value = '';
    const tempUserMsg = {
      role: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.renderSingleMessage(tempUserMsg);

    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Show attractive typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'aiTypingIndicator';
    typingIndicator.className = 'flex items-center gap-3 p-3.5 rounded-2xl chat-bubble-ai max-w-[200px] border border-white/10';
    typingIndicator.innerHTML = `
      <div class="dot-flashing ml-3"></div>
      <span class="text-[11px] font-mono text-slate-400">Airy is thinking...</span>
    `;
    this.chatMessages.appendChild(typingIndicator);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    try {
      const aiResponse = await this.assistant.ask(msgText);
      typingIndicator.remove();
      this.renderSingleMessage(aiResponse, true);
    } catch (err) {
      typingIndicator.remove();
      this.renderSingleMessage({
        role: 'assistant',
        text: "My bad bestie, hit a temporary connection hiccup! Try asking me again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  renderChatMessages() {
    this.chatMessages.innerHTML = '';
    this.assistant.messages.forEach(msg => {
      this.renderSingleMessage(msg, false);
    });
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  renderSingleMessage(msg, animate = false) {
    const isUser = msg.role === 'user';
    const wrapper = document.createElement('div');
    wrapper.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`;

    const bubble = document.createElement('div');
    bubble.className = `p-4 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
      isUser ? 'chat-bubble-user font-medium' : 'chat-bubble-ai font-sans'
    }`;

    // Format basic bold, italics, KaTeX inline math approximations, and newlines
    let formatted = msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-[#ccff00]">$1</em>')
      .replace(/\$([^\$]+)\$/g, '<code class="font-mono text-[#c084fc]">$1</code>')
      .replace(/\n\n/g, '<div class="h-2"></div>')
      .replace(/\n/g, '<br/>');

    bubble.innerHTML = formatted;
    wrapper.appendChild(bubble);

    // If assistant message includes dynamic suggestions, render clickable prompt chips
    if (!isUser && Array.isArray(msg.suggestions) && msg.suggestions.length > 0) {
      const suggestionsContainer = document.createElement('div');
      suggestionsContainer.className = 'flex flex-wrap gap-1.5 pt-1 max-w-[95%]';
      msg.suggestions.forEach(sug => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'px-2.5 py-1 rounded-full text-[11px] font-sans bg-white/5 hover:bg-[#ccff00]/15 hover:text-[#ccff00] border border-white/10 hover:border-[#ccff00]/30 text-slate-300 transition text-left cursor-pointer';
        chip.innerText = sug;
        chip.addEventListener('click', () => {
          this.handleUserChatMessage(sug);
        });
        suggestionsContainer.appendChild(chip);
      });
      wrapper.appendChild(suggestionsContainer);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'text-[9px] font-mono text-slate-500 px-1';
    timeSpan.innerText = msg.timestamp || '';
    wrapper.appendChild(timeSpan);

    this.chatMessages.appendChild(wrapper);

    if (window.lucide) window.lucide.createIcons();
  }

  // Calculator Handlers
  renderCalculator() {
    const res = this.calculator.calculate();

    // Render frequencies
    this.commuteFrequencyPills.innerHTML = '';
    COMMUTE_FREQUENCIES.forEach(freq => {
      const isSelected = freq.id === this.calculator.frequencyId;
      const btn = document.createElement('button');
      btn.className = `px-3 py-2 rounded-xl text-xs font-mono font-medium border transition ${
        isSelected
          ? 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/40'
          : 'bg-black/30 text-slate-400 border-white/5 hover:text-white'
      }`;
      btn.innerText = freq.label;
      btn.addEventListener('click', () => {
        this.calculator.setFrequency(freq.id);
        this.renderCalculator();
      });
      this.commuteFrequencyPills.appendChild(btn);
    });

    // Render 5 transport modes
    this.transportModesGrid.innerHTML = '';
    res.modesResults.forEach(mode => {
      const isSelected = mode.id === this.calculator.selectedAlternative;
      const isCar = mode.id === 'car';

      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
        isSelected 
          ? 'bg-[#ccff00]/10 border-[#ccff00]/50 shadow-[0_0_15px_rgba(204,255,0,0.15)]' 
          : isCar 
            ? 'bg-rose-950/20 border-rose-500/20' 
            : 'bg-white/[0.03] border-white/5 hover:border-white/15'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-2xl">${mode.icon}</span>
          ${isCar 
            ? '<span class="text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">Baseline</span>' 
            : isSelected 
              ? '<span class="text-[9px] font-mono uppercase bg-[#ccff00]/20 text-[#ccff00] px-1.5 py-0.5 rounded font-bold">Active Alt</span>' 
              : ''}
        </div>
        <div>
          <div class="text-xs font-bold font-display text-white">${mode.name}</div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${mode.gCo2PerKm}g CO₂/km</div>
        </div>
        <div class="pt-2 border-t border-white/5">
          <div class="text-lg font-black font-mono" style="color: ${mode.color}">${mode.totalKg} kg</div>
          <div class="text-[9px] text-slate-500 font-mono">Total Emissions</div>
        </div>
      `;

      if (!isCar) {
        card.addEventListener('click', () => {
          this.calculator.setSelectedAlternative(mode.id);
          this.renderCalculator();
        });
      }

      this.transportModesGrid.appendChild(card);
    });

    // Green Dividend Spotlight
    this.savingsKgDisplay.innerText = `${res.savings.kgSaved} kg`;
    this.savingsPercentDisplay.innerText = `${res.savings.percentReduction}%`;
    this.chosenAltName.innerText = res.chosenAlt.name;
    this.phoneChargesEquivalent.innerText = `${res.savings.phoneCharges.toLocaleString()} charges`;
    this.treeDaysEquivalent.innerText = `${res.savings.treeDays} days`;
    this.fuelLitersEquivalent.innerText = `${res.savings.fuelLiters} L`;
  }

  // Eco Streak Handlers
  renderStreakTracker() {
    const state = this.streakManager.getState();

    this.streakCountHero.innerText = state.currentStreak;
    this.bestStreakCount.innerText = state.bestStreak;
    this.totalActionsHero.innerText = state.totalActionsCompleted;
    this.navStreakBadge.innerText = state.currentStreak;

    this.streakBadgeHero.innerText = `${state.activeBadge.title} (${state.activeBadge.vibe})`;
    this.todayProgressText.innerText = `${state.todayCount} / ${state.totalCount} Completed (${state.completionPercent}%)`;
    this.todayProgressBar.style.width = `${state.completionPercent}%`;

    // Render daily actions
    this.dailyActionsList.innerHTML = '';
    DAILY_ACTIONS.forEach(action => {
      const isDone = state.todayActions.includes(action.id);

      const item = document.createElement('div');
      item.className = `p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
        isDone 
          ? 'bg-[#ccff00]/10 border-[#ccff00]/40 text-white' 
          : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
      }`;

      item.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-lg ${isDone ? 'bg-[#ccff00]/20' : 'bg-white/5'}">
            ${action.icon}
          </div>
          <div>
            <div class="text-xs font-bold font-display ${isDone ? 'text-[#ccff00]' : 'text-white'}">
              ${action.title}
            </div>
            <div class="text-[10px] text-slate-400 font-sans">${action.desc}</div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
            ${action.impact}
          </span>
          <div class="w-6 h-6 rounded-lg border flex items-center justify-center transition ${
            isDone ? 'bg-[#ccff00] border-[#ccff00] text-black font-bold' : 'border-white/20'
          }">
            ${isDone ? '✓' : ''}
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.streakManager.toggleAction(action.id);
        this.renderStreakTracker();
      });

      this.dailyActionsList.appendChild(item);
    });

    // Milestone badges
    this.badgesShowcaseGrid.innerHTML = '';
    STREAK_BADGES.forEach(badge => {
      const isEarned = state.currentStreak >= badge.days;
      const bCard = document.createElement('div');
      bCard.className = `p-3 rounded-2xl border text-center space-y-1.5 transition ${
        isEarned 
          ? 'bg-[#ccff00]/10 border-[#ccff00]/40' 
          : 'bg-white/[0.02] border-white/5 opacity-40'
      }`;
      bCard.innerHTML = `
        <div class="text-xl">${isEarned ? '🏆' : '🔒'}</div>
        <div class="text-[11px] font-bold font-display ${isEarned ? 'text-white' : 'text-slate-400'}">${badge.title}</div>
        <div class="text-[9px] font-mono text-slate-500">${badge.days} Days</div>
      `;
      this.badgesShowcaseGrid.appendChild(bCard);
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.airyApp = new AiryApp();
});
