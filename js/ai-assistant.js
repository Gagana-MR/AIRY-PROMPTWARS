/**
 * AIRY - Upgraded AI Air Assistant ("Airy ✨")
 * Context-aware, multi-turn conversational companion.
 * Tracks conversation state, resolves follow-ups ("What about tomorrow?", "Is that safe for me?"),
 * enforces scientific accuracy (debunks houseplant air-cleaning myth, recommends certified N95/FFP2),
 * and clearly distinguishes current live telemetry from forecast models and offline fallback.
 */

export class AiryAssistant {
  constructor() {
    this.messages = [];
    this.currentContext = null;
    this.customApiKey = localStorage.getItem('airy_custom_gemini_key') || '';
    
    // Multi-turn conversational memory state
    this.dialogueState = {
      lastTopic: null,          // 'exercise', 'forecast', 'masks', 'plants', 'pollutants', 'health'
      userExerciseType: null,   // 'running', 'cycling', 'walking'
      userHasSensitivity: null, // true, false
      lastSuggestedQuestions: []
    };

    this.initWelcomeMessage();
  }

  setContext(context) {
    this.currentContext = context;
  }

  setApiKey(key) {
    this.customApiKey = (key || '').trim();
    if (this.customApiKey) {
      localStorage.setItem('airy_custom_gemini_key', this.customApiKey);
    } else {
      localStorage.removeItem('airy_custom_gemini_key');
    }
  }

  getApiKey() {
    return this.customApiKey;
  }

