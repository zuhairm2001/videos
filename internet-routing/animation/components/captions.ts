/**
 * Global caption renderer (drawn by the engine on the crisp layer every frame; scenes never draw captions).
 * Spec: IBM Plex Mono 64 px, line height 76, ≤17 chars × ≤2 lines, left at x 120, line 1 top y 1090,
 * solid paper plate (x 108 → text end + 12, y 1080 → last line + 3), inkDeep text, `>` prompt in ink at x 72,
 * 4-frame scramble resolve, emphasis by inversion (paper on inkDeep).
 */
import { CAPTION, FPS, PALETTE, font } from '../config';
import type { TimelineCaption } from '../engine/types';
import { scrambleState } from './scramble';

interface Line {
  text: string;
  /** Per-char emphasis flags. */
  em: boolean[];
}

/** Split caption text into ≤2 lines with per-char emphasis flags (`[word]` brackets + `emphasis` list). */
export function layoutCaption(c: TimelineCaption): Line[] {
  let plain = '';
  const em: boolean[] = [];
  let inBracket = false;
  for (const ch of c.text) {
    if (ch === '[') inBracket = true;
    else if (ch === ']') inBracket = false;
    else {
      plain += ch;
      em.push(inBracket);
    }
  }
  for (const phrase of c.emphasis ?? []) {
    const i = plain.indexOf(phrase);
    if (i >= 0) for (let j = i; j < i + phrase.length; j++) em[j] = true;
  }
  const lines: Line[] = [];
  let start = 0;
  const push = (end: number) => {
    lines.push({ text: plain.slice(start, end).trimEnd(), em: em.slice(start, end) });
  };
  if (plain.includes('\n')) {
    for (let i = 0; i <= plain.length; i++) {
      if (i === plain.length || plain[i] === '\n') {
        push(i);
        start = i + 1;
      }
    }
  } else {
    // greedy word wrap at maxChars
    let lineStart = 0;
    let lastSpace = -1;
    for (let i = 0; i < plain.length; i++) {
      if (plain[i] === ' ') lastSpace = i;
      if (i - lineStart >= CAPTION.maxChars && lastSpace > lineStart) {
        start = lineStart;
        push(lastSpace);
        lineStart = lastSpace + 1;
      }
    }
    start = lineStart;
    push(plain.length);
  }
  return lines.slice(0, CAPTION.maxLines);
}

/** Active caption for a frame (frame-accurate: round(start·30) ≤ frame < round(end·30)); later start wins. */
export function activeCaption(captions: readonly TimelineCaption[], frame: number): TimelineCaption | null {
  if (frame < CAPTION.noneBefore || frame > CAPTION.noneAfter) return null;
  let best: TimelineCaption | null = null;
  for (const c of captions) {
    if (frame >= Math.round(c.start * FPS) && frame < Math.round(c.end * FPS) && (!best || c.start >= best.start)) best = c;
  }
  return best;
}

/** Draw the caption active at `frame` (if any) onto `ctx` (crisp layer, identity transform). */
export function captionRenderer(ctx: CanvasRenderingContext2D, captions: readonly TimelineCaption[], frame: number): void {
  const c = activeCaption(captions, frame);
  if (!c) return;
  const lines = layoutCaption(c);
  const k = frame - Math.round(c.start * FPS);
  const f = font('glyph', CAPTION.px);
  ctx.save();
  ctx.font = f;
  const adv = ctx.measureText('M').width;
  const maxLen = Math.max(...lines.map((l) => l.text.length));
  const plateBottom = CAPTION.line1Y + CAPTION.lineH * lines.length + 3;
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(CAPTION.plateX, CAPTION.plateY, CAPTION.x - CAPTION.plateX + maxLen * adv + CAPTION.pad, plateBottom - CAPTION.plateY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('>', CAPTION.promptX, CAPTION.line1Y + CAPTION.lineH / 2);
  lines.forEach((line, li) => {
    const y = CAPTION.line1Y + li * CAPTION.lineH;
    const chars = scrambleState(line.text, k, CAPTION.resolveFrames) ?? [];
    // emphasis plates (contiguous runs)
    ctx.fillStyle = PALETTE.inkDeep;
    for (let i = 0; i < line.text.length; i++) {
      if (!line.em[i] || i >= chars.length) continue;
      let j = i;
      while (j + 1 < line.text.length && line.em[j + 1] && j + 1 < chars.length) j++;
      ctx.fillRect(CAPTION.x + i * adv - 4, y + 2, (j - i + 1) * adv + 8, CAPTION.lineH - 4);
      i = j;
    }
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') continue;
      ctx.fillStyle = line.em[i] ? PALETTE.paper : PALETTE.inkDeep;
      ctx.fillText(chars[i], CAPTION.x + i * adv, y + CAPTION.lineH / 2);
    }
  });
  ctx.restore();
}
