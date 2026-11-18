---
name: motion-craft
description: >-
  Membangun video animasi explainer & Shorts sinematik berbasis kode (9:16 Shorts & 16:9 Video, durasi 15 detik hingga 10 menit) dalam 16 kategori visual setara studio: 3D, Isometrik, Bongkar Rumah, Stickman 3D, Astronomi (GLSL Black Hole), Dunia Hewan, Laut 3D, Sains & Alam, Sejarah, Peta (Natural Earth d3-geo), Islami, Geografi, Anatomi, Cerita Rakyat, Kartun, dan Animasi 2D. Menghasilkan rekomendasi visual, naskah bertahap (Hook -> Adegan 1..N), file HTML mandiri yang langsung berputar di browser, paket source code ZIP, serta render video MP4 deterministik. Gunakan skill ini setiap kali user meminta video animasi, Shorts edukasi, explainer, simulasi 3D, peta sejarah/geografi, stickman 3D, anatomi, atau storyboard video.
---

# MotionCraft — Universal Agent Skill untuk Video Explainer & Shorts 16 Kategori

Skill mandiri (*zero app dependency*) yang mengubah 1 kalimat ide cerita menjadi **rekomendasi arah visual**, **naskah bertahap (`HOOK` → `ADEGAN 1` → `ADEGAN 2` → dst. hingga 10 menit)**, **file mandiri `<slug>.html`** (klik 2x langsung jalan di browser lengkap dengan tombol ganti rasio `9:16` ↔ `16:9` & WebAudio SFX), **paket source code `<slug>-source.zip`**, serta **render video `.mp4`**.

---

## Alur Kerja Wajib (5 Langkah)

### Langkah 1 — Rekomendasi Visual & Rencana Naskah (`HOOK → ADEGAN 1..N`)
Saat user memberikan ide cerita (jika rasio atau durasi belum disebut, gunakan default `9:16` Shorts `30–45 dtk` untuk fakta singkat, atau `16:9` Video `60–600 dtk` untuk bahasan mendalam):
1. **Pilih 1 Kategori paling tepat** dari **16 Kategori Resmi**:
   `3D` · `Isometrik` · `Bongkar Rumah` · `Stickman 3D` · `Astronomi` · `Dunia Hewan` · `Laut` · `Sains & Alam` · `Sejarah` · `Peta` · `Islami` · `Geografi` · `Anatomi` · `Cerita Rakyat` · `Kartun` · `Animasi 2D`.
2. **Rumuskan Rekomendasi Visual Spesifik**:
   - **Objek & Prop (`objek`):** subjek utama bertekstur/bersendi + minimal 3 prop pembanding skala/bukti.
   - **Kamera & Transisi (`kamera`):** pola multi-shot (`wide` → `close-up` detail → `orbit` / `whipTo` / `pull-back`).
   - **Suasana & Pencahayaan (`suasana`):** atmosfer langit/ruang, kabut/cahaya volumetrik, palet warna, dan nada narasi.
3. **Susun Naskah Bertahap (`0` s.d. `DUR` detik tanpa celah kosong)**:
   - Bagian pertama **WAJIB** `HOOK` (3–10 detik pembuka pemicu rasa penasaran).
   - Dilanjutkan `ADEGAN 1`, `ADEGAN 2`, dst., dan ditutup kesimpulan faktual yang kuat (~2,2 kata/detik).
   - Untuk durasi panjang (> 60 dtk hingga `600` dtk / 10 menit), baca [Panduan Durasi Panjang 10 Menit](./references/longform-10min.md).

### Langkah 2 — Baca Resep Kategori & Standar Emas Kode Contoh (WAJIB!)
**JANGAN menulis `sceneCode` dari tebakan kosong!** Sebelum menulis kode animasi:
1. Baca tabel kategori & `style` ID di [Katalog 16 Kategori](./references/categories-16.md) serta daftar fungsi runtime di [Referensi API Engine v4 (`MF`)](./references/engine-v4-api.md).
2. Baca contoh kode sumber resmi yang paling dekat di [Standar Emas Kode Referensi](./examples/golden-showcases.md).
3. **Hukum Kesetaraan Kualitas:** Kepadatan objek, detail tekstur (`CanvasTexture` / SVG berlapis / garis pantai `world-atlas` / shader GLSL), pencahayaan, dan kemulusan kamera **WAJIB SETARA** dengan contoh di `golden-showcases.md`. Dilarang menggambar kotak/lingkaran polos tanpa tekstur atau prop!

