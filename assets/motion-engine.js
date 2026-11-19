(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => {
    const x = clamp(u, 0, 1);
    return x * x * (3 - 2 * x);
  };
  const mod = (a, n) => ((a % n) + n) % n;

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seedStr) {
    let a = hashStr(String(seedStr || 'mf'));
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shadeHex(hex, factor) {
    const clean = String(hex || '#cccccc').replace('#', '');
    if (clean.length !== 6 && clean.length !== 3) return hex;
    const full =
      clean.length === 3
        ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
        : clean;
    const r = clamp(Math.round(parseInt(full.slice(0, 2), 16) * factor), 0, 255);
    const g = clamp(Math.round(parseInt(full.slice(2, 4), 16) * factor), 0, 255);
    const b = clamp(Math.round(parseInt(full.slice(4, 6), 16) * factor), 0, 255);
    return (
      '#' +
      [r, g, b]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  function S(tag, attrs = {}, parent = null) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null) continue;
      if (k === 'text' || k === 'textContent') {
        el.textContent = String(v);
      } else {
        el.setAttribute(k, String(v));
      }
    }
    if (parent) parent.appendChild(el);
    return el;
  }

  function T(parent, text, x, y, attrs = {}) {
    return S('text', { x, y, ...attrs, text }, parent);
  }

  function H(tagOrHtml, styleOrAttrs = {}, parent = null) {
    let el;
    if (typeof tagOrHtml === 'string' && tagOrHtml.trim().startsWith('<')) {
      const tpl = document.createElement('template');
      tpl.innerHTML = tagOrHtml.trim();
      el = tpl.content.firstElementChild;
    } else {
      el = document.createElement(tagOrHtml || 'div');
    }
    if (!el) return null;
    if (styleOrAttrs && typeof styleOrAttrs === 'object') {
      if (styleOrAttrs.style && typeof styleOrAttrs.style === 'object') {
        Object.assign(el.style, styleOrAttrs.style);
      }
      for (const [k, v] of Object.entries(styleOrAttrs)) {
        if (k === 'style' || v === undefined || v === null) continue;
        if (k === 'text' || k === 'textContent') el.textContent = String(v);
        else if (k === 'html' || k === 'innerHTML') el.innerHTML = String(v);
        else if (k === 'className') el.className = String(v);
        else if (k in el.style && typeof v !== 'boolean') {
          el.style[k] = v;
        } else {
          el.setAttribute(k, String(v));
        }
      }
    }
    if (parent) parent.appendChild(el);
    return el;
  }

  // Cached 256x256 monochrome noise data URL for fast 60fps grainy gradient
  let _noiseDataUrl = null;
  function getNoiseTileUrl() {
    if (_noiseDataUrl) return _noiseDataUrl;
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 200;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(200, 200);
    const rand = rng('mf-film-grain-tile');
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rand() * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    _noiseDataUrl = c.toDataURL('image/png');
    return _noiseDataUrl;
  }

  // Runtime state per stage init
  let _state = {
    W: 1920,
    H: 1080,
    DUR: 20,
    FPS: 30,
    tl: null,
    stage: null,
    ticks: [],
    sfxCues: [],
    threeWorlds: [],
  };

  function initStage({ W, H, DUR, FPS = 30, stage }) {
    for (const tw of _state.threeWorlds) {
      try {
        tw.renderer.dispose();
      } catch (_) {}
    }
    _state = {
      W,
      H,
      DUR,
      FPS,
      tl: window.gsap.timeline({ paused: true }),
      stage,
      ticks: [],
      sfxCues: [],
      threeWorlds: [],
    };
    return _state.tl;
  }

  function onTick(fn) {
    if (typeof fn === 'function') _state.ticks.push(fn);
    return fn;
  }

  function sfx(time, type = 'pop', volume = 0.8) {
    const t = Math.max(0, Number(time) || 0);
    _state.sfxCues.push({ time: Number(t.toFixed(3)), type, volume });
  }

  function runTicks(t) {
    const boilIdx = Math.floor(Math.max(0, t) * 8) % 4;
    if (_state.stage) {
      const boils = _state.stage.querySelectorAll('.boil');
      for (let i = 0; i < boils.length; i++) {
        boils[i].setAttribute('filter', `url(#mf-boil-${boilIdx})`);
      }
    }
    for (let i = 0; i < _state.ticks.length; i++) {
      try {
        _state.ticks[i](t);
      } catch (err) {
        console.error('Tick error:', err);
      }
    }
    for (let i = 0; i < _state.threeWorlds.length; i++) {
      const tw = _state.threeWorlds[i];
      try {
        tw.renderer.render(tw.scene, tw.camera);
      } catch (err) {
        console.error('Three render error:', err);
      }
    }
  }

  function getRuntimeInfo() {
    const sortedCues = [..._state.sfxCues].sort((a, b) => a.time - b.time);
    return {
      W: _state.W,
      H: _state.H,
      DUR: _state.DUR,
      FPS: _state.FPS,
      tl: _state.tl,
      sfxCues: sortedCues,
      runTicks,
    };
  }

  // =========================================================================
  // SURFACE, ATMOSPHERE, GRAIN, LIGHT LEAK & CONTRAST POCKETS
  // =========================================================================
  function grainOverlay(parent = _state.stage, { opacity = 0.11, blend = 'overlay' } = {}) {
    const el = H('div', {
      position: 'absolute',
      inset: '-80px',
      backgroundImage: `url(${getNoiseTileUrl()})`,
      backgroundRepeat: 'repeat',
      opacity: String(opacity),
      mixBlendMode: blend,
      pointerEvents: 'none',
      zIndex: '45',
    }, parent);
    onTick((t) => {
      const k = Math.floor(t * 12);
      const gx = ((k * 37) % 60) - 30;
      const gy = ((k * 61) % 60) - 30;
      el.style.transform = `translate(${gx}px, ${gy}px)`;
    });
    return el;
  }

  function vignette(parent = _state.stage, { strength = 0.36, color = '6, 10, 22' } = {}) {
    return H('div', {
      position: 'absolute',
      inset: '0',
      background: `radial-gradient(85% 85% at 50% 50%, rgba(${color}, 0) 56%, rgba(${color}, ${strength}) 100%)`,
      pointerEvents: 'none',
      zIndex: '40',
    }, parent);
  }

  function ambientGlow(
    parent,
    { x = '50%', y = '65%', size = 900, color = '#FFD166', opacity = 0.24, blend = 'screen', drift = 35 } = {}
  ) {
    const orb = H('div', {
      position: 'absolute',
      left: typeof x === 'number' ? `${x}px` : x,
      top: typeof y === 'number' ? `${y}px` : y,
      width: `${size}px`,
      height: `${size}px`,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      opacity: String(opacity),
      mixBlendMode: blend,
      pointerEvents: 'none',
    }, parent);
    if (drift > 0) {
      const seed = hashStr(`${x}-${y}-${color}`) % 10;
      onTick((t) => {
        const dx = Math.sin(t * 0.65 + seed) * drift;
        const dy = Math.cos(t * 0.5 + seed) * (drift * 0.65);
        orb.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      });
    }
    return orb;
  }

  function lightLeak(
    parent = _state.stage,
    { tl = _state.tl, at = 5, dur = 0.85, color = '#FFD166', side = 'left' } = {}
  ) {
    const isLeft = side === 'left';
    const leak = H('div', {
      position: 'absolute',
      left: isLeft ? '-520px' : 'auto',
      right: isLeft ? 'auto' : '-520px',
      top: '-260px',
      width: '1700px',
      height: '1700px',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0.35) 24%, transparent 66%)`,
      filter: 'blur(42px)',
      mixBlendMode: 'screen',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '60',
    }, parent);

    if (tl) {
      sfx(at, 'whoosh', 0.62);
      tl.fromTo(
        leak,
        { opacity: 0, x: isLeft ? -180 : 180, scale: 0.85 },
        { opacity: 0.82, x: isLeft ? 220 : -220, scale: 1.12, duration: dur * 0.42, ease: 'sine.in' },
        at - dur * 0.35
      );
      tl.to(
        leak,
        { opacity: 0, x: isLeft ? 480 : -480, scale: 1.25, duration: dur * 0.58, ease: 'sine.out' },
        at + dur * 0.07
      );
    }
    return leak;
  }

  // =========================================================================
  // CAMERA & SHOT CHOREOGRAPHY (Wide <-> Medium Close-Up <-> Close-Up)
  // =========================================================================
  function createWorldCamera(worldEl, W = _state.W, H = _state.H, { breathe = 0.014 } = {}) {
    const isSvg = worldEl instanceof SVGElement;
    const cam = { x: W / 2, y: H / 2, zoom: 1, rot: 0, breathe, el: worldEl, _t: 0 };

    function apply() {
      if (!worldEl) return;
      const b = cam.breathe > 0 ? 1 + cam.breathe * Math.sin(cam._t * 0.85) : 1;
      const z = cam.zoom * b;
      const swayX = cam.breathe > 0 ? Math.sin(cam._t * 0.55) * 6 : 0;
      const swayY = cam.breathe > 0 ? Math.cos(cam._t * 0.45) * 4 : 0;
      if (isSvg) {
        worldEl.setAttribute(
          'transform',
          `translate(${(W / 2 + swayX).toFixed(2)} ${(H / 2 + swayY).toFixed(2)}) scale(${z.toFixed(4)}) rotate(${cam.rot.toFixed(2)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`
        );
      } else {
        worldEl.style.transformOrigin = '0 0';
        worldEl.style.transform = `translate(${(W / 2 + swayX - cam.x * z).toFixed(2)}px, ${(H / 2 + swayY - cam.y * z).toFixed(2)}px) scale(${z.toFixed(4)}) rotate(${cam.rot.toFixed(2)}deg)`;
      }
    }

    onTick((t) => {
      cam._t = t;
      apply();
    });

    apply();

    cam.apply = apply;
    cam.set = (x, y, zoom = 1, rot = 0) => {
      cam.x = x;
      cam.y = y;
      cam.zoom = zoom;
      cam.rot = rot;
      apply();
    };
    cam.cutTo = (tl, at, x, y, zoom = 1, rot = 0) => {
      tl.set(cam, { x, y, zoom, rot, onUpdate: apply }, at);
    };
    cam.panZoom = (tl, at, x, y, zoom = 1, dur = 1.35, ease = 'power2.inOut') => {
      tl.to(cam, { x, y, zoom, duration: dur, ease, onUpdate: apply }, at);
    };
    cam.shot = (tl, at, dur, zoom, x, y, ease = 'power2.inOut') => {
      tl.to(cam, { x, y, zoom, duration: dur, ease, onUpdate: apply }, at);
    };
    cam.reset = (tl, at, dur = 1.2, ease = 'power2.inOut') => {
      tl.to(cam, { x: W / 2, y: H / 2, zoom: 1, rot: 0, duration: dur, ease, onUpdate: apply }, at);
    };
    cam.whipTo = (tl, at, fromView, toView, dir = 1) => {
      sfx(at, 'whoosh', 0.74);
      tl.to(fromView, { y: -110 * dir, opacity: 0, filter: 'blur(14px)', duration: 0.28, ease: 'power2.in' }, at);
      tl.set(fromView, { visibility: 'hidden' }, at + 0.28);
      tl.set(toView, { visibility: 'visible', opacity: 0, y: 110 * dir, filter: 'blur(14px)' }, at + 0.26);
      tl.to(toView, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.38, ease: 'power3.out' }, at + 0.28);
    };
    return cam;
  }

  // Manual Joint Rig Helper (prevents GSAP SVG bbox pivot drift — Hukum 5)
  function joint(svgParent, tx = 0, ty = 0) {
    const el = S('g', {}, svgParent);
    const j = {
      el,
      tx,
      ty,
      x: 0,
      y: 0,
      r: 0,
      sx: 1,
      sy: 1,
      apply() {
        el.setAttribute(
          'transform',
          `translate(${(j.tx + j.x).toFixed(2)} ${(j.ty + j.y).toFixed(2)}) rotate(${j.r.toFixed(2)}) scale(${j.sx.toFixed(3)} ${j.sy.toFixed(3)})`
        );
      },
    };
    j.apply();
    return j;
  }

  // =========================================================================
  // KINETIC TYPOGRAPHY & HAND-DRAWN ANNOTATIONS
  // =========================================================================
  function highlightHeadline(
    parent,
    {
      tl = _state.tl,
      at = 0,
      outAt = null,
      before = '',
      highlight = '',
      after = '',
      y = 86,
      x = null,
      width = null,
      color = '#FFFFFF',
      pillColor = '#FFD166',
      pillTextColor = '#141B2D',
      variant = 'pill', // 'pill' | 'marker' | 'under'
      font = "'Fredoka', 'Plus Jakarta Sans', sans-serif",
      size = 64,
      tilt = -1.6,
      align = 'center',
      pocket = true,
    } = {}
  ) {
    // Optional subtle contrast pocket behind text so background never fights letters
    const isDarkText = parseInt(String(color).replace('#', '').slice(0, 2) || 'ff', 16) < 110;
    let pocketEl = null;
    if (pocket) {
      pocketEl = H('div', {
        position: 'absolute',
        left: '0',
        right: '0',
        top: `${Math.max(0, y - 48)}px`,
        height: `${size * 2.5}px`,
        background: isDarkText
          ? 'radial-gradient(60% 70% at 50% 45%, rgba(255,255,255,0.52) 0%, transparent 100%)'
          : 'radial-gradient(60% 70% at 50% 45%, rgba(6,10,22,0.56) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: '19',
        opacity: at <= 0.05 ? '1' : '0',
      }, parent);
    }

    const safeY = clamp(y, 44, _state.H - 175);
    const box = H('div', {
      position: 'absolute',
      top: `${safeY}px`,
      left: x !== null ? `${x}px` : '56px',
      right: width ? 'auto' : '56px',
      width: width ? `${width}px` : 'auto',
      textAlign: align,
      fontFamily: font,
      fontWeight: '700',
      fontSize: `${size}px`,
      lineHeight: '1.22',
      letterSpacing: '-0.01em',
      color,
      pointerEvents: 'none',
      zIndex: '20',
      textShadow: isDarkText ? '0 2px 14px rgba(255,255,255,0.25)' : '0 4px 26px rgba(5,9,20,0.55)',
      opacity: at <= 0.05 ? '1' : '0',
    }, parent);

    if (before) H('span', { text: `${before} ` }, box);
    let hlWrap = null;
    let hlBg = null;
    if (highlight) {
      hlWrap = H('span', {
        position: 'relative',
        display: 'inline-block',
        padding: variant === 'under' ? '0 4px' : '2px 20px 5px',
        margin: '0 6px',
        transform: variant === 'pill' ? `rotate(${tilt}deg)` : 'none',
      }, box);

      hlBg = H('i', {
        position: 'absolute',
        left: '0',
        right: '0',
        top: variant === 'under' ? 'auto' : variant === 'marker' ? '38%' : '0',
        bottom: variant === 'under' ? '-4px' : '0',
        height: variant === 'under' ? '10px' : 'auto',
        background: pillColor,
        opacity: variant === 'marker' ? '0.68' : '1',
        borderRadius: variant === 'pill' ? '14px' : '6px',
        boxShadow: variant === 'pill' ? '0 6px 0 rgba(12, 16, 30, 0.26)' : 'none',
        transformOrigin: '0% 50%',
        transform: at <= 0.05 ? 'scaleX(1)' : 'scaleX(0)',
      }, hlWrap);

      H('span', {
        text: highlight,
        position: 'relative',
        color: variant === 'pill' ? pillTextColor : color,
      }, hlWrap);
    }
    if (after) H('span', { text: ` ${after}` }, box);

    if (tl) {
      if (at > 0.05) {
        sfx(at, 'pop', 0.65);
        if (pocketEl) tl.to(pocketEl, { opacity: 1, duration: 0.35 }, at);
        tl.fromTo(
          box,
          { opacity: 0, y: 30, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.46, ease: 'power3.out', immediateRender: false },
          at
        );
        if (hlBg) {
          tl.fromTo(
            hlBg,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.45, ease: 'power3.out', immediateRender: false },
            at + 0.14
          );
        }
      } else {
        sfx(0.08, 'pop', 0.55);
      }

      if (outAt !== null && outAt !== undefined) {
        tl.to(
          box,
          { opacity: 0, y: -26, filter: 'blur(6px)', duration: 0.3, ease: 'power2.in' },
          outAt
        );
        if (pocketEl) tl.to(pocketEl, { opacity: 0, duration: 0.28 }, outAt);
      }
    }
    return box;
  }

  function handDrawCircle(
    svgParent,
    {
      tl = _state.tl,
      at = 1,
      outAt = null,
      cx = 500,
      cy = 400,
      r = 120,
      color = '#FF6B6B',
      strokeWidth = 8,
      dur = 0.72,
    } = {}
  ) {
    const pts = [];
    const steps = 16;
    const rand = rng(`circle-${cx}-${cy}-${r}`);
    for (let i = 0; i <= steps + 2; i++) {
      const a = (i / steps) * Math.PI * 2 - Math.PI * 0.65;
      const wobble = 1 + (rand() - 0.5) * 0.11;
      pts.push({
        x: cx + Math.cos(a) * r * wobble,
        y: cy + Math.sin(a) * r * (0.94 + (rand() - 0.5) * 0.1),
      });
    }
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const mx = ((prev.x + curr.x) / 2).toFixed(1);
      const my = ((prev.y + curr.y) / 2).toFixed(1);
      d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${mx} ${my}`;
    }

    const path = S(
      'path',
      {
        d,
        fill: 'none',
        stroke: color,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      svgParent
    );

    let len = 2 * Math.PI * r * 1.18;
    try {
      const measured = path.getTotalLength();
      if (measured > 0) len = measured;
    } catch (_) {}

    path.setAttribute('stroke-dasharray', String(len));
    path.setAttribute('stroke-dashoffset', String(len));

    if (tl) {
      sfx(at, 'scribble', 0.72);
      tl.to(path, { attr: { 'stroke-dashoffset': 0 }, duration: dur, ease: 'power2.out' }, at);
      if (outAt !== null && outAt !== undefined) {
        tl.to(path, { opacity: 0, duration: 0.25 }, outAt);
      }
    }
    return path;
  }

  function handDrawArrow(
    svgParent,
    {
      tl = _state.tl,
      at = 1.2,
      outAt = null,
      x1 = 600,
      y1 = 300,
      cx = 540,
      cy = 440,
      x2 = 420,
      y2 = 540,
      note = '',
      color = '#80ED99',
      noteColor = null,
      strokeWidth = 6,
      dur = 0.65,
      fontSize = 46,
      noteDx = 0,
      noteDy = -16,
    } = {}
  ) {
    const g = S('g', {}, svgParent);
    const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    const shaft = S(
      'path',
      {
        d,
        fill: 'none',
        stroke: color,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
      },
      g
    );

    const ang = Math.atan2(y2 - cy, x2 - cx);
    const headLen = 24;
    const h1x = x2 - headLen * Math.cos(ang - 0.52);
    const h1y = y2 - headLen * Math.sin(ang - 0.52);
    const h2x = x2 - headLen * Math.cos(ang + 0.52);
    const h2y = y2 - headLen * Math.sin(ang + 0.52);
    const head = S(
      'path',
      {
        d: `M ${h1x.toFixed(1)} ${h1y.toFixed(1)} L ${x2} ${y2} L ${h2x.toFixed(1)} ${h2y.toFixed(1)}`,
        fill: 'none',
        stroke: color,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0,
      },
      g
    );

    let len = Math.hypot(x2 - x1, y2 - y1) * 1.25;
    try {
      const m = shaft.getTotalLength();
      if (m > 0) len = m;
    } catch (_) {}
    shaft.setAttribute('stroke-dasharray', String(len));
    shaft.setAttribute('stroke-dashoffset', String(len));

    let noteEl = null;
    if (note) {
      noteEl = T(g, note, x1 + noteDx, y1 + noteDy, {
        fill: noteColor || color,
        'font-family': "'Caveat', cursive",
        'font-weight': '700',
        'font-size': fontSize,
        'text-anchor': 'middle',
        opacity: 0,
      });
    }

    if (tl) {
      sfx(at, 'scribble', 0.66);
      tl.to(shaft, { attr: { 'stroke-dashoffset': 0 }, duration: dur, ease: 'power2.out' }, at);
      tl.to(head, { opacity: 1, duration: 0.14 }, at + dur * 0.85);
      if (noteEl) {
        tl.fromTo(
          noteEl,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
          at + 0.15
        );
      }
      if (outAt !== null && outAt !== undefined) {
        tl.to(g, { opacity: 0, duration: 0.28 }, outAt);
      }
    }
    return g;
  }

  function bigStat(
    parent,
    {
      tl = _state.tl,
      at = 1,
      outAt = null,
      label = '',
      fromVal = 0,
      toVal = 100,
      suffix = '',
      decimals = 0,
      x = 960,
      y = 260,
      color = '#FF6B6B',
      labelColor = '#1E293B',
      cardBg = 'rgba(12, 18, 34, 0.72)',
      size = 132,
      dur = 1.1,
    } = {}
  ) {
    const isSubCard = parent && parent !== _state.stage && !parent.classList?.contains('mf-view');
    let safeX = x;
    let safeY = y;
    if (!isSubCard) {
      if (Math.abs(x - 960) < 30 && _state.W === 1080) safeX = 540;
      else if (Math.abs(x - 540) < 30 && _state.W === 1920) safeX = 960;
      safeX = clamp(safeX, 230, _state.W - 230);
      if (y > 1100 && _state.H === 1080) safeY = _state.H - 185;
      safeY = clamp(safeY, 145, _state.H - 165);
    }

    const wrap = H('div', {
      position: 'absolute',
      left: `${safeX}px`,
      top: `${safeY}px`,
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      pointerEvents: 'none',
      zIndex: '22',
      padding: '18px 36px',
      borderRadius: '24px',
      background: cardBg,
      backdropFilter: 'blur(8px)',
      border: '1.5px solid rgba(255,255,255,0.14)',
      boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
      opacity: '0',
    }, parent);

    if (label) {
      H('div', {
        text: label.toUpperCase(),
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: '800',
        fontSize: '23px',
        letterSpacing: '0.16em',
        color: labelColor,
        marginBottom: '6px',
      }, wrap);
    }

    const numRow = H('div', {
      fontFamily: "'Fredoka', 'Plus Jakarta Sans', sans-serif",
      fontWeight: '700',
      fontSize: `${size}px`,
      lineHeight: '1',
      color,
      fontVariantNumeric: 'tabular-nums',
    }, wrap);

    const valNode = H('span', { text: String(fromVal) }, numRow);
    if (suffix) {
      H('span', {
        text: suffix,
        fontSize: `${Math.round(size * 0.44)}px`,
        marginLeft: '8px',
        color: labelColor,
      }, numRow);
    }

    const counter = { val: fromVal };
    if (tl) {
      sfx(at, 'ding', 0.72);
      tl.fromTo(
        wrap,
        { opacity: 0, scale: 0.84, y: 24, filter: 'blur(8px)' },
        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'back.out(1.6)', immediateRender: false },
        at
      );
      tl.to(
        counter,
        {
          val: toVal,
          duration: dur,
          ease: 'power2.out',
          onUpdate: () => {
            valNode.textContent =
              decimals > 0
                ? counter.val.toFixed(decimals)
                : Math.round(counter.val).toLocaleString('id-ID');
          },
        },
        at
      );
      if (outAt !== null && outAt !== undefined) {
        tl.to(wrap, { opacity: 0, y: -24, filter: 'blur(6px)', duration: 0.3 }, outAt);
      }
    }
    return wrap;
  }

  // =========================================================================
  // STYLE 1 HELPERS: RICH ILLUSTRATED KARTUN 2D PROPS & CHARACTERS
  // =========================================================================
  function speedProfile(keyframes = [[0, 400], [30, 400]], totalDur = _state.DUR) {
    const keys = [...keyframes].sort((a, b) => a[0] - b[0]);
    const vAt = (t) => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          const [t0, v0] = keys[i - 1];
          const [t1, v1] = keys[i];
          const u = (t - t0) / Math.max(0.0001, t1 - t0);
          return v0 + (v1 - v0) * u;
        }
      }
      return keys[keys.length - 1][1];
    };
    const dt = 1 / 120;
    const steps = Math.ceil((totalDur + 2) / dt);
    const acc = new Float64Array(steps + 1);
    for (let i = 1; i <= steps; i++) {
      acc[i] = acc[i - 1] + vAt(i * dt) * dt;
    }
    return function distanceAt(t) {
      const idx = clamp(t / dt, 0, steps - 1);
      const k = Math.floor(idx);
      return acc[k] + (acc[k + 1] - acc[k]) * (idx - k);
    };
  }

  function parallaxStrip(svgParent, { factor = 0.5, period = 2400, distanceFn, drawFn }) {
    const g = S('g', {}, svgParent);
    for (let copy = 0; copy < 2; copy++) {
      const chunk = S('g', { transform: `translate(${copy * period} 0)` }, g);
      if (typeof drawFn === 'function') drawFn(chunk, period);
    }
    onTick((t) => {
      const d = typeof distanceFn === 'function' ? distanceFn(t) : t * 400;
      const offset = -mod(d * factor, period);
      g.setAttribute('transform', `translate(${offset.toFixed(2)} 0)`);
    });
    return g;
  }

  function illustratedTree(
    svgParent,
    { x = 0, y = 0, scale = 1, kind = 'pine', color = '#2D6A4F', swaySeed = 0 } = {}
  ) {
    const place = S('g', { transform: `translate(${x} ${y}) scale(${scale})` }, svgParent);
    // Ground contact shadow
    S('ellipse', { cx: 0, cy: 2, rx: 46, ry: 10, fill: 'rgba(6,10,22,0.28)' }, place);
    const swayG = S('g', {}, place);

    if (kind === 'oak') {
      S('path', { d: 'M -10 0 L -7 -72 L 7 -72 L 11 0 Z', fill: '#5C4033' }, swayG);
      S('path', { d: 'M -3 -48 L -24 -70 M 3 -54 L 22 -74', stroke: '#5C4033', 'stroke-width': 6, 'stroke-linecap': 'round' }, swayG);
      S('circle', { cx: -28, cy: -92, r: 38, fill: shadeHex(color, 0.84) }, swayG);
      S('circle', { cx: 28, cy: -90, r: 36, fill: shadeHex(color, 0.88) }, swayG);
      S('circle', { cx: 0, cy: -116, r: 46, fill: color }, swayG);
      S('circle', { cx: -10, cy: -124, r: 22, fill: shadeHex(color, 1.16), opacity: 0.55 }, swayG);
    } else {
      // Multi-tiered lush pine tree with shadow half
      S('rect', { x: -9, y: -38, width: 18, height: 38, rx: 3, fill: '#4A3525' }, swayG);
      const tiers = [
        { y: -30, w: 62, h: 66 },
        { y: -74, w: 50, h: 62 },
        { y: -114, w: 36, h: 54 },
      ];
      tiers.forEach((tr) => {
        S('path', {
          d: `M 0 ${tr.y - tr.h} L ${-tr.w} ${tr.y} Q 0 ${tr.y + 10} ${tr.w} ${tr.y} Z`,
          fill: color,
        }, swayG);
        S('path', {
          d: `M 0 ${tr.y - tr.h} L 0 ${tr.y + 5} Q ${tr.w * 0.5} ${tr.y + 4} ${tr.w} ${tr.y} Z`,
          fill: shadeHex(color, 0.8),
        }, swayG);
      });
    }

    onTick((t) => {
      const rot = Math.sin(t * 1.6 + swaySeed) * 1.8;
      swayG.setAttribute('transform', `rotate(${rot.toFixed(2)})`);
    });
    return place;
  }

  function illustratedHouse(
    svgParent,
    {
      x = 0,
      y = 0,
      scale = 1,
      wallColor = '#3D5A80',
      roofColor = '#E07A5F',
      stories = 1,
      lit = true,
    } = {}
  ) {
    const g = S('g', { transform: `translate(${x} ${y}) scale(${scale})` }, svgParent);
    const h = stories === 2 ? 156 : 108;
    const w = stories === 2 ? 156 : 144;
    const sideW = 44;

    // Ground shadow
    S('ellipse', { cx: 14, cy: 4, rx: w * 0.68, ry: 12, fill: 'rgba(6,10,22,0.3)' }, g);

    // Chimney + rising warm smoke puffs
    S('rect', { x: w * 0.22, y: -h - 48, width: 22, height: 42, rx: 3, fill: shadeHex(roofColor, 0.72) }, g);
    const puffs = [0, 1].map((idx) =>
      S('circle', { cx: w * 0.22 + 11, cy: -h - 60 - idx * 24, r: 9 + idx * 5, fill: 'rgba(226,232,240,0.28)' }, g)
    );

    // Side wall (depth)
    S('polygon', {
      points: `${w / 2},${-h} ${w / 2 + sideW},${-h + 14} ${w / 2 + sideW},0 ${w / 2},0`,
      fill: shadeHex(wallColor, 0.72),
    }, g);

    // Main front wall
    S('rect', { x: -w / 2, y: -h, width: w, height: h, rx: 4, fill: wallColor }, g);
    // Foundation trim
    S('rect', { x: -w / 2 - 3, y: -12, width: w + 6, height: 12, rx: 2, fill: shadeHex(wallColor, 0.6) }, g);

    // Pitched Roof + eaves shadow
    S('polygon', {
      points: `${-w / 2 - 16},${-h + 6} 0,${-h - 56} ${w / 2 + 16},${-h + 6}`,
      fill: roofColor,
    }, g);
    S('polygon', {
      points: `0,${-h - 56} ${w / 2 + 16},${-h + 6} ${w / 2 + sideW + 10},${-h + 16} ${sideW * 0.7},${-h - 44}`,
      fill: shadeHex(roofColor, 0.76),
    }, g);

    // Door
    S('rect', { x: -16, y: -52, width: 32, height: 52, rx: 5, fill: shadeHex(wallColor, 0.5) }, g);
    S('circle', { cx: 9, cy: -25, r: 3, fill: '#FFD166' }, g);

    // Multi-pane Windows with warm ambient glow
    const winRows = stories === 2 ? [-h + 26, -78] : [-78];
    winRows.forEach((wy) => {
      [-w * 0.3, w * 0.3 - 28].forEach((wx) => {
        if (stories === 1 && wx > -10 && wx < 10) return;
        if (lit) {
          S('rect', { x: wx - 6, y: wy - 6, width: 40, height: 42, rx: 8, fill: 'rgba(255, 209, 102, 0.22)' }, g);
        }
        S('rect', { x: wx, y: wy, width: 28, height: 30, rx: 4, fill: lit ? '#FFE17D' : '#1E293B', stroke: shadeHex(wallColor, 0.55), 'stroke-width': 3 }, g);
        S('line', { x1: wx + 14, y1: wy, x2: wx + 14, y2: wy + 30, stroke: shadeHex(wallColor, 0.55), 'stroke-width': 2.5 }, g);
        S('line', { x1: wx, y1: wy + 15, x2: wx + 28, y2: wy + 15, stroke: shadeHex(wallColor, 0.55), 'stroke-width': 2.5 }, g);
      });
    });

    onTick((t) => {
      puffs.forEach((p, idx) => {
        const u = mod(t * 0.45 + idx * 0.5, 1);
        p.setAttribute('cy', String(-h - 56 - u * 54));
        p.setAttribute('cx', String(w * 0.22 + 11 + Math.sin(t * 1.4 + idx) * 10));
        p.setAttribute('opacity', String(Math.sin(u * Math.PI) * 0.35));
      });
    });

    return g;
  }

  function utilityPoleStrip(svgParent, { distanceFn, factor = 0.72, period = 2400, yBase = 770, spacing = 480 } = {}) {
    return parallaxStrip(svgParent, {
      factor,
      period,
      distanceFn,
      drawFn: (g, per) => {
        const count = Math.floor(per / spacing);
        for (let i = 0; i < count; i++) {
          const px = i * spacing + 110;
          const nx = px + spacing;
          // Sagging catenary power cables to next pole
          S('path', {
            d: `M ${px - 26} ${yBase - 208} Q ${(px + nx) / 2} ${yBase - 166} ${nx - 26} ${yBase - 208}`,
            fill: 'none',
            stroke: 'rgba(15, 23, 42, 0.65)',
            'stroke-width': 2.5,
          }, g);
          S('path', {
            d: `M ${px + 26} ${yBase - 196} Q ${(px + nx) / 2} ${yBase - 154} ${nx + 26} ${yBase - 196}`,
            fill: 'none',
            stroke: 'rgba(15, 23, 42, 0.5)',
            'stroke-width': 2,
          }, g);
          // Pole mast & crossbar + ceramic insulators
          S('rect', { x: px - 6, y: yBase - 225, width: 12, height: 225, rx: 3, fill: '#4A3728' }, g);
          S('rect', { x: px - 2, y: yBase - 225, width: 4, height: 225, fill: '#6B4F3A' }, g);
          S('rect', { x: px - 36, y: yBase - 210, width: 72, height: 8, rx: 3, fill: '#3B2B20' }, g);
          S('circle', { cx: px - 26, cy: yBase - 213, r: 4, fill: '#CBD5E1' }, g);
          S('circle', { cx: px + 26, cy: yBase - 213, r: 4, fill: '#CBD5E1' }, g);
        }
      },
    });
  }

  function illustratedCar(
    svgParent,
    { x = 760, y = 845, scale = 1, bodyColor = '#FF6B6B', distanceFn = null } = {}
  ) {
    const root = S('g', { transform: `translate(${x} ${y}) scale(${scale})` }, svgParent);
    // Contact shadow on asphalt
    S('ellipse', { cx: 0, cy: 36, rx: 215, ry: 16, fill: 'rgba(5, 8, 18, 0.55)' }, root);

    const chassis = S('g', { class: 'boil' }, root);

    // Volumetric dual-layer headlight beam
    S('polygon', { points: '188,-42 740,-150 740,65 188,-8', fill: 'rgba(255, 244, 184, 0.12)' }, chassis);
    S('polygon', { points: '188,-36 520,-95 520,28 188,-12', fill: 'rgba(255, 244, 184, 0.22)' }, chassis);
    // Warm red tail-light glow
    S('ellipse', { cx: -195, cy: -38, rx: 28, ry: 16, fill: 'rgba(239, 68, 68, 0.35)' }, chassis);

    // Lower chassis & fenders
    S('path', {
      d: 'M -196 -6 L -190 -68 Q -180 -88 -118 -92 L -68 -150 Q -42 -166 64 -166 Q 94 -166 124 -94 L 184 -80 Q 204 -70 204 -6 Z',
      fill: bodyColor,
      stroke: '#141B2D',
      'stroke-width': 5.5,
      'stroke-linejoin': 'round',
    }, chassis);

    // Lower body shading stripe & chrome trim
    S('path', {
      d: 'M -192 -28 L 200 -28 L 202 -6 L -195 -6 Z',
      fill: shadeHex(bodyColor, 0.8),
    }, chassis);
    S('rect', { x: -202, y: -16, width: 24, height: 12, rx: 5, fill: '#E2E8F0', stroke: '#141B2D', 'stroke-width': 3 }, chassis);
    S('rect', { x: 184, y: -16, width: 24, height: 12, rx: 5, fill: '#E2E8F0', stroke: '#141B2D', 'stroke-width': 3 }, chassis);

    // Rear & Front Windows + Driver Silhouette looking up!
    S('path', { d: 'M -98 -94 L -60 -144 L -6 -144 L -6 -94 Z', fill: '#1E3A5F', stroke: '#141B2D', 'stroke-width': 4 }, chassis);
    S('path', { d: 'M 6 -94 L 6 -144 L 64 -144 L 106 -94 Z', fill: '#2B4C7E', stroke: '#141B2D', 'stroke-width': 4 }, chassis);
    // Driver silhouette inside front cabin
    const driverHead = S('g', { transform: 'translate(34, -122)' }, chassis);
    S('circle', { cx: 0, cy: 0, r: 14, fill: '#FFD6B0' }, driverHead);
    S('path', { d: 'M -13 -3 C -14 -18, 12 -18, 14 -3 Z', fill: '#1E293B' }, driverHead);
    S('circle', { cx: 7, cy: -2, r: 2.2, fill: '#1E293B' }, driverHead);
    S('path', { d: 'M 18 -94 Q 32 -112 48 -94 Z', fill: '#264653' }, chassis);

    // Diagonal glass reflection highlight
    S('polygon', { points: '24,-142 42,-142 18,-96 4,-96', fill: 'rgba(255,255,255,0.22)' }, chassis);

    // Headlight & Taillight lenses + Side mirror + Door handle
    S('ellipse', { cx: 196, cy: -42, rx: 8, ry: 14, fill: '#FFFBEB', stroke: '#141B2D', 'stroke-width': 3 }, chassis);
    S('rect', { x: -195, y: -52, width: 10, height: 22, rx: 4, fill: '#EF4444', stroke: '#141B2D', 'stroke-width': 3 }, chassis);
    S('rect', { x: 4, y: -74, width: 22, height: 6, rx: 3, fill: '#141B2D' }, chassis);
    S('ellipse', { cx: 98, cy: -92, rx: 10, ry: 7, fill: shadeHex(bodyColor, 0.85), stroke: '#141B2D', 'stroke-width': 3 }, chassis);

    // Wheel arches + Spoked Wheels
    S('circle', { cx: -115, cy: 2, r: 46, fill: '#0F172A' }, root);
    S('circle', { cx: 115, cy: 2, r: 46, fill: '#0F172A' }, root);
    const wheels = [-115, 115].map((wx) => {
      const wg = S('g', { transform: `translate(${wx} 4)` }, root);
      S('circle', { r: 39, fill: '#1E293B', stroke: '#0F172A', 'stroke-width': 4 }, wg);
      S('circle', { r: 23, fill: '#E2E8F0', stroke: '#475569', 'stroke-width': 3 }, wg);
      S('line', { x1: -18, y1: 0, x2: 18, y2: 0, stroke: '#475569', 'stroke-width': 4 }, wg);
      S('line', { x1: 0, y1: -18, x2: 0, y2: 18, stroke: '#475569', 'stroke-width': 4 }, wg);
      S('circle', { r: 7, fill: bodyColor }, wg);
      return { wg, wx };
    });

    onTick((t) => {
      const d = typeof distanceFn === 'function' ? distanceFn(t) : t * 500;
      const rot = (d * 1.15) % 360;
      wheels.forEach(({ wg, wx }) => {
        wg.setAttribute('transform', `translate(${wx} 4) rotate(${rot.toFixed(1)})`);
      });
      const susp = Math.sin(t * 12) * 2.2 + Math.cos(t * 5.5) * 1.2;
      const pitch = Math.sin(t * 6) * 0.45;
      chassis.setAttribute('transform', `translate(0 ${susp.toFixed(2)}) rotate(${pitch.toFixed(2)})`);
      const lookTilt = -12 + Math.sin(t * 1.8) * 5;
      driverHead.setAttribute('transform', `translate(34 -122) rotate(${lookTilt.toFixed(1)})`);
    });

    return root;
  }

  function cuteFace(
    svgParent,
    {
      x = 0,
      y = 0,
      scale = 1,
      mood = 'happy',
      strokeColor = '#1E293B',
      cheekColor = '#FF8FA3',
    } = {}
  ) {
    const g = S('g', { transform: `translate(${x} ${y}) scale(${scale})` }, svgParent);
    S('ellipse', { cx: -26, cy: 10, rx: 9, ry: 5.5, fill: cheekColor, opacity: 0.72 }, g);
    S('ellipse', { cx: 26, cy: 10, rx: 9, ry: 5.5, fill: cheekColor, opacity: 0.72 }, g);

    const eyeL = S('ellipse', { cx: -16, cy: -4, rx: 5.2, ry: 6.2, fill: strokeColor }, g);
    const eyeR = S('ellipse', { cx: 16, cy: -4, rx: 5.2, ry: 6.2, fill: strokeColor }, g);
    S('circle', { cx: -14.2, cy: -6.2, r: 2, fill: '#FFFFFF' }, g);
    S('circle', { cx: 17.8, cy: -6.2, r: 2, fill: '#FFFFFF' }, g);

    if (mood === 'shock') {
      S('ellipse', { cx: 0, cy: 14, rx: 7, ry: 10, fill: strokeColor }, g);
    } else if (mood === 'curious') {
      S('path', { d: 'M -9 13 Q 0 9 10 14', fill: 'none', stroke: strokeColor, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
      S('path', { d: 'M -22 -15 Q -16 -20 -10 -15', fill: 'none', stroke: strokeColor, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    } else {
      S('path', { d: 'M -11 10 Q 0 21 11 10', fill: 'none', stroke: strokeColor, 'stroke-width': 3.8, 'stroke-linecap': 'round' }, g);
    }

    onTick((t) => {
      const cycle = mod(t, 3.3);
      const isBlink = cycle > 3.16;
      const ry = isBlink ? 0.8 : 6.2;
      eyeL.setAttribute('ry', String(ry));
      eyeR.setAttribute('ry', String(ry));
    });

    return g;
  }

  // True Articulated Joint Rig Character (Hukum 4 & 5: pelvis -> thighs -> shins, torso -> arms -> head)
  function cartoonCharacter(
    svgParent,
    {
      x = 0,
      y = 0,
      scale = 1,
      shirtColor = '#FF6B6B',
      pantsColor = '#264653',
      skinColor = '#FFD6B0',
      hairColor = '#1E293B',
      mood = 'happy',
      walkSpeed = 0,
      pointAt = null,
    } = {}
  ) {
    const place = S('g', { transform: `translate(${x} ${y}) scale(${scale})` }, svgParent);
    const shadow = S('ellipse', { cx: 0, cy: 0, rx: 46, ry: 11, fill: 'rgba(10,14,26,0.22)' }, place);

    const pelvis = joint(place, 0, -118);

    // Legs
    const thighL = joint(pelvis.el, -14, 0);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 58, stroke: pantsColor, 'stroke-width': 16, 'stroke-linecap': 'round' }, thighL.el);
    const shinL = joint(thighL.el, 0, 56);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 54, stroke: pantsColor, 'stroke-width': 14, 'stroke-linecap': 'round' }, shinL.el);
    S('ellipse', { cx: 6, cy: 58, rx: 15, ry: 7, fill: '#1E293B' }, shinL.el);

    const thighR = joint(pelvis.el, 14, 0);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 58, stroke: shadeHex(pantsColor, 0.85), 'stroke-width': 16, 'stroke-linecap': 'round' }, thighR.el);
    const shinR = joint(thighR.el, 0, 56);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 54, stroke: shadeHex(pantsColor, 0.85), 'stroke-width': 14, 'stroke-linecap': 'round' }, shinR.el);
    S('ellipse', { cx: 6, cy: 58, rx: 15, ry: 7, fill: '#1E293B' }, shinR.el);

    const torso = joint(pelvis.el, 0, 0);
    // Back arm (R)
    const armR = joint(torso.el, 28, -74);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 44, stroke: shadeHex(shirtColor, 0.86), 'stroke-width': 14, 'stroke-linecap': 'round' }, armR.el);
    const foreR = joint(armR.el, 0, 42);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 38, stroke: skinColor, 'stroke-width': 11, 'stroke-linecap': 'round' }, foreR.el);
    S('circle', { cx: 0, cy: 40, r: 7, fill: skinColor }, foreR.el);

    // Shirt & Neck
    S('rect', { x: -32, y: -88, width: 64, height: 94, rx: 24, fill: shirtColor }, torso.el);
    S('rect', { x: -9, y: -104, width: 18, height: 22, rx: 6, fill: skinColor }, torso.el);

    // Front arm (L)
    const armL = joint(torso.el, -28, -74);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 44, stroke: shirtColor, 'stroke-width': 14, 'stroke-linecap': 'round' }, armL.el);
    const foreL = joint(armL.el, 0, 42);
    S('line', { x1: 0, y1: 0, x2: 0, y2: 38, stroke: skinColor, 'stroke-width': 11, 'stroke-linecap': 'round' }, foreL.el);
    S('circle', { cx: 0, cy: 40, r: 7, fill: skinColor }, foreL.el);

    // Head
    const head = joint(torso.el, 0, -138);
    S('circle', { cx: 0, cy: 0, r: 44, fill: skinColor }, head.el);
    S('path', { d: 'M -43 -8 C -46 -54, 44 -58, 45 -8 C 22 -28, -18 -28, -43 -8 Z', fill: hairColor }, head.el);
    cuteFace(head.el, { x: 0, y: 5, scale: 0.92, mood });

    onTick((t) => {
      if (walkSpeed > 0) {
        const step = Math.sin(t * walkSpeed);
        thighL.r = step * 18;
        shinL.r = Math.max(0, -step) * 20;
        thighR.r = -step * 18;
        shinR.r = Math.max(0, step) * 20;
        pelvis.y = -Math.abs(step) * 4;
        armL.r = -step * 16;
        armR.r = step * 16;
        shadow.setAttribute('rx', (46 - Math.abs(step) * 5).toFixed(1));
      } else {
        torso.r = Math.sin(t * 1.7) * 1.4;
        head.r = Math.sin(t * 2.3) * 2.1;
        armL.r = 10 + Math.sin(t * 1.9) * 3;
        foreL.r = -14;
        if (pointAt !== null && t >= pointAt) {
          const u = smooth((t - pointAt) / 0.55);
          armR.r = lerp(-12, -118, u) + Math.sin(t * 3.2) * 3;
          foreR.r = lerp(-10, -18, u);
        } else {
          armR.r = -12 + Math.cos(t * 2.1) * 4;
          foreR.r = -16;
        }
      }
      pelvis.apply();
      thighL.apply();
      shinL.apply();
      thighR.apply();
      shinR.apply();
      torso.apply();
      armL.apply();
      foreL.apply();
      armR.apply();
      foreR.apply();
      head.apply();
    });

    return place;
  }

  // =========================================================================
  // STYLE 2 HELPERS: ARCHITECTURAL ISOMETRIK & CUTAWAY
  // =========================================================================
  function isoPoint(ix, iy, iz, originX = _state.W / 2, originY = _state.H * 0.58) {
    const cos30 = 0.8660254;
    const sin30 = 0.5;
    return {
      x: originX + (ix - iy) * cos30,
      y: originY + (ix + iy) * sin30 - iz,
    };
  }

  function isoFacePoints(pts3d, originX, originY) {
    return pts3d
      .map(([x, y, z]) => {
        const pt = isoPoint(x, y, z, originX, originY);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }

  function isoBlock(
    svgParent,
    {
      ix = 0,
      iy = 0,
      iz = 0,
      w = 120,
      d = 120,
      h = 80,
      color = '#F4D35E',
      originX = _state.W / 2,
      originY = _state.H * 0.58,
      stroke = '#1D2D44',
      strokeWidth = 2.5,
      opacity = 1,
      windowsLeft = 0,
      windowsRight = 0,
      windowColor = '#FFE17D',
    } = {}
  ) {
    const g = S('g', { opacity }, svgParent);

    // Top face
    S('polygon', {
      points: isoFacePoints([[ix, iy, iz + h], [ix + w, iy, iz + h], [ix + w, iy + d, iz + h], [ix, iy + d, iz + h]], originX, originY),
      fill: color,
      stroke,
      'stroke-width': strokeWidth,
      'stroke-linejoin': 'round',
    }, g);

    // Left front face (iy + d)
    S('polygon', {
      points: isoFacePoints([[ix, iy + d, iz + h], [ix + w, iy + d, iz + h], [ix + w, iy + d, iz], [ix, iy + d, iz]], originX, originY),
      fill: shadeHex(color, 0.84),
      stroke,
      'stroke-width': strokeWidth,
      'stroke-linejoin': 'round',
    }, g);

    // Right front face (ix + w)
    S('polygon', {
      points: isoFacePoints([[ix + w, iy, iz + h], [ix + w, iy + d, iz + h], [ix + w, iy + d, iz], [ix + w, iy, iz]], originX, originY),
      fill: shadeHex(color, 0.68),
      stroke,
      'stroke-width': strokeWidth,
      'stroke-linejoin': 'round',
    }, g);

    // Optional architectural isometric windows on left face
    if (windowsLeft > 0) {
      const step = w / (windowsLeft + 1);
      for (let i = 1; i <= windowsLeft; i++) {
        const wx0 = ix + step * i - step * 0.26;
        const wx1 = ix + step * i + step * 0.26;
        const wz0 = iz + h * 0.32;
        const wz1 = iz + h * 0.76;
        S('polygon', {
          points: isoFacePoints([[wx0, iy + d + 0.5, wz1], [wx1, iy + d + 0.5, wz1], [wx1, iy + d + 0.5, wz0], [wx0, iy + d + 0.5, wz0]], originX, originY),
          fill: windowColor,
          stroke,
          'stroke-width': 2,
        }, g);
      }
    }

    // Optional architectural isometric windows on right face
    if (windowsRight > 0) {
      const step = d / (windowsRight + 1);
      for (let i = 1; i <= windowsRight; i++) {
        const wy0 = iy + step * i - step * 0.26;
        const wy1 = iy + step * i + step * 0.26;
        const wz0 = iz + h * 0.32;
        const wz1 = iz + h * 0.76;
        S('polygon', {
          points: isoFacePoints([[ix + w + 0.5, wy0, wz1], [ix + w + 0.5, wy1, wz1], [ix + w + 0.5, wy1, wz0], [ix + w + 0.5, wy0, wz0]], originX, originY),
          fill: shadeHex(windowColor, 0.9),
          stroke,
          'stroke-width': 2,
        }, g);
      }
    }

    return g;
  }

  function isoPitchedRoof(
    svgParent,
    { ix = 0, iy = 0, iz = 180, w = 240, d = 240, peakH = 95, color = '#3D5A80', originX = _state.W / 2, originY = _state.H * 0.58, stroke = '#1D2D44' } = {}
  ) {
    const g = S('g', {}, svgParent);
    const cx = ix + w / 2;
    const cy = iy + d / 2;
    const apex = [cx, cy, iz + peakH];
    // Back slopes first, front slopes last for clean painter's order
    const faces = [
      { pts: [[ix, iy, iz], [ix + w, iy, iz], apex], shade: 0.95 },
      { pts: [[ix, iy, iz], [ix, iy + d, iz], apex], shade: 0.88 },
      { pts: [[ix, iy + d, iz], [ix + w, iy + d, iz], apex], shade: 1.0 },
      { pts: [[ix + w, iy, iz], [ix + w, iy + d, iz], apex], shade: 0.72 },
    ];
    faces.forEach((f) => {
      S('polygon', {
        points: isoFacePoints(f.pts, originX, originY),
        fill: shadeHex(color, f.shade),
        stroke,
        'stroke-width': 2.5,
        'stroke-linejoin': 'round',
      }, g);
    });
    return g;
  }

  function peelAway(
    tl,
    targetEl,
    { at = 2, dx = 0, dy = -280, rot = -5, dur = 0.95, fade = true } = {}
  ) {
    if (!tl || !targetEl) return;
    sfx(at, 'whoosh', 0.78);
    tl.to(
      targetEl,
      {
        x: dx,
        y: dy,
        rotation: rot,
        opacity: fade ? 0 : 1,
        duration: dur,
        ease: 'power3.inOut',
      },
      at
    );
  }

  // =========================================================================
  // STYLE 3 HELPERS: PETA & ATLAS BERCERITA
  // =========================================================================
  function atlasSurface(
    parent,
    { oceanColor = '#A8D5E5', deepOceanColor = '#7FB8CE', gridColor = 'rgba(24, 54, 82, 0.14)', W = _state.W, H = _state.H } = {}
  ) {
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, parent);
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';

    const defs = S('defs', {}, svg);
    const grad = S('radialGradient', { id: 'mf-ocean-grad', cx: '50%', cy: '48%', r: '68%' }, defs);
    S('stop', { offset: '0%', 'stop-color': oceanColor }, grad);
    S('stop', { offset: '100%', 'stop-color': deepOceanColor }, grad);

    const world = S('g', {}, svg);
    S('rect', { x: -1800, y: -1800, width: W + 3600, height: H + 3600, fill: 'url(#mf-ocean-grad)' }, world);

    // Subtle animated ocean current dashes
    const currents = [];
    const rand = rng('atlas-currents');
    for (let i = 0; i < 16; i++) {
      const cx = rand() * W;
      const cy = rand() * H;
      const line = S('line', {
        x1: cx - 55,
        y1: cy,
        x2: cx + 55,
        y2: cy,
        stroke: 'rgba(255,255,255,0.28)',
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-dasharray': '22 18',
      }, world);
      currents.push({ line, phase: rand() * 10 });
    }
    onTick((t) => {
      currents.forEach((c) => {
        c.line.setAttribute('stroke-dashoffset', String(-(t * 24 + c.phase * 10)));
      });
    });

    const gridG = S('g', {}, world);
    for (let gx = -1200; gx <= W + 1200; gx += 180) {
      S('line', { x1: gx, y1: -1200, x2: gx, y2: H + 1200, stroke: gridColor, 'stroke-width': 1.8 }, gridG);
    }
    for (let gy = -1200; gy <= H + 1200; gy += 180) {
      S('line', { x1: -1200, y1: gy, x2: W + 1200, y2: gy, stroke: gridColor, 'stroke-width': 1.8 }, gridG);
    }

    // Ornate Compass Rose HUD
    const compass = S('g', { transform: `translate(${W - 115}, ${H - 115})` }, svg);
    S('circle', { cx: 0, cy: 0, r: 52, fill: 'rgba(247, 241, 229, 0.92)', stroke: '#2B4157', 'stroke-width': 3 }, compass);
    S('circle', { cx: 0, cy: 0, r: 42, fill: 'none', stroke: '#2B4157', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, compass);
    S('polygon', { points: '0,-36 10,0 0,-8 -10,0', fill: '#D64545' }, compass);
    S('polygon', { points: '0,36 10,0 0,8 -10,0', fill: '#2B4157' }, compass);
    S('polygon', { points: '-34,0 0,-8 -6,0 0,8', fill: '#64748B' }, compass);
    S('polygon', { points: '34,0 0,-8 6,0 0,8', fill: '#64748B' }, compass);
    T(compass, 'U', 0, -58, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#1E293B' });

    return { svg, world };
  }

  function landmass(
    svgParent,
    {
      d,
      fill = '#F2EAD7',
      stroke = '#4E657A',
      strokeWidth = 3.5,
      label = '',
      lx = 0,
      ly = 0,
      labelColor = '#2B4157',
    } = {}
  ) {
    const g = S('g', {}, svgParent);
    // Shallow coastal shelf ring + coastline drop shadow
    S('path', { d, fill: 'none', stroke: 'rgba(255,255,255,0.42)', 'stroke-width': 22, 'stroke-linejoin': 'round' }, g);
    S('path', { d, fill: 'rgba(22, 52, 77, 0.18)', transform: 'translate(10 14)' }, g);
    S('path', { d, fill, stroke, 'stroke-width': strokeWidth, 'stroke-linejoin': 'round' }, g);
    if (label) {
      T(g, label, lx, ly, {
        'font-family': "'Playfair Display', Georgia, serif",
        'font-weight': '700',
        'font-size': 34,
        fill: labelColor,
        'letter-spacing': '0.12em',
        'text-anchor': 'middle',
        opacity: 0.85,
      });
    }
    return g;
  }

  function animatedRoute(
    svgParent,
    {
      tl = _state.tl,
      at = 1,
      dur = 2.8,
      d,
      color = '#D64545',
      width = 11,
      cam = null,
      startZoom = 1.65,
      endZoom = 1.05,
    } = {}
  ) {
    const glowPath = S('path', {
      d,
      fill: 'none',
      stroke: color,
      'stroke-width': width * 2.3,
      'stroke-linecap': 'round',
      opacity: 0.22,
    }, svgParent);

    const path = S('path', {
      d,
      fill: 'none',
      stroke: color,
      'stroke-width': width,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, svgParent);

    let len = 800;
    try {
      const m = path.getTotalLength();
      if (m > 0) len = m;
    } catch (_) {}

    [path, glowPath].forEach((p) => {
      p.setAttribute('stroke-dasharray', String(len));
      p.setAttribute('stroke-dashoffset', String(len));
    });

    const dot = S('circle', {
      r: Math.max(12, width * 1.3),
      fill: '#FFFFFF',
      stroke: color,
      'stroke-width': 6,
      opacity: 0,
    }, svgParent);

    const state = { p: 0 };
    const update = () => {
      const u = clamp(state.p, 0, 1);
      const off = String(len * (1 - u));
      path.setAttribute('stroke-dashoffset', off);
      glowPath.setAttribute('stroke-dashoffset', off);
      try {
        const pt = path.getPointAtLength(len * u);
        dot.setAttribute('cx', pt.x.toFixed(1));
        dot.setAttribute('cy', pt.y.toFixed(1));
        if (cam && u > 0) {
          const z = lerp(startZoom, endZoom, smooth(u));
          const cx = lerp(pt.x, _state.W / 2, smooth(u));
          const cy = lerp(pt.y, _state.H / 2, smooth(u));
          cam.set(cx, cy, z);
        }
      } catch (_) {}
    };

    if (tl) {
      sfx(at, 'whoosh', 0.65);
      tl.set(dot, { opacity: 1 }, at);
      tl.to(state, { p: 1, duration: dur, ease: 'sine.inOut', onUpdate: update }, at);
    }

    return { path, dot };
  }

  function dropPin(
    svgParent,
    { tl = _state.tl, at = 1.5, x = 500, y = 500, label = '', color = '#D64545' } = {}
  ) {
    const g = S('g', { transform: `translate(${x} ${y})`, opacity: 0 }, svgParent);
    const ring = S('circle', { cx: 0, cy: 0, r: 12, fill: 'none', stroke: color, 'stroke-width': 4, opacity: 0.9 }, g);
    const pin = S('g', {}, g);
    S('ellipse', { cx: 0, cy: 3, rx: 14, ry: 5, fill: 'rgba(0,0,0,0.25)' }, pin);
    S('path', {
      d: 'M 0 0 C -18 -26, -24 -42, -24 -54 A 24 24 0 1 1 24 -54 C 24 -42, 18 -26, 0 0 Z',
      fill: color,
      stroke: '#FFFFFF',
      'stroke-width': 3.5,
    }, pin);
    S('circle', { cx: 0, cy: -54, r: 8, fill: '#FFFFFF' }, pin);

    if (label) {
      const padW = Math.max(130, label.length * 16 + 36);
      S('rect', {
        x: -padW / 2,
        y: 12,
        width: padW,
        height: 44,
        rx: 12,
        fill: '#141B2D',
        stroke: color,
        'stroke-width': 2.5,
      }, g);
      T(g, label, 0, 41, {
        fill: '#FFFFFF',
        'font-family': "'Plus Jakarta Sans', sans-serif",
        'font-weight': '800',
        'font-size': 21,
        'text-anchor': 'middle',
      });
    }

    if (tl) {
      sfx(at, 'pop', 0.78);
      tl.set(g, { opacity: 1 }, at);
      tl.fromTo(pin, { y: -72, scale: 0.6 }, { y: 0, scale: 1, duration: 0.45, ease: 'bounce.out' }, at);
      tl.fromTo(ring, { attr: { r: 10 }, opacity: 0.9 }, { attr: { r: 68 }, opacity: 0, duration: 0.75, ease: 'power2.out' }, at + 0.14);
    }
    return g;
  }

  // =========================================================================
  // REAL NATURAL EARTH WORLD-ATLAS MAP (d3-geo + topojson-client)
  // Exact technique used in "Ibn Battuta's Stop in Aceh" (world-atlas)
  // =========================================================================
  function realWorldMap(
    parent,
    {
      center = [66, 16],
      scale = 450,
      theme = 'parchment-book', // 'parchment-book' | 'modern-atlas'
      bookTitle = '',
      W = _state.W,
      H: stageH = _state.H,
    } = {}
  ) {
    const isParchment = theme === 'parchment-book';
    const root = H('div', {
      position: 'absolute',
      inset: '0',
      background: isParchment ? '#2C1B10' : '#0F1E36',
      overflow: 'hidden',
    }, parent);

    const svg = S('svg', { viewBox: `0 0 ${W} ${stageH}`, width: W, height: stageH }, root);
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';

    const defs = S('defs', {}, svg);
    // Ochre-to-Olive regional landmass gradient (Africa/Arabia ochre -> India/Nusantara olive-sage)
    const landGrad = S('linearGradient', { id: 'mf-parchment-land', x1: '0%', y1: '20%', x2: '100%', y2: '70%' }, defs);
    S('stop', { offset: '0%', 'stop-color': isParchment ? '#C9A368' : '#E9DFC8' }, landGrad);
    S('stop', { offset: '48%', 'stop-color': isParchment ? '#BEA06B' : '#DCE4C8' }, landGrad);
    S('stop', { offset: '85%', 'stop-color': isParchment ? '#8FA26C' : '#B7D7B8' }, landGrad);
    S('stop', { offset: '100%', 'stop-color': isParchment ? '#A39B6E' : '#CFE0C3' }, landGrad);

    const seaGrad = S('radialGradient', { id: 'mf-parchment-sea', cx: '52%', cy: '50%', r: '65%' }, defs);
    S('stop', { offset: '0%', 'stop-color': isParchment ? '#CBD3C6' : '#A9D6E5' }, seaGrad);
    S('stop', { offset: '100%', 'stop-color': isParchment ? '#B2BCAE' : '#78B3C9' }, seaGrad);

    const world = S('g', {}, svg);

    // Oversized sea/page base so camera zoom never shows black void
    S('rect', { x: -900, y: -700, width: W + 1800, height: stageH + 1400, fill: isParchment ? '#2B1A10' : 'url(#mf-parchment-sea)' }, world);

    const marginX = isParchment ? 92 : 0;
    const marginY = isParchment ? 68 : 0;
    const mapW = W - marginX * 2;
    const mapH = stageH - marginY * 2;

    if (isParchment) {
      // Open leather-bound book page spread sitting on wooden desk
      S('rect', { x: marginX - 28, y: marginY - 26, width: mapW + 56, height: mapH + 52, rx: 10, fill: '#DFD2B7', stroke: '#4A3728', 'stroke-width': 5 }, world);
      S('rect', { x: marginX, y: marginY, width: mapW, height: mapH, fill: 'url(#mf-parchment-sea)' }, world);
    }

    // Build d3-geo projection
    const d3 = window.d3;
    const topo = window.topojson;
    const projection = d3 && d3.geoEquirectangular
      ? d3.geoEquirectangular().center(center).scale(scale).translate([W / 2, stageH / 2])
      : null;
    const geoPath = projection && d3 ? d3.geoPath(projection) : null;

    // Clip map inside inner book margin
    const clipId = 'mf-map-clip-' + Math.floor(rng(bookTitle || 'map')() * 99999);
    const clip = S('clipPath', { id: clipId }, defs);
    S('rect', { x: marginX, y: marginY, width: mapW, height: mapH }, clip);
    const mapLayer = S('g', { 'clip-path': `url(#${clipId})` }, world);

    // Graticule grid
    if (geoPath && d3.geoGraticule) {
      const grat = d3.geoGraticule().step([15, 15])();
      S('path', {
        d: geoPath(grat) || '',
        fill: 'none',
        stroke: isParchment ? 'rgba(62, 46, 30, 0.16)' : 'rgba(20, 50, 80, 0.15)',
        'stroke-width': 1.2,
      }, mapLayer);
    }

    // Render REAL Natural Earth coastlines from world-atlas!
    if (geoPath && topo && window.__WORLD_TOPO__ && window.__WORLD_TOPO__.objects?.land) {
      const landGeo = topo.feature(window.__WORLD_TOPO__, window.__WORLD_TOPO__.objects.land);
      const dStr = geoPath(landGeo) || '';
      // Shallow coastal water tint ring
      S('path', {
        d: dStr,
        fill: 'none',
        stroke: isParchment ? 'rgba(238, 232, 213, 0.65)' : 'rgba(255,255,255,0.45)',
        'stroke-width': 12,
        'stroke-linejoin': 'round',
      }, mapLayer);
      // Main landmass with regional watercolor wash + crisp ink coastline
      S('path', {
        d: dStr,
        fill: 'url(#mf-parchment-land)',
        stroke: isParchment ? '#433222' : '#3E5870',
        'stroke-width': 2.1,
        'stroke-linejoin': 'round',
      }, mapLayer);
    }

    const decorLayer = S('g', { 'clip-path': `url(#${clipId})` }, world);

    // Classic Compass Roses
    const drawCompassRose = (cx, cy, r) => {
      const cg = S('g', { transform: `translate(${cx} ${cy})`, opacity: 0.58 }, decorLayer);
      S('circle', { r, fill: 'none', stroke: '#433222', 'stroke-width': 1.5 }, cg);
      S('circle', { r: r * 0.82, fill: 'none', stroke: '#433222', 'stroke-width': 1 }, cg);
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 * Math.PI) / 180;
        const len = i % 2 === 0 ? r * 1.15 : r * 0.78;
        S('polygon', {
          points: `0,0 ${(Math.cos(a - 0.16) * r * 0.24).toFixed(1)},${(Math.sin(a - 0.16) * r * 0.24).toFixed(1)} ${(Math.cos(a) * len).toFixed(1)},${(Math.sin(a) * len).toFixed(1)} ${(Math.cos(a + 0.16) * r * 0.24).toFixed(1)},${(Math.sin(a + 0.16) * r * 0.24).toFixed(1)}`,
          fill: i === 0 ? '#9B2C2C' : i % 2 === 0 ? '#3E2E1E' : '#7C6850',
        }, cg);
      }
    };

    if (isParchment) {
      drawCompassRose(marginX + 125, stageH - marginY - 125, 58);
      drawCompassRose(W - marginX - 125, stageH - marginY - 125, 48);

      // Checkerboard degree map border (Exact antique atlas border!)
      const seg = 36;
      for (let x = marginX; x < marginX + mapW; x += seg) {
        const wSeg = Math.min(seg, marginX + mapW - x);
        const dark = Math.floor((x - marginX) / seg) % 2 === 0;
        S('rect', { x, y: marginY - 10, width: wSeg, height: 10, fill: dark ? '#3E2E1E' : '#EFE6D2', stroke: '#3E2E1E', 'stroke-width': 1 }, world);
        S('rect', { x, y: marginY + mapH, width: wSeg, height: 10, fill: dark ? '#3E2E1E' : '#EFE6D2', stroke: '#3E2E1E', 'stroke-width': 1 }, world);
      }
      for (let y = marginY; y < marginY + mapH; y += seg) {
        const hSeg = Math.min(seg, marginY + mapH - y);
        const dark = Math.floor((y - marginY) / seg) % 2 === 0;
        S('rect', { x: marginX - 10, y, width: 10, height: hSeg, fill: dark ? '#3E2E1E' : '#EFE6D2', stroke: '#3E2E1E', 'stroke-width': 1 }, world);
        S('rect', { x: marginX + mapW, y, width: 10, height: hSeg, fill: dark ? '#3E2E1E' : '#EFE6D2', stroke: '#3E2E1E', 'stroke-width': 1 }, world);
      }

      if (bookTitle) {
        S('rect', { x: W / 2 - 310, y: marginY + 14, width: 620, height: 44, rx: 8, fill: 'rgba(239, 230, 210, 0.88)', stroke: '#6E563C', 'stroke-width': 1.5 }, world);
        T(world, bookTitle, W / 2, marginY + 45, {
          'font-family': "'Caveat', cursive",
          'font-size': 32,
          'font-weight': 700,
          fill: '#3E2E1E',
          'text-anchor': 'middle',
        });
      }

      // Central Open-Book Spine Crease Shadow
      const spineGrad = S('linearGradient', { id: 'mf-book-spine', x1: '0%', y1: '0%', x2: '100%', y2: '0%' }, defs);
      S('stop', { offset: '0%', 'stop-color': '#2B1A10', 'stop-opacity': 0 }, spineGrad);
      S('stop', { offset: '46%', 'stop-color': '#2B1A10', 'stop-opacity': 0.28 }, spineGrad);
      S('stop', { offset: '51%', 'stop-color': '#FFFDF7', 'stop-opacity': 0.22 }, spineGrad);
      S('stop', { offset: '56%', 'stop-color': '#2B1A10', 'stop-opacity': 0.18 }, spineGrad);
      S('stop', { offset: '100%', 'stop-color': '#2B1A10', 'stop-opacity': 0 }, spineGrad);
      S('rect', { x: W / 2 - 55, y: marginY - 26, width: 110, height: mapH + 52, fill: 'url(#mf-book-spine)', 'pointer-events': 'none' }, world);
    }

    const overlayLayer = S('g', { 'clip-path': `url(#${clipId})` }, world);

    function project(lonLat) {
      if (!projection) return [W / 2, stageH / 2];
      return projection(lonLat) || [W / 2, stageH / 2];
    }

    function addRegionLabel(lonLat, text, { size = 26, italic = false, color = '#4A3728' } = {}) {
      const [x, y] = project(lonLat);
      return T(overlayLayer, text, x, y, {
        'font-family': "'Playfair Display', Georgia, serif",
        'font-style': italic ? 'italic' : 'normal',
        'font-weight': 700,
        'font-size': size,
        'letter-spacing': italic ? '0.03em' : '0.16em',
        fill: color,
        opacity: 0.78,
        'text-anchor': 'middle',
      });
    }

    function addCityStop(tl, { at = 1, lonLat, name, yearNote = '', dx = 0, dy = -16, color = '#B83227' } = {}) {
      const [x, y] = project(lonLat);
      const g = S('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, opacity: at <= 0.05 ? 1 : 0 }, overlayLayer);
      S('circle', { r: 9, fill: '#FFFDF7', stroke: color, 'stroke-width': 4 }, g);
      S('circle', { r: 3.5, fill: color }, g);
      T(g, name, dx, dy, {
        'font-family': "'Playfair Display', Georgia, serif",
        'font-style': 'italic',
        'font-weight': 700,
        'font-size': 25,
        fill: '#2B1D12',
        'text-anchor': 'middle',
      });
      if (yearNote) {
        T(g, yearNote, dx, dy + 42, {
          'font-family': "'Caveat', cursive",
          'font-weight': 700,
          'font-size': 36,
          fill: color,
          'text-anchor': 'middle',
        });
      }
      if (tl && at > 0.05) {
        sfx(at, 'pop', 0.65);
        tl.fromTo(g, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.38, ease: 'back.out(1.8)', immediateRender: false }, at);
      }
      return { g, x, y };
    }

    function addVintageShip(lonLat, { kind = 'dhow', scale: sc = 1 } = {}) {
      const [x, y] = project(lonLat);
      const g = S('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc})` }, overlayLayer);
      const inner = S('g', {}, g);
      if (kind === 'junk') {
        // Traditional Red-Sail Chinese Junk Ship
        S('polygon', { points: '-38,6 38,6 26,20 -26,20', fill: '#7C4A2D', stroke: '#2B1D12', 'stroke-width': 2.5 }, inner);
        S('polygon', { points: '-24,4 -24,-34 2,-26 2,4', fill: '#C85A32', stroke: '#2B1D12', 'stroke-width': 2 }, inner);
        S('polygon', { points: '6,4 6,-28 28,-20 28,4', fill: '#C85A32', stroke: '#2B1D12', 'stroke-width': 2 }, inner);
        S('line', { x1: -24, y1: -14, x2: 2, y2: -10, stroke: '#5C341E', 'stroke-width': 2 }, inner);
        S('line', { x1: 6, y1: -12, x2: 28, y2: -8, stroke: '#5C341E', 'stroke-width': 2 }, inner);
      } else {
        // Arabian / Indian Ocean Lateen-Sail Dhow
        S('polygon', { points: '-32,6 32,6 20,18 -22,18', fill: '#6E472B', stroke: '#2B1D12', 'stroke-width': 2.5 }, inner);
        S('polygon', { points: '-18,4 22,-36 8,4', fill: '#F7EFE0', stroke: '#3E2E1E', 'stroke-width': 2 }, inner);
      }
      onTick((t) => {
        const bob = Math.sin(t * 2.2 + x * 0.02) * 3.5;
        const rock = Math.cos(t * 1.7 + y * 0.02) * 3;
        inner.setAttribute('transform', `translate(0 ${bob.toFixed(1)}) rotate(${rock.toFixed(1)})`);
      });
      return g;
    }

    function drawVoyageRoute(
      tl,
      { at = 0.8, dur = 4.5, waypointsLonLat = [], color = '#C93B2B', width = 5, cam = null, startZoom = 1.15, endZoom = 1.65 } = {}
    ) {
      const pts = waypointsLonLat.map(project);
      if (pts.length < 2) return null;
      let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2 + Math.hypot(x1 - x0, y1 - y0) * 0.12;
        d += ` Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      }
      // Dashed vintage trail + solid reveal mask
      const guidePath = S('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-dasharray': '12 9', opacity: 0 }, overlayLayer);
      const measurePath = S('path', { d, fill: 'none', stroke: 'none' }, overlayLayer);
      let totalLen = 1200;
      try {
        totalLen = measurePath.getTotalLength() || 1200;
      } catch (_) {}

      const maskId = 'mf-voyage-mask-' + Math.floor(rng(d)() * 99999);
      const mask = S('mask', { id: maskId }, defs);
      const revealStroke = S('path', {
        d,
        fill: 'none',
        stroke: '#FFFFFF',
        'stroke-width': width * 3,
        'stroke-dasharray': String(totalLen),
        'stroke-dashoffset': String(totalLen),
      }, mask);
      guidePath.setAttribute('opacity', '0.92');
      guidePath.setAttribute('mask', `url(#${maskId})`);

      const headDot = S('circle', { r: 8, fill: color, stroke: '#FFFDF7', 'stroke-width': 3, opacity: 0 }, overlayLayer);

      const st = { p: 0 };
      if (tl) {
        sfx(at, 'whoosh', 0.6);
        tl.set(headDot, { opacity: 1 }, at);
        tl.to(
          st,
          {
            p: 1,
            duration: dur,
            ease: 'sine.inOut',
            onUpdate: () => {
              const u = clamp(st.p, 0, 1);
              revealStroke.setAttribute('stroke-dashoffset', String(totalLen * (1 - u)));
              try {
                const pt = measurePath.getPointAtLength(totalLen * u);
                headDot.setAttribute('cx', pt.x.toFixed(1));
                headDot.setAttribute('cy', pt.y.toFixed(1));
                if (cam) {
                  const z = lerp(startZoom, endZoom, smooth(u));
                  cam.set(pt.x, pt.y, z);
                }
              } catch (_) {}
            },
          },
          at
        );
      }
      return { path: guidePath, headDot };
    }

    return {
      root,
      svg,
      world,
      overlayLayer,
      projection,
      project,
      addRegionLabel,
      addCityStop,
      addVintageShip,
      drawVoyageRoute,
    };
  }

  function leaderCallout(
    parent,
    {
      tl = _state.tl,
      at = 0.6,
      outAt = null,
      targetX = 820,
      targetY = 500,
      labelX = 160,
      labelY = 300,
      title = 'CAKRAWALA PERISTIWA',
      subtitle = 'batas tanpa jalan keluar',
      color = '#FFFFFF',
      dotColor = '#93C5FD',
      W = _state.W,
      H: stageH = _state.H,
    } = {}
  ) {
    const wrap = H('div', {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '26',
      opacity: at <= 0.05 ? '1' : '0',
    }, parent);

    const svg = S('svg', { viewBox: `0 0 ${W} ${stageH}`, width: W, height: stageH }, wrap);
    svg.style.position = 'absolute';
    svg.style.inset = '0';

    const safeTargetX = clamp(targetX > _state.W - 60 ? _state.W * 0.52 : targetX, 80, _state.W - 80);
    const safeTargetY = clamp(targetY > _state.H - 80 ? _state.H * 0.5 : targetY, 80, _state.H - 80);
    const safeLabelX = clamp(labelX, 60, Math.max(80, _state.W - 440));
    const safeLabelY = clamp(labelY, 90, _state.H - 200);

    const isLightText = /^#f|^#fff|^rgb\(255/i.test(String(color).trim());
    const lineStroke = isLightText ? 'rgba(255,255,255,0.82)' : 'rgba(18,26,51,0.72)';
    const elbowX = safeLabelX + (safeTargetX > safeLabelX ? 280 : -40);
    const d = `M ${elbowX} ${safeLabelY + 32} L ${safeTargetX} ${safeTargetY}`;
    const line = S('path', { d, fill: 'none', stroke: lineStroke, 'stroke-width': 2.4 }, svg);
    S('circle', { cx: safeTargetX, cy: safeTargetY, r: 12, fill: 'none', stroke: dotColor, 'stroke-width': 2, opacity: 0.7 }, svg);
    S('circle', { cx: safeTargetX, cy: safeTargetY, r: 5, fill: dotColor }, svg);

    const textBlock = H('div', {
      position: 'absolute',
      left: `${safeLabelX}px`,
      top: `${safeLabelY}px`,
      color,
      textShadow: isLightText ? '0 4px 20px rgba(0,0,0,0.85)' : '0 2px 10px rgba(255,255,255,0.65)',
    }, wrap);

    H('div', {
      text: title,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: '800',
      fontSize: '34px',
      letterSpacing: '0.06em',
    }, textBlock);
    if (subtitle) {
      H('div', {
        text: subtitle,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: '600',
        fontSize: '23px',
        color: isLightText ? 'rgba(255,255,255,0.84)' : 'rgba(18,26,51,0.78)',
        marginTop: '3px',
      }, textBlock);
    }

    if (tl && at > 0.05) {
      sfx(at, 'click', 0.65);
      tl.fromTo(wrap, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, at);
    }
    if (tl && outAt !== null && outAt !== undefined) {
      tl.to(wrap, { opacity: 0, duration: 0.3 }, outAt);
    }
    return { wrap, line };
  }

  function paperCutStage(parent, { skyTop = '#FCEFB4', skyBot = '#F9C784', W = _state.W, H: stageH = _state.H } = {}) {
    const view = H('div', {
      className: 'mf-view',
      background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBot} 100%)`,
    }, parent);
    const svg = S('svg', { viewBox: `0 0 ${W} ${stageH}`, width: W, height: stageH }, view);
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    const world = S('g', {}, svg);
    return { view, svg, world };
  }

  function paperLayer(svgParent, { d, fill = '#2A9D8F', swayX = 14, swayY = 5, freq = 1.4, phase = 0 } = {}) {
    const g = S('g', { filter: 'url(#mf-paper-cut)' }, svgParent);
    S('path', { d, fill, stroke: shadeHex(fill, 1.18), 'stroke-width': 2 }, g);
    if (swayX !== 0 || swayY !== 0) {
      onTick((t) => {
        const dx = Math.sin(t * freq + phase) * swayX;
        const dy = Math.cos(t * freq * 1.2 + phase) * swayY;
        g.setAttribute('transform', `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
      });
    }
    return g;
  }

  function paperCloud(svgParent, { x = 400, y = 200, scale = 1, fill = '#FFFDF7' } = {}) {
    const g = S('g', { transform: `translate(${x} ${y}) scale(${scale})`, filter: 'url(#mf-paper-cut)' }, svgParent);
    const inner = S('g', {}, g);
    S('line', { x1: 0, y1: -420, x2: 0, y2: -28, stroke: 'rgba(60,50,40,0.32)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, inner);
    S('path', {
      d: 'M -86 18 C -108 18 -118 -14 -92 -24 C -86 -56 -42 -64 -24 -42 C -6 -72 44 -68 56 -34 C 88 -34 102 -4 82 18 Z',
      fill,
    }, inner);
    onTick((t) => {
      const sw = Math.sin(t * 1.3 + x * 0.01) * 3.2;
      inner.setAttribute('transform', `rotate(${sw.toFixed(2)} 0 -220)`);
    });
    return g;
  }

  // 13. COMIC MANGA & POP-ART HALFTONE
  function comicStage(parent, { bgColor = '#FFE14D', dotColor = 'rgba(217, 45, 32, 0.22)', W = _state.W, H: stageH = _state.H } = {}) {
    const view = H('div', { className: 'mf-view', background: bgColor }, parent);
    const svg = S('svg', { viewBox: `0 0 ${W} ${stageH}`, width: W, height: stageH }, view);
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    const defs = S('defs', {}, svg);
    const pat = S('pattern', { id: 'mf-halftone-dots', width: 22, height: 22, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(18)' }, defs);
    S('circle', { cx: 11, cy: 11, r: 4.5, fill: dotColor }, pat);
    S('rect', { x: 0, y: 0, width: W, height: stageH, fill: 'url(#mf-halftone-dots)' }, svg);
    const world = S('g', {}, svg);
    return { view, svg, world };
  }

  function comicPanel(parent, { tl = _state.tl, at = 0, outAt = null, x = 80, y = 80, w = 800, h = 500, bg = '#FFFFFF', rotate = 0 } = {}) {
    const panel = H('div', {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${w}px`,
      height: `${h}px`,
      background: bg,
      border: '7px solid #111318',
      boxShadow: '12px 12px 0 #111318',
      overflow: 'hidden',
      transform: `rotate(${rotate}deg)`,
      opacity: at <= 0.05 ? '1' : '0',
      zIndex: '12',
    }, parent);
    const svg = S('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h }, panel);
    svg.style.position = 'absolute';
    svg.style.inset = '0';

    if (tl && at > 0.05) {
      sfx(at, 'stamp', 0.72);
      tl.fromTo(
        panel,
        { opacity: 0, scale: 0.78, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 0.34, ease: 'back.out(1.9)', immediateRender: false },
        at
      );
    }
    if (tl && outAt !== null && outAt !== undefined) {
      tl.to(panel, { opacity: 0, scale: 0.9, duration: 0.25 }, outAt);
    }
    return { panel, svg, w, h };
  }

  function speedLines(svgParent, { cx = 500, cy = 300, rInner = 140, rOuter = 900, count = 38, color = '#111318' } = {}) {
    const g = S('g', { transform: `translate(${cx} ${cy})` }, svgParent);
    const rand = rng('speed-' + cx + '-' + cy);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.08;
      const r0 = rInner + rand() * 70;
      const spread = 0.014 + rand() * 0.022;
      S('polygon', {
        points: `${(Math.cos(a) * r0).toFixed(1)},${(Math.sin(a) * r0).toFixed(1)} ${(Math.cos(a - spread) * rOuter).toFixed(1)},${(Math.sin(a - spread) * rOuter).toFixed(1)} ${(Math.cos(a + spread) * rOuter).toFixed(1)},${(Math.sin(a + spread) * rOuter).toFixed(1)}`,
        fill: color,
        opacity: 0.85,
      }, g);
    }
    onTick((t) => {
      const step = Math.floor(t * 10);
      const jit = (step % 2 === 0 ? 1 : -1) * 2.2;
      g.setAttribute('transform', `translate(${cx} ${cy}) rotate(${jit})`);
    });
    return g;
  }

  function comicBurst(parent, { tl = _state.tl, at = 0.5, outAt = null, x = 540, y = 400, text = 'BOOM!', fill = '#FF3B30', textColor = '#FFFDF5', scale = 1 } = {}) {
    const halfW = Math.max(190, String(text).length * 22 + 45);
    const isSubCard = parent && parent !== _state.stage && !parent.classList?.contains('mf-view');
    let safeX = x;
    let safeY = y;
    if (!isSubCard) {
      if (Math.abs(x - 960) < 30 && _state.W === 1080) safeX = 540;
      else if (Math.abs(x - 540) < 30 && _state.W === 1920) safeX = 960;
      safeX = clamp(safeX, 230, _state.W - 230);
      if (y > 1100 && _state.H === 1080) safeY = _state.H - 185;
      safeY = clamp(safeY, 145, _state.H - 165);
    }

    const wrap = H('div', {
      position: 'absolute',
      left: `${safeX}px`,
      top: `${safeY}px`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      zIndex: '28',
      pointerEvents: 'none',
      opacity: at <= 0.05 ? '1' : '0',
    }, parent);
    const svg = S('svg', { viewBox: `${-halfW} -120 ${halfW * 2} 240`, width: halfW * 2, height: 240 }, wrap);
    const spikes = 18;
    let pts = '';
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const rx = i % 2 === 0 ? halfW - 14 : halfW * 0.74;
      const ry = i % 2 === 0 ? 104 : 68;
      pts += `${(Math.cos(a) * rx).toFixed(1)},${(Math.sin(a) * ry).toFixed(1)} `;
    }
    S('polygon', { points: pts.trim(), fill: '#111318', transform: 'translate(7 7)' }, svg);
    S('polygon', { points: pts.trim(), fill, stroke: '#111318', 'stroke-width': 6 }, svg);
    T(svg, text, 0, 18, {
      'font-family': "'Bangers', 'Fredoka', cursive",
      'font-size': 58,
      'letter-spacing': '0.05em',
      fill: textColor,
      stroke: '#111318',
      'stroke-width': 3,
      'paint-order': 'stroke',
      'text-anchor': 'middle',
    });

    if (tl && at > 0.05) {
      sfx(at, 'boing', 0.8);
      tl.fromTo(
        wrap,
        { opacity: 0, scale: 0.2, rotation: -14 },
        { opacity: 1, scale, rotation: -4, duration: 0.36, ease: 'elastic.out(1.1, 0.5)', immediateRender: false },
        at
      );
    }
    if (tl && outAt !== null && outAt !== undefined) {
      tl.to(wrap, { opacity: 0, scale: 0.4, duration: 0.22 }, outAt);
    }
    return wrap;
  }

  // 14. RETRO 1980s PHOSPHOR CRT TERMINAL & PIXEL 8-BIT
  function kineticStage(parent, { bg = '#0E1324', gridColor = 'rgba(255,255,255,0.12)', W = _state.W, H: stageH = _state.H } = {}) {
    const view = H('div', { className: 'mf-view', background: bg }, parent);
    const svg = S('svg', { viewBox: `0 0 ${W} ${stageH}`, width: W, height: stageH }, view);
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    for (let x = 180; x < W; x += 360) {
      for (let y = 180; y < stageH; y += 360) {
        T(svg, '+', x, y, { fill: gridColor, 'font-family': 'monospace', 'font-size': 28, 'text-anchor': 'middle' });
      }
    }
    return { view, svg };
  }

  function kineticSlam(
    parent,
    {
      tl = _state.tl,
      at = 0,
      outAt = null,
      kicker = '',
      words = ['WAKTU', 'MELESAT'],
      bg = null,
      textColor = '#FFFDF7',
      accentBg = '#FF4D4D',
      accentText = '#FFFDF7',
      size = 112,
    } = {}
  ) {
    const block = H('div', {
      position: 'absolute',
      inset: '0',
      background: bg || 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '18px',
      padding: '48px',
      opacity: at <= 0.05 ? '1' : '0',
      zIndex: '20',
    }, parent);

    if (kicker) {
      H('div', {
        text: kicker.toUpperCase(),
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
        fontSize: '26px',
        fontWeight: '700',
        letterSpacing: '0.18em',
        color: accentBg,
      }, block);
    }

    const wordEls = words.map((w, idx) => {
      const isLast = idx === words.length - 1;
      const el = H('div', {
        text: w,
        fontFamily: "'Fredoka', 'Plus Jakarta Sans', sans-serif",
        fontSize: `${size}px`,
        fontWeight: '800',
        lineHeight: '1.05',
        textAlign: 'center',
        color: isLast ? accentText : textColor,
        background: isLast ? accentBg : 'transparent',
        padding: isLast ? '8px 34px 14px' : '0',
        borderRadius: isLast ? '22px' : '0',
        transform: isLast ? 'rotate(-1.5deg)' : 'none',
      }, block);
      return el;
    });

    if (tl && at > 0.05) {
      sfx(at, 'whoosh', 0.72);
      tl.set(block, { opacity: 1 }, at);
      wordEls.forEach((el, idx) => {
        const fromX = idx % 2 === 0 ? -240 : 240;
        tl.fromTo(
          el,
          { opacity: 0, x: fromX, filter: 'blur(14px)' },
          { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.36, ease: 'power3.out', immediateRender: false },
          at + idx * 0.14
        );
      });
    }
    if (tl && outAt !== null && outAt !== undefined) {
      tl.to(block, { opacity: 0, scale: 1.12, filter: 'blur(10px)', duration: 0.26 }, outAt);
    }
    return block;
  }

  // 16. 3D CLAYMATION / SOFT TACTILE PLASTISIN DIORAMA
  // =========================================================================
  // 22. HYBRID 2.5D/3D STICKMAN STUDIO & METALLIC PROPS ("STICKMAN 3D")
  // Exact style of MotionFormat "Koin Bergerigi" / "Pensil Kuning" / "Disket"
  // =========================================================================
  function stickmanStage3D(parent, { wallTop = '#8C522B', wallBot = '#4A2812', tableColor = 0x6b3e20, W = _state.W, H: stageH = _state.H } = {}) {
    const THREE = window.THREE;
    if (!THREE) throw new Error('Three.js belum dimuat.');

    parent.style.background = `radial-gradient(circle at 55% 38%, #C6834B 0%, ${wallTop} 52%, ${wallBot} 100%)`;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = stageH;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    parent.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(W, stageH, false);
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const fov = W < stageH ? 52 : 38;
    const camera = new THREE.PerspectiveCamera(fov, W / stageH, 0.1, 160);
    camera.position.set(0, 1.8, 12.2);
    camera.lookAt(0, 0.7, 0);

    // Warm Polished Studio Tabletop
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(36, 1.2, 24),
      new THREE.MeshStandardMaterial({ color: tableColor, roughness: 0.36, metalness: 0.08 })
    );
    table.position.set(0, -2.3, 0);
    scene.add(table);

    // Warm Studio Key + Golden Rim Halo Light
    scene.add(new THREE.HemisphereLight(0xffedd5, 0x451a03, 1.1));
    const key = new THREE.DirectionalLight(0xfff7ed, 1.65);
    key.position.set(6, 11, 9);
    scene.add(key);
    const rim = new THREE.PointLight(0xfef08a, 2.4, 28);
    rim.position.set(2.5, 3.2, -3.5);
    scene.add(rim);

    const handle = { THREE, renderer, scene, camera, canvas };
    _state.threeWorlds.push(handle);
    return handle;
  }

  function stickmanActor3D(st3d, { x = -2.0, y = -1.7, z = 0.6, shirtColor = 0x14b8a6, scale = 1 } = {}) {
    const THREE = st3d.THREE;
    const actor = new THREE.Group();
    actor.position.set(x, y, z);
    actor.scale.setScalar(scale);
    st3d.scene.add(actor);

    const inkMat = new THREE.MeshBasicMaterial({ color: 0x111318 });

    // Contact Shadow on Table
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 24),
      new THREE.MeshBasicMaterial({ color: 0x1f0f05, transparent: true, opacity: 0.36 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    actor.add(shadow);

    // Thin Black 3D Stick Legs
    const legGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.35, 10);
    const legL = new THREE.Mesh(legGeo, inkMat);
    legL.position.set(-0.26, 0.68, 0);
    const legR = new THREE.Mesh(legGeo, inkMat);
    legR.position.set(0.26, 0.68, 0);
    actor.add(legL, legR);

    // Cel-Outlined Cylinder Tunic Torso with 2 White Vertical Stripes (Exact MotionFormat Stickman!)
    const outlineTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.64, 1.62, 24),
      new THREE.MeshBasicMaterial({ color: 0x111318, side: THREE.BackSide })
    );
    outlineTorso.position.y = 2.12;
    actor.add(outlineTorso);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.58, 1.52, 24),
      new THREE.MeshToonMaterial ? new THREE.MeshToonMaterial({ color: shirtColor }) : new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 })
    );
    torso.position.y = 2.12;
    actor.add(torso);

    [-0.14, 0.14].forEach((sx) => {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 1.35, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xf8fafc })
      );
      stripe.position.set(sx, 2.1, 0.54);
      actor.add(stripe);
    });

    // Stick Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 10), inkMat);
    neck.position.y = 3.02;
    actor.add(neck);

    // Stick Arms with Shoulder Pivots
    const armL = new THREE.Group();
    armL.position.set(-0.54, 2.72, 0);
    const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.35, 10), inkMat);
    armMeshL.position.y = -0.65;
    armL.add(armMeshL);
    armL.rotation.z = -0.45;
    actor.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.54, 2.72, 0);
    const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.35, 10), inkMat);
    armMeshR.position.y = -0.65;
    armR.add(armMeshR);
    armR.rotation.z = 1.05; // pointing toward the 3D prop!
    actor.add(armR);

    // High-Res 2.5D Cel-Shaded Cartoon Head + Spiky Hair CanvasTexture!
    const headCv = document.createElement('canvas');
    headCv.width = 512;
    headCv.height = 512;
    const hctx = headCv.getContext('2d');

    function drawHeadMood(mood = 'shock') {
      hctx.clearRect(0, 0, 512, 512);
      // White pointed-chin cartoon face with bold black ink outline
      hctx.fillStyle = '#FAF8F5';
      hctx.strokeStyle = '#111318';
      hctx.lineWidth = 14;
      hctx.lineJoin = 'round';
      hctx.beginPath();
      hctx.moveTo(108, 175);
      hctx.quadraticCurveTo(95, 355, 256, 465);
      hctx.quadraticCurveTo(417, 355, 404, 175);
      hctx.closePath();
      hctx.fill();
      hctx.stroke();

      // 5-Peak Spiky Black Hair Crown
      hctx.fillStyle = '#141115';
      hctx.beginPath();
      hctx.moveTo(92, 195);
      hctx.lineTo(118, 68);
      hctx.lineTo(178, 132);
      hctx.lineTo(232, 38);
      hctx.lineTo(282, 126);
      hctx.lineTo(348, 46);
      hctx.lineTo(382, 128);
      hctx.lineTo(426, 78);
      hctx.lineTo(414, 198);
      hctx.quadraticCurveTo(256, 158, 92, 195);
      hctx.closePath();
      hctx.fill();

      // Expressive Big Eyes
      [188, 322].forEach((ex) => {
        hctx.fillStyle = '#FFFFFF';
        hctx.strokeStyle = '#111318';
        hctx.lineWidth = 11;
        hctx.beginPath();
        hctx.arc(ex, 268, 46, 0, Math.PI * 2);
        hctx.fill();
        hctx.stroke();

        hctx.fillStyle = '#111318';
        hctx.beginPath();
        hctx.arc(ex + 6, 268, 13, 0, Math.PI * 2);
        hctx.fill();
      });

      // Eyebrows
      hctx.strokeStyle = '#111318';
      hctx.lineWidth = 13;
      hctx.lineCap = 'round';
      hctx.beginPath();
      if (mood === 'shock') {
        hctx.moveTo(148, 204);
        hctx.lineTo(222, 214);
        hctx.moveTo(364, 204);
        hctx.lineTo(290, 214);
      } else {
        hctx.moveTo(148, 216);
        hctx.lineTo(220, 202);
        hctx.moveTo(364, 216);
        hctx.lineTo(292, 202);
      }
      hctx.stroke();

      // Sharp Nose Angle
      hctx.lineWidth = 9;
      hctx.beginPath();
      hctx.moveTo(254, 296);
      hctx.lineTo(272, 324);
      hctx.lineTo(248, 334);
      hctx.stroke();

      // Mouth
      if (mood === 'shock') {
        hctx.fillStyle = '#3B0D11';
        hctx.strokeStyle = '#111318';
        hctx.lineWidth = 10;
        hctx.beginPath();
        hctx.ellipse(258, 392, 28, 42, 0, 0, Math.PI * 2);
        hctx.fill();
        hctx.stroke();
      } else {
        hctx.beginPath();
        hctx.arc(258, 372, 34, 0.15, Math.PI - 0.15);
        hctx.stroke();
      }
    }

    drawHeadMood('shock');
    const headTex = new THREE.CanvasTexture(headCv);
    const headPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 2.55),
      new THREE.MeshBasicMaterial({ map: headTex, transparent: true, side: THREE.DoubleSide })
    );
    headPlane.position.set(0, 4.18, 0.08);
    actor.add(headPlane);

    return {
      actor,
      armL,
      armR,
      headPlane,
      setMood(m) {
        drawHeadMood(m);
        headTex.needsUpdate = true;
      },
    };
  }

  function reededCoin3D(st3d, { x = 1.9, y = 0.55, z = 0, radius = 2.25, thickness = 0.44, ridges = 88 } = {}) {
    const THREE = st3d.THREE;
    const coinGroup = new THREE.Group();
    coinGroup.position.set(x, y, z);
    st3d.scene.add(coinGroup);

    // Embossed Coin Face Texture ("500" + Laurel Wreath)
    const fCv = document.createElement('canvas');
    fCv.width = 512;
    fCv.height = 512;
    const fctx = fCv.getContext('2d');
    const g = fctx.createRadialGradient(200, 180, 20, 256, 256, 256);
    g.addColorStop(0, '#FEF08A');
    g.addColorStop(0.55, '#D97706');
    g.addColorStop(1, '#92400E');
    fctx.fillStyle = g;
    fctx.fillRect(0, 0, 512, 512);
    fctx.strokeStyle = '#FEF9C3';
    fctx.lineWidth = 14;
    fctx.beginPath();
    fctx.arc(256, 256, 218, 0, Math.PI * 2);
    fctx.stroke();
    fctx.fillStyle = '#FFFBEB';
    fctx.font = '800 132px Georgia, serif';
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';
    fctx.fillText('500', 256, 248);
    fctx.font = '700 36px monospace';
    fctx.fillText('1696 · NEWTON', 256, 352);

    const faceTex = new THREE.CanvasTexture(fCv);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.26, metalness: 0.84 });
    const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.3, metalness: 0.72 });

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 64), [goldMat, faceMat, faceMat]);
    disc.rotation.z = Math.PI / 2;
    coinGroup.add(disc);

    // 88 Crisp Milled / Reeded Edge Ridges Around the Coin Perimeter!
    const ridgeGeo = new THREE.BoxGeometry(thickness * 1.02, 0.048, 0.09);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.22, metalness: 0.88 });
    for (let i = 0; i < ridges; i++) {
      const a = (i / ridges) * Math.PI * 2;
      const rMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
      rMesh.position.set(0, Math.cos(a) * radius, Math.sin(a) * radius);
      rMesh.rotation.x = a;
      coinGroup.add(rMesh);
    }

    return coinGroup;
  }


  window.MF = {
    clamp, lerp, smooth, mod, rng, shadeHex,
    S, T, H, joint, initStage, onTick, sfx, getRuntimeInfo,
    grainOverlay, vignette, ambientGlow, lightLeak,
    createWorldCamera, highlightHeadline, handDrawCircle, handDrawArrow, leaderCallout, bigStat,
    speedProfile, parallaxStrip, illustratedTree, illustratedHouse, utilityPoleStrip, illustratedCar, cuteFace, cartoonCharacter,
    isoPoint, isoBlock, isoPitchedRoof, peelAway,
    atlasSurface, landmass, animatedRoute, dropPin, realWorldMap,
    paperCutStage, paperLayer, paperCloud,
    comicStage, comicPanel, speedLines, comicBurst,
    kineticStage, kineticSlam,
    stickmanStage3D, stickmanActor3D, reededCoin3D,
  };
})();
