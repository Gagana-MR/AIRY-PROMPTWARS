<<<<<<< HEAD
# AIRY-PROMPTWARS
A website created using google's antigravity tool where it works on the air pollution 
=======
# 🍃 AIRY — Gen-Z Environmental Wellness & Real-Time AQI App

[![Google PromptWars Submission](https://img.shields.io/badge/Google%20PromptWars-Submission-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-ccff00?style=for-the-badge&logoColor=black)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Status-Live%20Ready-c084fc?style=for-the-badge)](http://localhost:5173)

> **Submission for the Google PromptWars Challenge.**  
> A modern, aesthetic, streetwear-meets-wellness air quality web application.  
> Real-time atmospheric telemetry, Gen-Z status vibes, AI respiratory coaching, smog footprint calculations, and eco-streak tracking.

![AIRY Banner](https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80)

---

## ⚡ Highlights & Aesthetic

- **Dark Theme Palette:** Deep charcoal & obsidian backgrounds (`#08090d`), glowing neon lime accents (`#ccff00`), and soft lavender (`#c084fc`).
- **Glassmorphism & Aura:** Frosted glass panels (`backdrop-blur-xl`), glowing borders, and an atmospheric background orb that dynamically morphs color based on the city's active air quality.
- **Gen-Z Voice:** High-energy, witty, culturally relevant commentary (*"Fresh vibes ✨"*, *"Pretty okay 😌"*, *"A bit sketchy 🤨"*, *"Not it 🫠"*, *"Major red flag 🚩"*, *"Apocalyptic crisis 💀"*), grounded in rigorous medical and environmental science.
- **100% Real Live Data:** Powered by the open **Open-Meteo Air Quality & Geocoding API** (European Copernicus Atmosphere Monitoring Service / CAMS & NOAA models). Zero fake numbers.
- **Default City:** **Bengaluru, India** (with instant search for any global city and 1-tap quick pills for Delhi, Mumbai, New York, London, Tokyo, Paris, Singapore).

---

## 🌟 Core Features

### 1. Live AQI Dashboard
- **US EPA AQI & European AQI:** Dual standard calculations with a central glowing aura radial gauge.
- **6 Key Pollutants:** Real-time concentrations for **PM2.5, PM10, CO, NO₂, SO₂, and O₃** with safety threshold bars against WHO guidelines.
- **24-Hour Hourly Trend:** Interactive SVG trend graph mapping the past and next 24 hours of particulate trajectory.
- **Actionable Health Protocol:** Instant advisory on:
  - 🏃 **Outdoor Cardio:** Safe or swap for indoor gym?
  - 😷 **Mask Advisory:** When cloth is useless and N95/FFP2 is essential.
  - 🪟 **Window Ventilation:** Timing open drafts vs sealing against smog inversions.
  - 🌪️ **Air Purifier Mode:** Sleep, auto, or turbo HEPA circulation.

### 2. Gen-Z Air Status
- Real-time air status mapping based on live US AQI:
  - `0 - 50`: **Fresh vibes ✨** (*Pure immaculate energy, lungs are thriving, 10/10 no cap*)
  - `51 - 100`: **Pretty okay 😌** (*Air is mid, totally fine for outdoor plans, vibe check passed*)
  - `101 - 150`: **A bit sketchy 🤨** (*Sensitive lungs beware, take it easy on intense outdoor cardio*)
  - `151 - 200`: **Not it 🫠** (*Smog is giving toxic ex, seal windows, strap on an N95 outside*)
  - `201 - 300`: **Major red flag 🚩** (*Certified cooked, health hazard alert, stay inside fr*)
  - `301+`: **Apocalyptic crisis 💀** (*Dystopian particulate soup, emergency HEPA lockdown*)
- Includes an expandable medical breakdown detailing physiological impacts on children, elderly, and asthmatic individuals.

### 3. AI Air Assistant ("Airy ✨")
- Interactive conversational AI persona that knows the **exact city, current AQI, and pollutant readings**.
- Answers questions like:
  - *"Is it safe to go outside today?"*
  - *"What does PM2.5 mean in simple terms?"*
  - *"Should I go cycling today?"*
  - *"How can I protect myself from pollution?"*
- **Privacy & Security:** Zero exposed keys in client code. Uses a built-in context-aware knowledge engine that works 100% offline/out-of-the-box, with optional server-side proxy or user-configured Gemini API key support.

### 4. Smog Impact Calculator
- Interactive commute emissions simulator comparing 5 transport modes:
  - 🚗 **Solo Car (Petrol/Diesel):** 171 g CO₂ / km (DEFRA baseline)
  - 🚌 **City Bus:** 82 g CO₂ / km
  - 🚇 **Electric Metro / Rail:** 35 g CO₂ / km
  - 🚲 **Bicycle / E-Bike:** 0 g direct tailpipe emissions
  - 🚶 **Walking:** 0 g direct emissions
- Commute distance slider (1–80 km) & frequency switcher (One-way, Daily Round Trip, Weekly, Monthly).
- Calculates kilograms of CO₂ saved, percentage reductions, and equivalents (smartphone charges saved 📱, tree-absorption days 🌳, and liters of petrol avoided ⛽).
- Transparent methodology drawer citing **UK DEFRA** and **IPCC** greenhouse gas factors.

### 5. Eco Streak Tracker
- Daily micro-habit checklist stored locally in browser `localStorage`:
  - 🚲 Swapped car for bike / walk (< 5km)
  - 🚇 Took public transit / electric bus
  - 😷 Wore N95 mask during high AQI
  - 🌱 Ran HEPA air purifier or cared for clean-air plants
  - 🪟 Sealed windows during traffic smog peaks
- Fire flame streak counter with celebration mechanics.
- Unlockable badges: *Air Rookie ✨*, *Smog Dodger 🏃‍♂️*, *Carbon Slayer ⚡*, *Atmosphere Royalty 👑*, *Clean Air GOAT 🌍*.

### 6. Global City Search & GPS
- Debounced autocomplete search against the Open-Meteo global geocoding database.
- 1-click GPS button (*"Locate Me"*) with reverse geocoding.
- Curated quick pills for major metropolitan hubs.

---

## 🛠️ Architecture & Tech Stack

```
airy/
├── index.html          # Main application shell with Tailwind CSS & Lucide
├── styles/
│   └── main.css        # Custom glassmorphism, glow orbs, animations & typography
├── js/
│   ├── api.js          # Open-Meteo Air Quality & Geocoding client + caching
│   ├── aqi.js          # AQI standards, Gen-Z status mapping & pollutant thresholds
│   ├── ai-assistant.js # Airy AI assistant engine (smart context + optional Gemini)
│   ├── calculator.js   # Smog Impact Calculator (DEFRA / IPCC transport model)
│   ├── streak.js       # Eco Streak manager with localStorage persistence
│   └── app.js          # Main app coordinator, event listeners & reactive UI
├── server.py           # Zero-dependency Python dev server with CORS & proxy
├── .env.example        # Environment variable template
└── README.md           # Documentation
```

- **Frontend:** Pure Modern ES Modules, HTML5, Tailwind CSS, Google Fonts (*Outfit*, *Space Grotesk*, *Plus Jakarta Sans*), Lucide Icons.
- **Backend / Dev:** Python 3.x `http.server` with custom MIME-type resolution for Windows.
- **No Compilation Overhead:** Zero complex build chains required; instantly editable and previewable.

---

## 🚀 Quick Start (Local Run)

1. **Clone or navigate to the project directory:**
   ```bash
   cd C:\Users\gagan\.gemini\antigravity\scratch\airy
   ```

2. **Start the local server:**
   ```bash
   python server.py
   ```

3. **Open in your browser:**
   ```
   http://localhost:5173
   ```

---

## 🌐 Free 1-Click Deployment

AIRY is designed with standard static web assets and client-side APIs, making it deployable for free on any modern hosting platform in under 60 seconds:

### Option A: Vercel (Recommended)
1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository. Framework preset: **Other / Static**.
4. Click **Deploy**!

### Option B: Netlify
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `airy` folder directly into your browser.
3. Your app is instantly live with a free SSL certificate.

### Option C: GitHub Pages
1. Go to repository **Settings > Pages**.
2. Select `main` branch, `/ (root)` folder, and click **Save**.
3. Live at `https://<your-username>.github.io/<repo-name>/`.

---

## 📜 Citations & Disclaimers

- **Air Quality Telemetry:** European Copernicus Atmosphere Monitoring Service (CAMS) and NOAA models via [Open-Meteo](https://open-meteo.com/).
- **Carbon Conversion Factors:** UK Department for Environment, Food & Rural Affairs (DEFRA 2023) and Intergovernmental Panel on Climate Change (IPCC).
- **Health Guidance:** Based on World Health Organization (WHO) 2021 Global Air Quality Guidelines and US EPA Air Quality Index criteria.
- **Disclaimer:** The Smog Impact Calculator provides modeled statistical estimates for educational and awareness purposes, not measured tailpipe emissions. Always seek professional medical advice for respiratory symptoms.

---

*Crafted with ❤️ for clean lungs, green cities, and Gen-Z planetary wellness.*
>>>>>>> acc929b (feat: complete AIRY air quality web app for Google PromptWars)