### Langkah 3 — Aturan Emas Penulisan `sceneCode`
`sceneCode` dieksekusi sebagai isi fungsi `(MF, stage, tl, W, H, DUR)`:
- **Responsif Ganda (`9:16` Shorts & `16:9` Video):** Selalu gunakan proporsi `W` dan `H` (`W * 0.5`, `H * 0.45`, `size: W < H ? 50 : 56`, `labelX: W < H ? W * 0.08 : W * 0.54`) agar animasi tampil utuh tanpa terpotong di `1080×1920` maupun `1920×1080`.
- **Jangan Menimpa Variabel `H`:** Jangan pernah menulis `const { H } = MF;` karena akan menimpa tinggi panggung `H`! Selalu panggil lewat prefix `MF.` (`MF.H`, `MF.S`, `MF.T`).
- **Deterministik 100%:** Dilarang memakai `Math.random()`, `Date.now()`, `setTimeout`, atau `setInterval`. Gunakan `MF.rng('seed-tetap')`, tween pada `tl`, dan `MF.onTick((t) => ...)` sebagai fungsi murni dari waktu `t`.
- **Frame 0 Langsung Hidup:** Elemen panggung & judul pembuka `HOOK` wajib memakai `at: 0` agar frame pertama tidak kosong/gelap.
- **Anti-PPT:** Maksimal 1 kalimat headline (`MF.highlightHeadline`) + 1 callout/angka (`MF.leaderCallout` / `MF.bigStat`) pada satu waktu. Cerita wajib dibawa oleh perubahan aksi dunia/objek dan gerak kamera, bukan deretan kartu teks!

### Langkah 4 — Rakit File Mandiri (`.html`, `-source.zip`, `-naskah.md`)
Buat file spesifikasi JSON (mis. `spec.json`):
```json
{
  "title": "Judul Video",
  "idea": "Ide cerita asli user",
  "style": "stickman-3d",
  "aspectRatio": "9:16",
  "duration": 30,
  "visualRecommendation": {
    "objek": "...",
    "kamera": "...",
    "suasana": "..."
  },
  "scenes": [
    { "label": "HOOK", "title": "...", "start": 0, "end": 7, "narration": "...", "visualBeat": "..." },
    { "label": "ADEGAN 1", "title": "...", "start": 7, "end": 18, "narration": "...", "visualBeat": "..." }
  ],
  "sceneCode": "const view = MF.H('div', { className: 'mf-view' }, stage); ..."
}
```
Lalu jalankan skrip pembangun mandiri (**murni Node.js bawaan, 0 dependensi `npm`!**):
```bash
node "<path-ke-skill>/scripts/build.mjs" --spec path/ke/spec.json --out-dir path/tujuan
```
Skrip ini memvalidasi sintaks & determinisme `sceneCode`, menanamkan `./assets/motion-engine.js`, `./assets/sfx-synth.mjs`, serta `./assets/land-110m.json` (bila memakai peta), lalu menghasilkan:
1. `<slug>.html` — 1 file mandiri siap tonton di browser mana pun (auto-loop + scrub bar + tombol switch `9:16` ↔ `16:9` + WebAudio SFX).
2. `<slug>-source.zip` — arsip source code lengkap (`index.html`, `src/scene.js`, `src/project.json`, `NASKAH-DAN-STORYBOARD.md`, `engine/`).
3. `<slug>-naskah.md` — dokumen naskah & rekomendasi visual rapi.

> **Fallback Tanpa Shell / Web Chat:** Bila lingkungan agen tidak memiliki akses terminal Node.js, salin isi `./assets/starter-template.html`, ganti placeholder `/*__MOTION_ENGINE__*/`, `/*__SFX_SYNTH__*/`, dan `/*__PROJECT_JSON__*/ null` secara langsung untuk menghasilkan berkas `index.html` utuh.

### Langkah 5 — Verifikasi Frame & Export Video MP4 (Opsional / Bila Tersedia Browser Headless)
Bila lingkungan memiliki Chrome/Edge + `puppeteer-core` (atau `puppeteer`), jalankan verifikasi otomatis untuk memastikan `0` runtime error dan mengecek hasil tangkapan layar:
```bash
# Verifikasi cepat (cek 0 error + simpan screenshot HOOK & pertengahan):
node "<path-ke-skill>/scripts/export-mp4.mjs" --html path/tujuan/<slug>.html --verify-only

# Render penuh ke video MP4 (H.264 + AAC SFX otomatis, opsional + --vo narasi.mp3):
node "<path-ke-skill>/scripts/export-mp4.mjs" --html path/tujuan/<slug>.html --fps 30 --scale 1
```
Jika ditemukan error atau teks bertumpuk pada screenshot verifikasi, perbaiki `sceneCode`, bangun ulang dengan `scripts/build.mjs`, lalu serahkan hasilnya ke user.
