import { WebGLRenderer } from './webgl-renderer.js';
import {
  DEFAULT_PARAMS,
  BUILTIN_PRESETS,
  loadUserPresets,
  saveUserPreset,
  deleteUserPreset,
  renameUserPreset,
  getAllPresetsCombined,
} from './presets.js';
import { generateSampleImage } from './sample-image.js';
import {
  scrapePresetFromUrl,
  parseRecipeText,
  parseXmpPreset,
} from './preset-scraper.js';

// App State
const state = {
  params: JSON.parse(JSON.stringify(DEFAULT_PARAMS)),
  activeHslBand: 'red',
  splitActive: false,
  splitRatio: 0.5,
  isDraggingSplit: false,
  renderer: null,
  activePresetId: null,
  currentFileName: 'sample-photo.jpg',
  isSheetOpen: false,
};

// DOM Elements
const canvas = document.getElementById('gl-canvas');
const viewportContainer = document.getElementById('viewport-container');
const splitHandle = document.getElementById('split-handle');
const btnSplit = document.getElementById('btn-split');
const btnReset = document.getElementById('btn-reset');
const btnExportImg = document.getElementById('btn-export-img');
const fileInput = document.getElementById('file-input');
const btnSample = document.getElementById('btn-sample');
const presetListEl = document.getElementById('preset-list');
const btnSavePreset = document.getElementById('btn-save-preset');
const btnExportPreset = document.getElementById('btn-export-preset');
const presetFileInput = document.getElementById('preset-file-input');
const metaRes = document.getElementById('meta-res');
const metaFps = document.getElementById('meta-fps');
const currentFilenameEl = document.getElementById('current-filename');
const toastEl = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Mobile Bottom Sheet Elements
const sidebar = document.getElementById('sidebar');
const sheetBackdrop = document.getElementById('sheet-backdrop');
const btnCloseSheet = document.getElementById('btn-close-sheet');
const btnBottomPresets = document.getElementById('btn-bottom-presets');
const btnBottomAdjust = document.getElementById('btn-bottom-adjust');
const btnBottomSplit = document.getElementById('btn-bottom-split');
const btnBottomExport = document.getElementById('btn-bottom-export');

// Initialize WebGL
state.renderer = new WebGLRenderer(canvas);

// Toast Notification
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toastEl.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 2200);
}

// ==========================================
// Custom UI Dialogs (Replacing Native Alert / Prompt / Confirm)
// ==========================================
const alertDialog = document.getElementById('alert-dialog');
const alertBackdrop = document.getElementById('alert-backdrop');
const alertTitle = document.getElementById('alert-dialog-title');
const alertDesc = document.getElementById('alert-dialog-desc');
const alertInput = document.getElementById('alert-dialog-input');
const btnAlertCancel = document.getElementById('btn-alert-cancel');
const btnAlertConfirm = document.getElementById('btn-alert-confirm');

let activeDialogResolve = null;

function customAlert(message, title = 'Notice') {
  return new Promise((resolve) => {
    activeDialogResolve = resolve;
    alertTitle.textContent = title;
    alertDesc.textContent = message;
    alertInput.classList.add('hidden');
    btnAlertCancel.classList.add('hidden');
    btnAlertConfirm.textContent = 'OK';
    alertDialog.classList.remove('hidden');
    alertBackdrop.classList.remove('hidden');
  });
}

function customConfirm(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    activeDialogResolve = resolve;
    alertTitle.textContent = title;
    alertDesc.textContent = message;
    alertInput.classList.add('hidden');
    btnAlertCancel.classList.remove('hidden');
    btnAlertConfirm.textContent = 'Confirm';
    alertDialog.classList.remove('hidden');
    alertBackdrop.classList.remove('hidden');
  });
}

function customPrompt(message, defaultValue = '', title = 'Input Required') {
  return new Promise((resolve) => {
    activeDialogResolve = resolve;
    alertTitle.textContent = title;
    alertDesc.textContent = message;
    alertInput.value = defaultValue;
    alertInput.classList.remove('hidden');
    btnAlertCancel.classList.remove('hidden');
    btnAlertConfirm.textContent = 'Save';
    alertDialog.classList.remove('hidden');
    alertBackdrop.classList.remove('hidden');
    setTimeout(() => {
      alertInput.focus();
      alertInput.select();
    }, 50);
  });
}

function closeCustomDialog(result) {
  alertDialog.classList.add('hidden');
  alertBackdrop.classList.add('hidden');
  if (activeDialogResolve) {
    activeDialogResolve(result);
    activeDialogResolve = null;
  }
}

btnAlertConfirm.addEventListener('click', () => {
  if (!alertInput.classList.contains('hidden')) {
    closeCustomDialog(alertInput.value);
  } else {
    closeCustomDialog(true);
  }
});

btnAlertCancel.addEventListener('click', () => {
  closeCustomDialog(null);
});

alertInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    closeCustomDialog(alertInput.value);
  } else if (e.key === 'Escape') {
    closeCustomDialog(null);
  }
});

// FPS Counter
let lastTime = performance.now();
let frames = 0;
let fpsTimer = 0;

// Realtime Histogram Calculator & Renderer
const histCanvas = document.getElementById('histogram-canvas');
const histCtx = histCanvas?.getContext('2d');
const histShadowClip = document.getElementById('hist-shadow-clip');
const histHighlightClip = document.getElementById('hist-highlight-clip');

let histSampleCanvas = null;
let histSampleCtx = null;
let histAnimFrame = null;

