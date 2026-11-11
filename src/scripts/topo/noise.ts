/**
 * 3D simplex noise – after Stefan Gustavson's public-domain reference
 * implementation. Deterministic per seed, returns roughly −1…1.
 */
const GRAD = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);
const F3 = 1 / 3;
const G3 = 1 / 6;

export type Noise3D = (x: number, y: number, z: number) => number;

export function createNoise3D(seed = 7): Noise3D {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = (Math.abs(seed) % 2147483646) + 1;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const tmp = p[i];
        p[i] = p[j];
        p[j] = tmp;
    }
    const perm = new Uint8Array(512);
    const mod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        mod12[i] = perm[i] % 12;
    }

    return (x, y, z) => {
        const sk = (x + y + z) * F3;
        const i = Math.floor(x + sk);
        const j = Math.floor(y + sk);
        const k = Math.floor(z + sk);
        const t = (i + j + k) * G3;
        const x0 = x - (i - t);
        const y0 = y - (j - t);
        const z0 = z - (k - t);

        let i1, j1, k1, i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
            else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
            else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
        } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
        else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
        else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];

        const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
        const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
        const ii = i & 255, jj = j & 255, kk = k & 255;

        let n = 0;
        let c = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (c > 0) {
            const g = mod12[ii + perm[jj + perm[kk]]] * 3;
            c *= c;
            n += c * c * (GRAD[g] * x0 + GRAD[g + 1] * y0 + GRAD[g + 2] * z0);
        }
        c = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (c > 0) {
            const g = mod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            c *= c;
            n += c * c * (GRAD[g] * x1 + GRAD[g + 1] * y1 + GRAD[g + 2] * z1);
        }
        c = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (c > 0) {
            const g = mod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            c *= c;
            n += c * c * (GRAD[g] * x2 + GRAD[g + 1] * y2 + GRAD[g + 2] * z2);
        }
        c = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (c > 0) {
            const g = mod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            c *= c;
            n += c * c * (GRAD[g] * x3 + GRAD[g + 1] * y3 + GRAD[g + 2] * z3);
        }
        return 32 * n;
    };
}
