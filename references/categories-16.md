# Katalog 16 Kategori Resmi MotionCraft (`9:16` Shorts & `16:9` Video)

Pilih `style` ID dari tabel di bawah sesuai kategori topik cerita user:

| # | Kategori | `style` ID Resmi | Ciri Visual Utama & Teknik Engine v4 (`MF`) |
| :--- | :--- | :--- | :--- |
| 1 | **3D** | `monumen-3d` | Bangunan bersejarah / kapal / struktur raksasa prosedural di Three.js (`MF.monumentStage3D`, `MF.proceduralEiffelTower`, susunan `CylinderGeometry`/`BoxGeometry` + `THREE.CanvasTexture` batu/baja) dengan kabut senja/malam (`FogExp2`). |
| 2 | **Isometrik** | `isometrik-mesin` | Kamera ortografis 3D (`MF.isoThreeStage` / `THREE.OrthographicCamera`) membongkar lapisan baterai, turbin, mesin jet, lift, atau kereta beserta aliran ion/energi bercahaya. |
| 3 | **Bongkar Rumah** | `isometrik-cutaway` | Rumah berjendela & beratap miring (`MF.isoBlock`, `MF.isoPitchedRoof`) yang dinding/atapnya diangkat (`MF.peelAway` + `MF.lightLeak`) menyingkap pipa, MCB listrik, AC, atau pondasi tahan gempa. |
| 4 | **Stickman 3D** | `stickman-3d` | Panggung meja kayu hangat (`MF.stickmanStage3D`) dengan karakter stickman cel-shaded berambut runcing (`MF.stickmanActor3D`, ekspresi `shock`/`happy`) berdampingan dengan benda logam/fisik 3D raksasa (`MF.reededCoin3D`, disket, pensil, jam saku). |
| 5 | **Astronomi** | `sinematik-3d` | Lubang hitam GLSL raymarching (`MF.glslBlackHole` pembelokan gravitasi & Doppler plasma) atau tata surya/nebula Three.js (`MF.threeWorld` + `MF.threeSphere` atmosfer Fresnel). |
| 6 | **Dunia Hewan** | `dunia-hewan` | Lanskap savana senja / hutan malam atmosferik + satwa berlapis (`MF.illustratedElephant` atau rig sendi `MF.joint`) dengan visualisasi cincin gelombang indera (infrasonik, ekolokasi, medan magnet). |
| 7 | **Laut** | `biota-laut-3d`, `neon-mikro` | `biota-laut-3d`: Paus biru & kawanan ikan 3D bertekstur kulit totol `CanvasTexture` & tulang belakang meliuk (`MF.underwaterWorld3D` + `MF.realisticSwimmer3D`). `neon-mikro`: Laut abisal gelap berpendar (`MF.biolumStage` + `MF.glowOrganism`). |
| 8 | **Sains & Alam** | `kertas-cutout`, `komik-manga`, `tanah-liat-3d` | `kertas-cutout`: Diorama kertas berlapis (`#mf-paper-cut`) untuk ombak/gunung/cuaca. `komik-manga`: Panel komik miring + `speedLines` + `comicBurst` untuk fisika cepat. `tanah-liat-3d`: Plastisin 3D stop-motion 12fps (`MF.clayWorld`). |
| 9 | **Sejarah** | `kolase-jurnalisme`, `ukiran-sketsa`, `retro-crt` | `kolase-jurnalisme`: Meja arsip, benang merah, stabilo, & `inkStamp`. `ukiran-sketsa`: Buku sketsa etsa sepia Da Vinci (`MF.vintageSketchStage`, `MF.sketchGear`). `retro-crt`: Monitor fosfor 80-an + pixel 8-bit (`MF.crtStage`, `MF.pixelSprite`). |
| 10 | **Peta** | `peta-perkamen` | Peta garis pantai Bumi asli (`world-atlas` + `d3-geo`) di atas buku perkamen tua terbuka (`MF.realWorldMap` tema `'parchment-book'`), kapal layar dhow/jung, & rute perjalanan kamera (`drawVoyageRoute`). |
| 11 | **Islami** | `kisah-islami`, `manuskrip-emas` | `kisah-islami`: Berkas cahaya khusyuk (`MF.islamicStage`), kaligrafi ayat/doa berpendar emas, & siluet santun (*tanpa menggambar sosok Nabi*). `manuskrip-emas`: Bingkai geometris bintang segi-8 emas berputar (`MF.goldManuscriptStage`) untuk sejarah ilmuwan Muslim. |
| 12 | **Geografi** | `geografi-skala`, `peta-atlas` | `geografi-skala`: Perbandingan skala & proyeksi peta nyata (`MF.realWorldMap` tema `'modern-atlas'`, mis. rentang Indonesia vs Eropa). `peta-atlas`: Peta topografi dilanjutkan `whipTo` ke penampang geologi samping. |
| 13 | **Anatomi** | `anatomi-tubuh` | Studio medis merah-lembayung gelap (`MF.anatomyStage`) lengkap sel darah mikro, garis detak EKG hidup, dan organ berpendar (`MF.beatingHeart` kontraksi *lub-dub* atau penampang otak/mata/lambung/gigi). |
| 14 | **Cerita Rakyat** | `diorama-rakyat`, `cat-air` | `diorama-rakyat`: Lanskap senja/badai sinematik Nusantara dengan siluet rumah adat (Rumah Bolon, Candi, Perahu) & cahaya magis. `cat-air`: Sapuan pigmen cat air organik (`MF.watercolorStage` + `MF.watercolorWash`). |
| 15 | **Kartun** | `kartun-panggung` | Panggung edukasi cerah dengan tokoh manusia bersendi penuh (`MF.cartoonCharacter` berjalan, berkedip, menunjuk) dikelilingi 8–10 benda ruangan yang hidup. |
| 16 | **Animasi 2D** | `kartun-2d`, `katalog-risograf`, `infografis-kaca`, `tipografi-kinetik` | `kartun-2d`: Dunia paralaks mengalir + diagram interaktif. `katalog-risograf`: Meja putih dot-grid + kartu cetak tinta multiply (`MF.risoCard`). `infografis-kaca`: Kartu *frosted-glass* + `MF.animatedLineChart`. `tipografi-kinetik`: Hentakan kata cepat (`MF.kineticSlam`). |

