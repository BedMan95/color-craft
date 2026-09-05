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
