
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAQIStatus,
  getUnavailableStatus,
  evaluatePollutant
} from '../js/aqi.js';

import {
  AiryAssistant
} from '../js/ai-assistant.js';

import {
  DEFAULT_CITY,
  POPULAR_CITIES
} from '../js/api.js';

// Mock browser localStorage for Node.js tests
const storage = new Map();

globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

// 1. Default city
test('Bengaluru is the default city', () => {
  assert.equal(DEFAULT_CITY.name, 'Bengaluru');
});

// 2. City list contains Bengaluru and Mumbai
test('Popular cities include Bengaluru and Mumbai', () => {
  const names = POPULAR_CITIES.map(city => city.name);

  assert.ok(names.includes('Bengaluru'));
  assert.ok(names.includes('Mumbai'));
});

// 3. AQI boundary testing
const aqiCases = [
  [0, 'good'],
  [50, 'good'],
  [51, 'moderate'],
  [100, 'moderate'],
  [101, 'sensitive'],
  [150, 'sensitive'],
  [151, 'unhealthy'],
  [200, 'unhealthy'],
  [201, 'very-unhealthy'],
  [300, 'very-unhealthy'],
  [301, 'hazardous']
];

for (const [value, expected] of aqiCases) {
  test(`AQI ${value} returns ${expected}`, () => {
    assert.equal(getAQIStatus(value).severity, expected);
  });
}

// 4. Missing AQI data
test('Missing AQI returns offline status', () => {
  assert.equal(getAQIStatus(null).severity, 'unavailable');
  assert.equal(getUnavailableStatus().shortStatus, 'Offline');
});

// 5. Pollutant evaluation
const pollutantCases = [
  [10, 'Good'],
  [20, 'Fair'],
  [40, 'Moderate'],
  [80, 'High'],
  [151, 'Hazardous']
];

for (const [value, expected] of pollutantCases) {
  test(`PM2.5 value ${value} returns ${expected}`, () => {
    assert.equal(
      evaluatePollutant('pm2_5', value).status,
      expected
    );
  });
}

// 6. Missing pollutant data
test('Missing pollutant data returns Offline', () => {
  assert.equal(
    evaluatePollutant('pm2_5', null).status,
    'Offline'
  );
});

// 7. Unknown pollutant
test('Unknown pollutant is handled safely', () => {
  assert.equal(
    evaluatePollutant('unknown', 50).status,
    'Normal'
  );
});

// Create a fresh assistant for each test
function createAssistant() {
  localStorage.clear();
  return new AiryAssistant();
}

// 8. Offline telemetry handling
test('AI assistant handles offline telemetry', () => {
  const assistant = createAssistant();

  assistant.setContext({
    cityName: 'Mumbai',
    aqi: '--',
    isUnavailable: true
  });

  const result = assistant.generateIntelligentResponse(
    'Is it safe to go outside today?'
  );

  assert.match(result.text, /Telemetry Offline/);
  assert.match(result.text, /Mumbai/);
});

// 9. City-specific pollutant response
test('AI assistant uses the selected city context', () => {
  const assistant = createAssistant();

  assistant.setContext({
    cityName: 'Bengaluru',
    aqi: 42,
    pm2_5: 12,
    pm10: 23,
    statusTag: 'Fresh vibes'
  });

  const result = assistant.generateIntelligentResponse(
    'What does PM2.5 mean?'
  );

  assert.match(result.text, /Bengaluru/);
  assert.match(result.text, /PM2.5/);
});

// 10. Outdoor activity guidance
test('AI assistant responds to AQI-based activity questions', () => {
  const assistant = createAssistant();

  assistant.setContext({
    cityName: 'Mumbai',
    aqi: 125,
    pm2_5: 45,
    statusTag: 'Sensitive Alert'
  });

  const result = assistant.generateIntelligentResponse(
    'Is it safe to go outside today?'
  );

  assert.match(result.text, /Caution advised/);
});

// 11. Empty user questions
test('Empty questions are ignored', async () => {
  const assistant = createAssistant();
  const initialLength = assistant.messages.length;

  const result = await assistant.ask('   ');

  assert.equal(result, null);
  assert.equal(assistant.messages.length, initialLength);
});

// 12. Local AI fallback
test('Assistant uses local engine without an API key', async () => {
  const assistant = createAssistant();

  assistant.setContext({
    cityName: 'Mumbai',
    aqi: 45,
    pm2_5: 11,
    pm10: 23,
    statusTag: 'Fresh vibes'
  });

  const result = await assistant.ask('What does PM2.5 mean?');

  assert.equal(result.engine, 'smart_local');
  assert.match(result.text, /Mumbai/);
  assert.equal(assistant.messages.length, 3);
});
