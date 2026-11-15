// The loading screen: the logo over the sunset with a rotating tip, held until the fonts and the
// screenshots are in (or a few seconds have passed), then faded out. Shown once per visit.

const TIPS = [
  "Mark has been the sole lead developer for the Crown Oil group since 2018.",
  "Every site in The Work was built from scratch as a custom WordPress theme.",
  "Quote forms across the group feed straight into the company’s CRMs.",
  "The group’s calculators are HTML custom elements, so any site can embed them in its own colours.",
  "Moving the group onto Cloudflare, in front of AWS, made every site far more reliable.",
  "Keep scrolling. The logo is a window.",
  "Your wanted level rises the further you scroll.",
  "Tap a blip on the map to travel there.",
  "Open the phone for shortcuts and contacts.",
];

const MIN_MS = 1800;
const MAX_MS = 6000;
const TIP_MS = 2600;

const wait = (ms: number) => new Promise<void>(done => setTimeout(done, ms));

/** Resolves once the loading screen has started to clear, or straight away if it isn't showing. */
export function runLoader(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-loader]");
  if (!root || getComputedStyle(root).display === "none") {
    root?.remove();
    return Promise.resolve();
  }

  const tip = root.querySelector<HTMLElement>("[data-loader-tip]")!;
  const bar = root.querySelector<HTMLElement>("[data-loader-bar]")!;
  let n = Math.floor(Math.random() * TIPS.length);
  const showTip = () => {
    tip.classList.remove("is-in");
    void tip.offsetWidth;
    tip.textContent = TIPS[n++ % TIPS.length];
    tip.classList.add("is-in");
  };
  showTip();
  const tipTimer = setInterval(showTip, TIP_MS);

  // The bar creeps towards 90% while loading, and fills when done.
  const started = performance.now();
  let raf = 0;
  const creep = () => {
    const t = (performance.now() - started) / MAX_MS;
    bar.style.scale = `${0.9 * (1 - Math.exp(-3 * t))} 1`;
    raf = requestAnimationFrame(creep);
  };
  creep();

  const loaded = new Promise<void>(done =>
    document.readyState === "complete" ? done() : addEventListener("load", () => done(), { once: true }),
  );
  const ready = Promise.all([loaded, document.fonts.ready, wait(MIN_MS)]);

  return Promise.race([ready, wait(MAX_MS)]).then(() => {
    cancelAnimationFrame(raf);
    clearInterval(tipTimer);
    bar.style.scale = "1 1";
    try {
      sessionStorage.setItem("loaded", "1");
    } catch {}
    root.classList.add("is-done");
    setTimeout(() => root.remove(), 900);
  });
}