function updateHistogram() {
  if (!histCtx || !canvas || canvas.width === 0) return;

  // Downsample to 128x128 for 60fps fast readback without GPU stall
  if (!histSampleCanvas) {
    histSampleCanvas = document.createElement('canvas');
    histSampleCanvas.width = 128;
    histSampleCanvas.height = 128;
    histSampleCtx = histSampleCanvas.getContext('2d', { willReadFrequently: true });
  }

  try {
    histSampleCtx.drawImage(canvas, 0, 0, 128, 128);
    const imgData = histSampleCtx.getImageData(0, 0, 128, 128).data;

    const rBins = new Uint32Array(256);
    const gBins = new Uint32Array(256);
    const bBins = new Uint32Array(256);
    const lumaBins = new Uint32Array(256);

    let shadowClipCount = 0;
    let highlightClipCount = 0;
    const totalPixels = 128 * 128;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      rBins[r]++;
      gBins[g]++;
      bBins[b]++;
      lumaBins[lum]++;

      if (r <= 2 && g <= 2 && b <= 2) shadowClipCount++;
      if (r >= 253 && g >= 253 && b >= 253) highlightClipCount++;
    }

    // Shadow & Highlight clipping indicators
    if (histShadowClip) {
      histShadowClip.classList.toggle('active', shadowClipCount > totalPixels * 0.01);
    }
    if (histHighlightClip) {
      histHighlightClip.classList.toggle('active', highlightClipCount > totalPixels * 0.01);
    }

    // Find peak max (exclude extreme endpoints 0 and 255 from peak scaling)
    let maxCount = 1;
    for (let i = 2; i < 254; i++) {
      if (rBins[i] > maxCount) maxCount = rBins[i];
      if (gBins[i] > maxCount) maxCount = gBins[i];
      if (bBins[i] > maxCount) maxCount = bBins[i];
      if (lumaBins[i] > maxCount) maxCount = lumaBins[i];
    }

    const w = histCanvas.width;
    const h = histCanvas.height;
    histCtx.clearRect(0, 0, w, h);

    // Draw channels with screen blending
    histCtx.save();
    histCtx.globalCompositeOperation = 'screen';

    const drawChannel = (bins, color) => {
      histCtx.fillStyle = color;
      histCtx.beginPath();
      histCtx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const barH = Math.min(h, (bins[i] / maxCount) * (h * 0.9));
        histCtx.lineTo(x, h - barH);
      }
      histCtx.lineTo(w, h);
      histCtx.closePath();
      histCtx.fill();
    };

    drawChannel(rBins, 'rgba(239, 68, 68, 0.45)');
    drawChannel(gBins, 'rgba(34, 197, 94, 0.45)');
    drawChannel(bBins, 'rgba(59, 130, 246, 0.45)');
    drawChannel(lumaBins, 'rgba(240, 240, 245, 0.3)');

    histCtx.restore();
  } catch (err) {
    // fallback if context is detached
  }
}

function scheduleRender() {
  const now = performance.now();
  state.renderer.render(state.params);

  if (histAnimFrame) cancelAnimationFrame(histAnimFrame);
  histAnimFrame = requestAnimationFrame(updateHistogram);

  frames++;
  const dt = now - lastTime;
  fpsTimer += dt;
  lastTime = now;
  if (fpsTimer >= 500) {
    const fps = Math.round((frames * 1000) / fpsTimer);
    metaFps.textContent = `${fps} fps`;
    frames = 0;
    fpsTimer = 0;
  }
}

// Fit canvas to viewport responsively
function fitCanvas(imgW, imgH) {
  const isMobile = window.innerWidth <= 768;
  const pad = isMobile ? 12 : 32;
  const style = window.getComputedStyle(viewportContainer);
  const padBottom = parseFloat(style.paddingBottom) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;

  const availW = Math.max(50, viewportContainer.clientWidth - padLeft - padRight - pad);
  const availH = Math.max(50, viewportContainer.clientHeight - padTop - padBottom - pad);
  const aspect = imgW / imgH;

  let drawW = availW;
  let drawH = drawW / aspect;

  if (drawH > availH) {
    drawH = availH;
    drawW = drawH * aspect;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(drawW * dpr);
  canvas.height = Math.round(drawH * dpr);
  canvas.style.width = `${Math.round(drawW)}px`;
  canvas.style.height = `${Math.round(drawH)}px`;

  updateSplitHandle();
}

function updateSplitHandle() {
  if (!state.splitActive) {
    splitHandle.classList.add('hidden');
    state.renderer.setSplitPosition(-1.0);
    return;
  }

  splitHandle.classList.remove('hidden');
  const canvasRect = canvas.getBoundingClientRect();
  const contRect = viewportContainer.getBoundingClientRect();

  const handleX = (canvasRect.left - contRect.left) + canvasRect.width * state.splitRatio;
  splitHandle.style.left = `${handleX}px`;
  state.renderer.setSplitPosition(state.splitRatio);
}

// Load Image
function loadImage(img, fileName = 'sample-photo.jpg') {
  img.onload = () => {
    state.currentFileName = fileName;
    currentFilenameEl.textContent = fileName;
    metaRes.textContent = `${img.naturalWidth || img.width} × ${img.naturalHeight || img.height}`;
    fitCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    state.renderer.setImage(img);
    presetThumbnailCache.clear();
    thumbBaseCanvas = null;
    renderPresets();
    scheduleRender();
    showToast(`Loaded: ${fileName}`);
  };
  if (img.complete && img.naturalWidth > 0) {
    img.onload();
  }
}

// Sliders binding
const SLIDERS = [
  'temp', 'tint',
  'exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks',
  'vibrance', 'saturation',
  'lightIntensity', 'lightWarmth', 'lightRadius', 'lightX', 'lightY',
  'maskExposure', 'maskWarmth', 'maskAngle', 'maskPosition', 'maskFeather',
  'texture', 'clarity', 'dehaze',
  'splitShadowHue', 'splitShadowSat', 'splitHighlightHue', 'splitHighlightSat', 'splitBalance',
  'skinSmooth', 'glow',
  'curveBlacks', 'curveShadows', 'curveHighlights', 'curveWhites',
  'vignette', 'grain'
];

function bindSliders() {
  SLIDERS.forEach(id => {
    const input = document.getElementById(`param-${id}`);
    const valEl = document.getElementById(`val-${id}`);
    if (!input) return;

    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.params[id] = val;
      valEl.textContent = val > 0 ? `+${val}` : `${val}`;
      state.activePresetId = null;
      renderPresets();
      scheduleRender();
    });

    input.addEventListener('dblclick', () => {
      input.value = 0;
      state.params[id] = 0;
      valEl.textContent = '0';
      state.activePresetId = null;
      renderPresets();
      scheduleRender();
    });
  });

  // HSL Band Sliders
  const hslHue = document.getElementById('param-hsl-hue');
  const hslSat = document.getElementById('param-hsl-sat');
  const hslLum = document.getElementById('param-hsl-lum');

  [
    { el: hslHue, key: 'hue', valEl: document.getElementById('val-hsl-hue') },
    { el: hslSat, key: 'sat', valEl: document.getElementById('val-hsl-sat') },
    { el: hslLum, key: 'lum', valEl: document.getElementById('val-hsl-lum') },
  ].forEach(({ el, key, valEl }) => {
    el.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.params.hsl[state.activeHslBand][key] = val;
      valEl.textContent = val > 0 ? `+${val}` : `${val}`;
      scheduleRender();
    });
    el.addEventListener('dblclick', () => {
      el.value = 0;
      state.params.hsl[state.activeHslBand][key] = 0;
      valEl.textContent = '0';
      state.activePresetId = null;
      renderPresets();
      scheduleRender();
    });
  });

  // Mask invert checkbox
  const maskInvertChk = document.getElementById('param-maskInvert');
  if (maskInvertChk) {
    maskInvertChk.addEventListener('change', (e) => {
      state.params.maskInvert = e.target.checked ? 1 : 0;
      scheduleRender();
    });
  }

  // HSL Tab triggers
  const tabs = document.querySelectorAll('.tab-trigger');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeHslBand = tab.getAttribute('data-band');
      syncHslInputs();
    });
  });
}

