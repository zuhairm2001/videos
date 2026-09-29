/**
 * Grid snapping to the 12×20 ASCII cell grid (composition.md: motion snaps to it).
 */
import { CELL_H, CELL_W } from '../config';

/** Snap an x coordinate to the nearest cell column edge (multiple of 12). */
export const snapX = (x: number): number => Math.round(x / CELL_W) * CELL_W;
/** Snap a y coordinate to the nearest cell row edge (multiple of 20). */
export const snapY = (y: number): number => Math.round(y / CELL_H) * CELL_H;
/** Snap a point to the cell grid. */
export const snap = (p: { x: number; y: number }): { x: number; y: number } => ({ x: snapX(p.x), y: snapY(p.y) });
/** Column index containing x. */
export const col = (x: number): number => Math.floor(x / CELL_W);
/** Row index containing y. */
export const row = (y: number): number => Math.floor(y / CELL_H);
