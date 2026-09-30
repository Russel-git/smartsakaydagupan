const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const nodemailer = require('nodemailer');

async function runDiagnostics() {
  console.log('====================================================');
  console.log('🚀 SmartSakay Dagupan - Services Diagnostic Suite');
  console.log('====================================================\n');

  // 1. JWT Diagnostic
  console.log('🔐 [1/4] JWT Security:');
  const jwtPlaceholder = config.jwtSecret === 'your-jwt-secret-min-256-bits' || config.jwtSecret.includes('dev-secret');
  if (jwtPlaceholder) {
    console.log('   ⚠️ WARNING: Using default/placeholder JWT_SECRET.');
    console.log('   👉 Recommendation: Replace with a random 256-bit hex string before public deployment.');
  } else {
    try {
      const token = jwt.sign({ test: true }, config.jwtSecret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, config.jwtSecret);
      if (decoded.test) {
        console.log('   ✅ JWT Secret is cryptographically active and signing correctly.');
      }
    } catch (e) {
      console.log('   ❌ JWT validation error:', e.message);
    }
  }

  // 2. Email Service Diagnostic
  console.log('\n📧 [2/4] Email Service (Nodemailer):');
  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const hasGmail = Boolean(cleanPass && cleanPass !== 'your-gmail-app-password');
  if (hasGmail) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.gmail.user, pass: cleanPass },
      });
      await transporter.verify();
      console.log(`   ✅ Connected to Google SMTP as ${config.gmail.user}`);
    } catch (e) {
      console.log('   ❌ Google SMTP connection failed:', e.message);
    }
  } else {
    console.log('   ⚠️ Email credentials not fully configured in .env');
  }

  // 3. AI Services (Gemini / Groq)
  console.log('\n🤖 [3/4] AI Commuter Assistant Services:');
  const hasGemini = Boolean(config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key');
  const hasGroq = Boolean(config.groq.apiKey && config.groq.apiKey !== 'your-groq-api-key');

  if (hasGemini) {
    try {
      process.stdout.write('   ⏳ Testing Gemini 2.0 Flash API key... ');
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.gemini.apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: 'Reply with the word "CONNECTED"' }] }],
        },
        { timeout: 10000 }
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`✅ Success! Response: "${text}"`);
    } catch (e) {
      console.log(`❌ Failed: ${e.response?.data?.error?.message || e.message}`);
    }
  } else {
    console.log('   ℹ️ Gemini: Placeholder key. (Get a free key at https://aistudio.google.com/app/apikey)');
  }

  if (hasGroq) {
    try {
      process.stdout.write('   ⏳ Testing Groq API key... ');
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: 'Say "CONNECTED"' }],
          max_tokens: 10,
        },
        {
          headers: { Authorization: `Bearer ${config.groq.apiKey}` },
          timeout: 10000,
        }
      );
      const text = res.data?.choices?.[0]?.message?.content?.trim();
      console.log(`✅ Success! Response: "${text}"`);
    } catch (e) {
      console.log(`❌ Failed: ${e.response?.data?.error?.message || e.message}`);
    }
  } else {
    console.log('   ℹ️ Groq: Placeholder key. (Optional fallback, get at https://console.groq.com/keys)');
  }

  // 4. Weather API
  console.log('\n⛅ [4/4] Dagupan City Weather Service:');
  const hasWeatherKey = Boolean(config.weather.apiKey && config.weather.apiKey !== 'your-weatherapi-key');
  if (hasWeatherKey) {
    try {
      process.stdout.write('   ⏳ Testing WeatherAPI key... ');
      const res = await axios.get('http://api.weatherapi.com/v1/current.json', {
        params: { key: config.weather.apiKey, q: 'Dagupan,Philippines' },
        timeout: 5000,
      });
      console.log(`✅ Success! Dagupan: ${res.data.current.temp_c}°C, ${res.data.current.condition.text}`);
    } catch (e) {
      console.log(`❌ WeatherAPI failed: ${e.response?.data?.error?.message || e.message}`);
    }
  } else {
    console.log('   ℹ️ WeatherAPI: Using built-in Open-Meteo live Dagupan weather feed.');
    try {
      const res = await axios.get(
        'https://api.open-meteo.com/v1/forecast?latitude=16.0433&longitude=120.3333&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FManila',
        { timeout: 5000 }
      );
      console.log(`   ✅ Open-Meteo Live Data: ${res.data.current.temperature_2m}°C, Humidity: ${res.data.current.relative_humidity_2m}%`);
    } catch (e) {
      console.log('   ❌ Open-Meteo fallback error:', e.message);
    }
  }

  console.log('\n====================================================');
  console.log('✨ Diagnostic check complete!');
  console.log('====================================================');
}

runDiagnostics();
