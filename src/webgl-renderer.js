import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders.js';

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    if (!this.gl) {
      throw new Error('WebGL 2.0 is not supported in this browser.');
    }

    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    this.initBuffers();
    this.initUniformLocations();

    this.texture = null;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.splitPos = -1.0; // -1 means disabled
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed: ' + info);
    }
    return shader;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Program linking failed: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  initBuffers() {
    const gl = this.gl;
    // Quad vertices + UVs (Y flipped for WebGL texture orientation)
    // x, y, u, v
    const vertices = new Float32Array([
      -1, -1,  0, 1,
       1, -1,  1, 1,
      -1,  1,  0, 0,
      -1,  1,  0, 0,
       1, -1,  1, 1,
       1,  1,  1, 0,
    ]);

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

    const aTex = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

    gl.bindVertexArray(null);
  }

  initUniformLocations() {
    const gl = this.gl;
    const p = this.program;
    this.uniforms = {
      image: gl.getUniformLocation(p, 'u_image'),
      splitPos: gl.getUniformLocation(p, 'u_splitPos'),
      exposure: gl.getUniformLocation(p, 'u_exposure'),
      contrast: gl.getUniformLocation(p, 'u_contrast'),
      highlights: gl.getUniformLocation(p, 'u_highlights'),
      shadows: gl.getUniformLocation(p, 'u_shadows'),
      whites: gl.getUniformLocation(p, 'u_whites'),
      blacks: gl.getUniformLocation(p, 'u_blacks'),
      temp: gl.getUniformLocation(p, 'u_temp'),
      tint: gl.getUniformLocation(p, 'u_tint'),
      vibrance: gl.getUniformLocation(p, 'u_vibrance'),
      saturation: gl.getUniformLocation(p, 'u_saturation'),
      vignette: gl.getUniformLocation(p, 'u_vignette'),
      grain: gl.getUniformLocation(p, 'u_grain'),
      hsl: gl.getUniformLocation(p, 'u_hsl[0]'),
      lightPos: gl.getUniformLocation(p, 'u_lightPos'),
      lightRadius: gl.getUniformLocation(p, 'u_lightRadius'),
      lightIntensity: gl.getUniformLocation(p, 'u_lightIntensity'),
      lightWarmth: gl.getUniformLocation(p, 'u_lightWarmth'),
      maskAngle: gl.getUniformLocation(p, 'u_maskAngle'),
      maskPosition: gl.getUniformLocation(p, 'u_maskPosition'),
      maskFeather: gl.getUniformLocation(p, 'u_maskFeather'),
      maskExposure: gl.getUniformLocation(p, 'u_maskExposure'),
      maskWarmth: gl.getUniformLocation(p, 'u_maskWarmth'),
      maskInvert: gl.getUniformLocation(p, 'u_maskInvert'),
      radialMaskCenter: gl.getUniformLocation(p, 'u_radialMaskCenter'),
      radialMaskRadius: gl.getUniformLocation(p, 'u_radialMaskRadius'),
      radialMaskFeather: gl.getUniformLocation(p, 'u_radialMaskFeather'),
      radialMaskExposure: gl.getUniformLocation(p, 'u_radialMaskExposure'),
      radialMaskWarmth: gl.getUniformLocation(p, 'u_radialMaskWarmth'),
      radialMaskInvert: gl.getUniformLocation(p, 'u_radialMaskInvert'),
      clarity: gl.getUniformLocation(p, 'u_clarity'),
      texture: gl.getUniformLocation(p, 'u_texture'),
      dehaze: gl.getUniformLocation(p, 'u_dehaze'),
      sharpen: gl.getUniformLocation(p, 'u_sharpen'),
      noiseReduction: gl.getUniformLocation(p, 'u_noiseReduction'),
      texelSize: gl.getUniformLocation(p, 'u_texelSize'),
      shadowTint: gl.getUniformLocation(p, 'u_shadowTint'),
      midtoneTint: gl.getUniformLocation(p, 'u_midtoneTint'),
      highlightTint: gl.getUniformLocation(p, 'u_highlightTint'),
      splitBalance: gl.getUniformLocation(p, 'u_splitBalance'),
      skinSmooth: gl.getUniformLocation(p, 'u_skinSmooth'),
      glow: gl.getUniformLocation(p, 'u_glow'),
      skinTone: gl.getUniformLocation(p, 'u_skinTone'),
      bokehBlur: gl.getUniformLocation(p, 'u_bokehBlur'),
      bokehCenter: gl.getUniformLocation(p, 'u_bokehCenter'),
      bokehRadius: gl.getUniformLocation(p, 'u_bokehRadius'),
      curve: gl.getUniformLocation(p, 'u_curve'),
    };
  }

  setImage(imageElement) {
    const gl = this.gl;
    this.imageWidth = imageElement.naturalWidth || imageElement.width;
    this.imageHeight = imageElement.naturalHeight || imageElement.height;

    if (!this.texture) {
      this.texture = gl.createTexture();
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);

    this.currentImage = imageElement;
  }

  setSplitPosition(pos) {
    this.splitPos = pos;
  }

  render(params) {
    const gl = this.gl;
    if (!this.texture) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uniforms.image, 0);

    gl.uniform1f(this.uniforms.splitPos, this.splitPos);
    gl.uniform1f(this.uniforms.exposure, params.exposure);
    gl.uniform1f(this.uniforms.contrast, params.contrast);
    gl.uniform1f(this.uniforms.highlights, params.highlights);
    gl.uniform1f(this.uniforms.shadows, params.shadows);
    gl.uniform1f(this.uniforms.whites, params.whites);
    gl.uniform1f(this.uniforms.blacks, params.blacks);
    gl.uniform1f(this.uniforms.temp, params.temp);
    gl.uniform1f(this.uniforms.tint, params.tint);
    gl.uniform1f(this.uniforms.vibrance, params.vibrance);
    gl.uniform1f(this.uniforms.saturation, params.saturation);
    gl.uniform1f(this.uniforms.vignette, params.vignette);
    gl.uniform1f(this.uniforms.grain, params.grain);

    // Relight / Lighting
    const lx = (params.lightX !== undefined ? params.lightX : 50) / 100.0;
    const ly = (params.lightY !== undefined ? params.lightY : 50) / 100.0;
    const lRadius = (params.lightRadius !== undefined ? params.lightRadius : 60) / 100.0;
    gl.uniform2f(this.uniforms.lightPos, lx, ly);
    gl.uniform1f(this.uniforms.lightRadius, lRadius);
    gl.uniform1f(this.uniforms.lightIntensity, params.lightIntensity || 0);
    gl.uniform1f(this.uniforms.lightWarmth, params.lightWarmth || 0);

    // Linear Gradient Mask
    const angleRad = ((params.maskAngle || 0) * Math.PI) / 180;
    const mPos = (params.maskPosition !== undefined ? params.maskPosition : 50) / 100.0;
    const mFeather = (params.maskFeather !== undefined ? params.maskFeather : 40) / 100.0;
    gl.uniform1f(this.uniforms.maskAngle, angleRad);
    gl.uniform1f(this.uniforms.maskPosition, mPos);
    gl.uniform1f(this.uniforms.maskFeather, mFeather);
    gl.uniform1f(this.uniforms.maskExposure, params.maskExposure || 0);
    gl.uniform1f(this.uniforms.maskWarmth, params.maskWarmth || 0);
    gl.uniform1f(this.uniforms.maskInvert, params.maskInvert ? 1.0 : 0.0);

    // Radial Elliptical Mask
    gl.uniform2f(
      this.uniforms.radialMaskCenter,
      (params.radialMaskX ?? 50) * 0.01,
      1.0 - (params.radialMaskY ?? 50) * 0.01
    );
    gl.uniform2f(
      this.uniforms.radialMaskRadius,
      (params.radialMaskRx ?? 35) * 0.01,
      (params.radialMaskRy ?? 35) * 0.01
    );
    gl.uniform1f(this.uniforms.radialMaskFeather, (params.radialMaskFeather ?? 50) * 0.01);
    gl.uniform1f(this.uniforms.radialMaskExposure, params.radialMaskExposure || 0);
    gl.uniform1f(this.uniforms.radialMaskWarmth, params.radialMaskWarmth || 0);
    gl.uniform1f(this.uniforms.radialMaskInvert, params.radialMaskInvert ? 1.0 : 0.0);

    // Texture, Clarity & Dehaze, Sharpening & Noise Reduction
    gl.uniform1f(this.uniforms.clarity, params.clarity || 0);
    gl.uniform1f(this.uniforms.texture, params.texture || 0);
    gl.uniform1f(this.uniforms.dehaze, params.dehaze || 0);
    gl.uniform1f(this.uniforms.sharpen, params.sharpen || 0);
    gl.uniform1f(this.uniforms.noiseReduction, params.noiseReduction || 0);
    gl.uniform2f(this.uniforms.texelSize, 1.0 / (this.canvas.width || 1000), 1.0 / (this.canvas.height || 1000));

    // Color Grading / Split Toning
    const shHueRad = ((params.splitShadowHue || 0) * Math.PI) / 180;
    const shSat = (params.splitShadowSat || 0) * 0.01;
    const shR = (Math.cos(shHueRad) * 0.5 + 0.5) * shSat;
    const shG = (Math.cos(shHueRad - 2.094) * 0.5 + 0.5) * shSat;
    const shB = (Math.cos(shHueRad + 2.094) * 0.5 + 0.5) * shSat;
    gl.uniform3f(this.uniforms.shadowTint, shR, shG, shB);

    const midHueRad = ((params.splitMidtoneHue || 0) * Math.PI) / 180;
    const midSat = (params.splitMidtoneSat || 0) * 0.01;
    const midR = (Math.cos(midHueRad) * 0.5 + 0.5) * midSat;
    const midG = (Math.cos(midHueRad - 2.094) * 0.5 + 0.5) * midSat;
    const midB = (Math.cos(midHueRad + 2.094) * 0.5 + 0.5) * midSat;
    gl.uniform3f(this.uniforms.midtoneTint, midR, midG, midB);

    const hiHueRad = ((params.splitHighlightHue || 0) * Math.PI) / 180;
    const hiSat = (params.splitHighlightSat || 0) * 0.01;
    const hiR = (Math.cos(hiHueRad) * 0.5 + 0.5) * hiSat;
    const hiG = (Math.cos(hiHueRad - 2.094) * 0.5 + 0.5) * hiSat;
    const hiB = (Math.cos(hiHueRad + 2.094) * 0.5 + 0.5) * hiSat;
    gl.uniform3f(this.uniforms.highlightTint, hiR, hiG, hiB);

    gl.uniform1f(this.uniforms.splitBalance, params.splitBalance || 0);

    // Meitu Skin Smoothing, Glow & Skin Tone
    gl.uniform1f(this.uniforms.skinSmooth, params.skinSmooth || 0);
    gl.uniform1f(this.uniforms.glow, params.glow || 0);
    gl.uniform1f(this.uniforms.skinTone, params.skinTone || 0);

    // Portrait Bokeh Depth Blur
    gl.uniform1f(this.uniforms.bokehBlur, params.bokehBlur || 0);
    gl.uniform2f(
      this.uniforms.bokehCenter,
      (params.bokehX ?? 50) * 0.01,
      1.0 - (params.bokehY ?? 50) * 0.01
    );
    gl.uniform1f(this.uniforms.bokehRadius, (params.bokehRadius ?? 45) * 0.01);

    // Parametric Tone Curve
    gl.uniform4f(
      this.uniforms.curve,
      params.curveBlacks || 0,
      params.curveShadows || 0,
      params.curveHighlights || 0,
      params.curveWhites || 0
    );

    // HSL Bands: array of 7 vec3
    // red, orange, yellow, green, cyan, blue, magenta
    const bands = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
    const hslFlat = new Float32Array(21);
    bands.forEach((b, i) => {
      const bandData = params.hsl[b] || { hue: 0, sat: 0, lum: 0 };
      hslFlat[i * 3 + 0] = bandData.hue;
      hslFlat[i * 3 + 1] = bandData.sat;
      hslFlat[i * 3 + 2] = bandData.lum;
    });
    gl.uniform3fv(this.uniforms.hsl, hslFlat);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  // Export processed image at full native resolution
  exportImage(params, format = 'image/jpeg', quality = 0.95) {
    if (!this.currentImage) return null;

    // Create offscreen canvas matched exactly to original image size
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.imageWidth;
    offCanvas.height = this.imageHeight;

    const offRenderer = new WebGLRenderer(offCanvas);
    offRenderer.setImage(this.currentImage);
    offRenderer.setSplitPosition(-1.0); // Full render, no split
    offRenderer.render(params);

    return offCanvas.toDataURL(format, quality);
  }
}
