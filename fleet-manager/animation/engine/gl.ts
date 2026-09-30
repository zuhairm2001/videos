/**
 * WebGL2 compositor: main layer + bloom of the glow layer, static film grain, vignette.
 *
 * Passes per frame (all RGBA8, NEAREST/LINEAR sampling only, deterministic under SwiftShader):
 *  1. down   glow (1920×1080, premultiplied) → half res 960×540 (2×2 box via one LINEAR tap)
 *  2. blurH / blurV at half res   (9-tap gaussian, σ ≈ 3 half-px ≈ 6 px)   → "tight" bloom
 *  3. down   half → quarter 480×270, blurH / blurV (σ ≈ 4 quarter-px ≈ 16 px) → "wide" bloom
 *  4. composite: main + tight·K_TIGHT + wide·K_WIDE, + static grain (±1 %), vignette (≤ 8 % at corners)
 */
import { H, W } from '../config';

/** Bloom strengths (tuned against the design bible's "lit dots … with an 18 px soft glow"). */
const K_TIGHT = 0.8;
const K_WIDE = 0.55;
const GRAIN = 0.02; // peak-to-peak
const VIGNETTE = 0.08;

const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

/** Downsample by 2: one bilinear tap at the shared corner of a 2×2 block. */
const DOWN_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uSrcSize;
out vec4 o;
void main() { o = texture(uSrc, (gl_FragCoord.xy * 2.0) / uSrcSize); }`;

/** 9-tap gaussian along uDir, implemented as 5 LINEAR taps. */
const BLUR_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uDir;     // texel step (1/size along one axis)
uniform float uSpread; // tap spacing multiplier
out vec4 o;
void main() {
  vec2 size = vec2(textureSize(uSrc, 0));
  vec2 p = gl_FragCoord.xy / size;
  vec2 d = uDir * uSpread;
  vec4 c = texture(uSrc, p) * 0.2270270270;
  c += (texture(uSrc, p + d * 1.3846153846) + texture(uSrc, p - d * 1.3846153846)) * 0.3162162162;
  c += (texture(uSrc, p + d * 3.2307692308) + texture(uSrc, p - d * 3.2307692308)) * 0.0702702703;
  o = c;
}`;

const COMPOSITE_FS = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uMain, uTight, uWide;
out vec4 outColor;
const vec2 SIZE = vec2(${W}.0, ${H}.0);

uint hash(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float hash01(ivec2 p) { return float(hash(uint(p.x) * 1973u + uint(p.y) * 9277u + 26699u) & 0xffffu) / 65535.0; }

void main() {
  ivec2 p = ivec2(int(gl_FragCoord.x), int(SIZE.y) - 1 - int(gl_FragCoord.y));
  vec2 uv = vec2(gl_FragCoord.x, gl_FragCoord.y) / SIZE;
  vec3 col = texelFetch(uMain, p, 0).rgb;
  vec2 buv = vec2(uv.x, 1.0 - uv.y);
  col += texture(uTight, buv).rgb * ${K_TIGHT.toFixed(3)} + texture(uWide, buv).rgb * ${K_WIDE.toFixed(3)};
  col += (hash01(p) - 0.5) * ${GRAIN.toFixed(3)};
  vec2 q = (uv - 0.5) * 2.0;
  float r = length(q) / 1.41421356;
  col *= 1.0 - ${VIGNETTE.toFixed(3)} * smoothstep(0.3, 1.0, r);
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
}

export class Compositor {
  private gl: WebGL2RenderingContext;
  private down: WebGLProgram;
  private blur: WebGLProgram;
  private comp: WebGLProgram;
  private mainTex: WebGLTexture;
  private glowTex: WebGLTexture;
  private half: [Target, Target];
  private quarter: [Target, Target];

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.down = this.program(DOWN_FS);
    this.blur = this.program(BLUR_FS);
    this.comp = this.program(COMPOSITE_FS);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    this.mainTex = this.texture(gl.NEAREST);
    this.glowTex = this.texture(gl.LINEAR);
    const target = (w: number, h: number): Target => {
      const tex = this.texture(gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fbo, w, h };
    };
    this.half = [target(W / 2, H / 2), target(W / 2, H / 2)];
    this.quarter = [target(W / 4, H / 4), target(W / 4, H / 4)];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private texture(filter: number): WebGLTexture {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  private program(fs: string): WebGLProgram {
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`shader: ${gl.getShaderInfoLog(s)}`);
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
    return p;
  }

  private bind(prog: WebGLProgram, name: string, unit: number, t: WebGLTexture): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
  }

  private pass(prog: WebGLProgram, dst: Target | null, src: WebGLTexture, srcW: number, srcH: number, dir?: [number, number], spread = 1): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fbo : null);
    gl.viewport(0, 0, dst ? dst.w : W, dst ? dst.h : H);
    gl.useProgram(prog);
    this.bind(prog, 'uSrc', 0, src);
    if (dir) {
      gl.uniform2f(gl.getUniformLocation(prog, 'uDir'), dir[0] / srcW, dir[1] / srcH);
      gl.uniform1f(gl.getUniformLocation(prog, 'uSpread'), spread);
    } else {
      gl.uniform2f(gl.getUniformLocation(prog, 'uSrcSize'), srcW, srcH);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  render(main: HTMLCanvasElement, glow: HTMLCanvasElement): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.mainTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, main);
    // glow as premultiplied colour = additive light
    gl.bindTexture(gl.TEXTURE_2D, this.glowTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glow);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    const [h0, h1] = this.half;
    const [q0, q1] = this.quarter;
    // Canvas textures are uploaded top row first, so texture v=0 is the top of the frame; the FBO
    // passes keep that orientation (row y of the FBO = texture row y), the composite flips back.
    this.pass(this.down, h0, this.glowTex, W, H);
    this.pass(this.blur, h1, h0.tex, h0.w, h0.h, [1, 0], 1.5);
    this.pass(this.blur, h0, h1.tex, h0.w, h0.h, [0, 1], 1.5);
    this.pass(this.down, q0, h0.tex, h0.w, h0.h);
    this.pass(this.blur, q1, q0.tex, q0.w, q0.h, [1, 0], 2);
    this.pass(this.blur, q0, q1.tex, q0.w, q0.h, [0, 1], 2);

    const cp = this.comp;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(cp);
    this.bind(cp, 'uMain', 0, this.mainTex);
    this.bind(cp, 'uTight', 1, h0.tex);
    this.bind(cp, 'uWide', 2, q0.tex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
