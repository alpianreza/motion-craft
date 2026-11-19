# MotionCraft Community Edition — Engine Lite API (`MF.*`)

Inside `sceneCode`, your code runs with `(MF, stage, tl, W, H, DUR)`.
> **IMPORTANT:** Never destructure `H`, `S`, or `T` from `MF` (it shadows stage height `H`). Always call `MF.H`, `MF.S`, `MF.T`.

## 1. Core Utilities, Rigging & Procedural SFX
- `MF.S(tag, attrs, svgParent)`, `MF.T(svgParent, text, x, y, attrs)`, `MF.H(tag, styleOrAttrs, htmlParent)`
- `MF.joint(svgParent, tx, ty)` -> `{ el, tx, ty, x, y, r, sx, sy, apply() }`
- `MF.rng(seedStr)` — deterministic PRNG (`0..1`). Never use `Math.random()`!
- `MF.clamp(v, min, max)`, `MF.lerp(a, b, u)`, `MF.smooth(u)`, `MF.mod(a, n)`, `MF.shadeHex(hex, factor)`
- `MF.onTick((t) => { ... })` — deterministic per-frame callback synced to timeline & MP4 exporter.
- `MF.sfx(timeSec, type, volume)` — `'pop' | 'whoosh' | 'scribble' | 'stamp' | 'ding' | 'boing' | 'click' | 'riser'`.

## 2. Camera, Atmosphere & Responsive Typography
- `const cam = MF.createWorldCamera(worldEl, W, H, { breathe: 0.012 })` -> `cam.set`, `cam.shot`, `cam.cutTo`, `cam.whipTo`
- `MF.highlightHeadline(parent, { tl, at, outAt, before, highlight, after, y, color, pillColor, pillTextColor, variant, font, size })`
- `MF.leaderCallout(parent, { tl, at, outAt, targetX, targetY, labelX, labelY, title, subtitle, color, dotColor })`
- `MF.bigStat(parent, { tl, at, outAt, label, fromVal, toVal, suffix, decimals, dur, x, y, color, labelColor, cardBg, size })`
- `MF.handDrawCircle`, `MF.handDrawArrow`, `MF.ambientGlow`, `MF.lightLeak`, `MF.vignette`, `MF.grainOverlay`

## 3. Included Free Category Stages (6 Categories)
- **Stickman 3D (`stickman-3d`):** `MF.stickmanStage3D(view, { wallTop, wallBot, tableColor, W, H })`, `MF.stickmanActor3D`, `MF.reededCoin3D`
- **House Cutaway (`isometrik-cutaway`):** `MF.isoPoint`, `MF.isoBlock`, `MF.isoPitchedRoof`, `MF.peelAway`
- **Maps (`peta-perkamen`):** `MF.realWorldMap(view, { center: [lon, lat], scale, theme: 'parchment-book', bookTitle, W, H })` -> `project`, `addRegionLabel`, `addCityStop`, `addVintageShip`, `drawVoyageRoute`
- **Science & Nature (`kertas-cutout`, `komik-manga`):** `MF.paperCutStage`, `MF.paperLayer`, `MF.paperCloud`, `MF.comicStage`, `MF.comicPanel`, `MF.speedLines`, `MF.comicBurst`
- **Cartoon & 2D (`kartun-panggung`, `kartun-2d`, `tipografi-kinetik`):** `MF.cartoonCharacter`, `MF.cuteFace`, `MF.illustratedHouse`, `MF.illustratedTree`, `MF.illustratedCar`, `MF.utilityPoleStrip`, `MF.speedProfile`, `MF.parallaxStrip`, `MF.kineticStage`, `MF.kineticSlam`

> *Need 3D Turbofan Jet & Piston Cutaways, GLSL Black Hole, 3D Solar System, Ocean 3D, Anatomy, Islamic Heritage, Auto Karaoke Captions, or `.srt` export? Upgrade to **MotionCraft Pro Pack**.*
