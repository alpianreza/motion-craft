# MotionCraft Community Edition — Golden Reference Examples

Use these examples as your quality benchmark across the **6 Free Categories**:

---

## Example 1: `stickman-3d` (Cel-Shaded 3D Stickman + Metallic Prop)
```javascript
const view = MF.H('div', { className: 'mf-view' }, stage);
const st3d = MF.stickmanStage3D(view, { W, H });

const hero = MF.stickmanActor3D(st3d, { x: -2.05, y: -1.7, z: 0.4, shirtColor: 0x14b8a6, scale: 0.96 });
const coin = MF.reededCoin3D(st3d, { x: 1.85, y: 0.65, z: -0.2, radius: 2.25, thickness: 0.46, ridges: 92 });

MF.highlightHeadline(view, {
  tl, at: 0, outAt: 6.8,
  before: 'Kenapa pinggiran koin dibuat', highlight: 'bergerigi kasar?',
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

MF.vignette(stage, { strength: 0.3 });

MF.onTick((t) => {
  hero.setMood(t < 7.0 ? 'shock' : 'happy');
  hero.armR.rotation.z = 1.05 + Math.sin(t * 4.2) * 0.16;
  coin.rotation.y = t * 0.85;
  coin.rotation.x = Math.sin(t * 0.6) * 0.18;
  st3d.camera.position.set(0, 1.75, t < 6.8 ? 12.2 : 9.0);
  st3d.camera.lookAt(t < 6.8 ? 0 : 1.0, 0.75, 0);
});
```

---

## Example 2: `peta-perkamen` (Natural Earth Coastlines + Vintage Sailing Ship)
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
map.addCityStop(tl, { at: 4.5, lonLat: [97.14, 5.18], name: 'Samudera Pasai', yearNote: '1345' });

map.drawVoyageRoute(tl, {
  at: 0.6, dur: 5.5,
  waypointsLonLat: [[39.82, 21.42], [56, 25], [77.2, 28.6], [73.5, 4.17], [97.14, 5.18]],
  color: '#B83227', width: 5, cam, startZoom: 1.15, endZoom: 1.75,
});
```

---

## Example 3: `kertas-cutout` (Multi-Layer Paper Diorama)
```javascript
const pc = MF.paperCutStage(stage, { skyTop: '#FCEFB4', skyBot: '#F9C784', W, H });
MF.paperCloud(pc.svg, { x: W * 0.25, y: H * 0.22, scale: 1.1 });
MF.paperLayer(pc.svg, { d: `M 0 ${H*0.62} Q ${W*0.3} ${H*0.48} ${W*0.65} ${H*0.58} T ${W} ${H*0.54} L ${W} ${H} L 0 ${H} Z`, fill: '#2A9D8F', swayX: 16 });
MF.paperLayer(pc.svg, { d: `M 0 ${H*0.74} Q ${W*0.4} ${H*0.66} ${W} ${H*0.75} L ${W} ${H} L 0 ${H} Z`, fill: '#264653', swayX: 24, phase: 1.2 });

MF.highlightHeadline(stage, {
  tl, at: 0, outAt: 7.5,
  before: 'Kenapa ombak laut', highlight: 'tidak pernah berhenti?',
  y: H * 0.08, color: '#1E293B', pillColor: '#E76F51', pillTextColor: '#FFFFFF', size: W < H ? 50 : 56,
});
```