function syncHslInputs() {
  const band = state.params.hsl[state.activeHslBand];
  const hInput = document.getElementById('param-hsl-hue');
  const sInput = document.getElementById('param-hsl-sat');
  const lInput = document.getElementById('param-hsl-lum');

  hInput.value = band.hue;
  sInput.value = band.sat;
  lInput.value = band.lum;

  document.getElementById('val-hsl-hue').textContent = band.hue > 0 ? `+${band.hue}` : `${band.hue}`;
  document.getElementById('val-hsl-sat').textContent = band.sat > 0 ? `+${band.sat}` : `${band.sat}`;
  document.getElementById('val-hsl-lum').textContent = band.lum > 0 ? `+${band.lum}` : `${band.lum}`;
}

function syncAllInputs() {
  SLIDERS.forEach(id => {
    const input = document.getElementById(`param-${id}`);
    const valEl = document.getElementById(`val-${id}`);
    if (input && valEl) {
      const v = state.params[id];
      input.value = v;
      valEl.textContent = v > 0 ? `+${v}` : `${v}`;
    }
  });
  syncHslInputs();
}

// Reset section
document.querySelectorAll('.btn-reset-sec').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    if (target === 'wb') {
      state.params.temp = 0;
      state.params.tint = 0;
    } else if (target === 'tone') {
      ['exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks'].forEach(k => state.params[k] = 0);
    } else if (target === 'curve') {
      ['curveBlacks', 'curveShadows', 'curveHighlights', 'curveWhites'].forEach(k => state.params[k] = 0);
    } else if (target === 'presence') {
      state.params.vibrance = 0;
      state.params.saturation = 0;
    } else if (target === 'lighting') {
      state.params.lightIntensity = 0;
      state.params.lightWarmth = 0;
      state.params.lightRadius = 60;
      state.params.lightX = 50;
      state.params.lightY = 50;
    } else if (target === 'mask') {
      state.params.maskExposure = 0;
      state.params.maskWarmth = 0;
      state.params.maskAngle = 0;
      state.params.maskPosition = 50;
      state.params.maskFeather = 40;
      state.params.maskInvert = 0;
      const chk = document.getElementById('param-maskInvert');
      if (chk) chk.checked = false;
    } else if (target === 'detail') {
      state.params.texture = 0;
      state.params.clarity = 0;
      state.params.dehaze = 0;
    } else if (target === 'splitToning') {
      state.params.splitShadowHue = 210;
      state.params.splitShadowSat = 0;
      state.params.splitHighlightHue = 40;
      state.params.splitHighlightSat = 0;
      state.params.splitBalance = 0;
    } else if (target === 'beauty') {
      state.params.skinSmooth = 0;
      state.params.glow = 0;
    } else if (target === 'effects') {
      state.params.vignette = 0;
      state.params.grain = 0;
    } else if (target === 'hsl') {
      Object.keys(state.params.hsl).forEach(b => {
        state.params.hsl[b] = { hue: 0, sat: 0, lum: 0 };
      });
    }
    syncAllInputs();
    scheduleRender();
    showToast(`Reset ${target}`);
  });
});

// Preset Thumbnail Offscreen Generation
let presetThumbnailCache = new Map();
let thumbOffscreenRenderer = null;
let thumbBaseCanvas = null;

function getThumbBaseCanvas() {
  if (!state.renderer.currentImage) return null;
  if (!thumbBaseCanvas) {
    thumbBaseCanvas = document.createElement('canvas');
    thumbBaseCanvas.width = 160;
    thumbBaseCanvas.height = 160;
  }
  const ctx = thumbBaseCanvas.getContext('2d');
  const img = state.renderer.currentImage;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const minDim = Math.min(iw, ih);
  const sx = (iw - minDim) / 2;
  const sy = (ih - minDim) / 2;
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 160, 160);
  return thumbBaseCanvas;
}

