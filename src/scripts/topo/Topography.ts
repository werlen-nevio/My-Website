import { createNoise3D, type Noise3D } from './noise';

/**
 * Topography – contour lines of a slowly drifting terrain, like a map of
 * the Valais Alps that is still being surveyed.
 *
 * A height field (three octaves of 3D simplex noise, time as the third
 * axis) is sampled on a coarse grid and traced with marching squares.
 * Where the mouse is, a hill rises and the lines ring around it.
 *
 * Only the cells that actually cross a level do any work; everything is
 * drawn in two strokes (regular and index lines). ~30 fps, paused when
 * off-screen or in a hidden tab, a single static frame for reduced motion.
 */

interface Options {
    reduced: boolean;
    small: boolean;
    /** React to the mouse with a rising hill. */
    pointer?: boolean;
    /** Drift speed multiplier. */
    speed?: number;
    /** Overall line opacity multiplier. */
    intensity?: number;
    seed?: number;
}

const STEP = 0.075; // height difference between two contour lines
const INDEX_EVERY = 5; // every 5th line is an index contour

export class Topography {
    private ctx: CanvasRenderingContext2D;
    private noise: Noise3D;
    private w = 0;
    private h = 0;
    private cell = 14;
    private cols = 0;
    private rows = 0;
    private field = new Float32Array(0);
    private regular: number[] = [];
    private index: number[] = [];
    /** segments close to the pointer – drawn brighter, so the hill reads */
    private near: number[] = [];
    private nearIndex: number[] = [];

    private time = 0;
    private last = 0;
    private raf = 0;
    private visible = true;

    /** 0…1 – fades the whole map in and out */
    private alpha = 1;
    private fade: { from: number; to: number; t0: number; dur: number } | null = null;
    /** extra drift during the intro: the terrain «settles» */
    private warp = 0;

