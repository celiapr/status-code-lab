"""
Builds the images of the human verification CAPTCHA ("Select everything
that gets tired") and writes them into HUMAN_CHECK in content.js.

Each object is modelled in 3D with simple shapes (spheres, capsules, boxes),
lit from the top left, and the light and shadow are turned into characters
(" .:-=+*#%@", light to dark) - like turning a photo into ASCII.

Run it with:   python3 tools/make_images.py          (updates content.js)
Preview only:  python3 tools/make_images.py preview
It rewrites HUMAN_CHECK in content.js, so hand edits made there will be lost.
No extra libraries needed.
"""
import math, os, json

RAMP = " .:-=+*#%@"          # light -> dark
DARK_BACKGROUND = True   # the game is white on black; set to False for black on white
ASPECT = 1.75                # a character is this many times taller than wide

# ---------------- small vector helpers ----------------
def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
def length(a): return math.sqrt(dot(a, a))
def norm(a):
    l = length(a) or 1
    return (a[0]/l, a[1]/l, a[2]/l)
def clamp(x, a, b): return max(a, min(b, x))

# ---------------- shapes (signed distance functions) ----------------
def sphere(c, r):
    return lambda p: length(sub(p, c)) - r

def ellipsoid(c, rad):
    def f(p):
        q = sub(p, c)
        k0 = length((q[0]/rad[0], q[1]/rad[1], q[2]/rad[2]))
        k1 = length((q[0]/rad[0]**2, q[1]/rad[1]**2, q[2]/rad[2]**2))
        return k0*(k0-1)/k1 if k1 > 0 else -min(rad)
    return f

def capsule(a, b, ra, rb=None):
    rb = ra if rb is None else rb
    def f(p):
        pa, ba = sub(p, a), sub(b, a)
        h = clamp(dot(pa, ba)/dot(ba, ba), 0, 1)
        return length((pa[0]-ba[0]*h, pa[1]-ba[1]*h, pa[2]-ba[2]*h)) - (ra + (rb-ra)*h)
    return f

def box(c, half, r=0.0):
    def f(p):
        q = [abs(p[i]-c[i]) - half[i] + r for i in range(3)]
        out = length((max(q[0], 0), max(q[1], 0), max(q[2], 0)))
        return out + min(max(q[0], q[1], q[2]), 0) - r
    return f

def cylinder(c, r, h, axis="y"):
    def f(p):
        q = sub(p, c)
        if axis == "y": radial, along = math.hypot(q[0], q[2]), q[1]
        elif axis == "z": radial, along = math.hypot(q[0], q[1]), q[2]
        else: radial, along = math.hypot(q[1], q[2]), q[0]
        d = (radial - r, abs(along) - h)
        return min(max(d[0], d[1]), 0) + math.hypot(max(d[0], 0), max(d[1], 0))
    return f

def gear(c, r, teeth, depth, h):
    def f(p):
        q = sub(p, c)
        ang = math.atan2(q[1], q[0])
        rr = r + (depth if math.sin(teeth*ang) > 0 else 0)
        radial = math.hypot(q[0], q[1])
        d = (radial - rr, abs(q[2]) - h)
        hole = math.hypot(q[0], q[1]) - r*0.3
        base = min(max(d[0], d[1]), 0) + math.hypot(max(d[0], 0), max(d[1], 0))
        return max(base, -hole)
    return f

def torus_z(c, R, r):
    """a ring facing the viewer (like a cup handle or a clock rim)"""
    def f(p):
        q = sub(p, c)
        return math.hypot(math.hypot(q[0], q[1]) - R, q[2]) - r
    return f

def path(points, r0, r1, k=0.08):
    """a tube along a list of points, thinning from r0 to r1 (banana, chilli…)"""
    n = len(points) - 1
    return union(*[capsule(points[i], points[i+1], r0 + (r1-r0)*i/n, r0 + (r1-r0)*(i+1)/n) for i in range(n)], k=k)

def union(*fs, k=0.0):
    def f(p):
        d = fs[0](p)
        for g in fs[1:]:
            e = g(p)
            if k > 0:
                hh = max(k - abs(d - e), 0) / k
                d = min(d, e) - hh*hh*k*0.25
            else:
                d = min(d, e)
        return d
    return f

def cut(a, b):            # a minus b
    return lambda p: max(a(p), -b(p))

def clip_below(a, y):     # keep only the part of a above y
    return lambda p: max(a(p), y - p[1])

def clip_above(a, y):     # keep only the part of a below y
    return lambda p: max(a(p), p[1] - y)

# ---------------- the renderer ----------------
LIGHT = norm((-0.55, 0.75, 0.65))

def rotate(p, pitch, yaw):
    x, y, z = p
    c, s = math.cos(yaw), math.sin(yaw)
    x, z = c*x + s*z, -s*x + c*z
    c, s = math.cos(pitch), math.sin(pitch)
    y, z = c*y - s*z, s*y + c*z
    return (x, y, z)

