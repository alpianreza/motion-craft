#!/usr/bin/env node
/**
 * MotionCraft Community Edition (Free) — Standalone Builder (6 Free Categories, max 60s)
 * Usage:
 *   node scripts/build.mjs --spec path/to/spec.json [--out-dir path/to/output]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(SKILL_ROOT, 'assets');

const FREE_STYLES = {
  'stickman-3d': { category: 'Stickman 3D', name: 'Stickman 3D & Prop Fisik' },
  'isometrik-cutaway': { category: 'Bongkar Rumah', name: 'Bongkar Rumah Cutaway' },
  'peta-perkamen': { category: 'Peta', name: 'Peta Pelayaran Perkamen' },
  'kertas-cutout': { category: 'Sains & Alam', name: 'Diorama Kertas Cutout' },
  'komik-manga': { category: 'Sains & Alam', name: 'Komik Sains Dinamis' },
  'kartun-panggung': { category: 'Kartun', name: 'Panggung Kartun Bersendi' },
  'kartun-2d': { category: 'Animasi 2D', name: 'Dunia Vektor Paralaks 2D' },
  'tipografi-kinetik': { category: 'Animasi 2D', name: 'Tipografi Kinetik Cepat' },
};

const PRO_ONLY_STYLES = new Set([
  'monumen-3d', 'isometrik-mesin', 'sinematik-3d', 'dunia-hewan',
  'biota-laut-3d', 'neon-mikro', 'tanah-liat-3d', 'kolase-jurnalisme',
  'ukiran-sketsa', 'retro-crt', 'kisah-islami', 'manuskrip-emas',
  'geografi-skala', 'peta-atlas', 'anatomi-tubuh', 'diorama-rakyat',
  'cat-air', 'katalog-risograf', 'infografis-kaca',
]);

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--spec') out.spec = argv[++i];
    else if (a === '--out-dir') out.outDir = argv[++i];
    else if (!a.startsWith('--') && !out.spec) out.spec = a;
  }
  return out;
}

function escapeScriptClose(str) {
  return String(str || '').replace(/<\/script>/gi, '<\\/script>');
}

function validateSceneCode(code) {
  if (!code || !String(code).trim()) return 'sceneCode kosong.';
  try {
    new Function('MF', 'stage', 'tl', 'W', 'H', 'DUR', code);
  } catch (err) {
    return err.message || String(err);
  }
  if (/Math\.random\s*\(/.test(code)) {
    return 'Dilarang memakai Math.random(). Gunakan MF.rng("seed") agar deterministik.';
  }
  return null;
}

function buildScriptMarkdown(project, styleMeta) {
  const lines = [
    `# ${project.title}`,
    ``,
    `- **Ide Awal:** ${project.idea || '-'}`,
    `- **Kategori & Gaya (Community Free):** ${styleMeta.category} — ${styleMeta.name} (\`${project.style}\`)`,
    `- **Format & Durasi:** \`${project.aspectRatio}\` (Responsif \`9:16\` ↔ \`16:9\`) · \`${project.duration} detik\``,
  ];

  if (project.visualRecommendation) {
    const vr = project.visualRecommendation;
    lines.push(
      ``,
      `## Rekomendasi Visual`,
      `- **Objek & Prop:** ${vr.objek || vr.objects || '-'}`,
      `- **Kamera & Transisi:** ${vr.kamera || vr.camera || '-'}`,
      `- **Suasana & Pencahayaan:** ${vr.suasana || vr.mood || '-'}`
    );
  }

  lines.push(``, `## Naskah & Urutan Adegan`, ``);
  (project.scenes || []).forEach((sc, idx) => {
    const label = sc.label || (idx === 0 ? 'HOOK' : `ADEGAN ${idx}`);
    lines.push(`### ${label} — ${sc.title || ''} (${sc.start}s – ${sc.end}s)`, `**Narasi VO:**`, `> ${sc.narration || '-'}`, ``);
    if (sc.visualBeat || sc.visualDirection) {
      lines.push(`**Arahan Visual:** ${sc.visualBeat || sc.visualDirection}`, ``);
    }
  });

  return lines.join('\n');
}

function buildStandaloneHtml(project) {
  const template = readFileSync(path.join(ASSETS_DIR, 'starter-template.html'), 'utf8');
  const engineJs = readFileSync(path.join(ASSETS_DIR, 'motion-engine.js'), 'utf8');
  const sfxJs =
    readFileSync(path.join(ASSETS_DIR, 'sfx-synth.mjs'), 'utf8')
      .replace(/export\s+const\s+/g, 'const ')
      .replace(/export\s+function\s+/g, 'function ') +
    '\nwindow.__createSfx = createWebAudioSfxPlayer;';

  const needsWorldMap = /realWorldMap/.test(project.sceneCode || '');
  const worldTopoJson = needsWorldMap ? readFileSync(path.join(ASSETS_DIR, 'land-110m.json'), 'utf8') : 'null';

  const safeTitle = String(project.title || 'MotionCraft Animation')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return template
    .replace('/*__PAGE_TITLE__*/', safeTitle)
    .replace('/*__WORLD_TOPO__*/ null', escapeScriptClose(worldTopoJson))
    .replace('/*__SFX_SYNTH__*/', () => escapeScriptClose(sfxJs))
    .replace('/*__MOTION_ENGINE__*/', () => escapeScriptClose(engineJs))
    .replace('/*__PROJECT_JSON__*/ null', () => escapeScriptClose(JSON.stringify(project, null, 2)));
}

