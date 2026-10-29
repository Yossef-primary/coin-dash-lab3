/* Themed level backgrounds, painted in code on a canvas texture (no image files).
   One painter per theme, plus a light ambient layer of Phaser objects (twinkle, waves, neon). */
/* global Phaser, COIN_DASH */
/* exported addLevelBackground */
(function () {
  const W = 800, H = 500, TOP = 44; // TOP = HUD bar height; the play area is below it.

  // Small seeded random so every background looks the same on each visit.
  function rng(seed) {
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  const vgrad = (ctx, y0, y1, stops) => {
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([at, col]) => gr.addColorStop(at, col));
    return gr;
  };
  const glow = (ctx, x, y, r, col) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const stars = (ctx, rand, n, yMax) => {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `rgba(230,238,255,${0.25 + rand() * 0.5})`;
      ctx.fillRect(rand() * W, TOP + rand() * (yMax - TOP), rand() < 0.15 ? 2 : 1, rand() < 0.15 ? 2 : 1);
    }
  };
  // Darken the play area so the businessman, cash, robbers and bullets stay the brightest things on screen.
  const dim = (ctx, alpha) => {
    ctx.fillStyle = `rgba(6,10,22,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.65);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  };

  // Level 1 — Manhattan at night: two skyline layers with lit windows and a yellow-cab avenue.
  function manhattan(ctx) {
    const rand = rng(11);
    const windows = [];
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#070d1f'], [0.55, '#15214a'], [0.8, '#3a2a55'], [1, '#2a1b33']]);
    ctx.fillRect(0, 0, W, H);
    stars(ctx, rand, 90, 260);
    glow(ctx, 660, 110, 90, 'rgba(255,240,200,0.10)');
    ctx.fillStyle = '#9e9a8c';
    ctx.beginPath(); ctx.arc(660, 110, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#86826f';
    ctx.beginPath(); ctx.arc(652, 104, 4, 0, Math.PI * 2); ctx.arc(668, 118, 3, 0, Math.PI * 2); ctx.fill();
    glow(ctx, W / 2, 440, 420, 'rgba(255,170,90,0.10)'); // city light pollution

    const street = 440;
    const skyline = (base, minH, maxH, color, winColor, winChance, collect) => {
      let x = -10;
      while (x < W) {
        const w = 34 + rand() * 46, h = minH + rand() * (maxH - minH), top = base - h;
        ctx.fillStyle = color;
        ctx.fillRect(x, top, w, h);
        if (rand() < 0.3) { // stepped crown or spire
          ctx.fillRect(x + w * 0.2, top - 12, w * 0.6, 12);
          if (rand() < 0.5) ctx.fillRect(x + w / 2 - 1, top - 40, 2, 28);
        }
        for (let wy = top + 8; wy < base - 8; wy += 9) {
          for (let wx = x + 5; wx < x + w - 6; wx += 7) {
            if (rand() < winChance) {
              ctx.fillStyle = winColor[Math.floor(rand() * winColor.length)];
              ctx.fillRect(wx, wy, 3, 4);
              if (collect && rand() < 0.04) windows.push([wx + 1.5, wy + 2]);
            }
          }
        }
        x += w + rand() * 6;
      }
    };
    skyline(street, 120, 260, '#1a2342', ['rgba(150,170,220,0.35)', 'rgba(255,214,140,0.25)'], 0.25, false);
    // Hero tower: a stepped art-deco skyscraper with a needle.
    ctx.fillStyle = '#121a33';
    ctx.fillRect(360, 170, 70, 270); ctx.fillRect(372, 130, 46, 40); ctx.fillRect(384, 100, 22, 30);
    ctx.fillRect(393, 50, 4, 50);
    glow(ctx, 395, 52, 10, 'rgba(255,90,90,0.8)');
    skyline(street, 60, 190, '#0c1226', ['rgba(255,209,120,0.55)', 'rgba(255,236,190,0.45)', 'rgba(140,200,255,0.35)'], 0.3, true);

    // Avenue: sidewalk, asphalt, dashed yellow lane, cabs.
    ctx.fillStyle = '#1b1f2b'; ctx.fillRect(0, street, W, 6);
    ctx.fillStyle = vgrad(ctx, street + 6, H, [[0, '#14161f'], [1, '#0b0c12']]);
    ctx.fillRect(0, street + 6, W, H - street - 6);
    ctx.fillStyle = 'rgba(255,209,102,0.45)';
    for (let x = 0; x < W; x += 40) ctx.fillRect(x, 474, 22, 2);
    const cab = (x, y, dir) => {
      ctx.fillStyle = '#c99a1c'; ctx.fillRect(x, y, 40, 9); ctx.fillRect(x + 9, y - 6, 20, 6);
      ctx.fillStyle = '#2a3346'; ctx.fillRect(x + 11, y - 4, 7, 4); ctx.fillRect(x + 20, y - 4, 7, 4);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x + 6, y + 8, 7, 4); ctx.fillRect(x + 27, y + 8, 7, 4);
      glow(ctx, dir > 0 ? x + 42 : x - 2, y + 4, 14, 'rgba(255,240,190,0.35)');
      glow(ctx, dir > 0 ? x - 2 : x + 42, y + 4, 8, 'rgba(255,60,60,0.35)');
    };
    cab(90, 452, 1); cab(470, 452, 1); cab(280, 482, -1); cab(660, 482, -1);
    dim(ctx, 0.28);
    return { windows };
  }

  // Level 2 — Moonlit harbour: ocean with a moon path, distant lights, a pier and moored yachts.
  function harbour(ctx) {
    const rand = rng(23);
    const horizon = 250;
    ctx.fillStyle = vgrad(ctx, 0, horizon, [[0, '#06101f'], [0.6, '#0f2a44'], [1, '#2b4a63']]);
    ctx.fillRect(0, 0, W, horizon);
    stars(ctx, rand, 70, horizon - 40);
    glow(ctx, 230, 120, 120, 'rgba(210,235,255,0.12)');
    ctx.fillStyle = '#a9b6bd';
    ctx.beginPath(); ctx.arc(230, 120, 20, 0, Math.PI * 2); ctx.fill();
    // Far shore with a few town lights.
    ctx.fillStyle = '#0d1b2c';
    ctx.beginPath(); ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, horizon - 10 - Math.sin(x / 90) * 8 - rand() * 6);
    ctx.lineTo(W, horizon); ctx.fill();
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,214,140,0.6)' : 'rgba(180,220,255,0.5)';
      ctx.fillRect(rand() * W, horizon - 4 - rand() * 8, 2, 1);
    }
    // Sea.
    ctx.fillStyle = vgrad(ctx, horizon, H, [[0, '#123049'], [0.5, '#0b2135'], [1, '#061421']]);
    ctx.fillRect(0, horizon, W, H - horizon);
    for (let y = horizon + 6; y < H; y += 7 + (y - horizon) / 18) {
      const depth = (y - horizon) / (H - horizon);
      ctx.strokeStyle = `rgba(120,180,210,${0.10 + depth * 0.08})`;
      ctx.lineWidth = 1 + depth;
      ctx.beginPath();
      for (let x = -20; x < W + 20; x += 6) ctx.lineTo(x, y + Math.sin(x / (30 + depth * 30) + y) * (1 + depth * 2));
      ctx.stroke();
    }
    // Moon path on the water.
    for (let y = horizon + 3; y < H; y += 5) {
      const spread = 12 + (y - horizon) * 0.35;
      ctx.fillStyle = `rgba(220,235,245,${0.22 - (y - horizon) / 1600})`;
      ctx.fillRect(230 - spread * rand(), y, spread * (0.6 + rand()), 2);
    }
    // Yachts at anchor.
    const yacht = (x, y, s) => {
      ctx.fillStyle = '#081420';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70 * s, y); ctx.lineTo(x + 62 * s, y + 10 * s);
      ctx.lineTo(x + 6 * s, y + 10 * s); ctx.fill();
      ctx.fillRect(x + 16 * s, y - 9 * s, 34 * s, 9 * s);
      ctx.fillRect(x + 33 * s, y - 60 * s, 2, 51 * s);
      ctx.strokeStyle = '#081420'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 34 * s, y - 60 * s); ctx.lineTo(x + 2 * s, y); ctx.moveTo(x + 34 * s, y - 60 * s);
      ctx.lineTo(x + 68 * s, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,214,140,0.7)';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + (20 + i * 7) * s, y - 6 * s, 3 * s, 2 * s);
      glow(ctx, x + 34 * s, y - 60 * s, 5, 'rgba(255,80,80,0.8)');
    };
    yacht(400, 285, 0.8); yacht(90, 330, 1.1); yacht(520, 360, 1.3);
    // Wooden pier on the right with lamp posts.
    ctx.fillStyle = '#1a1410';
    ctx.beginPath(); ctx.moveTo(640, H); ctx.lineTo(700, 270); ctx.lineTo(740, 270); ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,50,0.6)';
    for (let i = 0; i < 12; i++) {
      const t = i / 12, y = 270 + t * t * (H - 270);
      ctx.beginPath(); ctx.moveTo(700 - t * 60, y); ctx.lineTo(740 + t * 60, y); ctx.stroke();
    }
    [[0.25, 1], [0.55, 1], [0.9, 1]].forEach(([t]) => {
      const y = 270 + t * t * (H - 270), h = 20 + t * 50;
      [700 - t * 60, 740 + t * 60].forEach((x) => {
        ctx.fillStyle = '#0d0a08'; ctx.fillRect(x - 1, y - h, 3, h);
        glow(ctx, x, y - h, 10 + t * 18, 'rgba(255,200,120,0.45)');
      });
    });
    dim(ctx, 0.25);
    return {};
  }

  // Level 3 — Las Vegas strip: dark magenta sky, casino towers with neon trim, marquee bulbs.
  function vegas(ctx) {
    const rand = rng(37);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#0b0518'], [0.5, '#22092f'], [0.8, '#3a0d3a'], [1, '#14061a']]);
    ctx.fillRect(0, 0, W, H);
    stars(ctx, rand, 35, 180);
    glow(ctx, 400, 470, 460, 'rgba(255,60,200,0.13)');
    glow(ctx, 120, 300, 200, 'rgba(60,220,255,0.08)');
    glow(ctx, 680, 300, 200, 'rgba(160,90,255,0.10)');
    // Searchlight beams.
    ctx.fillStyle = 'rgba(200,220,255,0.05)';
    [[200, -0.35], [600, 0.3]].forEach(([x, a]) => {
      ctx.beginPath(); ctx.moveTo(x - 4, 440); ctx.lineTo(x + 4, 440);
      ctx.lineTo(x + 400 * Math.sin(a) + 40, 0); ctx.lineTo(x + 400 * Math.sin(a) - 40, 0); ctx.fill();
    });
    const neonStroke = (col, w, draw) => {
      ctx.save();
      ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.strokeStyle = col; ctx.lineWidth = w;
      draw(); ctx.restore();
    };
    // Casino towers, each with a neon outline.
    const towers = [[20, 150, 90, '#3ce0ff'], [130, 210, 70, '#b07bff'], [220, 120, 110, '#ff4fd8'],
      [470, 140, 120, '#3ce0ff'], [610, 190, 80, '#ff4fd8'], [700, 130, 100, '#b07bff']];
    towers.forEach(([x, top, w, col]) => {
      ctx.fillStyle = '#120a1e';
      ctx.fillRect(x, top, w, 440 - top);
      for (let wy = top + 10; wy < 430; wy += 8) {
        for (let wx = x + 6; wx < x + w - 6; wx += 8) {
          if (rand() < 0.35) {
            ctx.fillStyle = rand() < 0.5 ? 'rgba(255,190,240,0.25)' : 'rgba(150,220,255,0.22)';
            ctx.fillRect(wx, wy, 3, 3);
          }
        }
      }
      neonStroke(col, 2, () => ctx.strokeRect(x + 1, top + 1, w - 2, 440 - top));
    });
    // Big central casino with a dome.
    ctx.fillStyle = '#170c24';
    ctx.fillRect(330, 230, 140, 210);
    ctx.beginPath(); ctx.arc(400, 230, 70, Math.PI, 0); ctx.fill();
    neonStroke('#ff4fd8', 3, () => { ctx.beginPath(); ctx.arc(400, 230, 70, Math.PI, 0); ctx.stroke(); });
    dim(ctx, 0.3);
    // Street with marquee bulb strip (kept below the overlay strength of the sky).
    ctx.fillStyle = '#0c0712'; ctx.fillRect(0, 440, W, H - 440);
    ctx.fillStyle = 'rgba(255,79,216,0.35)'; ctx.fillRect(0, 440, W, 2);
    for (let x = 6; x < W; x += 14) {
      ctx.fillStyle = 'rgba(255,230,180,0.35)';
      ctx.beginPath(); ctx.arc(x, 447, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(60,224,255,0.18)';
    for (let x = 0; x < W; x += 50) ctx.fillRect(x, 478, 26, 2);
    return {};
  }

  const THEMES = { 1: manhattan, 2: harbour, 3: vegas };

  // Ambient extras (Phaser objects on top of the static texture; a few tweens only).
  const AMBIENT = {
    1(scene, info) {
      info.windows.slice(0, 26).forEach(([x, y], i) => {
        const win = scene.add.rectangle(x, y, 3, 4, 0xffe6a8, 0);
        scene.tweens.add({ targets: win, alpha: 0.75, duration: 600 + (i % 5) * 300,
          delay: i * 230, yoyo: true, repeat: -1, repeatDelay: 1500 + (i % 7) * 400, ease: 'Sine.easeInOut' });
      });
    },
    2(scene) {
      for (let i = 0; i < 5; i++) {
        const y = 300 + i * 40;
        const crest = scene.add.graphics().lineStyle(1.5, 0x9fd3ea, 0.16);
        crest.beginPath();
        for (let x = -40; x <= W + 40; x += 8) crest.lineTo(x, y + Math.sin(x / 26 + i) * 3);
        crest.strokePath();
        scene.tweens.add({ targets: crest, x: i % 2 ? 26 : -26, y: 3, duration: 2600 + i * 400,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    },
    3(scene) {
      // Flickering neon "CASINO" sign over the dome.
      const sign = scene.add.text(400, 196, 'CASINO', {
        fontFamily: '"Avenir Next", "Trebuchet MS", sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffb6f0'
      }).setOrigin(0.5).setShadow(0, 0, '#ff4fd8', 14, true, true).setAlpha(0.55);
      const flicker = () => {
        sign.setAlpha(Math.random() < 0.15 ? 0.15 : 0.5 + Math.random() * 0.1);
        scene.time.delayedCall(80 + Math.random() * 600, flicker);
      };
      flicker();
      const suits = ['♠', '♥', '♦', '♣'];
      suits.forEach((s, i) => {
        const t = scene.add.text(80 + i * 213, 92 + (i % 2) * 30, s, { fontFamily: 'serif', fontSize: '30px',
          color: i % 2 ? '#3ce0ff' : '#b07bff' }).setOrigin(0.5).setAlpha(0.25)
          .setShadow(0, 0, i % 2 ? '#3ce0ff' : '#b07bff', 10, true, true);
        scene.tweens.add({ targets: t, alpha: 0.5, duration: 900 + i * 200, yoyo: true, repeat: -1 });
      });
    }
  };

  // Adds the background for `level` behind everything else; falls back to the classic grid.
  window.addLevelBackground = function (scene, level) {
    const paint = THEMES[level];
    if (!paint) {
      const c = COIN_DASH;
      return scene.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
        c.colors.background, 1, 0x24334b, 0.45);
    }
    const key = 'level-bg-' + level;
    if (!scene.textures.exists(key)) {
      const tex = scene.textures.createCanvas(key, W, H);
      tex.info = paint(tex.getContext());
      tex.refresh();
    }
    const img = scene.add.image(0, 0, key).setOrigin(0);
    const ambient = AMBIENT[level];
    if (ambient) ambient(scene, scene.textures.get(key).info || {});
    return img;
  };
}());
