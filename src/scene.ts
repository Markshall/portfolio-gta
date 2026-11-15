// The hero's sunset scene: a procedurally drawn skyline, stars, birds, sea glints and palm fronds, filled
// into the markup in src/partials/scene.html. Shared by the home page and the 404 page.

const SVG_NS = "http://www.w3.org/2000/svg";
const $ = (sel: string) => document.querySelector<SVGElement>(sel)!;

/* ───────────── The scene: procedurally drawn skyline, stars and sea glints ───────────── */

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function el(name: string, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

export function drawScene() {
  const r = rng(1986);

  const stars = $("[data-stars]");
  for (let i = 0; i < 60; i++) {
    stars.append(
      el("circle", { cx: r() * 1600, cy: r() * r() * 230, r: 0.6 + r() * 1.3, opacity: 0.2 + r() * 0.5 }),
    );
  }

  const skyline = $("[data-skyline]");
  const base = 642;
  const layers = [
    // A hazy far row, then the downtown silhouette against the sun.
    { fill: "#a24a92", min: 40, max: 120, step: [26, 60], windows: 0 },
    { fill: "#2a1447", min: 24, max: 190, step: [18, 52], windows: 0.16 },
  ];
  for (const layer of layers) {
    const g = el("g", { fill: layer.fill });
    let x = 250 + r() * 40;
    while (x < 1350) {
      const w = layer.step[0] + r() * (layer.step[1] - layer.step[0]);
      // Taller towers towards the centre, like a downtown cluster.
      const centre = 1 - Math.min(1, Math.abs(x - 760) / 520);
      const h = layer.min + r() * (layer.max - layer.min) * (0.35 + centre);
      g.append(el("rect", { x, y: base - h, width: w, height: h + 2 }));
      if (r() > 0.75) g.append(el("rect", { x: x + w / 2 - 1, y: base - h - 26, width: 2, height: 26 }));
      if (layer.windows) {
        for (let wy = base - h + 8; wy < base - 8; wy += 9) {
          for (let wx = x + 4; wx < x + w - 6; wx += 7) {
            if (r() < layer.windows) {
              g.append(el("rect", { x: wx, y: wy, width: 3, height: 4, fill: "#ffe9a8", opacity: 0.35 + r() * 0.5 }));
            }
          }
        }
      }
      x += w + r() * 8;
    }
    skyline.append(g);
  }

  drawFronds(r);

  // A loose flock crossing the sun.
  const birds = $("[data-birds]");
  for (let i = 0; i < 9; i++) {
    const x = 560 + r() * 520;
    const y = 300 + r() * 190;
    const s = 5 + r() * 7;
    const d = `M${x - s} ${y - s * 0.3}Q${x - s * 0.45} ${y - s * 0.75} ${x} ${y}Q${x + s * 0.45} ${y - s * 0.75} ${x + s} ${y - s * 0.3}`;
    birds.append(el("path", { d, opacity: 0.55 + r() * 0.4 }));
  }

  const ripples = $("[data-ripples]");
  for (let y = 648; y < 960; y += 6 + (y - 640) * 0.04) {
    const t = (y - 640) / 320;
    const w = 120 + t * 420 * (0.4 + r());
    const x = 800 - w / 2 + (r() - 0.5) * 40 * t;
    ripples.append(
      el("rect", {
        x,
        y,
        width: w,
        height: 1.5 + t * 3,
        rx: 2,
        fill: t < 0.3 ? "#fff3b8" : t < 0.6 ? "#ffb26b" : "#e9639b",
        opacity: (1 - t) * 0.8,
      }),
    );
  }
}

type Pt = [number, number];
const FRONDS: [Pt, Pt, Pt][] = [
  [[150, 80], [80, 92], [18, 176]],
  [[160, 60], [110, 32], [52, 44]],
  [[222, 60], [252, 22], [306, 12]],
  [[272, 80], [342, 94], [392, 166]],
  [[262, 122], [322, 172], [350, 266]],
  [[160, 132], [100, 182], [70, 284]],
  [[204, 72], [184, 30], [150, 2]],
  [[240, 140], [270, 210], [262, 300]],
];

// Each frond is a curved leaf whose edges are jagged into drooping leaflets.
function drawFronds(r: () => number) {
  const base: Pt = [212, 126];
  const g = $("[data-fronds]");
  for (const [c1, c2, end] of FRONDS) {
    const at = (t: number): Pt => {
      const u = 1 - t;
      return [0, 1].map(
        i => u * u * u * base[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * end[i],
      ) as Pt;
    };
    const left: Pt[] = [];
    const right: Pt[] = [];
    const steps = 34;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [x, y] = at(t);
      const [nx2, ny2] = at(Math.min(1, t + 0.01));
      const [px, py] = at(Math.max(0, t - 0.01));
      const len = Math.hypot(nx2 - px, ny2 - py) || 1;
      const tx = (nx2 - px) / len;
      const ty = (ny2 - py) / len;
      const w = 30 * Math.pow(Math.sin(Math.PI * Math.min(t * 1.15, 1)), 0.7) * (1 - 0.35 * t);
      const k = i % 2 ? 1 : 0.25;
      const droop = (i % 2 ? 0.55 : 0) * w;
      left.push([x - ty * w * k - tx * droop, y + tx * w * k - ty * droop + droop * 0.4]);
      right.push([x + ty * w * k - tx * droop, y - tx * w * k - ty * droop + droop * 0.6 + r() * 2]);
    }
    const pts = [...left, ...right.reverse()].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    g.append(el("polygon", { points: pts }));
  }
  g.append(el("circle", { cx: base[0], cy: base[1], r: 12 }));
}