function createZipBuffer(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name.replace(/\\/g, '/'), 'utf8');
    const rawBuf = Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content), 'utf8');
    const crc = zlib.crc32(rawBuf) >>> 0;
    const compBuf = zlib.deflateRawSync(rawBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x5972, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compBuf.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuf, compBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5972, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compBuf.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compBuf.length;
  }

  const centralSize = centralParts.reduce((s, b) => s + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.spec) {
    console.error('Usage: node scripts/build.mjs --spec <spec.json> [--out-dir <dir>]');
    process.exit(1);
  }

  const specPath = path.resolve(args.spec);
  const raw = JSON.parse(readFileSync(specPath, 'utf8').replace(/^\uFEFF/, ''));

  if (raw.style && PRO_ONLY_STYLES.has(raw.style)) {
    console.error(
      `[PRO PACK REQUIRED] Style "${raw.style}" is part of MotionCraft Pro Pack (16 Categories, 3D Cutaway Engines, Karaoke Captions, SRT Export, & up to 10-min videos). Available free styles: ${Object.keys(FREE_STYLES).join(', ')}.`
    );
    process.exit(1);
  }

  const syntaxErr = validateSceneCode(raw.sceneCode || '');
  if (syntaxErr) {
    console.error(`[SCENE CODE ERROR]: ${syntaxErr}`);
    process.exit(1);
  }

  const styleId = FREE_STYLES[raw.style] ? raw.style : 'stickman-3d';
  const styleMeta = FREE_STYLES[styleId];
  const aspectRatio = raw.aspectRatio === '16:9' ? '16:9' : '9:16';
  const rawDuration = Number(raw.duration) || 30;
  const duration = Math.max(5, Math.min(60, rawDuration));
  if (rawDuration > 60) {
    console.warn('[Community Edition Notice] Duration capped at 60s. Upgrade to MotionCraft Pro Pack for 1–10 minute (600s) long-form videos.');
  }

  const project = {
    id: raw.id || `mc-free-${Date.now()}`,
    title: raw.title || 'MotionCraft Animation',
    idea: raw.idea || raw.title || '',
    style: styleId,
    category: styleMeta.category,
    aspectRatio,
    responsive: true,
    duration,
    visualRecommendation: raw.visualRecommendation || null,
    scenes: Array.isArray(raw.scenes) ? raw.scenes : [],
    sceneCode: String(raw.sceneCode).trim(),
  };

  const outDir = path.resolve(args.outDir || path.dirname(specPath));
  mkdirSync(outDir, { recursive: true });

  const slug = String(project.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || project.id;
  const htmlContent = buildStandaloneHtml(project);
  const mdContent = buildScriptMarkdown(project, styleMeta);
  const engineJs = readFileSync(path.join(ASSETS_DIR, 'motion-engine.js'), 'utf8');
  const sfxJs = readFileSync(path.join(ASSETS_DIR, 'sfx-synth.mjs'), 'utf8');

  const sceneModule = `export function buildAnimation(MF, stage, tl, W, H, DUR) {\n${project.sceneCode}\n}\n`;
  const zipBuf = createZipBuffer([
    { name: 'index.html', content: htmlContent },
    { name: 'NASKAH-DAN-STORYBOARD.md', content: mdContent },
    { name: 'src/scene.js', content: sceneModule },
    { name: 'src/project.json', content: JSON.stringify(project, null, 2) },
    { name: 'engine/motion-engine.js', content: engineJs },
    { name: 'engine/sfx-synth.mjs', content: sfxJs },
  ]);

  const htmlPath = path.join(outDir, `${slug}.html`);
  const zipPath = path.join(outDir, `${slug}-source.zip`);
  const mdPath = path.join(outDir, `${slug}-naskah.md`);

  writeFileSync(htmlPath, htmlContent, 'utf8');
  writeFileSync(zipPath, zipBuf);
  writeFileSync(mdPath, mdContent, 'utf8');

  console.log(JSON.stringify({ ok: true, edition: 'community-free', title: project.title, category: styleMeta.category, style: project.style, aspectRatio, duration, htmlPath, zipPath, mdPath }, null, 2));
}

try {
  main();
} catch (err) {
  console.error('[build FAILED]', err.message || err);
  process.exit(1);
}
