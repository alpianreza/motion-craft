# Standar Emas Kode Referensi (`Golden Showcases`)

Gunakan kode di bawah ini sebagai patokan mutlak kepadatan detail, pencahayaan, dan gerak kamera saat menulis `sceneCode` baru!

---

## Contoh 1: Kategori `stickman-3d` (Stickman Cel-Shaded + Prop Logam 3D)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const st3d = MF.stickmanStage3D(view, { W, H });

const hero = MF.stickmanActor3D(st3d, { x: -2.05, y: -1.7, z: 0.4, shirtColor: 0x14b8a6, scale: 0.96 });
const coin = MF.reededCoin3D(st3d, { x: 1.85, y: 0.65, z: -0.2, radius: 2.25, thickness: 0.46, ridges: 92 });

MF.highlightHeadline(view, {
  tl, at: 0, outAt: 6.8,
  before: 'Kenapa pinggiran koin sengaja dibuat', highlight: 'bergerigi kasar?',
  y: H * 0.065, color: '#FFFDF7', pillColor: '#D97706', size: W < H ? 52 : 56,
});

MF.leaderCallout(view, {
  tl, at: 7.0, outAt: 14.4,
  targetX: W * 0.72, targetY: H * 0.52,
  labelX: W < H ? W * 0.08 : W * 0.54, labelY: H * 0.14,
  title: 'GERIGI ANTI-KEROK (1696)',
  subtitle: 'ide Isaac Newton mencegah pencurian tepi koin emas',
  color: '#FFFFFF', dotColor: '#FDE047',
});

MF.bigStat(view, {
  tl, at: 14.5, label: 'GERIGI TEPI KOIN MODERN',
  fromVal: 0, toVal: 119, suffix: ' alur',
  x: W * 0.5, y: H * 0.83, color: '#FDE047', labelColor: '#FEF3C7',
  cardBg: 'rgba(42, 22, 8, 0.9)', size: 90,
});

MF.vignette(stage, { strength: 0.3 });

MF.onTick((t) => {
  hero.setMood(t < 7.0 ? 'shock' : 'happy');
  hero.armR.rotation.z = 1.05 + Math.sin(t * 4.2) * 0.16;
  hero.actor.position.y = -1.7 + Math.abs(Math.sin(t * 2.6)) * 0.08;
  coin.rotation.y = t * 0.85;
  coin.rotation.x = Math.sin(t * 0.6) * 0.18;

  let zCam = 12.2, lookX = 0;
  if (t >= 6.8 && t < 14.4) {
    const u = MF.smooth(MF.clamp((t - 6.8) / 1.8, 0, 1));
    zCam = MF.lerp(12.2, 8.8, u);
    lookX = MF.lerp(0, 1.15, u);
  }
  st3d.camera.position.set(lookX * 0.4, 1.75, zCam);
  st3d.camera.lookAt(lookX, 0.75, 0);
});
```

---

## Contoh 2: Kategori `3d` (Monumen 3D Prosedural & Langit Senja)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const m3d = MF.monumentStage3D(view, { W, H });
const eiffel = MF.proceduralEiffelTower(m3d);

MF.highlightHeadline(view, {
  tl, at: 0, outAt: 7.0,
  before: 'Menara Eiffel', highlight: 'hampir dibongkar', after: 'setelah 20 tahun!',
  y: H * 0.065, color: '#FFFDF7', pillColor: '#D97706',
  font: "'Playfair Display', Georgia, serif", size: W < H ? 52 : 56,
});

MF.leaderCallout(view, {
  tl, at: 7.4, outAt: 14.6,
  targetX: W * 0.5, targetY: H * 0.38, labelX: W * 0.08, labelY: H * 0.22,
  title: 'ANTENA RADIO 1909', subtitle: 'menyelamatkan menara dari pembongkaran',
  color: '#FFFFFF', dotColor: '#7EE8FA',
});

MF.onTick((t) => {
  eiffel.pulseRadio(t, 7.2);
  const u = t >= 6.8 && t < 14.6 ? MF.smooth(MF.clamp((t - 6.8) / 2.2, 0, 1)) : 0;
  const dist = MF.lerp(22.8, 9.6, u);
  const camY = MF.lerp(4.2, 13.8, u);
  const lookY = MF.lerp(8.0, 15.6, u);
  const yaw = 0.35 + t * 0.14;
  m3d.camera.position.set(Math.sin(yaw) * dist, camY, Math.cos(yaw) * dist);
  m3d.camera.lookAt(0, lookY, 0);
});
```

