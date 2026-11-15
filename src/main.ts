import "./style.css";
import "./hud.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { PROJECTS, careerYears, siteHref, years } from "./data.ts";
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
} from "./logo.ts";
import { setupHud } from "./hud.ts";
import { runLoader } from "./loader.ts";
import { drawScene } from "./scene.ts";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];
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

/* ───────────── Logo: the M opens into a VI and closes again ───────────── */

function setupLogoMorph() {
  const bare = $<SVGPathElement>("#logo-me");
  const legged = $<SVGPathElement>("#logo-m");
  const legLayers = $$<SVGElement>("[data-logo-leg]");
  // The leg's and the E's share of the hero's window closes fully and early, so their ghosts sit on the
  // ink, not the scene.
  const legHoles = legLayers.filter((layer) => layer.closest("mask"));
  const legArt = legLayers.filter((layer) => !layer.closest("mask"));
  const bareTail = pathTail(bare.getAttribute("d")!);
  const leggedTail = pathTail(legged.getAttribute("d")!);
  // t runs from the M (0) to the VI (1); leg is the opacity of the M's left leg and the E.
  const state = { t: 0, leg: 1 };
  const draw = () => {
    const paths = logoPaths(state.t, bareTail, leggedTail);
    bare.setAttribute("d", paths.bare);
    legged.setAttribute("d", paths.legged);
    for (const layer of legArt) layer.setAttribute("opacity", state.leg.toFixed(3));
    for (const layer of legHoles) layer.setAttribute("opacity", ((1 - state.t) ** 3).toFixed(3));
  };
  draw();

  // ME is home. The VI is a short reveal: the V lands with the leg and the E as ghosts, which then dim
  // further, so the VI is held lit with ME only just visible behind it.
  const loop = gsap
    .timeline({ repeat: -1, paused: true, defaults: { ease: "power3.inOut", onUpdate: draw } })
    .to(state, { t: 1, leg: LEG_GHOST, duration: MORPH }, HOLD_M)
    .to(state, { leg: LEG_REST, duration: DIM_DURATION, ease: "power1.out" }, `>${DIM_DELAY}`)
    .to(state, { t: 0, leg: 1, duration: MORPH }, HOLD_M + MORPH + HOLD_VI);

  // Only run while a large logo is at rest in view: the hero's before the scroll zoom starts, or the
  // finale's. Otherwise settle back to the M, which is also the shape the zoom's window should keep.
  const finale = $(".finale-logo");
  let finaleInView = false;
  let running = false;
  const update = () => {
    const run = scrollY < 8 || finaleInView;
    if (run === running) return;
    running = run;
    if (run) {
      loop.play(HOLD_M - FIRST_MORPH);
    } else {
      loop.pause();
      gsap.to(state, { t: 0, leg: 1, duration: 0.5, ease: "power2.out", onUpdate: draw });
    }
  };
  new IntersectionObserver(([entry]) => {
    finaleInView = entry.isIntersecting;
    update();
  }).observe(finale);
  addEventListener("scroll", update, { passive: true });
  update();
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

function setupHero(ready: Promise<void>) {
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
  const intro = gsap
    .timeline({ paused: true, delay: 0.15 })
    .to(state, { intro: 1, duration: 2.2, ease: "expo.out", onUpdate: render }, 0)
    .to(fillInner, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0.25)
    .from("[data-intro] > *", { opacity: 0, y: 16, duration: 1, stagger: 0.12, ease: "power3.out" }, 0.7);
  ready.then(() => intro.play());

  const layers = (name: string) => `[data-scene] [data-layer="${name}"]`;
  gsap.set(layers("sky"), { scale: 1.25 });
  gsap.set(layers("city"), { scale: 1.4 });
  gsap.set(layers("sea"), { scale: 1.35 });
  gsap.set(layers("palms"), { scale: 2.1 });

  // The header comes in once the scene is revealed; the HUD once the hero's buttons have scrolled away,
  // so the minimap never sits on them.
  const chrome = [$("[data-header]")];
  const hud = $("[data-hud]");
  for (const node of [...chrome, hud]) node.classList.add("is-hidden");

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
      onUpdate: self => {
        for (const node of chrome) node.classList.toggle("is-hidden", self.progress < 0.82);
      },
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

  // Made after the pin above, so its start allows for the pin's extra scroll.
  ScrollTrigger.create({
    trigger: ".statement",
    start: "top 75%",
    end: "max",
    onToggle: self => hud.classList.toggle("is-hidden", !self.isActive),
  });
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

  // The character's stat bars fill as the card comes up.
  ScrollTrigger.create({
    trigger: "[data-char]",
    start: "top 70%",
    once: true,
    onEnter: () => $("[data-char]").classList.add("is-on"),
  });

  ScrollTrigger.create({
    trigger: ".statement",
    start: "top top",
    end: "max",
    toggleClass: { targets: "[data-header]", className: "is-solid" },
  });
}

/* ───────────── Menu: a phone that slides up over the page ───────────── */

let lenis: Lenis | undefined;

function setupMenu() {
  const menu = $("[data-menu]");
  const toggle = $<HTMLButtonElement>("[data-menu-toggle]");
  const label = $("[data-menu-label]");
  const header = $("[data-header]");
  const clock = $("[data-phone-clock]");
  const date = $("[data-phone-date]");

  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    date.textContent = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  };
  let ticker: ReturnType<typeof setInterval> | undefined;

  const set = (open: boolean) => {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    header.classList.toggle("is-menu", open);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close" : "Phone";
    clearInterval(ticker);
    if (open) {
      tick();
      ticker = setInterval(tick, 10_000);
      lenis?.stop();
      $<HTMLAnchorElement>(".phone-apps a", menu).focus({ preventScroll: true });
    } else {
      lenis?.start();
    }
  };

  toggle.addEventListener("click", () => set(!menu.classList.contains("is-open")));
  // A click beside the phone puts it away.
  menu.addEventListener("click", e => e.target === menu && set(false));
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

  // Hold the page still behind the loading screen.
  smooth.stop();
  const ready = runLoader().then(() => smooth.start());

  setupHero(ready);
  setupLogoMorph();
  setupReveals();
  setupHud(false);
  addEventListener("load", () => ScrollTrigger.refresh());
} else {
  runLoader();
  for (const dd of $$(".site-header")) dd.classList.add("is-solid");
  $("[data-char]").classList.add("is-on");
  setupHud(true);
}
