// Vertex Shader (Fullscreen quad)
export const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

// Fragment Shader (Color grading pipeline)
export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_splitPos;     // [0..1], <0 disables split
uniform bool u_showOriginal;

// Tone & WB Uniforms
uniform float u_exposure;    // -100 to 100
uniform float u_contrast;    // -100 to 100
uniform float u_highlights;  // -100 to 100
uniform float u_shadows;     // -100 to 100
uniform float u_whites;      // -100 to 100
uniform float u_blacks;      // -100 to 100
uniform float u_temp;        // -100 to 100
uniform float u_tint;        // -100 to 100
uniform float u_vibrance;    // -100 to 100
uniform float u_saturation;  // -100 to 100
uniform float u_vignette;    // 0 to 100
uniform float u_grain;       // 0 to 100

// HSL Per-band adjustments: vec3(hueShift, satShift, lumShift)
uniform vec3 u_hsl[7];

// Standard RGB to HSL with clamp to [0..1]
vec3 rgb2hsl(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  float cMin = min(min(c.r, c.g), c.b);
  float cMax = max(max(c.r, c.g), c.b);
  float delta = cMax - cMin;

  float h = 0.0;
  float s = 0.0;
  float l = (cMax + cMin) * 0.5;

  if (delta > 0.0001) {
    s = (l < 0.5) ? (delta / (cMax + cMin)) : (delta / (2.0 - cMax - cMin));
    if (c.r >= cMax) {
      h = (c.g - c.b) / delta + (c.g < c.b ? 6.0 : 0.0);
    } else if (c.g >= cMax) {
      h = (c.b - c.r) / delta + 2.0;
    } else {
      h = (c.r - c.g) / delta + 4.0;
    }
    h /= 6.0;
  }
  return vec3(clamp(h, 0.0, 1.0), clamp(s, 0.0, 1.0), clamp(l, 0.0, 1.0));
}

// HSL to RGB helper
float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float h = fract(hsl.x);
  float s = clamp(hsl.y, 0.0, 1.0);
  float l = clamp(hsl.z, 0.0, 1.0);

  if (s <= 0.0001) return vec3(l);

  float q = (l < 0.5) ? (l * (1.0 + s)) : (l + s - l * s);
  float p = 2.0 * l - q;
  return vec3(
    hue2rgb(p, q, h + 1.0/3.0),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1.0/3.0)
  );
}

// Pseudo random for film grain
float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 original = texture(u_image, v_texCoord);

  // Split View check: original on left side if split active
  if (u_splitPos >= 0.0 && v_texCoord.x < u_splitPos) {
    outColor = original;
    return;
  }

  vec3 color = original.rgb;

  // 1. Exposure (Photographic stops)
  float expFactor = pow(2.0, u_exposure * 0.02);
  color *= expFactor;

  // 2. White Balance (Temperature & Tint)
  float t = u_temp * 0.01;
  float ti = u_tint * 0.01;
  color.r += t * 0.25 + ti * 0.1;
  color.g -= ti * 0.2;
  color.b -= t * 0.25 - ti * 0.1;

  // 3. Highlights & Shadows
  float lum = dot(clamp(color, 0.0, 1.0), vec3(0.2126, 0.7152, 0.0722));
  float highlightMask = smoothstep(0.5, 1.0, lum);
  float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);
  color += color * (u_highlights * 0.005) * highlightMask;
  color += color * (u_shadows * 0.005) * shadowMask;

  // 4. Whites & Blacks
  color += vec3(u_whites * 0.003) * pow(lum, 1.5);
  color += vec3(u_blacks * 0.003) * pow(1.0 - lum, 1.5);

  // 5. Contrast (S-curve around middle gray 0.5)
  float cont = 1.0 + (u_contrast * 0.01);
  color = (color - 0.5) * cont + 0.5;

  // IMPORTANT: Clamp color to [0..1] before HSL conversion.
  // When exposure > 0, un-clamped color > 1.0 causes:
  // delta / (2.0 - (cMax + cMin)) denominator to go <= 0 or negative,
  // turning saturation negative or NaN/black.
  color = clamp(color, 0.0, 1.0);

  // 6. HSL Adjustments
  vec3 hsl = rgb2hsl(color);

  float centers[7] = float[7](0.0, 0.083, 0.166, 0.333, 0.5, 0.666, 0.833);
  vec3 hslDelta = vec3(0.0);

  for (int i = 0; i < 7; i++) {
    float dist = abs(hsl.x - centers[i]);
    if (dist > 0.5) dist = 1.0 - dist;
    float weight = smoothstep(0.12, 0.0, dist);
    hslDelta += u_hsl[i] * weight;
  }

  // Apply HSL Delta
  hsl.x = fract(hsl.x + hslDelta.x * 0.002);
  hsl.y = clamp(hsl.y * (1.0 + hslDelta.y * 0.01), 0.0, 1.0);
  hsl.z = clamp(hsl.z + hslDelta.z * 0.005, 0.0, 1.0);

  // 7. Global Vibrance & Saturation
  float vib = u_vibrance * 0.01;
  hsl.y = clamp(hsl.y * (1.0 + vib * (1.0 - hsl.y)), 0.0, 1.0);

  float sat = 1.0 + (u_saturation * 0.01);
  hsl.y = clamp(hsl.y * sat, 0.0, 1.0);

  color = hsl2rgb(hsl);

  // 8. Vignette
  if (u_vignette > 0.0) {
    vec2 coord = (v_texCoord - 0.5) * 2.0;
    float dist = length(coord);
    float vig = smoothstep(0.6, 1.5, dist * (1.0 + u_vignette * 0.015));
    color *= (1.0 - vig * (u_vignette * 0.01));
  }

  // 9. Film Grain
  if (u_grain > 0.0) {
    float noise = (rand(v_texCoord) - 0.5) * (u_grain * 0.002);
    color += noise;
  }

  outColor = vec4(clamp(color, 0.0, 1.0), original.a);
}
`;
