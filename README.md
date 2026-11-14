# portfolio-gta

A cinematic take on mark-eriksson.com: the sunset-filled "ME" logo is a window onto a sunset scene, and scales out on scroll to reveal it.

```shell
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, then build to dist/
```

- `index.html`: markup, the logo geometry, the scene SVG and the full-screen menu
- `src/main.ts`: the hero reveal (GSAP ScrollTrigger + Lenis), the generated skyline, palms and birds, the menu, scroll reveals
- `src/data.ts`: projects, copied from ../mark-eriksson.com
- `public/shots/`: project screenshots, resized from ../mark-eriksson.com

## Deploying

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`), at the custom domain in `public/CNAME`.