function renderPresetThumbnail(preset) {
  if (presetThumbnailCache.has(preset.id)) {
    return presetThumbnailCache.get(preset.id);
  }
  const base = getThumbBaseCanvas();
  if (!base) return '';

  if (!thumbOffscreenRenderer) {
    const off = document.createElement('canvas');
    off.width = 160;
    off.height = 160;
    thumbOffscreenRenderer = new WebGLRenderer(off);
  }

  thumbOffscreenRenderer.setImage(base);
  thumbOffscreenRenderer.setSplitPosition(-1.0);
  thumbOffscreenRenderer.render(preset.params);
  const dataUrl = thumbOffscreenRenderer.canvas.toDataURL('image/jpeg', 0.85);
  presetThumbnailCache.set(preset.id, dataUrl);
  return dataUrl;
}

// Preset Management
const mobilePresetListEl = document.getElementById('mobile-preset-list');

function renderPresets() {
  presetListEl.innerHTML = '';
  if (mobilePresetListEl) mobilePresetListEl.innerHTML = '';

  const userPresets = loadUserPresets();
  const allPresets = [...BUILTIN_PRESETS, ...userPresets];

  allPresets.forEach(p => {
    const thumbUrl = renderPresetThumbnail(p);

    // Desktop/Sheet preset card
    const card = document.createElement('button');
    card.className = `preset-card ${state.activePresetId === p.id ? 'active' : ''}`;
    card.title = p.name;
    card.innerHTML = `
      <div class="preset-thumb-wrap">
        ${thumbUrl ? `<img class="preset-thumb-canvas" src="${thumbUrl}" alt="${p.name}" />` : ''}
      </div>
      <span class="preset-thumb-name">${p.name}</span>
    `;
    card.addEventListener('click', () => {
      applyPreset(p);
    });
    presetListEl.appendChild(card);

    // Persistent Mobile Bottom Shelf card
    if (mobilePresetListEl) {
      const mCard = document.createElement('button');
      mCard.className = `preset-card ${state.activePresetId === p.id ? 'active' : ''}`;
      mCard.title = p.name;
      mCard.innerHTML = `
        <div class="preset-thumb-wrap">
          ${thumbUrl ? `<img class="preset-thumb-canvas" src="${thumbUrl}" alt="${p.name}" />` : ''}
        </div>
        <span class="preset-thumb-name">${p.name}</span>
      `;
      mCard.addEventListener('click', () => {
        applyPreset(p);
      });
      mobilePresetListEl.appendChild(mCard);
    }
  });
}

function applyPreset(preset) {
  state.params = JSON.parse(JSON.stringify(preset.params));
  state.activePresetId = preset.id;
  syncAllInputs();
  renderPresets();
  scheduleRender();
  showToast(`Applied preset: ${preset.name}`);
}

// Save Custom Preset
btnSavePreset.addEventListener('click', async () => {
  const name = await customPrompt('Give your color grade preset a memorable name:', 'My Color Grade', 'Save Preset');
  if (!name || !name.trim()) return;
  const newPreset = {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    params: JSON.parse(JSON.stringify(state.params)),
  };
  saveUserPreset(newPreset);
  state.activePresetId = newPreset.id;
  renderPresets();
  showToast(`Preset "${name.trim()}" saved`);
});

// Export Preset JSON
btnExportPreset.addEventListener('click', () => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.params, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `preset-${Date.now()}.json`;
  a.click();
  showToast('Preset JSON exported');
});

// Import Preset (JSON or XMP)
presetFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const content = evt.target.result;
    try {
      if (file.name.endsWith('.xmp') || file.name.endsWith('.xml') || content.includes('crs:')) {
        const preset = parseXmpPreset(content, file.name.replace(/\.[^/.]+$/, ''));
        saveUserPreset(preset);
        applyPreset(preset);
        showToast(`XMP preset imported: ${preset.name}`);
        return;
      }

      const importedParams = JSON.parse(content);
      const params = importedParams.params || importedParams;
      if (params.hsl && typeof params.exposure !== 'undefined') {
        state.params = params;
        state.activePresetId = null;
        syncAllInputs();
        renderPresets();
        scheduleRender();
        showToast('JSON preset imported');
      } else {
        customAlert('The selected JSON file does not contain valid ColorSchema preset data.', 'Invalid Preset Format');
      }
    } catch {
      customAlert('Could not parse the preset file. Please ensure it is valid JSON or Lightroom XMP.', 'Import Failed');
    }
  };
  reader.readAsText(file);
});

// Split View Toggle
function toggleSplit() {
  state.splitActive = !state.splitActive;
  btnSplit.classList.toggle('active', state.splitActive);
  btnBottomSplit?.classList.toggle('active', state.splitActive);
  updateSplitHandle();
  scheduleRender();
}

btnSplit.addEventListener('click', toggleSplit);
btnBottomSplit?.addEventListener('click', toggleSplit);

window.addEventListener('keydown', (e) => {
  if ((e.key === 'y' || e.key === 'Y') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    toggleSplit();
  }
});

// Unified Pointer Dragging for Split Screen
splitHandle.addEventListener('pointerdown', (e) => {
  state.isDraggingSplit = true;
  splitHandle.setPointerCapture(e.pointerId);
  e.preventDefault();
});

window.addEventListener('pointermove', (e) => {
  if (!state.isDraggingSplit) return;
  const canvasRect = canvas.getBoundingClientRect();
  if (canvasRect.width <= 0) return;
  const ratio = (e.clientX - canvasRect.left) / canvasRect.width;
  state.splitRatio = Math.max(0.01, Math.min(0.99, ratio));
  updateSplitHandle();
  scheduleRender();
});

window.addEventListener('pointerup', (e) => {
  if (state.isDraggingSplit) {
    state.isDraggingSplit = false;
    try {
      if (splitHandle.hasPointerCapture(e.pointerId)) {
        splitHandle.releasePointerCapture(e.pointerId);
      }
    } catch {
      // safe fallback
    }
  }
});

