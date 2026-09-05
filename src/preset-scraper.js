// Parser / Scraper for Lightroom presets, XMP text, Adobe Camera Raw settings, and raw paste recipes
import { DEFAULT_PARAMS } from './presets.js';

// Parses Lightroom .xmp / XML content into ColorSchema parameters
export function parseXmpPreset(xmlText, name = 'Imported XMP') {
  const p = JSON.parse(JSON.stringify(DEFAULT_PARAMS));

  function getAttr(attrName) {
    const reg = new RegExp(`crs:${attrName}="([^"]+)"`, 'i');
    const m = xmlText.match(reg);
    if (m) return parseFloat(m[1]);

    const tagReg = new RegExp(`<crs:${attrName}>([^<]+)<\\/crs:${attrName}>`, 'i');
    const tm = xmlText.match(tagReg);
    return tm ? parseFloat(tm[1]) : null;
  }

  // 1. Basic & Tone
  const exp = getAttr('Exposure2012');
  if (exp !== null) p.exposure = Math.round(exp * 30); // ~ -2.0 to +2.0 EV

  const cont = getAttr('Contrast2012');
  if (cont !== null) p.contrast = Math.round(cont);

  const high = getAttr('Highlights2012');
  if (high !== null) p.highlights = Math.round(high);

  const shad = getAttr('Shadows2012');
  if (shad !== null) p.shadows = Math.round(shad);

  const whites = getAttr('Whites2012');
  if (whites !== null) p.whites = Math.round(whites);

  const blacks = getAttr('Blacks2012');
  if (blacks !== null) p.blacks = Math.round(blacks);

  // 2. White Balance
  const temp = getAttr('Temperature');
  if (temp !== null) {
    // 5000K is neutral base
    p.temp = Math.round(Math.max(-100, Math.min(100, (temp - 5000) / 40)));
  }

  const tint = getAttr('Tint');
  if (tint !== null) p.tint = Math.round(Math.max(-100, Math.min(100, tint)));

  // 3. Presence
  const vib = getAttr('Vibrance');
  if (vib !== null) p.vibrance = Math.round(vib);

  const sat = getAttr('Saturation');
  if (sat !== null) p.saturation = Math.round(sat);

  // 4. Effects
  const vig = getAttr('PostCropVignetteAmount');
  if (vig !== null) p.vignette = Math.round(Math.abs(vig));

  const grain = getAttr('GrainAmount');
  if (grain !== null) p.grain = Math.round(grain);

  // 5. HSL adjustments
  const bands = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'];
  const mapBand = {
    'Red': 'red', 'Orange': 'orange', 'Yellow': 'yellow', 'Green': 'green',
    'Aqua': 'cyan', 'Blue': 'blue', 'Purple': 'magenta', 'Magenta': 'magenta'
  };

  bands.forEach(b => {
    const key = mapBand[b];
    const h = getAttr(`HueAdjustment${b}`);
    const s = getAttr(`SaturationAdjustment${b}`);
    const l = getAttr(`LuminanceAdjustment${b}`);
    if (h !== null) p.hsl[key].hue = Math.round(h);
    if (s !== null) p.hsl[key].sat = Math.round(s);
    if (l !== null) p.hsl[key].lum = Math.round(l);
  });

  return {
    id: `xmp-${Date.now()}`,
    name,
    params: p
  };
}

// Scrapes / extracts parameters from raw social/web text (e.g. "Exposure +15, Contrast -10, Highlights -30, Shadows +40...")
export function parseRecipeText(rawText, name = 'Web Recipe') {
  const p = JSON.parse(JSON.stringify(DEFAULT_PARAMS));
  const lines = rawText.split(/[\n,;]/);

  const keywords = [
    { key: 'exposure', terms: ['exposure', 'exp'] },
    { key: 'contrast', terms: ['contrast', 'cont'] },
    { key: 'highlights', terms: ['highlights', 'highlight', 'hl'] },
    { key: 'shadows', terms: ['shadows', 'shadow', 'sh'] },
    { key: 'whites', terms: ['whites', 'white'] },
    { key: 'blacks', terms: ['blacks', 'black'] },
    { key: 'temp', terms: ['temperature', 'temp', 'warmth'] },
    { key: 'tint', terms: ['tint'] },
    { key: 'vibrance', terms: ['vibrance', 'vib'] },
    { key: 'saturation', terms: ['saturation', 'sat'] },
    { key: 'vignette', terms: ['vignette', 'vig'] },
    { key: 'grain', terms: ['grain'] },
  ];

  lines.forEach(line => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return;

    for (const item of keywords) {
      for (const term of item.terms) {
        // Match term followed by optional colon/space then sign and numbers
        const regex = new RegExp(`\\b${term}\\b[^\\d+-]*([+-]?\\d+(?:\\.\\d+)?)`, 'i');
        const match = trimmed.match(regex);
        if (match) {
          let val = parseFloat(match[1]);
          if (item.key === 'exposure' && Math.abs(val) <= 5.0 && val !== 0 && match[1].includes('.')) {
            val = val * 30; // convert fractional stops e.g. +0.5 EV to slider scale
          }
          p[item.key] = Math.max(-100, Math.min(100, Math.round(val)));
          break;
        }
      }
    }
  });

  return {
    id: `recipe-${Date.now()}`,
    name,
    params: p
  };
}

// Scrapes online community presets directly from remote URL or CORS proxy
export async function scrapePresetFromUrl(url) {
  let targetUrl = url.trim();
  // Use public CORS worker proxy for external sites
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch preset: HTTP ${res.status}`);
  }
  const text = await res.text();

  // 1. Try parsing as JSON ColorSchema preset
  try {
    const json = JSON.parse(text);
    if (json.exposure !== undefined || (json.params && json.params.exposure !== undefined)) {
      return {
        id: `scraped-${Date.now()}`,
        name: json.name || 'Web Preset',
        params: json.params || json
      };
    }
  } catch {}

  // 2. Try parsing as Adobe XMP / XML
  if (text.includes('crs:Exposure2012') || text.includes('<x:xmpmeta') || text.includes('crs:Temperature')) {
    const nameMatch = text.match(/<crs:Name>([^<]+)<\/crs:Name>/i) || targetUrl.split('/').pop();
    const presetName = typeof nameMatch === 'string' ? nameMatch : (nameMatch[1] || 'Web XMP Preset');
    return parseXmpPreset(text, presetName.replace(/\.[^/.]+$/, ''));
  }

  // 3. Fallback: Parse as text recipe
  const urlName = targetUrl.split('/').pop().replace(/\.[^/.]+$/, '') || 'Web Recipe';
  return parseRecipeText(text, urlName);
}
