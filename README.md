# ColorCraft - Professional Web Photo Studio & Color Engine

A high-performance, studio-grade web photo color grading and portrait aesthetics editor combining **Adobe Lightroom color precision** with **Meitu beauty retouching**. Built on native **WebGL 2.0 fragment shaders**, running at 60 FPS real-time rendering with zero heavy runtime dependencies.

---

## Key Features

### 1. Adobe Lightroom Grade Color & Geometry Engine
- **Tone Curves**: 4-point parametric spline (Blacks, Shadows, Highlights, Whites) with a real-time interactive spline response canvas.
- **3-Way Color Grading / Split Toning**: Shadows, Midtones, and Highlights chromatic wheels with balance bias control.
- **Detail & Micro-Contrast**:
  - **Texture & Clarity**: Multi-tap neighborhood high-pass extraction for fine and mid-frequency contrast.
  - **Dehaze**: Atmospheric haze removal and contrast recovery.
  - **Sharpening & Noise Reduction**: Unsharp mask edge sharpening and luminance smoothing.
- **Selective Masking**:
  - **Linear Gradient Mask**: Angle, position, feather, exposure, warmth, and mask inversion.
  - **Radial Ellipse Mask**: Center (X, Y), radii (width, height), feather, exposure, warmth, and inversion.
- **Relight & Studio Lighting**: Virtual radial light source with variable origin, radius, intensity, and temperature.
- **Interactive RGB + Luma Histogram**: 128×128 hardware-accelerated downsampled histogram with real-time shadow underexposure and highlight clipping indicator badges.
- **Interactive Crop & Aspect Ratios**: Free crop, 1:1 (Square), 4:5 (Instagram Portrait), 16:9 (Landscape), and 9:16 (TikTok/Reels Story) with rule-of-thirds grid and multi-handle dragging.
- **90° Lossless Rotation**.

### 2. Meitu Portrait Beauty & Aesthetics
- **Skin Smoothing & Retouch**: Chromatic skin-tone selective bilateral smoothing preserving structural edge contrast.
- **Skin Tone Shift**: Dual-directional tuning:
  - Negative: *Porcelain Fair / Bright Cool Lift* (K-Beauty aesthetic).
  - Positive: *Warm Golden Tan / Sunkissed Bronze*.
- **Face Slimming & Reshape**: Real-time inverse coordinate liquify pinch warp for V-Line jaw contouring.
- **AI Portrait Bokeh Depth Blur**: 8-tap wide aperture disc sampling (f/1.4 - f/2.8 lens simulation) with customizable focus zone radius and focal center coordinates.
- **Dreamy Soft Glow / Bloom**: Luma threshold bloom diffusion filter.

### 3. Mobile-First & Meitu UI/UX
- **Draggable Bottom Sheet**: Smooth pointer-drag physics with dynamic canvas vertical shift (`translateY`), preventing viewport distortion and black bars.
- **Horizontal Preset Shelf**: 80×80 Meitu-style live filter carousel with hardware offscreen WebGL thumbnail rendering.
- **Compact Mobile Topbar**: Streamlined essentials (`Open`, `Rotate`, `Crop`, `Export`) leaving ample breathing room on small screens.
- **Hold-to-Compare Floating Button**: Seamless pointer-down comparison with original unprocessed image.
- **Split Screen Comparison**: Draggable comparison divider with `Y` key shortcut.

### 4. Preset Management & Scraper
- **Curated Film Presets**: Kodak Portra 400, Fuji Classic Chrome, Cine Teal & Orange, Dark Forest Moody, Golden Hour, B&W Noir, Tokyo Night Street, Meitu Korean Glow, Nordic Cold, Vintage Polaroid 600, etc.
- **Import / Export**: Full JSON preset collections + Lightroom XMP recipe parser.
- **Web Preset Scraper Modal**: Direct import from URLs or pasted recipes.

---

## Tech Stack

- **Runtime**: Native WebGL 2.0 Fragment Shaders (GLSL ES 3.00), HTML5 Canvas 2D.
- **Styling**: Tailwind CSS + Shadcn UI dark modern design system.
- **Build Tool**: Vite 5.x.
- **Deployment**: Zero-config Vercel deployment (`vercel.json`).

---

## Getting Started

### Local Development
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```
Production assets are generated in `dist/`.

---

## License
MIT License.