// Crop Tool Logic
const btnCropMode = document.getElementById('btn-crop-mode');
const cropOverlay = document.getElementById('crop-overlay');
const cropBox = document.getElementById('crop-box');
const btnCropApply = document.getElementById('btn-crop-apply');
const btnCropCancel = document.getElementById('btn-crop-cancel');
const cropRatioBtns = document.querySelectorAll('.btn-crop-ratio');

let isCropping = false;
let activeCropRatio = 'free'; // 'free', '1:1', '4:5', '16:9', '9:16'
let cropRect = { x: 0, y: 0, w: 0, h: 0 };
let cropDragMode = null; // 'move', 'nw', 'ne', 'sw', 'se'
let cropDragStart = { mouseX: 0, mouseY: 0, rect: null };

function updateCropBoxDOM() {
  if (!cropBox) return;
  cropBox.style.left = `${cropRect.x}px`;
  cropBox.style.top = `${cropRect.y}px`;
  cropBox.style.width = `${cropRect.w}px`;
  cropBox.style.height = `${cropRect.h}px`;
}

function initCropBox() {
  const canvasRect = canvas.getBoundingClientRect();
  const contRect = viewportContainer.getBoundingClientRect();
  const cx = canvasRect.left - contRect.left;
  const cy = canvasRect.top - contRect.top;
  const cw = canvasRect.width;
  const ch = canvasRect.height;

  // default to 90% of current canvas
  const insetX = cw * 0.05;
  const insetY = ch * 0.05;
  cropRect.x = cx + insetX;
  cropRect.y = cy + insetY;
  cropRect.w = cw - insetX * 2;
  cropRect.h = ch - insetY * 2;
  applyRatioToCropRect();
  updateCropBoxDOM();
}

function applyRatioToCropRect() {
  if (activeCropRatio === 'free') return;
  let targetRatio = 1.0;
  if (activeCropRatio === '1:1') targetRatio = 1.0;
  else if (activeCropRatio === '4:5') targetRatio = 4 / 5;
  else if (activeCropRatio === '16:9') targetRatio = 16 / 9;
  else if (activeCropRatio === '9:16') targetRatio = 9 / 16;

  cropRect.h = cropRect.w / targetRatio;
}

function openCropMode() {
  if (!state.renderer.currentImage) return;
  isCropping = true;
  cropOverlay.classList.remove('hidden');
  btnCropMode.classList.add('active');
  initCropBox();
}

function closeCropMode() {
  isCropping = false;
  cropOverlay.classList.add('hidden');
  btnCropMode.classList.remove('active');
}

btnCropMode?.addEventListener('click', () => {
  if (isCropping) closeCropMode();
  else openCropMode();
});

btnCropCancel?.addEventListener('click', closeCropMode);

cropRatioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    cropRatioBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCropRatio = btn.getAttribute('data-ratio');
    applyRatioToCropRect();
    updateCropBoxDOM();
  });
});

// Crop pointer dragging
cropBox?.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  const target = e.target;
  if (target.classList.contains('nw')) cropDragMode = 'nw';
  else if (target.classList.contains('ne')) cropDragMode = 'ne';
  else if (target.classList.contains('sw')) cropDragMode = 'sw';
  else if (target.classList.contains('se')) cropDragMode = 'se';
  else cropDragMode = 'move';

  cropDragStart.mouseX = e.clientX;
  cropDragStart.mouseY = e.clientY;
  cropDragStart.rect = { ...cropRect };
  cropBox.setPointerCapture(e.pointerId);
});

cropBox?.addEventListener('pointermove', (e) => {
  if (!cropDragMode) return;
  const dx = e.clientX - cropDragStart.mouseX;
  const dy = e.clientY - cropDragStart.mouseY;
  const start = cropDragStart.rect;

  if (cropDragMode === 'move') {
    cropRect.x = start.x + dx;
    cropRect.y = start.y + dy;
  } else if (cropDragMode === 'se') {
    cropRect.w = Math.max(40, start.w + dx);
    cropRect.h = Math.max(40, start.h + dy);
    applyRatioToCropRect();
  } else if (cropDragMode === 'sw') {
    const nextW = Math.max(40, start.w - dx);
    cropRect.x = start.x + (start.w - nextW);
    cropRect.w = nextW;
    cropRect.h = Math.max(40, start.h + dy);
    applyRatioToCropRect();
  } else if (cropDragMode === 'ne') {
    cropRect.w = Math.max(40, start.w + dx);
    const nextH = Math.max(40, start.h - dy);
    cropRect.y = start.y + (start.h - nextH);
    cropRect.h = nextH;
    applyRatioToCropRect();
  } else if (cropDragMode === 'nw') {
    const nextW = Math.max(40, start.w - dx);
    const nextH = Math.max(40, start.h - dy);
    cropRect.x = start.x + (start.w - nextW);
    cropRect.y = start.y + (start.h - nextH);
    cropRect.w = nextW;
    cropRect.h = nextH;
    applyRatioToCropRect();
  }
  updateCropBoxDOM();
});

cropBox?.addEventListener('pointerup', (e) => {
  cropDragMode = null;
  try {
    if (cropBox.hasPointerCapture(e.pointerId)) {
      cropBox.releasePointerCapture(e.pointerId);
    }
  } catch {}
});

