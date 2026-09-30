"""
Workflash Automation - 3D "Automation Core" generator
======================================================
Builds the 3D particle shapes shown in the "Automation Core" section of the
website and writes them to  assets/core3d.bin.  The browser (js/core3d.js)
only draws the points with WebGL and morphs between the shapes.

Shapes (same number of particles in each, so every particle flies from its
place in one shape to its place in the next):
    0  bolt   - the Workflash lightning bolt (the spark / your idea)
    1  gear   - an automation cog (processes that run themselves)
    2  brain  - a (2,3) torus knot wrapped in a neural shell (AI)
    3  globe  - a planet with data arcs between cities (scale everywhere)
    4  rings  - orbiting data rings, drawn on top of every shape

Run (Anaconda env from environment.yml, or any Python 3 with NumPy):
    python python/generate_3d_scene.py            # writes assets/core3d.bin
    python python/generate_3d_scene.py --n 9000   # denser shapes

File format (little-endian):
    4 bytes  b"WF3D"
    uint16   version (1)
    uint16   number of shapes (S)
    uint32   particles per shape (N)
    uint32   particles in the ring layer (R)
    float32  scale  (int16 value * scale = coordinate)
    int16    S * N * 3   xyz of the morphing shapes
    int16    R * 3       xyz of the ring layer
"""
from __future__ import annotations

import argparse
import struct
from pathlib import Path

import numpy as np

RNG = np.random.default_rng(2021)  # Workflash founded in 2021, fixed seed = same file every run
SCALE = 1.0 / 8000.0               # int16 range +-32767 -> +-4.1 units


# ---------------------------------------------------------------- helpers
def normalize(v: np.ndarray) -> np.ndarray:
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def fit(points: np.ndarray, radius: float = 1.55) -> np.ndarray:
    """Center a point cloud and scale it so it fits in a sphere of `radius`."""
    p = points - points.mean(axis=0)
    r = np.percentile(np.linalg.norm(p, axis=1), 99.5)
    return p * (radius / r)


def points_in_polygon(poly: np.ndarray, n: int) -> np.ndarray:
    """Uniform random 2D points inside a polygon (rejection sampling, ray casting)."""
    lo, hi = poly.min(0), poly.max(0)
    out = []
    while sum(len(o) for o in out) < n:
        c = RNG.uniform(lo, hi, size=(n * 3, 2))
        x, y = c[:, 0], c[:, 1]
        inside = np.zeros(len(c), bool)
        j = len(poly) - 1
        for i in range(len(poly)):
            xi, yi = poly[i]
            xj, yj = poly[j]
            cross = ((yi > y) != (yj > y)) & (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi)
            inside ^= cross
            j = i
        out.append(c[inside])
    return np.concatenate(out)[:n]


def points_on_outline(poly: np.ndarray, n: int) -> np.ndarray:
    """Points spread along the edges of a closed polygon, proportional to edge length."""
    a, b = poly, np.roll(poly, -1, axis=0)
    seg = np.linalg.norm(b - a, axis=1)
    idx = RNG.choice(len(seg), size=n, p=seg / seg.sum())
    t = RNG.random(n)[:, None]
    return a[idx] + (b[idx] - a[idx]) * t


def extrude(poly: np.ndarray, n: int, depth: float, edge_share: float = 0.55) -> np.ndarray:
    """A solid-looking 3D slab: crisp outlines on front/back faces, side walls, light fill."""
    n_edge = int(n * edge_share)
    n_side = int(n * 0.2)
    n_fill = n - n_edge - n_side
    e = points_on_outline(poly, n_edge)
    ez = RNG.choice([-depth / 2, depth / 2], size=n_edge)
    s = points_on_outline(poly, n_side)
    sz = RNG.uniform(-depth / 2, depth / 2, size=n_side)
    f = points_in_polygon(poly, n_fill)
    fz = RNG.uniform(-depth / 2, depth / 2, size=n_fill) * 0.8
    xy = np.concatenate([e, s, f])
    z = np.concatenate([ez, sz, fz])
    return np.column_stack([xy[:, 0], xy[:, 1], z])


