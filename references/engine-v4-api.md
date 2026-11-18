# Referensi Lengkap API Engine v4 (`MF`)

Di dalam `sceneCode`, fungsi dieksekusi dengan argumen `(MF, stage, tl, W, H, DUR)`.
> **PENTING:** Jangan pernah mendestrukturisasi variabel bernama `H`, `S`, atau `T` yang menimpa parameter `H` panggung atau fungsi `MF.H`/`MF.S`/`MF.T`. Selalu panggil lewat prefix `MF.`!

---

## 1. Utilitas, DOM, Rig Sendi & Audio SFX
- `MF.S(tag, attrs, svgParent)` — membuat elemen SVG (`path`, `circle`, `rect`, `g`, `line`, `polygon`, `ellipse`).
- `MF.T(svgParent, text, x, y, attrs)` — membuat elemen `<text>` SVG.
- `MF.H(tag, styleOrAttrs, htmlParent)` — membuat elemen HTML (`div`, `span`, dll.; properti `className` dan `text` didukung langsung).
- `MF.joint(svgParent, tx, ty)` — membuat grup sendi 2D `{ el, tx, ty, x, y, r, sx, sy, apply() }`. Ubah `.r` / `.x` / `.y` di `MF.onTick` lalu panggil `.apply()`.
- `MF.rng(seedStr)` — PRNG deterministik `() => 0..1`.
- `MF.clamp(v, min, max)`, `MF.lerp(a, b, u)`, `MF.smooth(u)`, `MF.mod(a, n)`, `MF.shadeHex(hex, factor)`.
- `MF.onTick((t) => { ... })` — dijalankan setiap frame pemutaran maupun saat scrub/export frame-by-frame!
- `MF.sfx(timeSec, type, volume)` — tipe: `'pop' | 'whoosh' | 'scribble' | 'stamp' | 'ding' | 'boing' | 'click' | 'riser'`.

## 2. Kamera, Atmosfer & Tipografi Responsif
- `const cam = MF.createWorldCamera(worldEl, W, H, { breathe: 0.012 })`
  - `cam.set(x, y, zoom, rot)`
  - `cam.shot(tl, at, dur, zoom, x, y, ease)`
  - `cam.cutTo(tl, at, x, y, zoom, rot)`
  - `cam.whipTo(tl, at, fromViewEl, toViewEl, 'left'|'right'|'up'|'down')`
- `MF.highlightHeadline(parent, { tl, at, outAt, before, highlight, after, y, color, pillColor, pillTextColor, variant: 'pill'|'marker'|'under', font, size })` *(otomatis dikunci aman di dalam tinggi `H`)*.
- `MF.leaderCallout(parent, { tl, at, outAt, targetX, targetY, labelX, labelY, title, subtitle, color, dotColor })` *(otomatis menggeser `labelX` ke dalam layar bila terlalu sempit di `9:16`)*.
- `MF.bigStat(parent, { tl, at, outAt, label, fromVal, toVal, suffix, decimals, dur, x, y, color, labelColor, cardBg, size })`
- `MF.handDrawCircle(svgParent, { tl, at, outAt, cx, cy, r, color, strokeWidth })`
- `MF.handDrawArrow(svgParent, { tl, at, outAt, x1, y1, cx, cy, x2, y2, note, color, fontSize })`
- `MF.ambientGlow(parent, { x, y, size, color, opacity, drift })`
- `MF.lightLeak(stage, { tl, at, dur, color, side })`
- `MF.vignette(stage, { strength: 0.32 })` & `MF.grainOverlay(stage, { opacity: 0.08, blend })`

## 3. Panggung 3D, Shader, Stickman 3D & Isometrik 3D
- **Monumen 3D (`3d`):**
  - `const m3d = MF.monumentStage3D(view, { horizonColor, midSkyColor, zenithColor, W, H })` -> `{ THREE, renderer, scene, camera, canvas }`
  - `const eiffel = MF.proceduralEiffelTower(m3d)` -> `eiffel.pulseRadio(t, activeFrom)`
- **Isometrik Ortografis 3D & Mesin Dibelah / Explode (`isometrik`):**
  - `const iso = MF.isoThreeStage(view, { bgTop, bgBot, orthoSize: 6.4, W, H })` -> `{ THREE, renderer, scene, camera, clipPlane, setCutaway(progress) }`
  - `const eng = MF.cutawayMachine3D(iso, { scale: 1 })` -> `eng.step(t, { rpm: 95, cutaway: 0..1, explode: 0..1 })` *(mesin 4-tak lengkap blok sirip pendingin yang dibelah laser `clipPlane` + dibongkar `explode` memperlihatkan piston, setang seher, kruk as, klep intake/exhaust, busi & ledakan api pembakaran, serta roda gigi timing)*