// Apply Crop to Image
btnCropApply?.addEventListener('click', () => {
  if (!state.renderer.currentImage) return;
  const img = state.renderer.currentImage;
  const canvasRect = canvas.getBoundingClientRect();
  const contRect = viewportContainer.getBoundingClientRect();
  const cx = canvasRect.left - contRect.left;
  const cy = canvasRect.top - contRect.top;

  // Normalized relative coords on canvas
  const relX = Math.max(0, Math.min(1, (cropRect.x - cx) / canvasRect.width));
  const relY = Math.max(0, Math.min(1, (cropRect.y - cy) / canvasRect.height));
  const relW = Math.max(0.01, Math.min(1 - relX, cropRect.w / canvasRect.width));
  const relH = Math.max(0.01, Math.min(1 - relY, cropRect.h / canvasRect.height));

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  const sx = Math.round(relX * origW);
  const sy = Math.round(relY * origH);
  const sw = Math.round(relW * origW);
  const sh = Math.round(relH * origH);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = sw;
  croppedCanvas.height = sh;
  const ctx = croppedCanvas.getContext('2d');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const croppedImg = new Image();
  croppedImg.onload = () => {
    state.renderer.setImage(croppedImg);
    fitCanvas(croppedImg.naturalWidth, croppedImg.naturalHeight);
    presetThumbnailCache.clear();
    thumbBaseCanvas = null;
    renderPresets();
    scheduleRender();
    closeCropMode();
    showToast(`Cropped to ${sw} × ${sh}`);
  };
  croppedImg.src = croppedCanvas.toDataURL('image/jpeg', 0.95);
});

// Rotate 90 deg clockwise
const btnRotate = document.getElementById('btn-rotate');
btnRotate?.addEventListener('click', () => {
  if (!state.renderer.currentImage) return;
  const img = state.renderer.currentImage;
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = origH;
  rotCanvas.height = origW;
  const ctx = rotCanvas.getContext('2d');
  ctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  ctx.rotate((90 * Math.PI) / 180);
  ctx.drawImage(img, -origW / 2, -origH / 2);

  const rotatedImg = new Image();
  rotatedImg.onload = () => {
    state.renderer.setImage(rotatedImg);
    fitCanvas(rotatedImg.naturalWidth, rotatedImg.naturalHeight);
    presetThumbnailCache.clear();
    thumbBaseCanvas = null;
    renderPresets();
    scheduleRender();
    showToast('Image rotated 90°');
  };
  rotatedImg.src = rotCanvas.toDataURL('image/jpeg', 0.95);
});

// Mobile Bottom Sheet Controls
const btnBottomHsl = document.getElementById('btn-bottom-hsl');
const btnHoldCompare = document.getElementById('btn-hold-compare');

function updateCanvasShift(sheetHeight = null) {
  if (window.innerWidth > 768) {
    canvas.style.transform = '';
    return;
  }
  if (!state.isSheetOpen) {
    canvas.style.transform = '';
    return;
  }
  const h = sheetHeight !== null ? sheetHeight : (sidebar.getBoundingClientRect().height || window.innerHeight * 0.52);
  const shiftY = Math.round((h - 120) * 0.48);
  canvas.style.transform = `translateY(-${Math.max(0, shiftY)}px)`;
}

function openSheet(focusSection = null) {
  sidebar.classList.add('open');
  sheetBackdrop.classList.add('active');
  state.isSheetOpen = true;

  btnBottomPresets?.classList.remove('active');
  btnBottomAdjust?.classList.remove('active');
  btnBottomHsl?.classList.remove('active');

  updateCanvasShift();

  const sheetScrollEl = sidebar.querySelector('.sheet-scroll');
  const presetSec = sidebar.querySelector('.sheet-section');

  if (focusSection === 'presets') {
    btnBottomPresets?.classList.add('active');
    presetSec?.scrollIntoView({ behavior: 'smooth' });
  } else if (focusSection === 'hsl') {
    btnBottomHsl?.classList.add('active');
    const hslSec = document.querySelector('.tab-trigger')?.closest('.accordion-item');
    if (hslSec) hslSec.scrollIntoView({ behavior: 'smooth' });
  } else {
    btnBottomAdjust?.classList.add('active');
    if (sheetScrollEl) sheetScrollEl.scrollTop = 0;
  }
}

function closeSheet() {
  sidebar.classList.remove('open');
  sidebar.style.height = '';
  sidebar.style.maxHeight = '';
  sheetBackdrop.classList.remove('active');
  state.isSheetOpen = false;
  btnBottomAdjust?.classList.remove('active');
  btnBottomPresets?.classList.remove('active');
  btnBottomHsl?.classList.remove('active');
  canvas.style.transform = '';
}

btnBottomAdjust?.addEventListener('click', () => {
  if (state.isSheetOpen && btnBottomAdjust.classList.contains('active')) {
    closeSheet();
  } else {
    openSheet('tune');
  }
});

btnBottomPresets?.addEventListener('click', () => {
  if (state.isSheetOpen && btnBottomPresets.classList.contains('active')) {
    closeSheet();
  } else {
    openSheet('presets');
  }
});

btnBottomHsl?.addEventListener('click', () => {
  if (state.isSheetOpen && btnBottomHsl.classList.contains('active')) {
    closeSheet();
  } else {
    openSheet('hsl');
  }
});

// Meitu-style Hold to Compare (Original Preview)
if (btnHoldCompare) {
  const startCompare = (e) => {
    e.preventDefault();
    btnHoldCompare.classList.add('active');
    state.renderer.render(DEFAULT_PARAMS);
  };
  const endCompare = (e) => {
    e.preventDefault();
    btnHoldCompare.classList.remove('active');
    scheduleRender();
  };

  btnHoldCompare.addEventListener('pointerdown', startCompare);
  btnHoldCompare.addEventListener('pointerup', endCompare);
  btnHoldCompare.addEventListener('pointerleave', endCompare);
  btnHoldCompare.addEventListener('pointercancel', endCompare);
}

btnCloseSheet?.addEventListener('click', closeSheet);
sheetBackdrop?.addEventListener('click', closeSheet);

// Reset All
btnReset.addEventListener('click', () => {
  state.params = JSON.parse(JSON.stringify(DEFAULT_PARAMS));
  state.activePresetId = null;
  syncAllInputs();
  renderPresets();
  scheduleRender();
  showToast('Reset all adjustments');
});