---

## Contoh 3: Kategori `laut` (Biota Laut 3D Bertekstur Totol & Sinar Volumetrik)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const uw = MF.underwaterWorld3D(view, { W, H });
const whale = MF.realisticSwimmer3D(uw, { species: 'blue-whale', length: 7.4, scale: 1 });
const school = [0, 1, 2, 3].map((i) => ({
  x: -1.6 + i * 1.1, y: -1.8 - (i % 2) * 0.4, z: 1.5, phase: i * 1.3,
  fish: MF.realisticSwimmer3D(uw, { species: 'fish', length: 1.1, scale: 0.85 }),
}));

MF.highlightHeadline(view, {
  tl, at: 0, outAt: 7.0,
  before: 'Hewan terbesar sepanjang masa', highlight: 'bukan dinosaurus!',
  y: H * 0.065, color: '#F8FAFC', pillColor: '#0284C7', size: W < H ? 52 : 56,
});

MF.onTick((t) => {
  whale.swim(t, { speed: 2.2, amp: 0.34 });
  whale.root.rotation.y = -0.58 + Math.sin(t * 0.2) * 0.12;
  school.forEach((s) => {
    s.fish.swim(t + s.phase, { speed: 5.5, amp: 0.12 });
    s.fish.root.position.set(s.x + Math.sin(t * 0.55 + s.phase) * 0.5, s.y, s.z);
    s.fish.root.rotation.y = -0.48;
  });
  uw.camera.position.set(0.8, 0.35 + Math.sin(t * 0.35) * 0.3, 15.6);
  uw.camera.lookAt(0, -0.1, 0);
});
```

---

## Contoh 4: Kategori `isometrik` (Mesin 3D Dibelah Laser `cutaway` + Dibongkar `explode`)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const iso = MF.isoThreeStage(view, { bgTop: '#162844', bgBot: '#070E1A', orthoSize: 6.2, W, H });
const eng = MF.cutawayMachine3D(iso, { scale: 1.05 });

MF.highlightHeadline(view, {
  tl, at: 0, outAt: 7.0,
  before: 'Apa yang terjadi di dalam', highlight: 'mesin 4-tak saat menyala?',
  y: H * 0.065, color: '#F8FAFC', pillColor: '#0284C7', size: W < H ? 50 : 56,
});

MF.leaderCallout(view, {
  tl, at: 7.2, outAt: 14.5,
  targetX: W * 0.5, targetY: H * 0.48,
  labelX: W < H ? W * 0.08 : W * 0.56, labelY: H * 0.16,
  title: 'RUANG BAKAR & PISTON',
  subtitle: 'dinding silinder dibelah (clipping plane) & kepala blok di-explode',
  color: '#FFFFFF', dotColor: '#38BDF8',
});

MF.onTick((t) => {
  // 0..3s: dinding blok silinder dibelah laser; 7..11s: kepala silinder & roda gigi di-explode
  const cut = MF.smooth(MF.clamp((t - 0.8) / 2.4, 0, 1));
  const exp = MF.smooth(MF.clamp((t - 7.0) / 2.2, 0, 1));
  eng.step(t, { rpm: 110, cutaway: cut, explode: exp });

  const rot = 0.72 + Math.sin(t * 0.32) * 0.22;
  iso.camera.position.set(Math.sin(rot) * 18, 11.5, Math.cos(rot) * 18);
  iso.camera.lookAt(0, 0.2, 0);
});
```

---

## Contoh 5: Kategori `astronomi` (Lubang Hitam GLSL Raymarching)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const bh = MF.glslBlackHole(view, { W, H });

