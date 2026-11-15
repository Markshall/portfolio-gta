# portfolio-gta

A cinematic take on mark-eriksson.com: the sunset-filled "ME" logo is a window onto a sunset scene, and scales out on scroll to reveal it.

```shell
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, then build to dist/
```

- `index.html`: markup, the logo geometry, the loading screen, the phone menu, the HUD and the character card
- `404.html`: the Wasted / Busted page GitHub Pages serves for unknown paths
- `src/partials/scene.html`: the sunset scene SVG, included into both pages by `vite.config.ts`
- `src/main.ts`: the hero reveal (GSAP ScrollTrigger + Lenis), the phone, scroll reveals
- `src/scene.ts`: the generated skyline, palms, birds and sea glints
- `src/hud.ts`: the wanted level, the minimap and the Mission passed banner
- `src/loader.ts`: the loading screen and its tips
- `src/logo.ts`: the logo morph's shapes and timings, shared with `scripts/export-logo.mjs`
- `src/data.ts`: projects, copied from ../mark-eriksson.com
- `public/shots/`: project screenshots, resized from ../mark-eriksson.com

## Deploying

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`), at the custom domain in `public/CNAME`.
