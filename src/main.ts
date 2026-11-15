import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { PROJECTS, careerYears, siteHref, years } from "./data.ts";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];
const SVG_NS = "http://www.w3.org/2000/svg";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── Content ───────────── */

function fillStats() {
  $("[data-years]").textContent = String(careerYears());
  $("[data-project-total]").textContent = String(PROJECTS.length);
  $("[data-personal-total]").textContent = String(PROJECTS.filter(p => p.cat === "Personal").length);
  $("[data-year]").textContent = String(new Date().getFullYear());
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function renderProjects() {
  const total = String(PROJECTS.length).padStart(2, "0");
  $("[data-projects]").innerHTML = PROJECTS.map((p, i) => {
    const href = siteHref(p);
    const num = String(i + 1).padStart(2, "0");
    return `
      <article class="project" aria-labelledby="p-${p.id}">
        <div class="wrap project-inner">
          <div class="project-copy">
            <span class="project-ghost display" aria-hidden="true">${num}</span>
            <p class="project-num reveal">${num} / ${total} · ${p.cat}</p>
            <h3 id="p-${p.id}" class="display project-name reveal">${esc(p.name)}</h3>
            <p class="project-role display reveal">${esc(p.role)} <span>· ${years(p)}</span>${
              p.retired ? `<span class="retired-tag">Retired</span>` : ""
            }</p>
            <p class="project-summary reveal">${esc(p.summary)}</p>
            <ul class="chips reveal">${p.stack.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
            ${
              href
                ? `<div class="actions reveal"><a class="btn btn-lime" href="${href}" target="_blank" rel="noopener noreferrer">${
                    p.retired ? "View archived site" : "Visit site"
                  } ↗</a></div>`
                : ""
            }
          </div>
          <figure class="shot reveal">
            <div class="shot-bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(p.url)}</span></div>
            <div class="shot-view"><img src="/shots/${p.id}.webp" alt="The ${esc(p.name)} website" loading="lazy" decoding="async" /></div>
          </figure>
        </div>
      </article>`;
  }).join("");
}

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

function drawScene() {
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

/* ───────────── Hero: the logo scales out to reveal the scene ───────────── */

// Logo grid units. The zoom heads into the E's upright, where it meets the middle arm,
// so the hole keeps covering the screen as it grows.
const LOGO_W = 294;
const LOGO_H = 140;
const FOCUS = { x: 214, y: 70 };
// How far the solid upright around the focus reaches either side, and above and below.
const FOCUS_HALF_W = 20;
const FOCUS_HALF_H = 70;

function setupHero() {
  const xforms = $$<SVGGElement>("[data-logo-xform]");
  const state = { zoom: 0, intro: 0 };
  let layout = { b: 1, cx: 0, cy: 0, maxScale: 1, vw: 0, vh: 0 };

  const measure = () => {
    const vw = innerWidth;
    const vh = innerHeight;
    const logoW = Math.min(vw * (vw < 700 ? 0.74 : 0.5), (vh * 0.5 * LOGO_W) / LOGO_H, 680);
    const b = logoW / LOGO_W;
    const maxScale = 1.25 * Math.max(vw / (2 * FOCUS_HALF_W * b), vh / (2 * FOCUS_HALF_H * b));
    layout = { b, cx: vw / 2, cy: vh * 0.46, maxScale, vw, vh };
    render();
  };

  const render = () => {
    const { b, cx, cy, maxScale, vw, vh } = layout;
    const z = state.zoom;
    const s = b * Math.exp(Math.log(maxScale) * z) * (0.82 + 0.18 * state.intro);
    // Where the focus point sits on screen: in the logo at rest, the centre of the screen at full zoom.
    const restX = cx + (FOCUS.x - LOGO_W / 2) * b;
    const restY = cy + (FOCUS.y - LOGO_H / 2) * b;
    const k = Math.min(1, z * 1.6);
    const px = restX + (vw / 2 - restX) * k;
    const py = restY + (vh / 2 - restY) * k;
    const t = `translate(${px} ${py}) scale(${s}) translate(${-FOCUS.x} ${-FOCUS.y})`;
    for (const x of xforms) x.setAttribute("transform", t);
  };

  measure();
  addEventListener("resize", measure);

  // On load: the logo settles in and lights up.
  const fillInner = $("[data-logo-fill] > g");
  gsap.set(fillInner, { opacity: 0 });
  gsap
    .timeline({ delay: 0.15 })
    .to(state, { intro: 1, duration: 2.2, ease: "expo.out", onUpdate: render }, 0)
    .to(fillInner, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0.25)
    .from("[data-intro] > *", { opacity: 0, y: 16, duration: 1, stagger: 0.12, ease: "power3.out" }, 0.7);

  const layers = (name: string) => `[data-scene] [data-layer="${name}"]`;
  gsap.set(layers("sky"), { scale: 1.25 });
  gsap.set(layers("city"), { scale: 1.4 });
  gsap.set(layers("sea"), { scale: 1.35 });
  gsap.set(layers("palms"), { scale: 2.1 });

  const header = $("[data-header]");
  header.classList.add("is-hidden");

  const copy = $("[data-hero-copy]");
  gsap.set(copy, { autoAlpha: 0 });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: "[data-hero]",
      start: "top top",
      end: () => `+=${innerHeight * 2.6}`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => header.classList.toggle("is-hidden", self.progress < 0.82),
    },
  });

  tl.to("[data-intro]", { opacity: 0, y: -20, duration: 0.12 }, 0)
    .to("[data-logo-fill]", { opacity: 0, duration: 0.18, ease: "power1.in" }, 0.02)
    .to(state, { zoom: 1, duration: 0.62, ease: "power1.in", onUpdate: render }, 0.12)
    .to(layers("sky"), { scale: 1, duration: 0.7, ease: "power2.out" }, 0.12)
    .to(layers("city"), { scale: 1, duration: 0.7, ease: "power2.out" }, 0.12)
    .to(layers("sea"), { scale: 1, duration: 0.7, ease: "power2.out" }, 0.12)
    .to(layers("palms"), { scale: 1, duration: 0.72, ease: "power2.out" }, 0.12)
    .to("[data-ink]", { opacity: 0, duration: 0.06 }, 0.7)
    .to(copy, { autoAlpha: 1, duration: 0.01 }, 0.78)
    .from(
      copy.children,
      { opacity: 0, y: 60, duration: 0.16, stagger: 0.035, ease: "power3.out" },
      0.78,
    )
    .to({}, { duration: 0.08 });
}