- **Stickman 3D (`stickman-3d`):**
  - `const st3d = MF.stickmanStage3D(view, { wallTop, wallBot, tableColor, W, H })`
  - `const hero = MF.stickmanActor3D(st3d, { x, y, z, shirtColor, scale })` -> `{ actor, armL, armR, setMood('shock'|'happy') }`
  - `const coin = MF.reededCoin3D(st3d, { x, y, z, radius, thickness, ridges })`
- **Biota Laut 3D (`laut`):**
  - `const uw = MF.underwaterWorld3D(view, { W, H })`
  - `const whale = MF.realisticSwimmer3D(uw, { species: 'blue-whale'|'fish', length: 7.4, scale: 1 })` -> `whale.swim(t, { speed, amp })`
- **Lubang Hitam GLSL (`astronomi`):**
  - `const bh = MF.glslBlackHole(view, { W, H })` -> `bh.setView({ dist, pitch, yaw, roll, redshift })`
  - `const w3d = MF.threeWorld(view, { W, H, nebulaColorA, nebulaColorB, starsCount })` + `MF.threeSphere(w3d, { radius, color, atmosphereColor, ring })`
- **Claymation 3D (`sains-alam`):**
  - `const clay = MF.clayWorld(view, { bgColor, stopMotionFps: 12, W, H })` + `MF.clayMesh(clay, { kind: 'sphere'|'capsule'|'torus'|'box', radius, color, x, y, z })`

## 4. Peta Natural Earth, Anatomi, Islami & 2D Spesialis
- **Peta Garis Pantai Bumi Asli (`peta` & `geografi`):**
  - `const map = MF.realWorldMap(view, { center: [lon, lat], scale, theme: 'parchment-book'|'modern-atlas', bookTitle, W, H })`
  - `map.project([lon, lat])`, `map.addRegionLabel([lon, lat], text, opts)`, `map.addCityStop(tl, { at, lonLat, name, yearNote, color, dy })`, `map.addVintageShip([lon, lat], { kind: 'dhow'|'junk', scale })`, `map.drawVoyageRoute(tl, { at, dur, waypointsLonLat, color, width, cam, startZoom, endZoom })`
- **Anatomi Medis (`anatomi`):**
  - `const an = MF.anatomyStage(stage, { W, H })` + `MF.beatingHeart(an.world, { x, y, scale, bpm })`
- **Islami & Manuskrip Emas (`islami`):**
  - `const isl = MF.islamicStage(stage, { theme: 'deep-yunus'|'golden-mihrab', W, H })`
  - `const gm = MF.goldManuscriptStage(stage, { baseColor, goldColor, W, H })`
- **Dunia Hewan & Kartun (`dunia-hewan`, `kartun`, `animasi-2d`):**
  - `MF.illustratedElephant(svg, { x, y, scale })`, `MF.cartoonCharacter(svg, { x, y, scale, shirtColor, pantsColor, mood, walkSpeed, pointAt })`, `MF.cuteFace(svg, { x, y, scale, mood })`
  - `MF.illustratedHouse`, `MF.illustratedTree`, `MF.illustratedCar`, `MF.utilityPoleStrip`, `MF.speedProfile`, `MF.parallaxStrip`
- **Bongkar Rumah, Kolase, Cat Air, Sketsa, Kertas, Komik, CRT, Kinetik, Kaca, Risograf:**
  - `MF.isoPoint`, `MF.isoBlock`, `MF.isoPitchedRoof`, `MF.peelAway`
  - `MF.paperDesk`, `MF.collageCard`, `MF.inkStamp`, `MF.markerSweep`
  - `MF.watercolorStage`, `MF.watercolorWash`
  - `MF.vintageSketchStage`, `MF.sketchDrawPath`, `MF.sketchGear`
  - `MF.paperCutStage`, `MF.paperLayer`, `MF.paperCloud`
  - `MF.comicStage`, `MF.comicPanel`, `MF.speedLines`, `MF.comicBurst`
  - `MF.crtStage`, `MF.pixelSprite`
  - `MF.kineticStage`, `MF.kineticSlam`
  - `MF.biolumStage`, `MF.glowOrganism`, `MF.synapsePulse`
  - `MF.glassCard`, `MF.animatedLineChart`, `MF.risographStage`, `MF.risoCard`
