#!/usr/bin/env node
/**
 * MotionCraft Standalone Frame Verifier & Deterministic MP4 Exporter
 *
 * Verify frames & runtime health (0 errors):
 *   node scripts/export-mp4.mjs --html path/to/video.html --verify-only [--aspect 9:16|16:9]
 *
 * Render deterministic H.264 MP4 + synthesized WAV SFX (+ optional voiceover):
 *   node scripts/export-mp4.mjs --html path/to/video.html [--out video.mp4] [--aspect 9:16|16:9] [--fps 30] [--scale 1] [--vo voiceover.mp3]
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderTimelineTrackWav } from '../assets/sfx-synth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { fps: 30, scale: 1, verifyOnly: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--html') out.html = argv[++i];
    else if (a === '--out') out.outPath = argv[++i];
    else if (a === '--aspect') out.aspect = argv[++i];
    else if (a === '--fps') out.fps = Math.max(10, Math.min(60, Number(argv[++i]) || 30));
    else if (a === '--scale') out.scale = Math.max(0.5, Math.min(2, Number(argv[++i]) || 1));
    else if (a === '--vo') out.voPath = argv[++i];
    else if (a === '--verify-only') out.verifyOnly = true;
    else if (!a.startsWith('--') && !out.html) out.html = a;
  }
  return out;
}

function findBrowserExecutable() {
  const prog = process.env.PROGRAMFILES || 'C:\\Program Files';
  const prog86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
  const localApp = process.env.LOCALAPPDATA || '';

  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    path.join(prog, 'Google/Chrome/Application/chrome.exe'),
    path.join(prog86, 'Google/Chrome/Application/chrome.exe'),
    localApp ? path.join(localApp, 'Google/Chrome/Application/chrome.exe') : null,
    path.join(prog, 'Microsoft/Edge/Application/msedge.exe'),
    path.join(prog86, 'Microsoft/Edge/Application/msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function findFfmpegExecutable() {
  const localApp = process.env.LOCALAPPDATA || '';
  const candidates = [
    process.env.FFMPEG_PATH,
    localApp ? path.join(localApp, 'Microsoft/WinGet/Links/ffmpeg.exe') : null,
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
  ].filter(Boolean);

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return 'ffmpeg';
}

async function loadPuppeteer(hintDir = process.cwd()) {
  const directNames = ['puppeteer-core', 'puppeteer'];
  for (const pkg of directNames) {
    try {
      const mod = await import(pkg);
      return mod.default || mod;
    } catch {}
  }

  const searchDirs = [];
  for (const start of [process.cwd(), hintDir]) {
    let cur = path.resolve(start);
    for (let d = 0; d < 5; d++) {
      if (!searchDirs.includes(cur)) searchDirs.push(cur);
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
  }
  if (process.env.NODE_PATH) {
    searchDirs.push(...process.env.NODE_PATH.split(path.delimiter).filter(Boolean));
  }
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (globalRoot) searchDirs.push(globalRoot);
  } catch {}

  for (const base of searchDirs) {
    const candidates = [
      path.join(base, 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'),
      path.join(base, 'puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'),
      path.join(base, 'node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js'),
      path.join(base, 'puppeteer/lib/esm/puppeteer/puppeteer.js'),
    ];
    for (const c of candidates) {
      if (existsSync(c)) {
        const mod = await import(pathToFileURL(c).href);
        return mod.default || mod;
      }
    }
  }

  throw new Error(
    'Paket "puppeteer-core" (atau "puppeteer") belum terpasang untuk verifikasi/render headless. Pasang sekali dengan: npm install -g puppeteer-core'
  );
}

function serveHtmlFile(htmlPath) {
  const htmlBytes = readFileSync(htmlPath);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(htmlBytes);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        server,
        url: `http://127.0.0.1:${server.address().port}/index.html`,
      });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.html) {
    console.error(
      'Usage: node scripts/export-mp4.mjs --html <video.html> [--verify-only] [--aspect 9:16|16:9] [--fps 30] [--scale 1] [--vo audio.mp3] [--out video.mp4]'
    );
    process.exit(1);
  }

  const htmlPath = path.resolve(args.html);
  if (!existsSync(htmlPath)) {
    throw new Error(`Berkas HTML tidak ditemukan: ${htmlPath}`);
  }

  const puppeteer = await loadPuppeteer(path.dirname(htmlPath));
  const browserExe = findBrowserExecutable();
  const launchOpts = {
    headless: true,
    args: [
      '--enable-gpu',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  };
  if (browserExe) launchOpts.executablePath = browserExe;

  const { server, url } = await serveHtmlFile(htmlPath);
  let browser = null;
  const tempWavPath = path.join(os.tmpdir(), `mc-sfx-${Date.now()}.wav`);

  try {
    browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message || String(e)));

    const aspectParam = args.aspect === '9:16' || args.aspect === '16:9' ? `&aspect=${encodeURIComponent(args.aspect)}` : '';
    await page.setViewport({ width: 1920, height: 1920, deviceScaleFactor: args.scale });
    await page.goto(`${url}?clean=1${aspectParam}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(
      'Boolean((window.MOTION && window.MOTION.ready === true) || window.MOTION_ERROR)',
      { timeout: 45000 }
    );

    const stageErr = await page.evaluate(() => window.MOTION_ERROR || '');
    if (stageErr || pageErrors.length > 0) {
      throw new Error(stageErr || pageErrors.join(' | '));
    }

    const meta = await page.evaluate(() => ({
      W: window.MOTION.WIDTH,
      H: window.MOTION.HEIGHT,
      DURATION: window.MOTION.DURATION,
      aspectRatio: window.MOTION.aspectRatio,
      sfxCues: window.MOTION.sfxCues || [],
    }));

    await page.setViewport({ width: meta.W, height: meta.H, deviceScaleFactor: args.scale });
    await page.evaluate(() =>
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3500))])
    );

    const outDir = path.dirname(args.outPath ? path.resolve(args.outPath) : htmlPath);
    mkdirSync(outDir, { recursive: true });
    const baseName = path.basename(htmlPath, path.extname(htmlPath));

    if (args.verifyOnly) {
      const snapHook = path.join(outDir, `${baseName}-verify-hook.png`);
      const snapMid = path.join(outDir, `${baseName}-verify-mid.png`);

      await page.evaluate((t) => window.MOTION.seek(t), Math.min(meta.DURATION - 0.2, meta.DURATION * 0.15));
      await new Promise((r) => setTimeout(r, 120));
      await page.screenshot({ path: snapHook, clip: { x: 0, y: 0, width: meta.W, height: meta.H } });

      await page.evaluate((t) => window.MOTION.seek(t), Math.min(meta.DURATION - 0.2, meta.DURATION * 0.55));
      await new Promise((r) => setTimeout(r, 120));
      await page.screenshot({ path: snapMid, clip: { x: 0, y: 0, width: meta.W, height: meta.H } });

      console.log(
        JSON.stringify(
          {
            ok: true,
            verified: true,
            aspectRatio: meta.aspectRatio,
            resolution: `${meta.W}x${meta.H}`,
            duration: meta.DURATION,
            snapshots: [snapHook, snapMid],
          },
          null,
          2
        )
      );
      return;
    }

    const outMp4Path = args.outPath
      ? path.resolve(args.outPath)
      : path.join(outDir, `${baseName}.mp4`);

    const wavBytes = renderTimelineTrackWav(meta.sfxCues, meta.DURATION, 44100);
    writeFileSync(tempWavPath, wavBytes);

    const ffmpegExe = findFfmpegExecutable();
    const hasVo = Boolean(args.voPath && existsSync(path.resolve(args.voPath)));
    const ffArgs = [
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', String(args.fps),
      '-i', '-',
      '-i', tempWavPath,
    ];

    if (hasVo) {
      ffArgs.push(
        '-i', path.resolve(args.voPath),
        '-filter_complex', '[1:a]volume=0.35[sfx];[2:a]volume=1.0[vo];[sfx][vo]amix=inputs=2:duration=first:dropout_transition=2[aout]',
        '-map', '0:v',
        '-map', '[aout]'
      );
    } else {
      ffArgs.push('-map', '0:v', '-map', '1:a');
    }

    ffArgs.push(
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      '-y',
      outMp4Path
    );

    const ff = spawn(ffmpegExe, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
    let ffStderr = '';
    ff.stderr.on('data', (c) => { ffStderr += c.toString(); });

    const ffDone = new Promise((resolve, reject) => {
      ff.on('error', (err) => reject(new Error(`ffmpeg tidak ditemukan / gagal dijalankan: ${err.message}`)));
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg keluar dengan kode ${code}: ${ffStderr.slice(-400)}`));
      });
    });

    const totalFrames = Math.max(1, Math.ceil(meta.DURATION * args.fps));
    for (let i = 0; i < totalFrames; i++) {
      const t = i / args.fps;
      await page.evaluate(async (time) => {
        window.MOTION.seek(time);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, t);

      const frameBuf = await page.screenshot({
        type: 'jpeg',
        quality: 92,
        clip: { x: 0, y: 0, width: meta.W, height: meta.H },
      });

      if (!ff.stdin.write(frameBuf)) {
        await new Promise((r) => ff.stdin.once('drain', r));
      }

      if (i % 5 === 0 || i === totalFrames - 1) {
        const pct = Math.round(((i + 1) / totalFrames) * 100);
        process.stderr.write(`\r[MotionCraft MP4 ${pct}%] Frame ${i + 1}/${totalFrames} (${t.toFixed(1)}s)`);
      }
    }
    process.stderr.write('\n');
    ff.stdin.end();
    await ffDone;

    console.log(
      JSON.stringify(
        {
          ok: true,
          mp4Path: outMp4Path,
          aspectRatio: meta.aspectRatio,
          resolution: `${meta.W}x${meta.H}`,
          duration: meta.DURATION,
          frames: totalFrames,
        },
        null,
        2
      )
    );
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
    if (existsSync(tempWavPath)) {
      try { unlinkSync(tempWavPath); } catch {}
    }
  }
}

main().catch((err) => {
  console.error('[export-mp4 FAILED]', err.message || err);
  process.exit(1);
});
