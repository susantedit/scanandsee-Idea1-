import { AI_PERSONAS } from '../config/constants.js';
import logger from '../utils/logger.js';

const MURF_API_URL = 'https://api.murf.ai/v1/speech/generate';

/**
 * Murf AI voice ID mapping per persona.
 * Full list: GET https://api.murf.ai/v1/speech/voices
 */
const MURF_VOICE_MAP = {
  doctor:       'en-US-marcus',    // calm, professional male
  gym_bro:      'en-US-terrell',   // energetic male
  coach:        'en-US-natalie',   // warm, motivational female
  savage_roast: 'en-US-wayne',     // edgy, direct male
};

/**
 * Generate voice audio for a text string.
 *
 * Free tier  → Web Speech API params returned (client handles TTS, zero cost)
 * Premium    → Murf AI called, returns base64 audio (no storage needed)
 *
 * @param {string}  text        - text to speak
 * @param {string}  personality - AI persona key
 * @param {boolean} isPremium   - whether user is on premium tier
 * @returns {Promise<{ type: 'text'|'audio', data?: string, url?: string, speechParams?: object }>}
 */
export async function generateVoice(text, personality = 'coach', isPremium = false) {
  // Free tier — return text + Web Speech API params for client-side TTS
  if (!isPremium) {
    return {
      type: 'text',
      data: text,
      speechParams: getSpeechParams(personality),
    };
  }

  const apiKey = process.env.MURF_API_KEY;
  if (!apiKey || apiKey === 'your_murf_api_key_here') {
    logger.warn('MURF_API_KEY not set — falling back to text TTS');
    return {
      type: 'text',
      data: text,
      speechParams: getSpeechParams(personality),
    };
  }

  try {
    const voiceId = MURF_VOICE_MAP[personality] || MURF_VOICE_MAP.coach;
    const { pitch, rate } = getMurfParams(personality);

    const res = await fetch(MURF_API_URL, {
      method: 'POST',
      headers: {
        'api-key':     apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        format:          'MP3',
        modelVersion:    'GEN2',
        encodeAsBase64:  true,   // get audio back directly — no storage URL needed
        channelType:     'MONO',
        sampleRate:      44100,
        pitch,
        rate,
        variation:       1,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Murf API error ${res.status}: ${err.message || res.statusText}`);
    }

    const data = await res.json();

    // Murf returns audioFile as a URL normally, but with encodeAsBase64=true
    // it returns the base64 string in the audioFile field
    const audioBase64 = data.audioFile;
    if (!audioBase64) throw new Error('Murf returned no audio data');

    logger.debug(`Murf TTS generated for persona: ${personality}, chars: ${text.length}`);

    return {
      type: 'audio',
      // Return as data URL so frontend can play directly — no storage needed
      url: `data:audio/mp3;base64,${audioBase64}`,
      remainingChars: data.remainingCharacterCount,
    };
  } catch (err) {
    logger.error('Murf TTS failed — falling back to text', { error: err.message });
    return {
      type: 'text',
      data: text,
      speechParams: getSpeechParams(personality),
    };
  }
}

/**
 * Get list of available voice personalities.
 */
export function getPersonalities() {
  return Object.values(AI_PERSONAS).map(p => ({
    id:          p.id,
    label:       p.label,
    description: p.description,
    voiceStyle:  p.voiceStyle,
    murfVoiceId: MURF_VOICE_MAP[p.id] || null,
  }));
}

// ── Murf pitch/rate params per persona ───────────────────────────────────────
// pitch: -50 to +50 (0 = default)
// rate:  -50 to +50 (0 = default)
function getMurfParams(personality) {
  const params = {
    doctor:       { pitch:  -5, rate: -10 },  // slightly lower, slower = authoritative
    gym_bro:      { pitch:   5, rate:  15 },  // higher energy, faster
    coach:        { pitch:   0, rate:   0 },  // natural default
    savage_roast: { pitch:  -8, rate:   5 },  // lower pitch, slightly faster = edgy
  };
  return params[personality] || params.coach;
}

// ── Web Speech API params (free tier fallback) ────────────────────────────────
function getSpeechParams(personality) {
  const params = {
    doctor:       { rate: 0.88, pitch: 0.9,  volume: 1.0 },
    gym_bro:      { rate: 1.15, pitch: 1.1,  volume: 1.0 },
    coach:        { rate: 1.0,  pitch: 1.0,  volume: 1.0 },
    savage_roast: { rate: 1.05, pitch: 0.85, volume: 1.0 },
  };
  return params[personality] || params.coach;
}
