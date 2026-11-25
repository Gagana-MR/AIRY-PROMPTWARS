/**
 * AIRY - AI Air Assistant ("Airy ✨")
 * Gen-Z personality, scientifically accurate health & wellness guidance.
 * Supports context-aware responses based on current city air telemetry.
 * Fallback intelligent reasoning engine + optional Gemini API integration.
 */

export class AiryAssistant {
  constructor() {
    this.messages = [];
    this.currentContext = null;
    this.customApiKey = localStorage.getItem('airy_custom_gemini_key') || '';
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
    this.messages = [
      {
        role: 'assistant',
        text: `Yo bestie! I'm **Airy ✨**, your Gen-Z air quality & respiratory hype assistant. Ask me anything about whether you should run outside, what these microscopic PM2.5 specs actually mean, or how to dodge city smog no cap. What's on your mind?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }

  /**
   * Process a question from the user
   */
  async ask(userQuestion) {
    const q = userQuestion.trim();
    if (!q) return null;

    // Add user message
    const userMsg = {
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(userMsg);

    let answerText = '';

    // If a custom API key is present, attempt live Gemini API call
    if (this.customApiKey) {
      try {
        answerText = await this.callGeminiAPI(q);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local reasoning engine:', err);
        answerText = this.generateLocalResponse(q);
      }
    } else {
      // Use built-in intelligent reasoning engine
      answerText = this.generateLocalResponse(q);
    }

    const aiMsg = {
      role: 'assistant',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(aiMsg);

    return aiMsg;
  }

  /**
   * Smart local context-aware response generator
   */
  generateLocalResponse(question) {
    const qLower = question.toLowerCase();
    const ctx = this.currentContext || {
      cityName: 'Bengaluru',
      aqi: 45,
      statusTag: 'Fresh vibes ✨',
      pm2_5: 10,
      pm10: 20,
      severity: 'good'
    };

    const cityName = ctx.cityName || 'your city';
    const aqi = Math.round(Number(ctx.aqi) || 45);
    const pm25 = ctx.pm2_5 ? Number(ctx.pm2_5).toFixed(1) : '12';

    // 1. Is it safe to go outside?
    if (qLower.includes('safe to go outside') || qLower.includes('can i go out') || qLower.includes('safe outside') || qLower.includes('step outside') || qLower.includes('touch grass')) {
      if (aqi <= 50) {
        return `**100% yes, bestie!** Right now in **${cityName}**, the AQI is sitting pretty at **${aqi}** (*${ctx.statusTag}*). PM2.5 is only **${pm25} µg/m³**, which is immaculate. Your lungs will literally thank you. Go for that run, have a picnic, or just touch some grass without worrying fr.`;
      } else if (aqi <= 100) {
        return `**Pretty safe!** Current AQI in **${cityName}** is **${aqi}** (*${ctx.statusTag}*). The vibe is moderate. If you don't have asthma or acute allergies, you're totally cleared for outdoor adventures. If you do have sensitive lungs, maybe skip sprinting up hill trails during rush hour.`;
      } else if (aqi <= 150) {
        return `**Proceed with caution, king/queen.** Current AQI in **${cityName}** is **${aqi}** (*${ctx.statusTag}*). It's unhealthy for sensitive groups. Casual walking is fine, but intense cardio will have you wheezing. Keep an eye on any scratchy throat feelings!`;
      } else if (aqi <= 200) {
        return `**Honestly, it's not it 🫠.** **${cityName}** AQI is at **${aqi}** with PM2.5 at **${pm25} µg/m³**. Even healthy people will feel irritated eyes and tight chest after 30 mins outside. If you gotta step out, strap on an **N95 mask** and save the workout for the gym.`;
      } else {
        return `**ABSOLUTE RED FLAG 🚩.** AQI in **${cityName}** is **${aqi}** (*${ctx.statusTag}*). Going outside for a jog right now is basically speedrunning lung irritation. Stay indoors, keep the windows tightly sealed, and blast that air purifier on turbo mode. Do not raw-dog this air!`;
      }
    }

    // 2. What does PM2.5 mean?
    if (qLower.includes('pm2.5') || qLower.includes('pm 2.5') || qLower.includes('particulate') || qLower.includes('what is pm')) {
      return `**PM2.5 explained, Gen-Z edition:**\n\nImagine a single strand of your hair. PM2.5 is **30 times smaller** than that width! (≤ 2.5 micrometers).\n\nBecause these dust and soot specks are microscopic ninja particles from exhaust pipes and burning fuel, your nose hairs can't filter them. They go straight into your lung alveoli and can even leak into your bloodstream! 🫀\n\n- **WHO Safe Limit:** Below 15 µg/m³ (24hr avg)\n- **Current in ${cityName}:** **${pm25} µg/m³**\n\nWhen PM2.5 is high, regular cloth masks are basically useless; only an **N95 / FFP2** has the electrostatic fibers to trap them!`;
    }

    // 3. Should I go cycling today?
    if (qLower.includes('cycling') || qLower.includes('cycle') || qLower.includes('bike') || qLower.includes('biking') || qLower.includes('jog') || qLower.includes('run')) {
      if (aqi <= 75) {
        return `**Pedal away bestie! 🚴** With ${cityName}'s AQI at **${aqi}**, cycling is a huge win. You get your cardio in while skipping car emissions. Just stick to greenway trails or quiet residential streets rather than drafting directly behind city buses!`;
      } else if (aqi <= 125) {
        return `**Lowkey borderline.** AQI is **${aqi}**. When cycling, you inhale about **3x to 5x more air volume per minute** than resting. If you cycle today, cruise at an easy pace and avoid peak bumper-to-bumper rush hours (8-10 AM, 6-8 PM).`;
      } else {
        return `**Respectfully, swap for the indoor stationary bike today 🛑.** AQI is **${aqi}** (*${ctx.statusTag}*). Deep cycling respirations in this air means inhaling thousands of micro-soot particles directly into your airways. Hit the gym or do an indoor HIIT session!`;
      }
    }

    // 4. How can I protect myself from pollution?
    if (qLower.includes('protect') || qLower.includes('tips') || qLower.includes('defense') || qLower.includes('mask') || qLower.includes('purifier')) {
      return `**The Ultimate Clean-Air Survival Guide 🛡️:**\n\n1. **Certified N95 / KN95 / FFP2:** Cloth and surgical bandanas have zero PM2.5 seal. Get a snug N95 mask.\n2. **True HEPA Air Purifier:** In your bedroom, run a HEPA (High-Efficiency Particulate Air) filter. It traps 99.97% of PM2.5.\n3. **Window Timing:** Only ventilate when AQI is low (usually mid-afternoon sunny hours). Lock windows shut during morning smog inversions.\n4. **Indoor Greenery:** Spider plants, Snake plants, and Peace lilies help freshen stale indoor rooms.\n5. **Antioxidant Hydration:** Vitamin C, green tea, and lots of water help combat particulate oxidative stress.\n\nCurrently in **${cityName}**, AQI is **${aqi}** (${ctx.statusTag})!`;
    }

    // 5. Why is air quality bad / seasonal / smog questions
    if (qLower.includes('why') && (qLower.includes('bad') || qLower.includes('smog') || qLower.includes('winter') || qLower.includes('pollution'))) {
      return `**Why smog hits so hard:**\n\nDuring colder months or calm mornings, a phenomenon called **Temperature Inversion** happens. Cold, dense air gets trapped close to the ground beneath a layer of warm air, trapping car exhaust, construction dust, and smoke like a giant invisible glass lid over the city 🪟.\n\nCombine that with vehicular traffic, stagnant wind, and festival biomass burning, and you get that gray haze we all hate. Right now in **${cityName}**, AQI is sitting at **${aqi}**.`;
    }

    // 6. Generic friendly contextual response
    return `**Here's the scoop for ${cityName} right now:**\n\n- **US AQI:** ${aqi} (*${ctx.statusTag}*)\n- **PM2.5:** ${pm25} µg/m³\n- **Health Vibe:** ${ctx.healthExplanation || 'Keep an eye on air conditions and hydrate.'}\n\nYou can ask me if it's safe to workout outside, what masks actually work, or how to calculate your commute emissions! What else do you need to know, bestie?`;
  }

  /**
   * Optional Gemini API integration if user configured API key
   */
  async callGeminiAPI(question) {
    const ctx = this.currentContext || {};
    const systemPrompt = `You are Airy, a witty, culturally savvy Gen-Z environmental wellness assistant for the web app AIRY.
Tone: Fresh, conversational, engaging Gen-Z slang ("bestie", "no cap", "vibe check", "slay", "lowkey", "giving smog"), but 100% medically responsible and scientifically accurate. Always prioritize user respiratory health.
Current real-time telemetry:
City: ${ctx.cityName || 'Bengaluru'}
US AQI: ${ctx.aqi || 45}
Status: ${ctx.statusTag || 'Fresh vibes ✨'}
PM2.5: ${ctx.pm2_5 || 10} µg/m³
PM10: ${ctx.pm10 || 20} µg/m³
Keep responses punchy, concise (2-4 paragraphs max), formatting with bolding and bullet points.`;

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
    return data.candidates[0].content.parts[0].text;
  }
}
