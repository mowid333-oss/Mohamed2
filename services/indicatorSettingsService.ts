export interface SuperTrendSettings {
  length: number;      // Period (e.g. 10, range: 5 to 50)
  multiplier: number;  // Multiplier (e.g. 3.0, range: 1.0 to 8.0)
}

export interface MacdSettings {
  fastLength: number;   // Fast EMA period (e.g. 12, range: 3 to 30)
  slowLength: number;   // Slow EMA period (e.g. 26, range: 10 to 60)
  signalLength: number; // Signal smoothing period (e.g. 9, range: 2 to 20)
}

export interface IndicatorSettings {
  superTrend: SuperTrendSettings;
  macd: MacdSettings;
  sensitivityPreset: 'FAST' | 'STANDARD' | 'CONSERVATIVE' | 'CUSTOM';
  soundAlertsEnabled: boolean; // Mute / Unmute buy & sell chart chimes
}

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  superTrend: {
    length: 10,
    multiplier: 3.0,
  },
  macd: {
    fastLength: 12,
    slowLength: 26,
    signalLength: 9,
  },
  sensitivityPreset: 'STANDARD',
  soundAlertsEnabled: true,
};

export const PRESET_FAST_SCALPING: IndicatorSettings = {
  superTrend: {
    length: 7,
    multiplier: 2.0,
  },
  macd: {
    fastLength: 6,
    slowLength: 13,
    signalLength: 5,
  },
  sensitivityPreset: 'FAST',
  soundAlertsEnabled: true,
};

export const PRESET_CONSERVATIVE_SWING: IndicatorSettings = {
  superTrend: {
    length: 14,
    multiplier: 4.0,
  },
  macd: {
    fastLength: 19,
    slowLength: 39,
    signalLength: 9,
  },
  sensitivityPreset: 'CONSERVATIVE',
  soundAlertsEnabled: true,
};

const STORAGE_KEY = 'egx_indicator_settings_v1';
export const INDICATOR_SETTINGS_EVENT = 'egx_indicator_settings_updated';

/**
 * Loads current indicator settings from localStorage or defaults
 */
export function getStoredIndicatorSettings(): IndicatorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INDICATOR_SETTINGS;
    const parsed = JSON.parse(raw);

    const length = Math.max(3, Math.min(50, Number(parsed.superTrend?.length) || DEFAULT_INDICATOR_SETTINGS.superTrend.length));
    const multiplier = Math.max(1.0, Math.min(8.0, Number(parsed.superTrend?.multiplier) || DEFAULT_INDICATOR_SETTINGS.superTrend.multiplier));

    let slowLength = Math.max(10, Math.min(60, Number(parsed.macd?.slowLength) || DEFAULT_INDICATOR_SETTINGS.macd.slowLength));
    let fastLength = Math.max(3, Math.min(30, Number(parsed.macd?.fastLength) || DEFAULT_INDICATOR_SETTINGS.macd.fastLength));
    // Guard against equal or inverted lengths
    if (fastLength >= slowLength) {
      fastLength = Math.max(3, Math.min(12, Math.floor(slowLength / 2)));
    }
    const signalLength = Math.max(2, Math.min(20, Number(parsed.macd?.signalLength) || DEFAULT_INDICATOR_SETTINGS.macd.signalLength));
    const soundAlertsEnabled = parsed.soundAlertsEnabled !== false;

    return {
      superTrend: { length, multiplier },
      macd: { fastLength, slowLength, signalLength },
      sensitivityPreset: parsed.sensitivityPreset || 'CUSTOM',
      soundAlertsEnabled,
    };
  } catch {
    return DEFAULT_INDICATOR_SETTINGS;
  }
}

/**
 * Saves settings to localStorage and dispatches a live sync event
 */
export function saveIndicatorSettings(settings: IndicatorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Dispatch custom event for real-time live synchronization across all components & chart
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(INDICATOR_SETTINGS_EVENT, { detail: settings })
      );
    }
  } catch (err) {
    console.error('Failed to save indicator settings:', err);
  }
}

/**
 * Resets settings to default standard values
 */
export function resetIndicatorSettings(): IndicatorSettings {
  saveIndicatorSettings(DEFAULT_INDICATOR_SETTINGS);
  return DEFAULT_INDICATOR_SETTINGS;
}
