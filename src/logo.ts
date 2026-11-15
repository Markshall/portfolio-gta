// The logo's morph: the M opens into a VI and closes again. Shared by the site (src/main.ts) and the
// export script (scripts/export-logo.mjs), which Node runs directly, so nothing here may touch the DOM
// or use TypeScript syntax that cannot simply be erased.

// The V's corners: [top-left x, notch left x, centre x, notch right x, top-right x, notch depth, foot depth].
// The foot stops short of the baseline, and the top-left corner short of the left edge, by enough that
// the outline's points there end level with the outline of the other letters.
// As an M the V sits midway between the legs, its arms running into both. As a VI it has slid left to
// stand where the left leg was, a separate letter beside the I: its top-right corner stops 6 units short
// of the I's top-left, so each keeps its own white rim and only the darker outline bridges them.
export const V_AS_M = [6.6, 49, 90, 131, 173.4, 65.4, 133];
export const V_AS_VI = [5.1, 45.1, 72.55, 100, 140, 53.3, 130.5];
export const LEG_W = 34;
// How much of the left leg and the E show while the V is landing, and what they settle to while the VI
// is held: just visible, so ME stays readable behind it.
export const LEG_GHOST = 0.22;
export const LEG_REST = 0.1;
// Seconds: how long the M and the VI are each held, how long the change between them takes, and how soon
// after the logo comes into view the first change starts.
export const HOLD_M = 6;
export const HOLD_VI = 2.5;
export const MORPH = 1.1;
export const FIRST_MORPH = 3;
// Seconds: how long after the V lands the ghosts start to dim, and how long the dimming takes.
export const DIM_DELAY = 0.3;
export const DIM_DURATION = 0.8;

// Everything after the V in a logo path, which is left as drawn: the I bar, and in the fuller shape the E.
export const pathTail = (d: string) => d.slice(d.indexOf(" M"));

// The two logo paths with the V at t, from the M (0) to the VI (1): `bare` without the M's left leg and
// the E, `legged` with them.
export function logoPaths(t: number, bareTail: string, leggedTail: string) {
  const [x, a, b, c, e, n, v] = V_AS_M.map((m, i) => +(m + (V_AS_VI[i] - m) * t).toFixed(2));
  // Where the V's left edge crosses the leg's inner edge.
  const y = +((v * (LEG_W - x)) / (b - x)).toFixed(2);
  const top = `H${a}L${b} ${n}L${c} 0H${e}L${b} ${v}`;
  return { bare: `M${x} 0${top}Z${bareTail}`, legged: `M0 0${top}L${LEG_W} ${y}V140H0Z${leggedTail}` };
}