---

## Panduan Pemilihan Cepat dari Ide Cerita
- **Bangunan ikonik, keajaiban dunia, kapal besar** → `monumen-3d` (Kategori **3D**)
- **Cara kerja alat, baterai, turbin, lift, mesin** → `isometrik-mesin` (Kategori **Isometrik**)
- **Pipa mampet, listrik MCB, AC bocor, pondasi rumah** → `isometrik-cutaway` (Kategori **Bongkar Rumah**)
- **Asal-usul benda unik sehari-hari (koin, jeans, disket, QWERTY, pensil)** → `stickman-3d` (Kategori **Stickman 3D**)
- **Lubang hitam, bintang, planet, galaksi, relativitas** → `sinematik-3d` (Kategori **Astronomi**)
- **Fakta satwa darat/udara & indera supernya** → `dunia-hewan` (Kategori **Dunia Hewan**)
- **Paus, hiu, ikan, palung laut, biota bercahaya** → `biota-laut-3d` atau `neon-mikro` (Kategori **Laut**)
- **Jalur penjelajah, pelayaran, perdagangan lintas negara** → `peta-perkamen` (Kategori **Peta**)
- **Perbandingan luas negara, batas benua, sungai, gunung** → `geografi-skala` atau `peta-atlas` (Kategori **Geografi**)
- **Jantung, otak, saraf, lambung, mata, tulang, gigi** → `anatomi-tubuh` (Kategori **Anatomi**)
- **Tadabbur Al-Qur'an, kisah hikmah, sejarah peradaban Islam** → `kisah-islami` atau `manuskrip-emas` (Kategori **Islami**)
- **Legenda Nusantara (Danau Toba, Malin Kundang, Tangkuban Parahu)** → `diorama-rakyat` atau `cat-air` (Kategori **Cerita Rakyat**)