document.getElementById('btn-reset-all-mobile')?.addEventListener('click', () => {
  btnReset.click();
});

// Image Upload
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.src = URL.createObjectURL(file);
  loadImage(img, file.name);
});

// Sample Image
btnSample.addEventListener('click', () => {
  const img = generateSampleImage();
  loadImage(img, 'sample-photo.jpg');
});

// Suffix export filename: <name>-cs-<time>.<ext>
function getExportFilename(origName, format) {
  const dotIndex = origName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? origName.substring(0, dotIndex) : origName;
  const ext = format === 'image/png' ? 'png' : 'jpg';

  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  return `${baseName}-cs-${timestamp}.${ext}`;
}

// Export function
function handleExport() {
  const format = 'image/jpeg';
  const dataUrl = state.renderer.exportImage(state.params, format, 0.95);
  if (!dataUrl) return;

  const filename = getExportFilename(state.currentFileName, format);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
  showToast(`Exported: ${filename}`);
}

btnExportImg.addEventListener('click', handleExport);
btnBottomExport?.addEventListener('click', handleExport);

// Resize handling
window.addEventListener('resize', () => {
  if (state.renderer.currentImage) {
    const img = state.renderer.currentImage;
    fitCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    scheduleRender();
  }
});

// Scraper Modal Handlers
const btnScraperModal = document.getElementById('btn-scraper-modal');
const scraperDialog = document.getElementById('scraper-dialog');
const scraperBackdrop = document.getElementById('scraper-backdrop');
const btnCloseScraper = document.getElementById('btn-close-scraper');
const btnDoScrapeUrl = document.getElementById('btn-do-scrape-url');
const scraperUrlInput = document.getElementById('scraper-url-input');
const btnDoParseText = document.getElementById('btn-do-parse-text');
const scraperTextInput = document.getElementById('scraper-text-input');
const btnSampleRecipe = document.getElementById('btn-sample-recipe');

function openScraperModal() {
  scraperDialog.classList.remove('hidden');
  scraperBackdrop.classList.remove('hidden');
}

function closeScraperModal() {
  scraperDialog.classList.add('hidden');
  scraperBackdrop.classList.add('hidden');
}

btnScraperModal?.addEventListener('click', openScraperModal);
btnCloseScraper?.addEventListener('click', closeScraperModal);
scraperBackdrop?.addEventListener('click', closeScraperModal);

// Sample recipe button
btnSampleRecipe?.addEventListener('click', () => {
  scraperTextInput.value = `Warm Sun Recipe:
Exposure: +0.4
Contrast: +15
Highlights: -30
Shadows: +20
Whites: +10
Blacks: -15
Temp: +22
Tint: +4
Vibrance: +25
Saturation: -8
Vignette: 20
Grain: 15`;
});

// Parse Text / Recipe / XMP
btnDoParseText?.addEventListener('click', async () => {
  const text = scraperTextInput.value.trim();
  if (!text) {
    await customAlert('Please enter or paste a recipe or XMP XML content.', 'Input Empty');
    return;
  }

  let preset;
  if (text.includes('crs:Exposure') || text.includes('<x:xmpmeta')) {
    preset = parseXmpPreset(text, 'Pasted XMP');
  } else {
    preset = parseRecipeText(text, 'Scraped Recipe');
  }

  saveUserPreset(preset);
  applyPreset(preset);
  closeScraperModal();
  showToast(`Scraped & applied: ${preset.name}`);
});

// Scrape remote URL
btnDoScrapeUrl?.addEventListener('click', async () => {
  const url = scraperUrlInput.value.trim();
  if (!url) {
    await customAlert('Please enter a valid preset or recipe URL.', 'URL Required');
    return;
  }

  btnDoScrapeUrl.disabled = true;
  btnDoScrapeUrl.textContent = 'Fetching...';

  try {
    const preset = await scrapePresetFromUrl(url);
    saveUserPreset(preset);
    applyPreset(preset);
    closeScraperModal();
    showToast(`Scraped: ${preset.name}`);
  } catch (err) {
    await customAlert(`Failed to fetch preset from URL: ${err.message}`, 'Scrape Failed');
  } finally {
    btnDoScrapeUrl.disabled = false;
    btnDoScrapeUrl.textContent = 'Scrape';
  }
});

// ==========================================
// Preset Library Manager Handlers
// ==========================================
const btnManagePresets = document.getElementById('btn-manage-presets');
const managerDialog = document.getElementById('manager-dialog');
const managerBackdrop = document.getElementById('manager-backdrop');
const btnCloseManager = document.getElementById('btn-close-manager');
const btnDoneManager = document.getElementById('btn-done-manager');
const managerListEl = document.getElementById('manager-list');
const btnExportAllPresets = document.getElementById('btn-export-all-presets');

function openManagerModal() {
  renderManagerList();
  managerDialog.classList.remove('hidden');
  managerBackdrop.classList.remove('hidden');
}

function closeManagerModal() {
  managerDialog.classList.add('hidden');
  managerBackdrop.classList.add('hidden');
  renderPresets();
}

