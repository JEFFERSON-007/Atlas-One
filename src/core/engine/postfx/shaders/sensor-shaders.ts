/**
 * GLSL Fragment Shaders — Post-processing sensor modes for Atlas One v0.8.
 * Each shader transforms the rendered scene into a distinct visual style.
 */

/** Night Vision Goggles — green phosphor with noise grain. */
export const NVG_FRAGMENT = `
uniform sampler2D colorTexture;
uniform float time;
in vec2 v_textureCoordinates;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float noise = rand(v_textureCoordinates + vec2(time * 0.001)) * 0.12;
  float scanline = sin(v_textureCoordinates.y * 900.0) * 0.04;
  float green = clamp(lum + noise + scanline, 0.0, 1.0);
  out_FragColor = vec4(green * 0.15, green * 1.0, green * 0.15, 1.0);
}
`;

/** Forward-Looking Infrared — thermal heat-map palette. */
export const FLIR_FRAGMENT = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

vec3 thermal(float t) {
  vec3 cold   = vec3(0.0, 0.0, 0.2);
  vec3 mid    = vec3(0.8, 0.1, 0.3);
  vec3 warm   = vec3(1.0, 0.85, 0.0);
  vec3 hot    = vec3(1.0, 1.0, 1.0);
  if (t < 0.33) return mix(cold, mid, t / 0.33);
  if (t < 0.66) return mix(mid, warm, (t - 0.33) / 0.33);
  return mix(warm, hot, (t - 0.66) / 0.34);
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float inverted = 1.0 - lum;
  out_FragColor = vec4(thermal(inverted), 1.0);
}
`;

/** CRT Monitor — curvature, scanlines, chromatic aberration. */
export const CRT_FRAGMENT = `
uniform sampler2D colorTexture;
uniform float time;
in vec2 v_textureCoordinates;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = v_textureCoordinates;
  // Barrel distortion
  vec2 centered = uv - 0.5;
  float d = dot(centered, centered);
  uv = uv + centered * d * 0.15;

  float r = texture(colorTexture, uv + vec2(0.002, 0.0)).r;
  float g = texture(colorTexture, uv).g;
  float b = texture(colorTexture, uv - vec2(0.002, 0.0)).b;
  vec3 color = vec3(r, g, b);

  // Scanlines
  float scanline = sin(uv.y * 800.0) * 0.08;
  color -= scanline;

  // Vignette
  float vignette = 1.0 - d * 2.8;
  color *= vignette;

  // Slight flicker
  float flicker = 0.97 + 0.03 * sin(time * 8.0);
  color *= flicker;

  // Green phosphor tint
  color *= vec3(0.8, 1.0, 0.8);

  out_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/** Noir — high-contrast black-and-white with vignette. */
export const NOIR_FRAGMENT = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Increase contrast
  lum = clamp((lum - 0.5) * 1.6 + 0.5, 0.0, 1.0);

  // Vignette
  vec2 centered = v_textureCoordinates - 0.5;
  float d = dot(centered, centered);
  float vignette = 1.0 - d * 2.0;
  lum *= vignette;

  // Slight sepia warmth
  vec3 sepia = vec3(lum * 1.05, lum * 0.97, lum * 0.85);
  out_FragColor = vec4(sepia, 1.0);
}
`;

/** Snow / Signal Loss — static noise with occasional frame tears. */
export const SNOW_FRAGMENT = `
uniform sampler2D colorTexture;
uniform float time;
in vec2 v_textureCoordinates;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  vec2 uv = v_textureCoordinates;

  float noise = rand(uv * 500.0 + vec2(time * 5.0));
  float tearLine = step(0.998, rand(vec2(time * 0.1, floor(uv.y * 40.0))));
  float tearOffset = tearLine * 0.04;

  vec4 shifted = texture(colorTexture, uv + vec2(tearOffset, 0.0));
  vec3 result = mix(shifted.rgb, vec3(noise), 0.35);

  // Scanline darkening
  float scanline = sin(uv.y * 1200.0) * 0.06;
  result -= scanline;

  out_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;

/** Tactical — high-contrast blue-white with sharpened edges. */
export const TACTICAL_FRAGMENT = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Edge detection (Sobel-approximation via luminance neighbors)
  float texelW = 1.0 / 1920.0;
  float texelH = 1.0 / 1080.0;
  float lumL = dot(texture(colorTexture, v_textureCoordinates + vec2(-texelW, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float lumR = dot(texture(colorTexture, v_textureCoordinates + vec2( texelW, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float lumU = dot(texture(colorTexture, v_textureCoordinates + vec2(0.0,  texelH)).rgb, vec3(0.299, 0.587, 0.114));
  float lumD = dot(texture(colorTexture, v_textureCoordinates + vec2(0.0, -texelH)).rgb, vec3(0.299, 0.587, 0.114));
  float edge = abs(lumL - lumR) + abs(lumU - lumD);

  // Tactical blue palette
  vec3 base = vec3(lum * 0.15, lum * 0.25, lum * 0.55);
  vec3 edgeColor = vec3(0.4, 0.7, 1.0) * edge * 3.0;

  out_FragColor = vec4(clamp(base + edgeColor, 0.0, 1.0), 1.0);
}
`;
