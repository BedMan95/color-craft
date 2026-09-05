// Preset definitions and persistence

export const DEFAULT_PARAMS = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  vignette: 0,
  grain: 0,
  // Relight & Lighting
  lightX: 0.5,
  lightY: 0.5,
  lightRadius: 0.6,
  lightIntensity: 0,
  lightWarmth: 0,
  // Linear Masking
  maskAngle: 0,
  maskPosition: 0.5,
  maskFeather: 0.4,
  maskExposure: 0,
  maskWarmth: 0,
  maskInvert: 0,
  hsl: {
    red: { hue: 0, sat: 0, lum: 0 },
    orange: { hue: 0, sat: 0, lum: 0 },
    yellow: { hue: 0, sat: 0, lum: 0 },
    green: { hue: 0, sat: 0, lum: 0 },
    cyan: { hue: 0, sat: 0, lum: 0 },
    blue: { hue: 0, sat: 0, lum: 0 },
    magenta: { hue: 0, sat: 0, lum: 0 },
  }
};

// Curated industry-standard color grading formulas
// (Kodak Portra, Fuji Superia, Cine Teal & Orange, Dark Forest, Golden Hour, B&W Noir)
export const BUILTIN_PRESETS = [
  {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 8,
      contrast: -8,
      highlights: -24,
      shadows: 28,
      whites: 12,
      blacks: 18,
      temp: 14,
      tint: -4,
      vibrance: 16,
      saturation: -8,
      vignette: 14,
      grain: 20,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        red: { hue: 4, sat: 10, lum: 6 },
        orange: { hue: 2, sat: 14, lum: 16 }, // warm creamy skin tones
        yellow: { hue: -8, sat: 12, lum: 4 },
        green: { hue: 10, sat: -18, lum: -5 },
        cyan: { hue: 8, sat: -10, lum: 4 },
        blue: { hue: -6, sat: -14, lum: 2 },
      }
    }
  },
  {
    id: 'fuji-superia-400',
    name: 'Fuji Superia 400',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 4,
      contrast: 14,
      highlights: -18,
      shadows: 16,
      whites: 8,
      blacks: 14,
      temp: -8,
      tint: 12, // characteristic Fuji magenta/emerald shift
      vibrance: 22,
      saturation: -5,
      vignette: 18,
      grain: 24,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        red: { hue: 6, sat: 16, lum: 2 },
        green: { hue: -14, sat: 20, lum: -8 }, // rich emerald greens
        cyan: { hue: 12, sat: 15, lum: 5 },
        blue: { hue: 8, sat: -12, lum: -4 },
        magenta: { hue: 10, sat: 18, lum: 6 },
      }
    }
  },
  {
    id: 'cinematic-teal-orange',
    name: 'Cinematic Teal & Orange',
    params: {
      ...DEFAULT_PARAMS,
      exposure: -4,
      contrast: 26,
      highlights: -38,
      shadows: 20,
      whites: 16,
      blacks: -22,
      temp: -10,
      tint: 6,
      vibrance: 25,
      saturation: -12,
      vignette: 32,
      grain: 12,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        red: { hue: 8, sat: 22, lum: 4 },
        orange: { hue: 12, sat: 35, lum: 14 },  // vibrant copper / gold skin
        yellow: { hue: 5, sat: -20, lum: -6 },
        green: { hue: 0, sat: -65, lum: -25 },
        cyan: { hue: -20, sat: 38, lum: -12 },  // deep teal shadows
        blue: { hue: -28, sat: 44, lum: -18 },
      }
    }
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour Sunset',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 6,
      contrast: 8,
      highlights: -32,
      shadows: 22,
      whites: 18,
      blacks: -10,
      temp: 36,
      tint: 10,
      vibrance: 28,
      saturation: 4,
      vignette: 22,
      grain: 8,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        red: { hue: -4, sat: 24, lum: 8 },
        orange: { hue: 6, sat: 32, lum: 16 },
        yellow: { hue: 12, sat: 28, lum: 10 },
        green: { hue: -8, sat: -15, lum: 0 },
        blue: { hue: 10, sat: -30, lum: -12 },
      }
    }
  },
  {
    id: 'moody-forest',
    name: 'Moody Forest',
    params: {
      ...DEFAULT_PARAMS,
      exposure: -12,
      contrast: 28,
      highlights: -45,
      shadows: 18,
      whites: -15,
      blacks: -10,
      temp: -14,
      tint: -8,
      vibrance: -10,
      saturation: -25,
      vignette: 42,
      grain: 16,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        yellow: { hue: 25, sat: -40, lum: -15 },
        green: { hue: -18, sat: -10, lum: -18 }, // dark desaturated pine green
        cyan: { hue: -5, sat: 15, lum: -8 },
        orange: { hue: 4, sat: 12, lum: 6 },
        blue: { hue: -15, sat: -35, lum: -20 },
      }
    }
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 8,
      contrast: 38,
      highlights: 30,
      shadows: -18,
      whites: 24,
      blacks: -32,
      temp: -28,
      tint: 32,
      vibrance: 48,
      saturation: 20,
      vignette: 45,
      grain: 18,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        magenta: { hue: 12, sat: 65, lum: 22 },
        cyan: { hue: 14, sat: 60, lum: 18 },
        blue: { hue: -8, sat: 45, lum: 12 },
        yellow: { hue: 0, sat: -85, lum: 0 },
        green: { hue: 0, sat: -85, lum: 0 },
      }
    }
  },
  {
    id: 'film-noir-bw',
    name: 'Film Noir B&W',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 2,
      contrast: 52,
      highlights: 22,
      shadows: -28,
      whites: 32,
      blacks: -40,
      vibrance: -100,
      saturation: -100,
      vignette: 35,
      grain: 34,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        orange: { hue: 0, sat: 0, lum: 18 }, // skin luminance boost in B&W
        red: { hue: 0, sat: 0, lum: 10 },
        blue: { hue: 0, sat: 0, lum: -20 },   // dramatic dark skies
      }
    }
  },
  {
    id: 'clean-matte',
    name: 'Minimal Clean Matte',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 10,
      contrast: -15,
      highlights: -20,
      shadows: 24,
      whites: -8,
      blacks: 30, // faded matte black curve
      temp: 2,
      tint: 0,
      vibrance: 6,
      saturation: -12,
      vignette: 6,
      grain: 10,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        orange: { hue: 0, sat: 6, lum: 12 },
        yellow: { hue: 0, sat: -15, lum: 4 },
        blue: { hue: 0, sat: -25, lum: -5 },
      }
    }
  }
];

const STORAGE_KEY = 'photo_color_schema_user_presets';

export function loadUserPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load user presets from localStorage', e);
    return [];
  }
}

export function saveUserPreset(preset) {
  const list = loadUserPresets();
  const existingIdx = list.findIndex(p => p.id === preset.id);
  if (existingIdx >= 0) {
    list[existingIdx] = preset;
  } else {
    list.push(preset);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteUserPreset(presetId) {
  const list = loadUserPresets().filter(p => p.id !== presetId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function renameUserPreset(presetId, newName) {
  const list = loadUserPresets();
  const item = list.find(p => p.id === presetId);
  if (item) {
    item.name = newName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

export function getAllPresetsCombined() {
  const userPresets = loadUserPresets();
  return [...BUILTIN_PRESETS, ...userPresets];
}