/* ───────────── Scroll reveals ───────────── */

function setupReveals() {
  for (const node of $$(".reveal")) {
    gsap.from(node, {
      y: 70,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: node, start: "top 88%", once: true },
    });
  }

  // The statement lights up word by word as it scrolls past.
  const statement = $("[data-words]");
  statement.innerHTML = statement
    .textContent!.trim()
    .split(/\s+/)
    .map(w => `<span class="w">${esc(w)} </span>`)
    .join("");
  gsap.to($$(".w", statement), {
    opacity: 1,
    color: "#fff9cb",
    stagger: 0.1,
    ease: "none",
    scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 45%", scrub: true },
  });

  // Count the stats up.
  for (const dd of $$(".stats dd")) {
    const target = dd.querySelector("span") ?? dd;
    const end = Number(target.textContent);
    const counter = { v: 0 };
    gsap.to(counter, {
      v: end,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: dd, start: "top 90%", once: true },
      onUpdate: () => (target.textContent = String(Math.round(counter.v))),
    });
  }

  // Each screenshot holds at the top of the site until its frame is mostly on screen,
  // then scrolls through the whole page, reaching the bottom as the frame starts to leave the screen.
  for (const project of $$(".project")) {
    const frame = $(".shot-view", project);
    const img = $<HTMLImageElement>("img", frame);
    gsap.fromTo(
      img,
      { y: 0 },
      {
        y: () => Math.min(0, frame.clientHeight - img.offsetHeight),
        ease: "none",
        scrollTrigger: {
          trigger: frame,
          start: "top 55%",
          end: "top top",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    );
    img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

    // The big name drifts against the scroll, for depth.
    gsap.fromTo(
      $(".project-name", project),
      { yPercent: 18 },
      { yPercent: -18, ease: "none", scrollTrigger: { trigger: project, scrub: true } },
    );
  }

  ScrollTrigger.create({
    trigger: ".statement",
    start: "top top",
    end: "max",
    toggleClass: { targets: "[data-header]", className: "is-solid" },
  });
}

/* ───────────── Menu: a full-screen overlay behind the header ───────────── */

let lenis: Lenis | undefined;

function setupMenu() {
  const menu = $("[data-menu]");
  const toggle = $<HTMLButtonElement>("[data-menu-toggle]");
  const label = $("[data-menu-label]");
  const header = $("[data-header]");

  const set = (open: boolean) => {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    header.classList.toggle("is-menu", open);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close" : "Menu";
    if (open) lenis?.stop();
    else lenis?.start();
  };

  toggle.addEventListener("click", () => set(!menu.classList.contains("is-open")));
  // Close before the link is followed, so smooth scrolling is running again when it jumps.
  for (const a of $$("a", menu)) a.addEventListener("click", () => set(false));
  addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      set(false);
      toggle.focus();
    }
  });
}

/* ───────────── Boot ───────────── */

fillStats();
renderProjects();
drawScene();
setupMenu();

if (!reducedMotion) {
  // Load the screenshots eagerly so their heights are known before ScrollTrigger measures.
  for (const img of $$<HTMLImageElement>(".shot img")) img.loading = "eager";

  const smooth = (lenis = new Lenis({ lerp: 0.09, anchors: true }));
  smooth.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => smooth.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  setupHero();
  setupReveals();
  addEventListener("load", () => ScrollTrigger.refresh());
} else {
  for (const dd of $$(".site-header")) dd.classList.add("is-solid");
}