# ---------------------------------------------------------------- shapes
def bolt(n: int) -> np.ndarray:
    # Same path as the logo icon:  M13 2 4 14h7l-1 8 9-12h-7z   (SVG y points down)
    poly = np.array([[13, 2], [4, 14], [11, 14], [10, 22], [19, 10], [12, 10]], float)
    poly[:, 1] *= -1
    pts = fit(extrude(poly, int(n * 0.92), depth=3.2), 1.75)
    # a thin halo of sparks around the bolt
    k = n - len(pts)
    spark = normalize(RNG.normal(size=(k, 3))) * RNG.uniform(1.9, 2.6, size=(k, 1))
    return np.concatenate([pts, spark])


def gear(n: int, teeth: int = 12) -> np.ndarray:
    ang = np.linspace(0, 2 * np.pi, teeth * 16, endpoint=False)
    # square-ish teeth: radius jumps between 1.0 and 1.22
    phase = (ang * teeth / (2 * np.pi)) % 1.0
    r = np.where((phase > 0.18) & (phase < 0.62), 1.24, 1.0)
    outer = np.column_stack([r * np.cos(ang), r * np.sin(ang)])
    n_body = int(n * 0.72)
    body = extrude(outer, n_body, depth=0.42, edge_share=0.5)
    # cut the hub hole and spokes out of the fill: keep points outside radius 0.38 unless on a spoke
    rr = np.linalg.norm(body[:, :2], axis=1)
    th = np.arctan2(body[:, 1], body[:, 0])
    spoke = np.abs(((th * 6 / (2 * np.pi)) % 1.0) - 0.5) < 0.09
    keep = (rr > 0.78) | ((rr > 0.3) & spoke) | ((rr > 0.26) & (rr < 0.36))
    body = body[keep]
    # inner hub ring (a tube)
    k = n - len(body)
    t = RNG.uniform(0, 2 * np.pi, k)
    u = RNG.uniform(0, 2 * np.pi, k)
    R, rt = 0.3, 0.06
    hub = np.column_stack([(R + rt * np.cos(u)) * np.cos(t), (R + rt * np.cos(u)) * np.sin(t), rt * 2.4 * np.sin(u)])
    pts = np.concatenate([body, hub])[:n]
    if len(pts) < n:  # top up on the rim
        extra = extrude(outer, n - len(pts), depth=0.42, edge_share=1.0)
        pts = np.concatenate([pts, extra])
    # tilt a little so it reads as 3D straight away
    a = 0.5
    rot = np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])
    return fit(pts @ rot.T, 1.6)


def brain(n: int) -> np.ndarray:
    """(2,3) torus knot tube + a sparse neural shell around it."""
    n_knot = int(n * 0.86)
    t = RNG.uniform(0, 2 * np.pi, n_knot)
    p, q = 2, 3
    r = 2 + np.cos(q * t)
    c = np.column_stack([r * np.cos(p * t), r * np.sin(p * t), -np.sin(q * t)])
    # tube around the curve: offset along a random direction perpendicular-ish, radius 0.35
    dt = 1e-3
    t2 = t + dt
    r2 = 2 + np.cos(q * t2)
    c2 = np.column_stack([r2 * np.cos(p * t2), r2 * np.sin(p * t2), -np.sin(q * t2)])
    tang = normalize(c2 - c)
    rnd = normalize(RNG.normal(size=(n_knot, 3)))
    perp = normalize(rnd - (rnd * tang).sum(1, keepdims=True) * tang)
    knot = c + perp * 0.36 * np.sqrt(RNG.random((n_knot, 1)))
    # neural shell: points on a slightly squashed sphere, clustered into "neurons"
    k = n - n_knot
    centers = normalize(RNG.normal(size=(60, 3)))
    which = RNG.integers(0, 60, k)
    shell = normalize(centers[which] + RNG.normal(scale=0.12, size=(k, 3))) * 3.4
    shell[:, 2] *= 0.8
    return fit(np.concatenate([knot, shell]), 1.65)


