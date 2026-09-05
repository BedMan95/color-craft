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
  maskFeather: 40,
  maskExposure: 0,
  maskWarmth: 0,
  maskInvert: 0,
  // Radial Elliptical Mask
  radialMaskX: 50,
  radialMaskY: 50,
  radialMaskRx: 35,
  radialMaskRy: 35,
  radialMaskFeather: 50,
  radialMaskExposure: 0,
  radialMaskWarmth: 0,
  radialMaskInvert: 0,
  // Detail, Clarity & Sharpening
  texture: 0,
  clarity: 0,
  dehaze: 0,
  sharpen: 0,
  noiseReduction: 0,
  // Color Grading / Split Toning (3-Way Wheels: Shadows, Midtones, Highlights)
  splitShadowHue: 210,      // Default cool shadows (Teal/Blue)
  splitShadowSat: 0,
  splitMidtoneHue: 30,      // Natural skin/warm midtones
  splitMidtoneSat: 0,
  splitHighlightHue: 40,    // Default warm highlights (Gold/Orange)
  splitHighlightSat: 0,
  splitBalance: 0,
  // Meitu Beauty & Glow
  skinSmooth: 0,
  glow: 0,
  skinTone: 0,
  // Face Slimming & Reshape
  faceSlim: 0,
  faceRadius: 30,
  faceX: 50,
  faceY: 65,
  // Portrait Bokeh Depth Blur
  bokehBlur: 0,
  bokehRadius: 45,
  bokehX: 50,
  bokehY: 50,
  // Parametric Tone Curve
  curveBlacks: 0,
  curveShadows: 0,
  curveHighlights: 0,
  curveWhites: 0,
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
  },
  {
    id: 'fuji-classic-chrome',
    name: 'Fuji Classic Chrome',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 2,
      contrast: 18,
      highlights: -15,
      shadows: -10,
      whites: 10,
      blacks: 12,
      temp: -4,
      tint: 6,
      vibrance: -8,
      saturation: -20,
      clarity: 15,
      texture: 10,
      grain: 18,
      splitShadowHue: 200,
      splitShadowSat: 12,
      splitHighlightHue: 45,
      splitHighlightSat: 8,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        red: { hue: -5, sat: -10, lum: 0 },
        blue: { hue: -10, sat: -30, lum: -10 },
        green: { hue: -12, sat: -40, lum: -15 },
        cyan: { hue: 5, sat: -20, lum: 5 },
      }
    }
  },
  {
    id: 'meitu-korean-glow',
    name: 'Meitu Korean Glow',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 14,
      contrast: -12,
      highlights: -25,
      shadows: 30,
      whites: 16,
      blacks: 15,
      temp: 6,
      tint: 10, // pastel rosy tone
      vibrance: 12,
      saturation: -6,
      skinSmooth: 65,
      glow: 45,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        red: { hue: 2, sat: 15, lum: 12 },
        orange: { hue: 0, sat: 18, lum: 24 }, // fair illuminated skin
        magenta: { hue: 5, sat: 20, lum: 10 },
      }
    }
  },
  {
    id: 'kodak-tri-x-400',
    name: 'Kodak Tri-X 400',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 4,
      contrast: 42,
      highlights: 15,
      shadows: -20,
      whites: 26,
      blacks: -35,
      vibrance: -100,
      saturation: -100,
      clarity: 25,
      texture: 20,
      grain: 45,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        orange: { hue: 0, sat: 0, lum: 12 },
        blue: { hue: 0, sat: 0, lum: -25 },
      }
    }
  },
  {
    id: 'nordic-cold-moody',
    name: 'Nordic Cold Moody',
    params: {
      ...DEFAULT_PARAMS,
      exposure: -6,
      contrast: 20,
      highlights: -40,
      shadows: 14,
      whites: -10,
      blacks: 10,
      temp: -24,
      tint: -6,
      vibrance: 8,
      saturation: -30,
      dehaze: 15,
      splitShadowHue: 215,
      splitShadowSat: 25,
      splitHighlightHue: 50,
      splitHighlightSat: 10,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        green: { hue: 15, sat: -45, lum: -20 },
        cyan: { hue: -10, sat: 20, lum: 5 },
        blue: { hue: -5, sat: 15, lum: -10 },
      }
    }
  },
  {
    id: 'tokyo-night-cyber',
    name: 'Tokyo Night Street',
    params: {
      ...DEFAULT_PARAMS,
      exposure: -2,
      contrast: 32,
      highlights: 25,
      shadows: -15,
      whites: 20,
      blacks: -25,
      temp: -18,
      tint: 20,
      vibrance: 35,
      saturation: 10,
      clarity: 22,
      texture: 18,
      splitShadowHue: 230,
      splitShadowSat: 30,
      splitHighlightHue: 330, // neon pink highlight
      splitHighlightSat: 22,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        cyan: { hue: 10, sat: 50, lum: 15 },
        magenta: { hue: 8, sat: 55, lum: 20 },
        yellow: { hue: -10, sat: 40, lum: 10 },
        blue: { hue: -12, sat: 35, lum: 8 },
      }
    }
  },
  {
    id: 'vintage-polaroid-600',
    name: 'Vintage Polaroid 600',
    params: {
      ...DEFAULT_PARAMS,
      exposure: 8,
      contrast: -18,
      highlights: -22,
      shadows: 26,
      whites: -14,
      blacks: 36, // lifted milky shadows
      temp: 16,
      tint: -12, // pale retro greenish-yellow cast
      vibrance: -10,
      saturation: -15,
      vignette: 28,
      grain: 32,
      glow: 30,
      splitShadowHue: 90,
      splitShadowSat: 16,
      splitHighlightHue: 40,
      splitHighlightSat: 18,
      hsl: {
        ...DEFAULT_PARAMS.hsl,
        orange: { hue: 5, sat: 12, lum: 8 },
        yellow: { hue: 10, sat: -20, lum: 5 },
        blue: { hue: 12, sat: -35, lum: 4 },
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

