// The HUD: the wanted level in the header, the minimap in the corner, and the "Mission passed" banner
// that shows as each project scrolls past.
import gsap from "gsap";
import { PROJECTS, type Project, years } from "./data.ts";
import { maxScroll, whenPast } from "./scroll.ts";

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];
const SVG_NS = "http://www.w3.org/2000/svg";

/** How far down the page a section starts, from 0 to 1. */
function pageFraction(el: Element) {
  const top = el.getBoundingClientRect().top + scrollY;
  return Math.min(1, Math.max(0, top / maxScroll()));
}

const pageProgress = () => Math.min(1, Math.max(0, scrollY / maxScroll()));

/* ───────────── Wanted level ───────────── */

function setupWanted(reducedMotion: boolean) {
  const stars = $$<SVGElement>("[data-wanted] svg");
  const wanted = $("[data-wanted]");
  const siren = $("[data-siren]");
  let level = 0;
  let maxed: ReturnType<typeof setTimeout> | undefined;

  const set = (next: number) => {
    if (next === level) return;
    stars.forEach((star, i) => {
      const lit = i < next;
      // A newly lit star flashes in.
      if (lit && i >= level && !reducedMotion) star.animate([{ scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1 }], 380);
      star.classList.toggle("is-lit", lit);
    });
    level = next;
  };

  // Getting in touch is the most wanted you can be: all five stars and the lights.
  const maxOut = () => {
    set(5);
    if (reducedMotion) return;
    wanted.classList.add("is-max");
    siren.classList.add("is-on");
    clearTimeout(maxed);
    maxed = setTimeout(() => {
      wanted.classList.remove("is-max");
      siren.classList.remove("is-on");
      set(Math.ceil(pageProgress() * 5 - 0.05));
    }, 4200);
  };

  for (const a of $$<HTMLAnchorElement>('a[href="#contact"], a[href^="mailto:"]')) a.addEventListener("click", maxOut);
  whenPast($(".finale-title"), "top", 0.8, maxOut, false);

  return (progress: number) => {
    if (!wanted.classList.contains("is-max")) set(Math.ceil(progress * 5 - 0.05));
  };
}

/* ───────────── Minimap ───────────── */

// Each blip sits at a set point along the road (`at`, 0 to 1), so a long section doesn't crowd the
// others out; the player arrow runs between them in step with the page.
const BLIPS = [
  { href: "#top", letter: "S", label: "Start", colour: "#ff9d5c", at: 0 },
  { href: "#work", letter: "W", label: "The Work", colour: "#e9639b", at: 0.2 },
  { href: "#experience", letter: "E", label: "Experience", colour: "#8d88cb", at: 0.8 },
  { href: "#contact", letter: "C", label: "Say hello", colour: "#e6ffa3", at: 1 },
];

function setupMinimap() {
  const road = $<SVGPathElement>("[data-map-road]");
  const player = $<SVGPathElement>("[data-map-player]");
  const blipsRoot = $("[data-map-blips]");
  const dotsRoot = $<SVGGElement>("[data-map-dots]");
  const length = road.getTotalLength();
  const at = (f: number) => road.getPointAtLength(Math.min(1, Math.max(0, f)) * length);

  // City blocks either side of the road.
  const blocks = $<SVGGElement>("[data-map-blocks]");
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let y = 6; y < 160; y += 17) {
    for (let x = 6; x < 196; x += 17) {
      if (r() < 0.62) {
        const b = document.createElementNS(SVG_NS, "rect");
        Object.entries({ x, y, width: 11 + r() * 3, height: 11 + r() * 3, rx: 1.5 }).forEach(([k, v]) =>
          b.setAttribute(k, String(v)),
        );
        blocks.append(b);
      }
    }
  }

  const blips = BLIPS.map(blip => {
    const a = document.createElement("a");
    a.href = blip.href;
    a.className = "blip";
    a.style.setProperty("--c", blip.colour);
    a.dataset.label = blip.label;
    a.setAttribute("aria-label", blip.label);
    a.textContent = blip.letter;
    blipsRoot.append(a);
    return { a, el: $(blip.href), at: blip.at, top: 0, f: 0 };
  });

  const projects = $$(".project");
  const dots = projects.map(() => {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("r", "3.2");
    dotsRoot.append(c);
    return c;
  });

  // From how far down the page to how far along the road.
  const toRoad = (f: number) => {
    let i = 0;
    while (i < blips.length - 2 && f > blips[i + 1].f) i++;
    const a = blips[i];
    const b = blips[i + 1];
    return a.at + ((b.at - a.at) * (f - a.f)) / (b.f - a.f || 1);
  };

  const layout = () => {
    for (const blip of blips) blip.f = blip.top = pageFraction(blip.el);
    // The last section may start before the end of the page; the road ends at the end of the page.
    blips[blips.length - 1].f = 1;
    for (const blip of blips) {
      const p = at(blip.at);
      blip.a.style.left = `${p.x / 2}%`;
      blip.a.style.top = `${p.y / 2}%`;
    }
    projects.forEach((project, i) => {
      const p = at(toRoad(pageFraction(project)));
      dots[i].setAttribute("cx", p.x.toFixed(1));
      dots[i].setAttribute("cy", p.y.toFixed(1));
    });
  };

  const done = (i: number) => dots[i]?.classList.add("is-done");

  const update = (progress: number) => {
    const f = toRoad(progress);
    const p = at(f);
    const ahead = at(f + 0.01);
    const behind = at(f - 0.01);
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI + 90;
    player.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    // The blip for the section you're in.
    let here = 0;
    blips.forEach((blip, i) => progress >= blip.top - 0.01 && (here = i));
    blips.forEach((blip, i) => blip.a.classList.toggle("is-here", i === here));
  };

  return { update, done, layout };
}