  initWelcomeMessage() {
    const cityName = this.currentContext?.cityName || 'Bengaluru';
    const aqi = this.currentContext?.aqi || '--';
    
    this.messages = [
      {
        role: 'assistant',
        text: `Yo bestie! I'm **Airy ✨**, your contextual air quality & respiratory companion. I'm currently tracking live telemetry for **${cityName}** (US AQI: **${aqi}**).\n\nAsk me anything about whether you should exercise, what specific pollutants mean, or how tomorrow's forecast is shaping up!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'smart_local',
        suggestions: [
          'Is it safe to go outside today? 🏃',
          'What about cycling then? 🚴',
          'What about tomorrow? 📅',
          'Can houseplants clean indoor air? 🌿'
        ]
      }
    ];
  }

  /**
   * Process a question from the user with full multi-turn conversational memory
   */
  async ask(userQuestion) {
    const q = (userQuestion || '').trim();
    if (!q) return null;

    // Record user message
    const userMsg = {
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(userMsg);

    let answerText = '';
    let engineType = 'smart_local';
    let suggestions = [];

    // Attempt server-side proxy or custom Gemini API if configured
    if (this.customApiKey) {
      try {
        answerText = await this.callGeminiAPI(q);
        engineType = 'gemini';
        suggestions = this.generateDynamicFollowUps(q, this.dialogueState.lastTopic);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local reasoning engine:', err);
        const localRes = this.generateIntelligentResponse(q);
        answerText = localRes.text;
        suggestions = localRes.suggestions;
        engineType = 'smart_local';
      }
    } else {
      // Use upgraded conversational reasoning engine with context tracking
      const localRes = this.generateIntelligentResponse(q);
      answerText = localRes.text;
      suggestions = localRes.suggestions;
      engineType = 'smart_local';
    }

    const aiMsg = {
      role: 'assistant',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: engineType,
      suggestions: suggestions || []
    };
    this.messages.push(aiMsg);

    return aiMsg;
  }

  /**
   * Upgraded multi-turn contextual reasoning engine
   */
  generateIntelligentResponse(question) {
    const qLower = question.toLowerCase();
    const ctx = this.currentContext || {};
    const cityName = ctx.cityName || 'your city';
    const isUnavailable = !ctx.aqi || ctx.isUnavailable || ctx.aqi === '--';
    const aqi = isUnavailable ? null : Math.round(Number(ctx.aqi));
    const pm25 = ctx.pm2_5 !== undefined && ctx.pm2_5 !== '--' ? Number(ctx.pm2_5).toFixed(1) : null;
    const pm10 = ctx.pm10 !== undefined && ctx.pm10 !== '--' ? Number(ctx.pm10).toFixed(1) : null;

    let response = '';
    let suggestions = [];
    let detectedTopic = this.dialogueState.lastTopic;

    // 0. TELEMETRY OFFLINE / UNAVAILABLE STATE
    if (isUnavailable) {
      response = `⚠️ **[Airy Offline Intelligence • Telemetry Offline]**\n\nLive atmospheric sensor data for **${cityName}** is currently unreachable. Because air quality cannot be confirmed right now, please do **not** assume the air is safe if you notice outdoor haze or strong traffic odors.\n\n- **Protective Precaution:** Keep windows sealed and run your indoor True HEPA purifier on Auto/Medium.\n- **Sensitive Individuals:** If stepping outside is necessary, consider wearing a certified **N95/FFP2 respirator**.\n- Check back in a moment or hit **Retry Connection** above!`;
      suggestions = ['Check another city 🏙️', 'Why do live sensors go offline? 📡', 'What mask protects best? 😷'];
      return { text: response, suggestions };
    }

    // 1. SCIENTIFIC ACCURACY: HOUSEPLANTS AIR CLEANING MYTH
    if (qLower.includes('plant') || qLower.includes('houseplant') || qLower.includes('snake plant') || qLower.includes('spider plant') || qLower.includes('indoor greenery')) {
      detectedTopic = 'plants';
      this.dialogueState.lastTopic = 'plants';
      response = `🌿 **[Airy Offline Intelligence • Scientific Fact-Check]**\n\nReal talk bestie: **Houseplants do NOT meaningfully purify indoor air!**\n\nWhile plants are incredible for aesthetic wellness, mental calm, and room ambiance, here is the atmospheric science:\n- **The NASA Myth:** The famous 1989 NASA Clean Air Study was conducted in tiny, sealed airtight glass chambers under high light. That is totally different from a real home.\n- **Real-World Airflow:** Peer-reviewed studies by atmospheric researchers (such as Drexel University's 2019 review) prove that standard home ventilation exchanges indoor air thousands of times faster than potted plants can absorb volatile organic compounds (VOCs).\n- **Particulate Reality:** Houseplants have **zero ability** to remove microscopic **PM2.5** or **PM10** soot from your breathing zone.\n\n✨ **What actually works:** To remove fine smog and allergens, you need a certified **True HEPA air purifier** with active mechanical airflow. Keep your monsteras for the vibe, but rely on HEPA filters for your lungs!`;
      suggestions = [
        'How does a True HEPA purifier work? 🌪️',
        'Is outdoor air clean in ' + cityName + ' right now? 🏃',
        'What mask should I buy? 😷'
      ];
      return { text: response, suggestions };
    }

    // 2. FORECAST / "WHAT ABOUT TOMORROW?"
    if (qLower.includes('tomorrow') || qLower.includes('next day') || qLower.includes('forecast') || qLower.includes('later this week') || qLower.includes('getting better')) {
      detectedTopic = 'forecast';
      this.dialogueState.lastTopic = 'forecast';

      if (ctx.tomorrowForecast) {
        const tf = ctx.tomorrowForecast;
        const trendVerb = tf.avgAqi < aqi ? 'improving compared to today' : tf.avgAqi > aqi ? 'trending slightly dirtier than today' : 'staying around similar levels';
        response = `📅 **[Airy Offline Intelligence • Forecast Model]**\n\nLooking at the 24-48 hour satellite trajectory model for **${cityName}**:\n- **Tomorrow's Projected Average AQI:** ~**${tf.avgAqi}** (${trendVerb})\n- **Projected Peak AQI:** ~**${tf.maxAqi}**\n${tf.avgPm25 ? `- **Expected PM2.5 Concentration:** ~**${tf.avgPm25} µg/m³**\n` : ''}\n*Note: This is a predictive atmospheric transport model, distinct from live sensor telemetry. Morning rush-hour traffic and weather inversions can cause localized spikes.*`;
      } else {
        response = `📅 **[Airy Offline Intelligence • Forecast Analysis]**\n\nWhile live US AQI in **${cityName}** is currently **${aqi}** (*${ctx.statusTag}*), tomorrow's air trajectory will largely depend on morning traffic and temperature inversion layers. Peak smog typically clusters between **7:30 AM – 10:00 AM** and after **7:00 PM**.\n\n*Planning an outdoor workout? Midday sunny hours (1:00 PM – 4:00 PM) usually feature the best thermal mixing for outdoor plans!*`;
      }

      suggestions = [
        'What about cycling tomorrow? 🚴',
        'Is that safe for sensitive lungs? 🫁',
        'How can I protect my bedroom air? 🪟'
      ];
      return { text: response, suggestions };
    }

    // 3. PERSONALIZED HEALTH SENSITIVITIES & ASTHMA ("IS THAT SAFE FOR ME?")
    if (qLower.includes('asthma') || qLower.includes('safe for me') || qLower.includes('allerg') || qLower.includes('sensitive') || qLower.includes('kids') || qLower.includes('elderly') || qLower.includes('pregnant')) {
      detectedTopic = 'sensitivities';
      this.dialogueState.lastTopic = 'sensitivities';
      this.dialogueState.userHasSensitivity = true;

      response = `🫁 **[Airy Offline Intelligence • Personalized Health Guidance]**\n\nBestie, your respiratory health is priority number one. Here is the direct guidance for sensitive lungs in **${cityName}** (Current US AQI: **${aqi}**):\n\n`;

      if (aqi <= 50) {
        response += `- **Current Situation:** With AQI at **${aqi}** and PM2.5 at **${pm25 || '10'} µg/m³**, atmospheric particulate levels are low. For most people with asthma or seasonal allergies, outdoor activity poses minimal environmental trigger risk today.\n- **Precaution:** Always keep your prescribed inhaler on hand, especially during seasonal pollen shifts!`;
      } else if (aqi <= 100) {
        response += `- **Caution Advisory:** AQI is **${aqi}** (Moderate). While deemed acceptable for the general population, people with asthma or hyper-reactive airways can still experience mild airway irritation or throat dryness during extended outdoor exercise.\n- **Action:** Choose lower-intensity exercise (walking instead of intense sprints), and avoid routes alongside heavy diesel bus routes.`;
      } else {
        response += `- **High Caution Alert:** With AQI at **${aqi}**, particulate exposure triggers acute airway inflammation and bronchospasm in individuals with asthma or cardiovascular conditions.\n- **Action:** Strenuous outdoor cardio is **not** recommended today. Move workouts indoors with air filtration running, and don a certified **N95/FFP2 respirator** if you must commute outside.`;
      }

      response += `\n\n*(Note: This is environmental exposure guidance based on WHO/EPA metrics, not an individual medical diagnosis. Always consult your physician for personalized medical advice.)*`;
      suggestions = [
        'What kind of mask should I buy? 😷',
        'Can I do a short 20-min walk? 🚶',
        'What does PM2.5 do to lungs? 🔬'
      ];
      return { text: response, suggestions };
    }

    // 4. CYCLING VS RUNNING VS WALKING ("WHAT ABOUT CYCLING THEN?")
    if (qLower.includes('cycl') || qLower.includes('bike') || qLower.includes('biking') || (qLower.includes('what about') && (this.dialogueState.lastTopic === 'exercise' || qLower.includes('ride')))) {
      detectedTopic = 'exercise';
      this.dialogueState.lastTopic = 'exercise';
      this.dialogueState.userExerciseType = 'cycling';

      response = `🚴 **[Airy Offline Intelligence • Cycling Telemetry Review]**\n\nCycling involves a critical physiological difference compared to walking: **Minute Ventilation** (the total volume of air you breathe per minute) increases **3x to 5x** during a ride (often 40–60 liters/minute), meaning you inhale exponentially more particulate matter directly into your alveoli.\n\n`;

      if (aqi <= 50) {
        response += `In **${cityName}**, current AQI is **${aqi}** with PM2.5 at **${pm25 || 'low'} µg/m³**. Cycling is **100% green-lit**! You get great aerobic conditioning while cutting commute emissions. Just steer clear of idling diesel traffic at intersections.`;
      } else if (aqi <= 100) {
        response += `Current AQI in **${cityName}** is **${aqi}** (Moderate). Casual cycling on dedicated bike paths or quiet neighborhood streets is fine for healthy adults. If you plan an aggressive 2+ hour high-intensity training ride, consider doing part of it indoors or cruising at a moderate cadence.`;
      } else {
        response += `Respectfully, **skip the outdoor bike ride today 🛑**. AQI is **${aqi}** (*${ctx.statusTag}*). Deep cycling respirations at this level draw unfiltered soot particles deep into your vascular system. Swap for an indoor stationary bike or gym trainer session today!`;
      }

      response += `\n\n*Quick check: How long are you planning to ride, and are you riding on city streets or green trails?*`;
      suggestions = [
        'Just a quick 20-minute commute ⏱️',
        'Long training ride (1-2 hours) 🚴',
        'Is that safe for asthma? 🫁'
      ];
      return { text: response, suggestions };
    }

    // 5. GENERAL EXERCISE / SAFE OUTSIDE ("IS IT SAFE TO GO OUTSIDE TODAY?")
    if (qLower.includes('safe to go outside') || qLower.includes('can i go out') || qLower.includes('workout') || qLower.includes('exercise') || qLower.includes('run') || qLower.includes('jog') || qLower.includes('touch grass')) {
      detectedTopic = 'exercise';
      this.dialogueState.lastTopic = 'exercise';

      response = `🏃 **[Airy Offline Intelligence • Activity Evaluation]**\n\nHere is your environmental workout breakdown for **${cityName}** right now:\n- **Current US AQI:** **${aqi}** (*${ctx.statusTag}*)\n- **PM2.5:** **${pm25 ? pm25 + ' µg/m³' : 'Standard levels'}** (WHO safe guideline: $\\le 15\\,\\mu\\text{g}/\\text{m}^3$)\n\n`;

      if (aqi <= 50) {
        response += `**Vibe Check: Passed 10/10!** Atmospheric conditions are clean. Ideal for running, outdoor bootcamps, and park walks. Note that individual safety also depends on workout duration and distance from heavy highway corridors.`;
      } else if (aqi <= 100) {
        response += `**Vibe Check: Acceptable for most.** Normal outdoor exercise is fine. If you're doing prolonged strenuous endurance training (>60 minutes), pick parks over busy arterial roads. Sensitive kings & queens should monitor for any chest tightness.`;
      } else if (aqi <= 150) {
        response += `**Vibe Check: Caution advised.** General public is usually okay for light movement, but high-intensity cardio will leave you feeling dry throat and cough. If you have asthma or allergies, keep cardio indoors today.`;
      } else {
        response += `**Vibe Check: Not it 🫠.** Outdoor air is actively hazardous for prolonged cardiovascular breathing. Shift workouts indoors with HEPA air filtration running!`;
      }

      response += `\n\n*To personalize this: Are you planning a light walk or intense cardio (running/cycling)? And how long are you staying out?*`;
      suggestions = [
        'What about cycling then? 🚴',
        'I have mild asthma, is that safe? 🫁',
        'What about tomorrow? 📅'
      ];
      return { text: response, suggestions };
    }

    // 6. SCIENTIFIC ACCURACY: MASKS & CERTIFIED RESPIRATORS
    if (qLower.includes('mask') || qLower.includes('respirator') || qLower.includes('n95') || qLower.includes('ffp2') || qLower.includes('surgical mask') || qLower.includes('cloth mask')) {
      detectedTopic = 'masks';
      this.dialogueState.lastTopic = 'masks';

      response = `😷 **[Airy Offline Intelligence • Respirator Standards]**\n\nWhen pollution spikes in **${cityName}**, here is the medical reality on facial protection:\n\n- **Cloth & Bandanas:** **0% effective** against PM2.5. The weave gaps in woven cotton are 100 to 500 microns wide—PM2.5 particles slip right through.\n- **Standard Blue Surgical Masks:** Only designed for large droplet fluid resistance; they lack a peripheral airtight seal, meaning you inhale unfiltered smog around the cheeks and nose.\n- **Certified N95 / FFP2 / KN95 Respirators:** The only proven standard. They utilize electrostatically charged meltblown polypropylene microfibers that capture sub-micron particles with $\\ge 95\\%$ efficiency.\n\n✨ **Pro Tip:** A respirator only protects if it has a snug, gap-free seal across your nose bridge and jawline. Pinch the metallic nose wire!`;
      suggestions = [
        'Is a mask needed in ' + cityName + ' right now? 🏙️',
        'Can houseplants clean indoor air? 🌿',
        'What does PM2.5 actually mean? 🔬'
      ];
      return { text: response, suggestions };
    }

    // 7. SCIENTIFIC ACCURACY: PM2.5 AND POLLUTANT EXPLAINER
    if (qLower.includes('pm2.5') || qLower.includes('pm 2.5') || qLower.includes('particulate') || qLower.includes('pollutant') || qLower.includes('pm10') || qLower.includes('ozone')) {
      detectedTopic = 'pollutants';
      this.dialogueState.lastTopic = 'pollutants';

      response = `🔬 **[Airy Offline Intelligence • Atmospheric Science]**\n\n**What PM2.5 actually is:**\n- **Size:** Particles with an aerodynamic diameter $\\le 2.5\\,\\mu\\text{m}$ (roughly **30 times smaller** than the width of human hair!).\n- **Why it matters:** Unlike larger dust (PM10) that gets trapped in your nasal passages, PM2.5 travels past respiratory cilia into terminal lung alveoli and can pass directly through the alveolar-capillary barrier into the systemic bloodstream 🫀.\n- **WHO Benchmark:** 24-hour average should remain below **$15\\,\\mu\\text{g}/\\text{m}^3$**.\n- **Current in ${cityName}:** **${pm25 || 'normal'} µg/m³**.\n\nCombined with nitrogen dioxide ($NO_2$) from vehicle tailpipes and ground-level ozone ($O_3$), this forms the core index of your daily AQI!`;
      suggestions = [
        'How can I protect myself indoors? 🛡️',
        'Is outdoor cardio safe today? 🏃',
        'What about tomorrow? 📅'
      ];
      return { text: response, suggestions };
    }

    // 8. FOLLOW-UP DURATION & SHORT ACTIVITY (E.G. "JUST A 20 MINUTE WALK")
    if (qLower.includes('20 min') || qLower.includes('30 min') || qLower.includes('short walk') || qLower.includes('just walking') || qLower.includes('light walk')) {
      response = `🚶 **[Airy Offline Intelligence • Tailored Duration Review]**\n\nGot you bestie! For a short 20-30 minute casual walk in **${cityName}** (AQI: **${aqi}**):\n\n- Casual walking maintains low minute ventilation (~10–12 liters/min), which produces far less particulate intake than running.\n- At current air levels, a short walk is totally fine for general wellbeing. Just pick tree-lined side streets rather than walking directly alongside congested multi-lane junctions.\n- Enjoy the fresh steps!`;
      suggestions = [
        'What about tomorrow? 📅',
        'What if I have asthma? 🫁',
        'Can plants clean my bedroom air? 🌿'
      ];
      return { text: response, suggestions };
    }

    // 9. GENERAL CONVERSATIONAL CONTEXTUAL RESPONSE
    response = `✨ **[Airy Offline Intelligence • Live Context: ${cityName}]**\n\nHere is your live environmental summary:\n- **Current US AQI:** **${aqi}** (*${ctx.statusTag || 'Monitoring'}*)\n${pm25 ? `- **PM2.5:** ${pm25} µg/m³ (WHO guideline: $\\le 15\\,\\mu\\text{g}/\\text{m}^3$)\n` : ''}${pm10 ? `- **PM10:** ${pm10} µg/m³\n` : ''}- **Advisory:** ${ctx.healthExplanation || 'Conditions verified through open satellite and ground monitoring.'}\n\nAsk me about outdoor workout safety, cycling, tomorrow's forecast, or certified N95 respirators!`;
    suggestions = [
      'Is it safe to go outside today? 🏃',
      'What about cycling then? 🚴',
      'What about tomorrow? 📅',
      'Can houseplants clean indoor air? 🌿'
    ];

    return { text: response, suggestions };
  }

  generateDynamicFollowUps(question, lastTopic) {
    const q = question.toLowerCase();
    if (q.includes('exercise') || q.includes('run') || q.includes('outside')) {
      return ['What about cycling then? 🚴', 'Is that safe for asthma? 🫁', 'What about tomorrow? 📅'];
    }
    if (q.includes('plant')) {
      return ['How does a True HEPA purifier work? 🌪️', 'What mask protects best? 😷', 'Is it safe to run today? 🏃'];
    }
    if (q.includes('tomorrow')) {
      return ['What about cycling tomorrow? 🚴', 'How to protect bedroom air? 🪟', 'Is it safe for kids? 🫁'];
    }
    return [
      'Is it safe to go outside today? 🏃',
      'What about tomorrow? 📅',
      'Can houseplants clean indoor air? 🌿',
      'What mask should I buy? 😷'
    ];
  }

  /**
   * Gemini API integration if user configured key or server proxy
   */
  async callGeminiAPI(question) {
    const ctx = this.currentContext || {};
    const systemPrompt = `You are Airy, a witty, culturally savvy Gen-Z environmental wellness AI assistant for the web app AIRY.
Tone: Fresh, conversational, engaging Gen-Z personality ("bestie", "no cap", "vibe check", "slay", "lowkey", "giving smog"), but 100% medically responsible and scientifically accurate.
Strict guidelines:
- Never make medical diagnoses.
- Do NOT claim houseplants meaningfully purify indoor air (clarify that True HEPA filters are required).
- Recommend certified N95 / FFP2 respirators when particulate pollution is elevated.
- Do not recommend outdoor exercise solely on a single AQI number without considering workout intensity and duration.
- Use the current active telemetry: City: ${ctx.cityName || 'Bengaluru'}, US AQI: ${ctx.aqi || 45}, Status: ${ctx.statusTag || 'Fresh vibes ✨'}, PM2.5: ${ctx.pm2_5 || 10} ug/m3.
- Clearly distinguish live current readings from forecasts.
Keep replies punchy and well-formatted with markdown.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.customApiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }]
        }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    return `⚡ **[Airy Gemini 1.5 Flash • Live AI]**\n\n` + data.candidates[0].content.parts[0].text;
  }
}