MF.highlightHeadline(view, {
  tl, at: 0, outAt: 7.5,
  before: 'Apa yang terjadi tepat di tepi', highlight: 'Event Horizon?',
  y: H * 0.065, color: '#F8FAFC', pillColor: '#EA580C', size: W < H ? 52 : 56,
});

MF.leaderCallout(view, {
  tl, at: 8.0, outAt: 15.5,
  targetX: W * 0.52, targetY: H * 0.46, labelX: W * 0.08, labelY: H * 0.2,
  title: 'DOPPLER BEAMING', subtitle: 'plasma mendekat tampak jauh lebih terang',
  color: '#FFFFFF', dotColor: '#FDBA74',
});

MF.onTick((t) => {
  const u = MF.smooth(MF.clamp(t / DUR, 0, 1));
  bh.setView({
    dist: MF.lerp(13.5, 6.4, u),
    pitch: 0.16 + Math.sin(t * 0.25) * 0.06,
    yaw: t * 0.22,
    roll: Math.sin(t * 0.18) * 0.08,
    redshift: MF.lerp(0.0, 0.55, MF.clamp((u - 0.55) * 2.2, 0, 1)),
  });
});
```

---

## Contoh 6: Kategori `peta` & `geografi` (Natural Earth `world-atlas` + `d3-geo`)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const map = MF.realWorldMap(view, {
  center: [62, 16], scale: W < H ? 340 : 430,
  theme: 'parchment-book', bookTitle: 'Jalur Pelayaran Samudra Hindia', W, H,
});
const cam = MF.createWorldCamera(map.world, W, H, { breathe: 0.008 });

map.addVintageShip([61, 11], { kind: 'dhow', scale: 0.95 });
map.addVintageShip([114, 15], { kind: 'junk', scale: 1.05 });
map.addCityStop(tl, { at: 0, lonLat: [39.82, 21.42], name: 'Makkah' });
map.addCityStop(tl, { at: 4.5, lonLat: [97.14, 5.18], name: 'Samudera Pasai (Aceh)', yearNote: '1345' });

map.drawVoyageRoute(tl, {
  at: 0.6, dur: 5.5,
  waypointsLonLat: [[39.82, 21.42], [56, 25], [77.2, 28.6], [73.5, 4.17], [97.14, 5.18]],
  color: '#B83227', width: 5, cam, startZoom: 1.15, endZoom: 1.75,
});
```

---

## Contoh 7: Kategori `anatomi` (Studio Medis EKG + Organ Berdenyut)
```javascript
const an = MF.anatomyStage(stage, { W, H });
const heart = MF.beatingHeart(an.world, { x: W * 0.5, y: H * 0.52, scale: W < H ? 1.18 : 1.05, bpm: 74 });
const cam = MF.createWorldCamera(an.world, W, H, { breathe: 0.01 });

MF.highlightHeadline(stage, {
  tl, at: 0, outAt: 7.0,
  before: 'Dalam sehari jantungmu memompa', highlight: '7.500 liter darah!',
  y: H * 0.065, color: '#FFF1F2', pillColor: '#E11D48', size: W < H ? 50 : 56,
});

cam.shot(tl, 7.2, 2.2, 1.32, W * 0.5, H * 0.5, 'power2.inOut');

MF.bigStat(stage, {
  tl, at: 13.5, label: 'DETAK JANTUNG PER HARI',
  fromVal: 0, toVal: 100000, suffix: 'x',
  x: W * 0.5, y: H * 0.83, color: '#FDA4AF', size: 84,
});
```

---

## Contoh 8: Kategori `islami` & `kartun` (Cahaya Mihrab / Panggung Kartun Bersendi)
```javascript
// Contoh Islami santun tanpa menggambar figur Nabi:
const isl = MF.islamicStage(stage, { theme: 'golden-mihrab', W, H });
MF.highlightHeadline(stage, {
  tl, at: 0, outAt: 8.0,
  before: 'Dari Baghdad abad ke-9 lahir', highlight: 'Aljabar Modern',
  y: H * 0.07, color: '#FEF9C3', pillColor: '#B45309',
  font: "'Playfair Display', Georgia, serif", size: W < H ? 50 : 56,
});
```
