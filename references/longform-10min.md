# Arsitektur Video Explainer Durasi Panjang (1 Menit s.d. 10 Menit / `600` Detik)

Ketika user meminta video berdurasi panjang (`60` hingga `600` detik / 10 menit), **jangan** menyalin kode blok yang berulang secara manual hingga ribuan baris. Gunakan **Pola Bab Modular (`CHAPTERS` Data-Driven Architecture)** agar `sceneCode` tetap bersih (~150–260 baris), bebas *memory leak*, dan hidup penuh dari `t = 0` sampai `t = DUR`.

---

## 1. Pembagian Jumlah Bab Ideal
- `30–45 detik`: `HOOK` + 2–3 Adegan (`~4` bagian)
- `60–90 detik` (1–1,5 menit): `HOOK` + 4–5 Adegan (`~6` bagian)
- `180 detik` (3 menit): `HOOK` + 7 Adegan (`~8` bagian, rata-rata 20–25 dtk/adegan)
- `300 detik` (5 menit): `HOOK` + 10 Adegan (`~11` bagian, rata-rata 25–30 dtk/adegan)
- `600 detik` (10 menit): `HOOK` + 13 Adegan (`~14` bagian, rata-rata 40–45 dtk/adegan)

## 2. Pola Kode Modular Tanpa Frame Kosong
Di dalam satu adegan berdurasi 30–45 detik, **jangan biarkan layar diam**! Pecah tiap bab menjadi **3 sub-beat**:
1. `start` (`+0s`): Dunia/panggung aktif + `MF.highlightHeadline` pembuka bab + shot kamera *wide/medium*.
2. `mid` (`start + dur * 0.38`): Kamera bergerak `cam.shot` mendekat + `MF.leaderCallout` / `MF.handDrawCircle` menyorot mekanisme penting.
3. `climax` (`start + dur * 0.72`): `MF.bigStat` / aksi klimaks bab sebelum `MF.lightLeak` berpindah ke bab berikutnya!

Contoh kerangka bersih untuk video multi-bab (mis. 180–600 detik):
```javascript
const chapters = [
  { start: 0, end: 35, head: ['Lima abad lalu,', 'segenggam pala', 'setara emas!'], lonLat: [129.9, -4.5], zoom: 1.9, stat: [0, 3000, '% laba'] },
  { start: 35, end: 85, head: ['Angin muson mengantar', 'jung Nusantara', 'ke Malaka'], lonLat: [102.2, 2.2], zoom: 1.65, stat: [0, 2400, ' km'] },
  // ... berlanjut mulus sampai DUR (mis. 300 atau 600 detik)
];

const view = MF.H('div', { className: 'mf-view' }, stage);
const map = MF.realWorldMap(view, { center: [85, 12], scale: W < H ? 360 : 460, theme: 'parchment-book', W, H });
const cam = MF.createWorldCamera(map.world, W, H, { breathe: 0.01 });

chapters.forEach((ch, idx) => {
  const segDur = ch.end - ch.start;
  const [px, py] = map.project(ch.lonLat);
  map.addCityStop(tl, { at: ch.start + 0.4, lonLat: ch.lonLat, name: `Bab ${idx + 1}`, color: '#B83227' });
  cam.shot(tl, ch.start, Math.min(3.2, segDur * 0.25), ch.zoom, px, py, 'power2.inOut');

  MF.highlightHeadline(view, {
    tl,
    at: ch.start,
    outAt: ch.end - 0.5,
    before: ch.head[0],
    highlight: ch.head[1],
    after: ch.head[2],
    y: H * 0.07,
    color: '#FFFDF7',
    pillColor: '#B83227',
    font: "'Playfair Display', Georgia, serif",
    size: W < H ? 48 : 54,
  });

  if (ch.stat) {
    MF.bigStat(view, {
      tl,
      at: ch.start + segDur * 0.55,
      outAt: ch.end - 0.5,
      label: 'FAKTA KUNCI',
      fromVal: ch.stat[0],
      toVal: ch.stat[1],
      suffix: ch.stat[2],
      x: W * 0.5,
      y: H * 0.82,
      size: 86,
    });
  }
});
```
