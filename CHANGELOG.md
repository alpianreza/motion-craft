# Changelog

All notable changes to **MotionCraft Skill** are documented in this file.

## [1.0.0] - 2026-11-18

### Added
- **Universal Agent Skill Release** compatible with Claude Code (`.claude-plugin`), Google Antigravity, OpenAI Codex CLI (`AGENTS.md` & `~/.codex/skills`), Gemini CLI, Cursor, Windsurf, and plain chat.
- **100% Standalone Engine v4 (`assets/motion-engine.js`)** supporting all **16 MotionFormat categories**:
  `3D`, `Isometrik`, `Bongkar Rumah`, `Stickman 3D`, `Astronomi`, `Dunia Hewan`, `Laut`, `Sains & Alam`, `Sejarah`, `Peta`, `Islami`, `Geografi`, `Anatomi`, `Cerita Rakyat`, `Kartun`, and `Animasi 2D`.
- **Dual Aspect Ratio Responsive Stage**: Native `9:16` Shorts (`1080×1920`) and `16:9` Video (`1920×1080`) with live interactive switcher in the exported HTML player.
- **Embedded Offline + Live WebAudio Synthesizer (`assets/sfx-synth.mjs`)** and Natural Earth `world-atlas` TopoJSON (`assets/land-110m.json`).
- **Zero-Dependency Builder (`scripts/build.mjs`)** using only Node.js built-ins (`node:fs`, `node:zlib`) to output standalone `<slug>.html`, `<slug>-source.zip`, and `<slug>-naskah.md`.
- **Deterministic Verifier & MP4 Exporter (`scripts/export-mp4.mjs`)** supporting `--verify-only` frame checks and frame-by-frame H.264 + synthesized WAV SFX `.mp4` rendering.
