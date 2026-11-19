<div align="center">

<img src="icon.svg" width="108" alt="MotionCraft icon">

# MotionCraft (Community Edition)

**Free & open-source AI Agent Skill for 9:16 Vertical Shorts & 16:9 Explainer animations.**<br>
Turn 1 sentence into a visual brief, `Hook → Scene` script (up to 60s), standalone playable `index.html`, source code ZIP, and MP4 across **6 core visual categories** — zero app dependency, zero `npm install` required to build.

[![Version](https://img.shields.io/badge/version-1.1.0-f5b82e?style=flat-square&labelColor=101829)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-3fa34d?style=flat-square)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/format-Agent%20Skills-1c2a4a?style=flat-square)](#install)
[![Works With](https://img.shields.io/badge/works%20with-Claude%20Code%20%C2%B7%20Antigravity%20%C2%B7%20Codex%20%C2%B7%20Gemini%20CLI%20%C2%B7%20Cursor-7a5af5?style=flat-square)](#install)

[6 Free Categories](#6-free-categories-included) · [Free vs. Pro Pack](#community-free-vs-motioncraft-pro-pack) · [Install](#install) · [Example Prompts](#example-prompts)

</div>

---

## 6 Free Categories Included

| # | Category | Free `style` ID | Visual Technique |
| :--- | :--- | :--- | :--- |
| 1 | **Stickman 3D** | `stickman-3d` | Warm tabletop 3D stage, expressive cel-shaded 3D stickman, & oversized metallic props |
| 2 | **House Cutaway** | `isometrik-cutaway` | Isometric architectural cutaway with roof/wall peel-away (`peelAway`) |
| 3 | **Maps & Voyages** | `peta-perkamen` | Real Natural Earth coastlines (`world-atlas` + `d3-geo`), sailing ships, & voyage routes |
| 4 | **Science & Nature** | `kertas-cutout`, `komik-manga` | Layered paper diorama cutout & dynamic science comic panels |
| 5 | **Cartoon Stage** | `kartun-panggung` | Articulated walking/pointing cartoon characters with houses, trees, & vehicles |
| 6 | **2D Motion Graphics** | `kartun-2d`, `tipografi-kinetik` | Parallax vector world & beat-locked kinetic typography |

---

## Community (Free) vs. MotionCraft Pro Pack

Want all **16 studio categories**, **3D Laser-Cutaway Turbofan Jet & 4-Stroke Piston Engines**, **GLSL Black Holes & 3D Solar System**, **Auto-Synced Karaoke Captions + `.srt` export**, and **up to 10-minute long-form explainers**?

| Feature | Community (GitHub Free) | **MotionCraft Pro Pack** |
| :--- | :---: | :---: |
| **Visual Categories** | **6 Core Categories** | **All 16 Studio Categories** (+10 Pro exclusives) |
| **Max Video Duration** | Up to **60 seconds** | Up to **10 minutes (`600s`)** modular long-form |
| **3D Cutaway & Exploded Turbofan Jet & Piston Engines** | ❌ | ✅ (`MF.turbofanJet3D`, `MF.cutawayMachine3D`) |
| **GLSL Black Hole, 3D Solar System, Ocean 3D & Anatomy** | ❌ | ✅ (`MF.glslBlackHole`, `MF.solarSystem3D`, `MF.beatingHeart`) |
| **3D Monuments, Wildlife, Islamic, History, Geography, Folklore** | ❌ | ✅ Full 16-category Engine v4 Pro |
| **Auto-Synced Karaoke Captions (`CC` toggle) & `.srt` Export** | ❌ | ✅ YouTube / CapCut / Premiere Pro ready |
| **8 Studio Brand Themes & Channel Watermark** | ❌ | ✅ `MF.brandTheme`, `MF.watermark` |
| **Dual-Aspect Batch Builder (`9:16` + `16:9` in 1 command)** | ❌ | ✅ `scripts/batch-render.mjs` |
| **Auto Cover Thumbnail PNG (`--thumb`) & Dual MP4 (`--both`)** | ❌ | ✅ `scripts/export-mp4.mjs` |
| **Viral Hooks Playbook + 3 Ready-to-Build Pro Templates** | ❌ | ✅ Included |

> 🚀 **Upgrade to MotionCraft Pro Pack:** Available soon on **Agensi.io** *(update this link with your Agensi.io Pro Pack affiliate link once live!)*.

---

## Install

### Claude Code (Plugin Marketplace)
```text
/plugin marketplace add alpianreza/motion-craft
/plugin install motion-craft@motion-craft
```

### Manual Clone (Any AI Agent)
| AI Agent | Command |
| :--- | :--- |
| **Claude Code** | `git clone https://github.com/alpianreza/motion-craft.git ~/.claude/skills/motion-craft` |
| **Google Antigravity** | `git clone https://github.com/alpianreza/motion-craft.git ~/.gemini/config/skills/motion-craft` |
| **OpenAI Codex CLI** | `git clone https://github.com/alpianreza/motion-craft.git ~/.codex/skills/motion-craft` |
| **Gemini CLI / Cursor / Windsurf** | `git clone https://github.com/alpianreza/motion-craft.git .agents/skills/motion-craft` |

---

## Example Prompts

```text
Make a 35-second 9:16 Short in Stickman 3D style explaining why coins have ridges on their edges.
```
```text
Create a 45-second animated Natural Earth parchment map tracing the historic spice trade route across the Indian Ocean.
```
```text
Explain how house plumbing works using House Cutaway (isometrik-cutaway) style, 40 seconds, 9:16.
```

---

## License

[MIT](LICENSE)