    private pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, amp: 0, on: false };

    constructor(
        private canvas: HTMLCanvasElement,
        private opts: Options,
    ) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D canvas not supported');
        this.ctx = ctx;
        this.noise = createNoise3D(opts.seed ?? 7);
        this.time = (opts.seed ?? 7) * 13.7;
        this.resize();

        new IntersectionObserver(([e]) => {
            this.visible = e.isIntersecting;
            this.visible ? this.play() : this.pause();
        }).observe(canvas);
        document.addEventListener('visibilitychange', () => (document.hidden ? this.pause() : this.play()));

        if (opts.pointer && !opts.reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            window.addEventListener('pointermove', this.onPointer, { passive: true });
            document.documentElement.addEventListener('pointerleave', () => (this.pointer.on = false));
        }
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.w = Math.max(1, rect.width);
        this.h = Math.max(1, rect.height);
        const dpr = Math.min(window.devicePixelRatio || 1, this.opts.small ? 1.5 : 2);
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.cell = this.opts.small ? 18 : 14;
        this.cols = Math.ceil(this.w / this.cell) + 1;
        this.rows = Math.ceil(this.h / this.cell) + 1;
        this.field = new Float32Array((this.cols + 1) * (this.rows + 1));
        this.render();
    }

    /** Intro: the map fades in while the terrain drifts into its resting shape. */
    intro(seconds = 2.4) {
        this.fadeTo(0, 1, seconds);
        this.warp = 1;
        this.play();
    }

    fadeIn(seconds = 1.2) {
        this.fadeTo(0, 1, seconds);
        this.play();
    }

    fadeOut(seconds = 0.5) {
        this.fadeTo(this.alpha, 0, seconds);
        this.play();
    }

    play() {
        if (this.opts.reduced || this.raf || !this.visible || document.hidden) return;
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.frame);
    }

    pause() {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
    }

    private fadeTo(from: number, to: number, seconds: number) {
        this.alpha = from;
        this.fade = { from, to, t0: performance.now(), dur: seconds * 1000 };
    }

    private onPointer = (e: PointerEvent) => {
        const r = this.canvas.getBoundingClientRect();
        this.pointer.tx = e.clientX - r.left;
        this.pointer.ty = e.clientY - r.top;
        this.pointer.on = this.pointer.ty > -60 && this.pointer.ty < r.height + 60 && this.pointer.tx > -60 && this.pointer.tx < r.width + 60;
        if (this.pointer.x < -1e3) {
            this.pointer.x = this.pointer.tx;
            this.pointer.y = this.pointer.ty;
        }
    };

    private frame = (now: number) => {
        this.raf = 0;
        const dt = Math.min(0.1, (now - this.last) / 1000);
        // ~30 fps is plenty for slow terrain
        if (dt < 1 / 32 && !this.fade) {
            this.raf = requestAnimationFrame(this.frame);
            return;
        }
        this.last = now;

        if (this.fade) {
            const k = Math.min(1, (now - this.fade.t0) / this.fade.dur);
            const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
            this.alpha = this.fade.from + (this.fade.to - this.fade.from) * e;
            if (k >= 1) this.fade = null;
        }
        this.warp = Math.max(0, this.warp - dt * 0.45);
        this.time += dt * (this.opts.speed ?? 1) * (1 + this.warp * this.warp * 14);

        const p = this.pointer;
        p.x += (p.tx - p.x) * 0.12;
        p.y += (p.ty - p.y) * 0.12;
        p.amp += ((p.on ? 1 : 0) - p.amp) * 0.06;

        this.render();
        this.play();
    }

    /** Samples the height field and traces it. */
    private render() {
        const { ctx, cols, rows, cell, field, noise } = this;
        const z = this.time * 0.035;
        const sc = this.opts.small ? 1 / 300 : 1 / 430;
        const p = this.pointer;
        const sigma2 = 2 * (this.opts.small ? 90 : 120) ** 2;
        const hill = p.amp * 0.75;

        for (let r = 0; r <= rows; r++) {
            const y = r * cell;
            for (let c = 0; c <= cols; c++) {
                const x = c * cell;
                let v =
                    0.62 * noise(x * sc, y * sc, z) +
                    0.27 * noise(x * sc * 2.1 + 3.1, y * sc * 2.1 - 1.7, z * 1.3) +
                    (this.opts.small ? 0 : 0.11 * noise(x * sc * 4.6 - 7.2, y * sc * 4.6 + 2.9, z * 1.7));
                if (hill > 0.002) {
                    const dx = x - p.x;
                    const dy = y - p.y;
                    v += hill * Math.exp(-(dx * dx + dy * dy) / sigma2);
                }
                field[r * (cols + 1) + c] = v;
            }
        }

        this.trace();

        ctx.clearRect(0, 0, this.w, this.h);
        if (this.alpha <= 0.002) return;
        const k = this.alpha * (this.opts.intensity ?? 1);
        ctx.lineJoin = 'round';
        this.stroke(this.regular, `rgba(150, 162, 255, ${0.11 * k})`, 1);
        this.stroke(this.index, `rgba(172, 182, 255, ${0.26 * k})`, 1.25);
        const glow = k * this.pointer.amp;
        this.stroke(this.near, `rgba(160, 172, 255, ${0.3 * glow})`, 1);
        this.stroke(this.nearIndex, `rgba(190, 198, 255, ${0.55 * glow})`, 1.3);
    }

    private stroke(seg: number[], color: string, width: number) {
        if (!seg.length) return;
        const { ctx } = this;
        ctx.beginPath();
        for (let i = 0; i < seg.length; i += 4) {
            ctx.moveTo(seg[i], seg[i + 1]);
            ctx.lineTo(seg[i + 2], seg[i + 3]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    /** Marching squares over every level a cell actually crosses (allocation-free). */
    private trace() {
        const { cols, rows, cell, field } = this;
        const regular = this.regular;
        const index = this.index;
        const near = this.near;
        const nearIndex = this.nearIndex;
        regular.length = 0;
        index.length = 0;
        near.length = 0;
        nearIndex.length = 0;
        const W = cols + 1;
        const p = this.pointer;
        const R2 = (this.opts.small ? 150 : 200) ** 2;
        const usePointer = p.amp > 0.02;

        for (let r = 0; r < rows; r++) {
            const y0 = r * cell;
            const y1 = y0 + cell;
            for (let c = 0; c < cols; c++) {
                const a = field[r * W + c];
                const b = field[r * W + c + 1];
                const cc = field[(r + 1) * W + c + 1];
                const d = field[(r + 1) * W + c];
                const kStart = Math.ceil(Math.min(a, b, cc, d) / STEP);
                const kEnd = Math.floor(Math.max(a, b, cc, d) / STEP);
                if (kStart > kEnd) continue;
                const x0 = c * cell;
                const x1 = x0 + cell;
                const dxp = x0 - p.x;
                const dyp = y0 - p.y;
                const isNear = usePointer && dxp * dxp + dyp * dyp < R2;

                for (let k = kStart; k <= kEnd; k++) {
                    const L = k * STEP;
                    const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (cc > L ? 2 : 0) | (d > L ? 1 : 0);
                    if (idx === 0 || idx === 15) continue;
                    const isIndex = k % INDEX_EVERY === 0;
                    const out = isNear ? (isIndex ? nearIndex : near) : isIndex ? index : regular;
                    // crossings on the top, right, bottom and left edge
                    const tX = x0 + ((L - a) / (b - a)) * cell;
                    const rY = y0 + ((L - b) / (cc - b)) * cell;
                    const bX = x0 + ((L - d) / (cc - d)) * cell;
                    const lY = y0 + ((L - a) / (d - a)) * cell;
                    switch (idx) {
                        case 1:
                        case 14:
                            out.push(x0, lY, bX, y1);
                            break;
                        case 2:
                        case 13:
                            out.push(bX, y1, x1, rY);
                            break;
                        case 3:
                        case 12:
                            out.push(x0, lY, x1, rY);
                            break;
                        case 4:
                        case 11:
                            out.push(tX, y0, x1, rY);
                            break;
                        case 6:
                        case 9:
                            out.push(tX, y0, bX, y1);
                            break;
                        case 7:
                        case 8:
                            out.push(x0, lY, tX, y0);
                            break;
                        case 5:
                            out.push(tX, y0, x0, lY, bX, y1, x1, rY);
                            break;
                        case 10:
                            out.push(tX, y0, x1, rY, x0, lY, bX, y1);
                            break;
                    }
                }
            }
        }
    }
}
