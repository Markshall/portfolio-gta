// Exports the animated ME/VI logo to exports/ as a standalone animated SVG and an animated WebP.
//
//   npm run export:logo            WebP 1600px wide
//   npm run export:logo -- 800     WebP 800px wide
//
// The SVG is built from the logo's shapes and timings in src/logo.ts, which the site uses too, with the
// script-drawn palm fronds and the fixed parts of the logo's paths lifted from the running site. The WebP is that SVG rendered frame by frame in headless Chrome, so the two always match.
// Needs Google Chrome installed.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { createServer } from "vite";
import {
  DIM_DELAY,
  DIM_DURATION,
  FIRST_MORPH,
  HOLD_M,
  HOLD_VI,
  LEG_GHOST,
  LEG_REST,
  MORPH,
  logoPaths,
  pathTail,
} from "../src/logo.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "exports");
const webpWidth = Number(process.argv[2] ?? 1600);
if (!Number.isInteger(webpWidth) || webpWidth < 1) throw new Error(`Not a pixel width: ${process.argv[2]}`);

// The logo's 294×140 grid plus room for the outline.
const VIEW = { x: -10, y: -10, w: 314, h: 160 };
// Frames, and SVG keyframes, per second while the logo is changing.
const FPS = 30;

// One loop, in seconds from the start of the M's hold.
const CYCLE = HOLD_M + MORPH + HOLD_VI + MORPH;
const OUT = [HOLD_M, HOLD_M + MORPH]; // the M opens into the VI
const DIM = [OUT[1] + DIM_DELAY, OUT[1] + DIM_DELAY + DIM_DURATION]; // the leg's and the E's ghosts dim
const BACK = [HOLD_M + MORPH + HOLD_VI, CYCLE]; // the VI closes into the M
// Playback starts this far into the loop, so the first change comes FIRST_MORPH seconds in, as on the site.
const PHASE = HOLD_M - FIRST_MORPH;

// GSAP's power3.inOut and power1.out.
const power3InOut = (p) => (p < 0.5 ? 0.5 * (2 * p) ** 4 : 1 - 0.5 * (2 * (1 - p)) ** 4);
const power1Out = (p) => 1 - (1 - p) ** 2;
const lerp = (a, b, p) => a + (b - a) * p;
const progress = ([a, b], time) => Math.min(1, Math.max(0, (time - a) / (b - a)));

// t runs from the M (0) to the VI (1); leg is the opacity of the M's left leg and the E.
function stateAt(time) {
  if (time <= OUT[0]) return { t: 0, leg: 1 };
  if (time <= OUT[1]) {
    const p = power3InOut(progress(OUT, time));
    return { t: p, leg: lerp(1, LEG_GHOST, p) };
  }
  if (time <= DIM[1]) return { t: 1, leg: lerp(LEG_GHOST, LEG_REST, power1Out(progress(DIM, time))) };
  if (time <= BACK[0]) return { t: 1, leg: LEG_REST };
  const p = power3InOut(progress(BACK, time));
  return { t: 1 - p, leg: lerp(LEG_REST, 1, p) };
}

const steps = ([a, b]) => Math.round((b - a) * FPS);

/* ───────────── The SVG ───────────── */

// From the running site: the palm silhouette, with the fronds the site's script draws into it, and the
// parts of the two logo paths that the morph leaves as drawn.
async function readSite(browser) {
  const server = await createServer({ root, logLevel: "silent", server: { port: 0, host: "127.0.0.1" } });
  await server.listen();
  try {
    const { port } = server.httpServer.address();
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    return await page.evaluate(() => {
      const symbol = document.querySelector("#palm").cloneNode(true);
      for (const node of symbol.querySelectorAll("*")) {
        for (const attr of [...node.attributes]) if (attr.name.startsWith("data-")) node.removeAttribute(attr.name);
      }
      return {
        palm: new XMLSerializer().serializeToString(symbol).replace(/ xmlns="[^"]*"/g, ""),
        bare: document.querySelector("#logo-me").getAttribute("d"),
        legged: document.querySelector("#logo-m").getAttribute("d"),
      };
    });
  } finally {
    await server.close();
  }
}

// SMIL, so it also plays in an <img>. The eased stretches are sampled, with straight lines between.
function animate(attr, stretches, value) {
  const times = [0];
  for (const [a, b] of stretches) {
    const n = steps([a, b]);
    for (let i = 0; i <= n; i++) times.push(a + ((b - a) * i) / n);
  }
  const keyTimes = times.map((time) => +(time / CYCLE).toFixed(5)).join(";");
  const values = times.map(value).join(";");
  return `<animate attributeName="${attr}" dur="${CYCLE}s" begin="-${PHASE}s" repeatCount="indefinite" calcMode="linear" keyTimes="${keyTimes}" values="${values}" />`;
}