def render(parts, W=32, H=15, X=1.1, overlay=None, labels=(), yshift=0.0, view=(0.0, 0.0)):
    """parts: list of (shape, albedo 0..1, lighter is higher).
       overlay(x, y, darkness) -> new darkness (draw flat details on top).
       labels: (x, y, text) written on top."""
    cw = 2*X / W
    ch = cw * ASPECT
    Y = H * ch / 2

    pitch, yaw = view
    def scene(p):
        if pitch or yaw: p = rotate(p, pitch, yaw)
        best, alb = 1e9, 1.0
        for f, a in parts:
            d = f(p)
            if d < best: best, alb = d, a
        return best, alb

    def shade(x, y):
        t, z0 = 0.0, 3.0
        for _ in range(90):
            p = (x, y, z0 - t)
            d, alb = scene(p)
            if d < 0.002:
                e = 0.004
                n = norm((scene((p[0]+e, p[1], p[2]))[0] - scene((p[0]-e, p[1], p[2]))[0],
                          scene((p[0], p[1]+e, p[2]))[0] - scene((p[0], p[1]-e, p[2]))[0],
                          scene((p[0], p[1], p[2]+e))[0] - scene((p[0], p[1], p[2]-e))[0]))
                diff = max(dot(n, LIGHT), 0)
                rim = (1 - abs(n[2])) ** 2           # edges a bit darker: reads as volume
                refl = 2*dot(n, LIGHT)*n[2] - LIGHT[2]
                spec = max(refl, 0) ** 14            # a small highlight
                b = alb * (0.34 + 0.66*diff) - 0.12*rim + 0.18*spec
                return clamp(1 - b, 0.12, 1.0), True
            t += d
            if t > 6: break
        return 0.0, False

    rows = []
    for j in range(H):
        row = ""
        for i in range(W):
            acc, hits = 0.0, 0
            for sx, sy in ((0.25, 0.25), (0.75, 0.25), (0.25, 0.75), (0.75, 0.75)):
                x = -X + (i + sx) * cw
                y = Y - (j + sy) * ch + yshift
                d, hit = shade(x, y)
                if overlay:
                    o = overlay(x, y, d if hit else 0.0)
                    if o is not None: d, hit = o, True
                if hit: acc += d; hits += 1
            if hits < 2: row += " "; continue
            dark = acc / hits
            if DARK_BACKGROUND: dark = 1.05 - dark      # light parts get the dense characters
            row += RAMP[max(1, min(len(RAMP) - 1, int(round(dark * (len(RAMP) - 1)))))]
        rows.append(row)
    for (lx, ly, text) in labels:
        col = int((lx + X) / cw - len(text) / 2 + 0.5)
        r = int((Y - ly + yshift) / ch)
        if 0 <= r < H:
            s = list(rows[r])
            for k, c in enumerate(text):
                if 0 <= col + k < W: s[col + k] = c
            rows[r] = "".join(s)
    return trim(rows)

def trim(rows):
    while rows and not rows[0].strip(): rows.pop(0)
    while rows and not rows[-1].strip(): rows.pop()
    left = min(len(r) - len(r.lstrip()) for r in rows if r.strip())
    return [r[left:].rstrip() for r in rows]

