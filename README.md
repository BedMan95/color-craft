# Photo Color Schema Editor

A high-performance Lightroom-style web photo color schema editor built with native WebGL 2.0 fragment shaders. Zero external heavy dependencies, 60fps real-time color grading.

## Features

- **Real-Time WebGL Color Engine**:
  - **White Balance**: Temperature & Tint.
  - **Tone**: Exposure, Contrast, Highlights, Shadows, Whites, Blacks.
  - **Presence**: Vibrance, Saturation.
  - **HSL Color Grading**: 7 color bands (Red, Orange, Yellow, Green, Cyan, Blue, Magenta) with independent Hue shift, Saturation, and Luminance.
  - **Effects**: Vignette & Film Grain.
- **Before / After Comparison**:
  - Split screen view with draggable comparison divider.
  - Shortcut key `Y` toggle.
- **Color Schema & Preset System**:
  - 5 Built-in presets: *Clean Portrait, Warm Vintage, Moody Teal & Orange, Cyberpunk Neon, B&W High Contrast*.
  - Save custom presets to `localStorage`.
  - Export / Import presets as `.json` files.
- **Image Management**:
  - Built-in procedural high-res sample photo (1600x1066).
  - Custom photo upload (JPEG, PNG, WebP).
  - Full-resolution native export using offscreen WebGL canvas.

## Getting Started

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.