function renderManagerList() {
  managerListEl.innerHTML = '';
  const all = getAllPresetsCombined();

  all.forEach(p => {
    const isBuiltin = BUILTIN_PRESETS.some(b => b.id === p.id);
    const item = document.createElement('div');
    item.className = `preset-manager-item ${state.activePresetId === p.id ? 'active' : ''}`;

    item.innerHTML = `
      <div class="preset-item-info">
        <span class="preset-item-name" title="${p.name}">${p.name}</span>
        <span class="preset-item-tag">${isBuiltin ? 'Built-in' : 'Custom'}</span>
      </div>
      <div class="preset-item-actions">
        <button class="btn-icon-xs btn-apply-item" title="Apply Preset">
          <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button class="btn-icon-xs btn-export-item" title="Export this JSON">
          <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        ${!isBuiltin ? `
          <button class="btn-icon-xs btn-rename-item" title="Rename">
            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button class="btn-icon-xs delete btn-delete-item" title="Delete">
            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        ` : ''}
      </div>
    `;

    // Action listeners
    item.querySelector('.btn-apply-item')?.addEventListener('click', () => {
      applyPreset(p);
      renderManagerList();
    });

    item.querySelector('.btn-export-item')?.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(p, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `${p.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      showToast(`Exported ${p.name}`);
    });

    item.querySelector('.btn-rename-item')?.addEventListener('click', async () => {
      const newName = await customPrompt('Enter new name for this preset:', p.name, 'Rename Preset');
      if (newName && newName.trim()) {
        renameUserPreset(p.id, newName.trim());
        renderManagerList();
        renderPresets();
        showToast(`Renamed to "${newName.trim()}"`);
      }
    });

    item.querySelector('.btn-delete-item')?.addEventListener('click', async () => {
      const ok = await customConfirm(`Are you sure you want to delete preset "${p.name}"? This action cannot be undone.`, 'Delete Preset');
      if (ok) {
        deleteUserPreset(p.id);
        if (state.activePresetId === p.id) state.activePresetId = null;
        renderManagerList();
        renderPresets();
        showToast(`Deleted ${p.name}`);
      }
    });

    managerListEl.appendChild(item);
  });
}

// Export full collection JSON
btnExportAllPresets?.addEventListener('click', () => {
  const all = getAllPresetsCombined();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(all, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `all-presets-collection-${Date.now()}.json`;
  a.click();
  showToast('All presets exported');
});

btnManagePresets?.addEventListener('click', openManagerModal);
btnCloseManager?.addEventListener('click', closeManagerModal);
btnDoneManager?.addEventListener('click', closeManagerModal);
managerBackdrop?.addEventListener('click', closeManagerModal);

// Mobile sidebar-sheet vertical drag
const sheetHandle = document.getElementById('sheet-handle');
if (sheetHandle && sidebar) {
  let isDraggingSheet = false;
  let startY = 0;
  let startHeight = 0;
  let maxH = 0;
  let minH = 120;

  sheetHandle.addEventListener('pointerdown', (e) => {
    if (window.innerWidth > 768) return;
    isDraggingSheet = true;
    startY = e.clientY;
    startHeight = sidebar.getBoundingClientRect().height;
    maxH = window.innerHeight * 0.70;
    sidebar.classList.add('dragging');
    sheetHandle.setPointerCapture(e.pointerId);
  });

  sheetHandle.addEventListener('pointermove', (e) => {
    if (!isDraggingSheet) return;
    const dy = startY - e.clientY;
    const nextH = Math.max(minH, Math.min(maxH, startHeight + dy));
    sidebar.style.height = `${nextH}px`;
    sidebar.style.maxHeight = `${nextH}px`;
    updateCanvasShift(nextH);
  });

  const stopSheetDrag = (e) => {
    if (isDraggingSheet) {
      isDraggingSheet = false;
      sidebar.classList.remove('dragging');
      if (sheetHandle.hasPointerCapture(e.pointerId)) {
        sheetHandle.releasePointerCapture(e.pointerId);
      }
      const curH = sidebar.getBoundingClientRect().height;
      if (curH < 140) {
        closeSheet();
        sidebar.style.height = '';
        sidebar.style.maxHeight = '';
      } else {
        updateCanvasShift(curH);
      }
    }
  };

  sheetHandle.addEventListener('pointerup', stopSheetDrag);
  sheetHandle.addEventListener('pointercancel', stopSheetDrag);
}

// Tone Curve Graph Renderer
const curveCanvas = document.getElementById('curve-canvas');
function renderCurveVisual() {
  if (!curveCanvas) return;
  const ctx = curveCanvas.getContext('2d');
  const w = curveCanvas.width;
  const h = curveCanvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background Grid (3x3)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const x = (w / 4) * i;
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Base Diagonal Reference
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plot Curve Spline
  const blacks = (state.params.curveBlacks || 0) * 0.003;
  const shadows = (state.params.curveShadows || 0) * 0.003;
  const highlights = (state.params.curveHighlights || 0) * 0.003;
  const whites = (state.params.curveWhites || 0) * 0.003;

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();

  const steps = 40;
  for (let s = 0; s <= steps; s++) {
    const clum = s / steps;
    const wBlacks = Math.max(0, 1.0 - clum * 4.0);
    const s1 = Math.max(0, Math.min(1, clum / 0.35));
    const smoothS1 = s1 * s1 * (3 - 2 * s1);
    const s2 = Math.max(0, Math.min(1, (clum - 0.35) / 0.3));
    const smoothS2 = s2 * s2 * (3 - 2 * s2);
    const wShadows = smoothS1 * (1.0 - smoothS2);

    const h1 = Math.max(0, Math.min(1, (clum - 0.35) / 0.3));
    const smoothH1 = h1 * h1 * (3 - 2 * h1);
    const h2 = Math.max(0, Math.min(1, (clum - 0.65) / 0.35));
    const smoothH2 = h2 * h2 * (3 - 2 * h2);
    const wHighlights = smoothH1 * (1.0 - smoothH2);

    const wWhites = smoothH2;

    const delta = (blacks * wBlacks) + (shadows * wShadows) + (highlights * wHighlights) + (whites * wWhites);
    const outLum = Math.max(0, Math.min(1, clum + delta));

    const px = clum * w;
    const py = (1.0 - outLum) * h;
    if (s === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// Update curve graph on render
const origScheduleRender = scheduleRender;
scheduleRender = function() {
  origScheduleRender();
  renderCurveVisual();
};

// Bootstrapping
bindSliders();
renderPresets();
renderCurveVisual();
loadImage(generateSampleImage(), 'sample-photo.jpg');