def globe(n: int) -> np.ndarray:
    n_sphere = int(n * 0.62)
    # Fibonacci sphere = evenly spread points
    i = np.arange(n_sphere) + 0.5
    phi = np.arccos(1 - 2 * i / n_sphere)
    th = np.pi * (1 + 5 ** 0.5) * i
    sph = np.column_stack([np.cos(th) * np.sin(phi), np.cos(phi), np.sin(th) * np.sin(phi)])
    # "continents": push some latitude bands of points slightly out so the globe has texture
    band = (np.sin(th * 0.5) * np.cos(phi * 3) > 0.35)
    sph[band] *= 1.035
    # data arcs between random "cities"
    k = n - n_sphere
    cities = normalize(RNG.normal(size=(26, 3)))
    pairs = RNG.integers(0, 26, size=(40, 2))
    pairs = pairs[pairs[:, 0] != pairs[:, 1]]
    which = RNG.integers(0, len(pairs), k)
    a, b = cities[pairs[which, 0]], cities[pairs[which, 1]]
    s = RNG.random((k, 1))
    omega = np.arccos(np.clip((a * b).sum(1, keepdims=True), -1, 1)) + 1e-6
    slerp = (np.sin((1 - s) * omega) * a + np.sin(s * omega) * b) / np.sin(omega)
    lift = 1 + 0.35 * np.sin(np.pi * s) * (omega / np.pi)  # arcs rise above the surface
    arcs = normalize(slerp) * lift
    return fit(np.concatenate([sph, arcs]), 1.55)


def rings(n: int) -> np.ndarray:
    out = []
    specs = [(2.15, 0.35, 0.0), (2.45, -0.5, 1.1), (2.75, 0.9, 2.2)]
    for k, (R, tilt, spin) in enumerate(specs):
        m = n // 3 if k < 2 else n - 2 * (n // 3)
        t = RNG.uniform(0, 2 * np.pi, m)
        # dashed look: points bunch into 18 packets per ring
        t = np.round(t * 18 / (2 * np.pi)) * (2 * np.pi / 18) + RNG.normal(scale=0.06, size=m)
        p = np.column_stack([R * np.cos(t), RNG.normal(scale=0.015, size=m), R * np.sin(t)])
        cx, sx = np.cos(tilt), np.sin(tilt)
        cy, sy = np.cos(spin), np.sin(spin)
        rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
        ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
        out.append(p @ rx.T @ ry.T)
    return np.concatenate(out) * 0.78


# ---------------------------------------------------------------- main
def build(n: int, n_rings: int) -> tuple[list[np.ndarray], np.ndarray]:
    shapes = [bolt(n), gear(n), brain(n), globe(n)]
    shapes = [s[RNG.permutation(len(s))][:n] for s in shapes]  # shuffle: any prefix is a fair sample (used on phones)
    return shapes, rings(n_rings)


def write(path: Path, shapes: list[np.ndarray], ring: np.ndarray) -> None:
    n = len(shapes[0])
    q = lambda a: np.clip(np.round(a / SCALE), -32767, 32767).astype("<i2")
    with path.open("wb") as f:
        f.write(b"WF3D")
        f.write(struct.pack("<HHIIf", 1, len(shapes), n, len(ring), SCALE))
        for s in shapes:
            f.write(q(s).tobytes())
        f.write(q(ring).tobytes())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--n", type=int, default=7000, help="particles per shape (default 7000)")
    ap.add_argument("--rings", type=int, default=1500, help="particles in the orbit rings (default 1500)")
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent.parent / "assets" / "core3d.bin")
    a = ap.parse_args()
    shapes, ring = build(a.n, a.rings)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    write(a.out, shapes, ring)
    kb = a.out.stat().st_size / 1024
    print(f"Wrote {a.out}  ({len(shapes)} shapes x {a.n:,} particles + {a.rings:,} ring particles, {kb:.0f} KB)")


if __name__ == "__main__":
    main()