function buildSvg({ palm, bare, legged }) {
  const shapesAt = (t) => logoPaths(t, pathTail(bare), pathTail(legged));
  const home = shapesAt(0);
  const layer = (shape, clip) => `<g fill="none" stroke-linejoin="miter" stroke-miterlimit="4">
      <use href="#${shape}" stroke="#2a1150" stroke-width="16" />
      <use href="#${shape}" stroke="url(#logo-edge)" stroke-width="9" />
      <use href="#${shape}" stroke="#fff" stroke-width="3" />
    </g>
    <use href="#${shape}" fill="url(#grad-logo)" />
    <rect x="0" y="0" width="294" height="140" fill="url(#logo-palm-tone)" mask="url(#logo-palms)" clip-path="url(#${clip})" opacity="0.5" />`;
  // No width or height: it fills whatever box it is given, at the viewBox's proportions.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" role="img" aria-label="ME">
  <defs>
    ${palm}
    <path id="logo-me" d="${home.bare}">
      ${animate("d", [OUT, BACK], (time) => shapesAt(stateAt(time).t).bare)}
    </path>
    <path id="logo-m" d="${home.legged}">
      ${animate("d", [OUT, BACK], (time) => shapesAt(stateAt(time).t).legged)}
    </path>
    <clipPath id="logo-clip"><use href="#logo-me" /></clipPath>
    <clipPath id="logo-m-clip"><use href="#logo-m" /></clipPath>
    <linearGradient id="grad-logo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="36" y2="140">
      <stop offset="0" stop-color="#3f6fe0" />
      <stop offset="0.28" stop-color="#8a5ce0" />
      <stop offset="0.55" stop-color="#f2409b" />
      <stop offset="0.82" stop-color="#ff8a4f" />
      <stop offset="1" stop-color="#ffb347" />
    </linearGradient>
    <linearGradient id="logo-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="140">
      <stop offset="0" stop-color="#6a2fc4" />
      <stop offset="1" stop-color="#a02ab4" />
    </linearGradient>
    <linearGradient id="logo-palm-tone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="140">
      <stop offset="0" stop-color="#2a2fa8" />
      <stop offset="0.5" stop-color="#8a2a9a" />
      <stop offset="1" stop-color="#c43a5a" />
    </linearGradient>
    <mask id="logo-palms" maskUnits="userSpaceOnUse" x="0" y="0" width="294" height="140">
      <g fill="#fff">
        <use href="#palm" x="-32" y="-0.65" width="110" height="220" />
        <use href="#palm" x="79" y="21.65" width="90" height="180" transform="rotate(4 127 140)" />
        <use href="#palm" x="139" y="-9.8" width="120" height="240" />
        <use href="#palm" x="236" y="4.8" width="80" height="160" transform="rotate(-5 279 140)" />
      </g>
    </mask>
  </defs>
  ${layer("logo-me", "logo-clip")}
  <g>
    ${animate("opacity", [OUT, DIM, BACK], (time) => +stateAt(time).leg.toFixed(3))}
    ${layer("logo-m", "logo-m-clip")}
  </g>
</svg>
`;
}

/* ───────────── The WebP ───────────── */

// One loop as [loop time shown, milliseconds it stays up]: a single long frame for each hold, FPS through
// the changes. Delays are whole milliseconds measured from a running clock, so they add up to the loop.
function frameList() {
  const frames = [];
  let clock = 0;
  const playback = (time) => (time - PHASE + CYCLE) % CYCLE || CYCLE;
  const show = (time, until) => {
    const end = Math.round(until * 1000);
    frames.push([time, end - clock]);
    clock = end;
  };
  const change = ([a, b]) => {
    const n = steps([a, b]);
    for (let i = 1; i <= n; i++) show(a + ((b - a) * i) / n, playback(a) + ((b - a) * i) / n);
  };
  show(PHASE, playback(OUT[0])); // the M, held
  change(OUT);
  show(OUT[1], playback(DIM[0]));
  change(DIM);
  show(DIM[1], playback(BACK[0])); // the VI, held
  change(BACK);
  show(CYCLE, CYCLE); // the M again, up to the loop point
  return frames;
}

async function renderWebp(browser, svg, file) {
  const width = webpWidth;
  const height = Math.round((width * VIEW.h) / VIEW.w);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`,
  );
  await page.evaluate(() => document.querySelector("svg").pauseAnimations());
  const frames = frameList();
  const shots = [];
  for (const [time] of frames) {
    await page.evaluate((at) => document.querySelector("svg").setCurrentTime(at), (time - PHASE + CYCLE) % CYCLE);
    shots.push(await page.screenshot({ omitBackground: true }));
  }
  await sharp(shots, { join: { animated: true }, limitInputPixels: false })
    .webp({ loop: 0, delay: frames.map(([, ms]) => ms), quality: 90, alphaQuality: 100, effort: 4, minSize: true, mixed: true })
    .toFile(file);
  return { width, height };
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const svg = buildSvg(await readSite(browser));
  writeFileSync(resolve(outDir, "logo-me-vi.svg"), svg);
  console.log("exports/logo-me-vi.svg");
  const { width, height } = await renderWebp(browser, svg, resolve(outDir, "logo-me-vi.webp"));
  console.log(`exports/logo-me-vi.webp  ${width}×${height}`);
} finally {
  await browser.close();
}
