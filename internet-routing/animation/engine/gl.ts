/**
 * WebGL2 compositor: ASCII conversion of the two source layers + crisp layer + global effects.
 *
 * Passes per frame:
 *  1. reduce  ascii (12×20) and asciiHero (24×40) sources → per-cell {colour, density} textures
 *  2. composite full-res: paper(+grain) → ascii glyphs/dither → hero glyphs/dither → crisp,
 *     with ink re-colouring, registration slip of the ink plate, and the scanline wipe.
 */
import { CELL_H, CELL_W, DITHER_PX, FONTS, HEIGHT, HERO_CELL_H, HERO_CELL_W, PALETTE, RAMP, WIDTH } from '../config';

export interface CompositeParams {
  asciiTint: string;
  heroTint: string;
  inkOverride: string | null;
  slip: number;
  scanlineWipe: number;
}

const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const REDUCE_FS = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uSrc;
uniform ivec2 uCell;
uniform vec3 uTint;
out vec4 o;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 st = uCell / ivec2(6, 10);
  ivec2 base = c * uCell + st / 2;
  float wT = 0.0, wC = 0.0;
  vec3 acc = vec3(0.0);
  for (int j = 0; j < 10; j++) {
    for (int i = 0; i < 6; i++) {
      vec4 v = texelFetch(uSrc, base + ivec2(i, j) * st, 0);
      if (v.a < 0.004) continue;
      float mn = min(v.r, min(v.g, v.b));
      float mx = max(v.r, max(v.g, v.b));
      if (mx - mn < 0.08) wT += v.a * (1.0 - mx);   // neutral paint: black share → glyphs (white share → dither)
      else { wC += v.a; acc += v.rgb * v.a; }
    }
  }
  float d = (wT + wC) / 60.0;
  vec3 col = wT >= wC ? uTint : acc / max(wC, 1e-4);
  o = vec4(col, d);
}`;

const COMPOSITE_FS = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uAsciiSrc, uAsciiCells, uAtlas, uHeroSrc, uHeroCells, uHeroAtlas, uCrisp;
uniform vec3 uPaper, uInk, uInkDeep, uAsciiTint, uHeroTint;
uniform vec4 uOverride;   // rgb, enabled
uniform ivec2 uSlip;
uniform float uWipe;
out vec4 outColor;

const ivec2 SIZE = ivec2(${WIDTH}, ${HEIGHT});
const ivec2 CELL = ivec2(${CELL_W}, ${CELL_H});
const ivec2 HCELL = ivec2(${HERO_CELL_W}, ${HERO_CELL_H});
const int DP = ${DITHER_PX};

uint hash(uint x) {
  x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x;
}
float hash01(ivec2 p) { return float(hash(uint(p.x) * 1973u + uint(p.y) * 9277u + 26699u) & 0xffffu) / 65535.0; }

float bayer(ivec2 m) {
  const float B[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return (B[m.y * 4 + m.x] + 0.5) / 16.0;
}

bool inside(ivec2 p) { return p.x >= 0 && p.y >= 0 && p.x < SIZE.x && p.y < SIZE.y; }

// ASCII layer at pixel p → unpremultiplied colour + coverage.
vec4 asciiLayer(sampler2D src, sampler2D cells, sampler2D atlas, ivec2 cell, vec3 tint, ivec2 p) {
  if (!inside(p)) return vec4(0.0);
  ivec2 c = p / cell;
  vec4 cd = texelFetch(cells, c, 0);
  int lvl = min(9, int(cd.a * 10.0));
  if (lvl > 0) {
    ivec2 q = p - c * cell;
    float cov = texelFetch(atlas, ivec2(lvl * cell.x + q.x, q.y), 0).a;
    if (cov > 0.0) return vec4(cd.rgb, cov);
  }
  ivec2 b = (p / DP) * DP;
  float dd = 0.0;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
    vec4 v = texelFetch(src, b + ivec2(1 + 2 * i, 1 + 2 * j), 0);
    float mn = min(v.r, min(v.g, v.b));
    if (max(v.r, max(v.g, v.b)) - mn < 0.08) dd += v.a * mn;   // white share of neutral paint
  }
  dd *= 0.25;
  if (dd > 0.0 && dd > bayer((p / DP) & 3)) return vec4(tint, 1.0);
  return vec4(0.0);
}

vec4 layer(int which, ivec2 p) {
  if (which == 0) return asciiLayer(uAsciiSrc, uAsciiCells, uAtlas, CELL, uAsciiTint, p);
  if (which == 1) return asciiLayer(uHeroSrc, uHeroCells, uHeroAtlas, HCELL, uHeroTint, p);
  if (!inside(p)) return vec4(0.0);
  return texelFetch(uCrisp, p, 0);
}

bool isInk(vec3 c) { return distance(c, uInk) < 0.12; }
vec3 recolour(vec3 c, bool ink) { return (ink && uOverride.a > 0.5) ? uOverride.rgb : c; }

void main() {
  ivec2 p = ivec2(int(gl_FragCoord.x), SIZE.y - 1 - int(gl_FragCoord.y));
  float grain = (hash01(p) - 0.5) * 0.03;          // ±1.5 % paper grain (static)
  vec3 paper = uPaper * (1.0 + grain);
  vec3 col = paper;
  bool slip = uSlip.x != 0 || uSlip.y != 0;
  for (int L = 0; L < 3; L++) {
    vec4 a = layer(L, p);
    bool ai = a.a > 0.0 && isInk(a.rgb);
    if (slip && ai) a = vec4(0.0);
    col = mix(col, recolour(a.rgb, ai), a.a);
    if (slip) {
      vec4 b = layer(L, p - uSlip);
      if (b.a > 0.0 && isInk(b.rgb)) col = mix(col, recolour(b.rgb, true), b.a);
    }
  }
  if (uWipe > 0.0 && uWipe < 1.0) {
    const float BW = 0.26, JIT = 0.1;
    float Y = float(p.y) / float(SIZE.y);
    float j = hash01(ivec2(p.y / 20, 7)) * JIT;
    float s = uWipe * (1.0 + BW + JIT) - Y - j;
    if (s < 0.0) col = paper;
    else if (s < BW) {
      float k = s / BW;                           // 0 at the front → 1 at the tail
      if (float(p.y % 4) < 4.0 * (1.0 - k)) col = uInkDeep;
    }
  }
  outColor = vec4(col, 1.0);
}`;

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export class Compositor {
  private gl: WebGL2RenderingContext;
  private reduceProg: WebGLProgram;
  private compProg: WebGLProgram;
  private tex: Record<'asciiSrc' | 'heroSrc' | 'crisp' | 'atlas' | 'heroAtlas' | 'asciiCells' | 'heroCells', WebGLTexture>;
  private fboAscii: WebGLFramebuffer;
  private fboHero: WebGLFramebuffer;

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
    this.reduceProg = this.program(REDUCE_FS);
    this.compProg = this.program(COMPOSITE_FS);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const prog of [this.reduceProg, this.compProg]) {
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    const mk = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.tex = {
      asciiSrc: mk(),
      heroSrc: mk(),
      crisp: mk(),
      atlas: mk(),
      heroAtlas: mk(),
      asciiCells: mk(),
      heroCells: mk(),
    };
    const cellTex = (t: WebGLTexture, w: number, h: number) => {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return fbo;
    };
    this.fboAscii = cellTex(this.tex.asciiCells, WIDTH / CELL_W, HEIGHT / CELL_H);
    this.fboHero = cellTex(this.tex.heroCells, WIDTH / HERO_CELL_W, HEIGHT / HERO_CELL_H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.upload(this.tex.atlas, buildAtlas(CELL_W, CELL_H));
    this.upload(this.tex.heroAtlas, buildAtlas(HERO_CELL_W, HERO_CELL_H));
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

  private upload(t: WebGLTexture, src: TexImageSource): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }

  private bind(prog: WebGLProgram, name: string, unit: number, t: WebGLTexture): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
  }

  render(ascii: HTMLCanvasElement, hero: HTMLCanvasElement, crisp: HTMLCanvasElement, p: CompositeParams): void {
    const gl = this.gl;
    this.upload(this.tex.asciiSrc, ascii);
    this.upload(this.tex.heroSrc, hero);
    this.upload(this.tex.crisp, crisp);

    const rp = this.reduceProg;
    gl.useProgram(rp);
    const reduce = (fbo: WebGLFramebuffer, src: WebGLTexture, cw: number, ch: number, tint: string) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, WIDTH / cw, HEIGHT / ch);
      this.bind(rp, 'uSrc', 0, src);
      gl.uniform2i(gl.getUniformLocation(rp, 'uCell'), cw, ch);
      gl.uniform3fv(gl.getUniformLocation(rp, 'uTint'), hexRgb(tint));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    reduce(this.fboAscii, this.tex.asciiSrc, CELL_W, CELL_H, p.asciiTint);
    reduce(this.fboHero, this.tex.heroSrc, HERO_CELL_W, HERO_CELL_H, p.heroTint);

    const cp = this.compProg;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, WIDTH, HEIGHT);
    gl.useProgram(cp);
    this.bind(cp, 'uAsciiSrc', 0, this.tex.asciiSrc);
    this.bind(cp, 'uAsciiCells', 1, this.tex.asciiCells);
    this.bind(cp, 'uAtlas', 2, this.tex.atlas);
    this.bind(cp, 'uHeroSrc', 3, this.tex.heroSrc);
    this.bind(cp, 'uHeroCells', 4, this.tex.heroCells);
    this.bind(cp, 'uHeroAtlas', 5, this.tex.heroAtlas);
    this.bind(cp, 'uCrisp', 6, this.tex.crisp);
    const u3 = (n: string, hex: string) => gl.uniform3fv(gl.getUniformLocation(cp, n), hexRgb(hex));
    u3('uPaper', PALETTE.paper);
    u3('uInk', PALETTE.ink);
    u3('uInkDeep', PALETTE.inkDeep);
    u3('uAsciiTint', p.asciiTint);
    u3('uHeroTint', p.heroTint);
    gl.uniform4fv(gl.getUniformLocation(cp, 'uOverride'), p.inkOverride ? [...hexRgb(p.inkOverride), 1] : [0, 0, 0, 0]);
    const s = Math.round(p.slip);
    gl.uniform2i(gl.getUniformLocation(cp, 'uSlip'), s, s);
    gl.uniform1f(gl.getUniformLocation(cp, 'uWipe'), p.scanlineWipe);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

/** Glyph atlas: RAMP glyphs in IBM Plex Mono, white on transparent, one cell per glyph, laid out horizontally. */
function buildAtlas(cw: number, ch: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = cw * RAMP.length;
  c.height = ch;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.font = `400 ${ch}px "${FONTS.glyph}"`;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  for (let i = 1; i < RAMP.length; i++) g.fillText(RAMP[i], i * cw + cw / 2, Math.round(ch * 0.78));
  return c;
}