# ---------------- flat details drawn on top ----------------
def in_ellipse(x, y, cx, cy, rx, ry): return ((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1
def near_seg(x, y, a, b, w):
    ax, ay = a; bx, by = b
    vx, vy = bx-ax, by-ay
    h = clamp(((x-ax)*vx + (y-ay)*vy) / (vx*vx + vy*vy), 0, 1)
    return math.hypot(x-ax-vx*h, y-ay-vy*h) <= w
def near_curve(x, y, f, x0, x1, w):
    return x0 <= x <= x1 and abs(y - f(x)) <= w

# =====================================================================
# HUMAN VERIFICATION: things that get tired (or not)
# =====================================================================
def make_human():
    H = {}
    # palm + four fingers spread like a fan + thumb
    palm = ellipsoid((0.05, -0.35, 0), (0.5, 0.5, 0.2))
    tips = [((-0.32, 0.05), (-0.62, 0.72)), ((-0.1, 0.12), (-0.18, 0.95)), ((0.14, 0.12), (0.22, 0.95)), ((0.36, 0.05), (0.6, 0.68))]
    fingers = [capsule((bx, by, 0), (tx, ty, 0), 0.11, 0.085) for (bx, by), (tx, ty) in tips]
    thumb = capsule((-0.35, -0.5, 0.02), (-0.85, -0.05, 0.05), 0.13, 0.1)
    H["hand"] = render([(union(palm, *fingers, thumb, k=0.12), 0.9)], view=(0.0, -0.25),
                       overlay=lambda x, y, d: 0.85 if d and near_curve(x, y, lambda u: -0.18 - 0.3*(u - 0.05)**2, -0.25, 0.35, 0.025) else None)
    H["eye"] = render([(ellipsoid((0, 0, 0), (0.95, 0.45, 0.4)), 1.0)],
                      overlay=lambda x, y, d: (1.0 if d and math.hypot(x, y) < 0.13 else
                                               (0.75 if d and math.hypot(x, y) < 0.32 else
                                                (0.9 if d and abs(y) > 0.3 else None))))
    H["foot"] = render([(union(capsule((-0.6, -0.4, 0), (0.45, -0.5, 0), 0.24, 0.2), capsule((-0.62, -0.25, 0), (-0.58, 0.85, 0), 0.24), k=0.35), 0.88)] +
                       [(sphere((0.58, -0.47 + 0.02*i, 0.12 - 0.08*i), 0.11 - 0.012*i), 0.88) for i in range(4)], view=(0.15, -0.3))
    H["heart"] = render([(union(sphere((-0.38, 0.2, 0), 0.45), sphere((0.38, 0.2, 0), 0.45),
                                lambda p: max(abs(p[0]) - (p[1] + 0.85)*0.82, -0.85 - p[1], p[1] - 0.25, abs(p[2]) - 0.4 + (abs(p[0]))*0.2), k=0.25), 0.55)])
    # a light bulb: glass globe, neck, threaded base
    glass = union(sphere((0, 0.3, 0), 0.52), capsule((0, 0.0, 0), (0, -0.3, 0), 0.26, 0.22), k=0.2)
    base = cylinder((0, -0.5, 0), 0.22, 0.18, "y")
    H["bulb"] = render([(glass, 1.0), (base, 0.5), (sphere((0, -0.72, 0), 0.08), 0.3)], view=(0.15, -0.2),
                       overlay=lambda x, y, d: 1.0 if d and -0.66 < y < -0.34 and abs(((y + 0.66) % 0.11) - 0.055) < 0.02 else None)
    H["clock"] = render([(cylinder((0, 0, 0), 0.82, 0.12, "z"), 0.95), (torus_z((0, 0, 0.02), 0.84, 0.1), 0.45)],
                        overlay=lambda x, y, d: 1.0 if d and (near_seg(x, y, (0, 0), (0, 0.55), 0.04) or near_seg(x, y, (0, 0), (0.38, -0.1), 0.045) or
                                                         any(math.hypot(x - 0.66*math.cos(a), y - 0.66*math.sin(a)) < 0.05 for a in [k*math.pi/6 for k in range(12)])) else None)
    H["gear"] = render(view=(0.3, -0.3), parts=[(gear((0, 0, 0), 0.62, 8, 0.2, 0.15), 0.55)])
    H["calculator"] = render(view=(0.15, -0.35), parts=[(box((0, 0, 0), (0.55, 0.85, 0.12), 0.05), 0.6)],
                             overlay=lambda x, y, d: (0.1 if d and abs(x) < 0.42 and 0.4 < y < 0.72 else
                                                      (0.15 if d and y < 0.25 and (abs(((x + 0.42) % 0.28) - 0.14) < 0.07 and abs(((y + 0.75) % 0.25) - 0.125) < 0.06) else None)))
    # a robot head: square head, antenna, ears, round eyes, grille mouth
    head = box((0, -0.05, 0), (0.62, 0.5, 0.35), 0.08)
    antenna = union(capsule((0, 0.45, 0), (0, 0.72, 0), 0.04), sphere((0, 0.78, 0), 0.1))
    ears = union(cylinder((-0.68, -0.05, 0), 0.14, 0.08, "x"), cylinder((0.68, -0.05, 0), 0.14, 0.08, "x"))
    H["robot"] = render([(head, 0.7), (antenna, 0.5), (ears, 0.45)], view=(0.1, -0.35),
                        overlay=lambda x, y, d: (1.0 if d and any(math.hypot(x - ex, y - 0.08) < 0.14 for ex in (-0.26, 0.26)) else
                                                 (0.95 if d and abs(x) < 0.33 and -0.38 < y < -0.22 and abs(((x + 0.33) % 0.11) - 0.055) < 0.025 else None)))
    return H

# =====================================================================
TIRED = {"hand", "eye", "foot", "heart"}      # the right answers

def js_art(rows):
    return "String.raw`\n" + "\n".join(rows) + "\n`"

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    path_ = os.path.join(here, "..", "content.js")
    human = make_human()
    block = ["const HUMAN_CHECK = ["]
    for name, rows in human.items():
        assert "`" not in "".join(rows), name
        flag = "tired:true, " if name in TIRED else ""
        block.append(f'  {{ name:"{name}", {flag}art:{js_art(rows)} }},')
    block.append("];")
    s = open(path_, encoding="utf-8").read()
    start = s.index("const HUMAN_CHECK = [")
    end = s.index("];", start) + 2
    s = s[:start] + "\n".join(block) + s[end:]
    open(path_, "w", encoding="utf-8").write(s)
    print("updated HUMAN_CHECK in", os.path.normpath(path_))

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        for k, v in make_human().items():
            print(k); print("\n".join(v)); print()
    else:
        main()