/* ───────────── Mission passed ───────────── */

function setupMissions(onDone: (i: number) => void, reducedMotion: boolean) {
  const root = $("[data-mission]");
  const title = $("[data-mission-title]");
  const name = $("[data-mission-name]");
  const stats = $("[data-mission-stats]");
  const passed = new Set<number>();
  let pending: number[] = [];
  let flush: ReturnType<typeof setTimeout> | undefined;
  let tl: gsap.core.Timeline | undefined;

  const stat = (k: string, v: string) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

  const show = (i: number) => {
    const p: Project = PROJECTS[i];
    name.textContent = p.name;
    stats.innerHTML =
      stat("Year", years(p)) +
      stat("Role", esc(p.role)) +
      stat("Tools", String(p.stack.length)) +
      stat("Missions", `${passed.size}/${PROJECTS.length}`);
    tl?.kill();
    tl = gsap.timeline();
    if (reducedMotion) {
      tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }).to(root, { autoAlpha: 0, duration: 0.4 }, "+=2.4");
      return;
    }
    tl.set(root, { autoAlpha: 1 })
      .fromTo(".mission-inner", { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "power3.out" })
      .fromTo(title, { scale: 1.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" }, 0.08)
      .fromTo(
        [name, ".mission-respect", ...stats.children],
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: "power3.out" },
        0.35,
      )
      .to(root, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=1.9");
  };

  // Projects passed in quick succession (a fast scroll, or a jump from the map) only tick off on the
  // map, so the banner never covers where you were headed.
  const pass = (i: number) => {
    if (passed.has(i)) return;
    passed.add(i);
    onDone(i);
    pending.push(i);
    clearTimeout(flush);
    flush = setTimeout(() => {
      if (pending.length === 1) show(pending[0]);
      pending = [];
    }, 350);
  };

  $$(".project").forEach((project, i) =>
    whenPast(project, "bottom", 0.7, () => pass(i)),
  );

  // The finale is the last word: clear any banner still up (or about to be) as it comes in.
  whenPast(
    $(".finale-title"),
    "top",
    0.95,
    () => {
      clearTimeout(flush);
      pending = [];
      tl?.kill();
      tl = gsap.timeline().to(root, { autoAlpha: 0, duration: reducedMotion ? 0 : 0.3, ease: "power2.in" });
    },
    false,
  );
}

/* ───────────── Boot ───────────── */

export function setupHud(reducedMotion: boolean) {
  const wanted = setupWanted(reducedMotion);
  const map = setupMinimap();
  setupMissions(map.done, reducedMotion);

  const update = () => {
    const progress = pageProgress();
    wanted(progress);
    map.update(progress);
  };
  addEventListener("scroll", update, { passive: true });

  // The map is laid out from where the sections sit, so redo it whenever the page changes size.
  const relayout = () => {
    map.layout();
    update();
  };
  new ResizeObserver(relayout).observe(document.body);
  addEventListener("resize", relayout);
  relayout();
}
