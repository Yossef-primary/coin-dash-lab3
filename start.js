/* global Phaser, COIN_DASH, CoinSound */
// Start screen: one card per entry in COIN_DASH.levels, so new levels show up automatically.
class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }

  create(data = {}) {
    const c = COIN_DASH;
    const levels = c.levels;
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');
    this.selected = Phaser.Math.Clamp((data.level || 1) - 1, 0, levels.length - 1);

    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);

    // Background decoration: drifting drones and floating coins (no physics, just tweens).
    for (let i = 0; i < 6; i++) {
      const drone = this.add.rectangle(Phaser.Math.Between(0, c.width), Phaser.Math.Between(0, c.height),
        18, 18, c.colors.drone, 0.18).setAngle(Phaser.Math.Between(0, 90));
      this.tweens.add({
        targets: drone, x: drone.x + Phaser.Math.Between(-160, 160), y: drone.y + Phaser.Math.Between(-90, 90),
        angle: drone.angle + 180, duration: Phaser.Math.Between(5000, 9000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    for (let i = 0; i < 10; i++) {
      const coin = this.add.circle(Phaser.Math.Between(20, c.width - 20), Phaser.Math.Between(20, c.height - 20),
        Phaser.Math.Between(4, 8), c.colors.coin, 0.35);
      this.tweens.add({
        targets: coin, y: coin.y - Phaser.Math.Between(15, 40), alpha: 0.1,
        duration: Phaser.Math.Between(1500, 3000), delay: Phaser.Math.Between(0, 1500),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // Title with a glow shadow and a gentle pulse.
    const title = this.add.text(c.width / 2, 92, 'COIN DASH', {
      font: 'bold 64px monospace', color: hex(c.colors.coin)
    }).setOrigin(0.5).setShadow(0, 0, hex(c.colors.coin), 18, true, true);
    this.tweens.add({ targets: title, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(c.width / 2, 148, 'CHOOSE YOUR LEVEL', {
      font: '18px monospace', color: hex(c.colors.player)
    }).setOrigin(0.5).setLetterSpacing(4);

    // Difficulty pips are scaled against the hardest level, so they stay meaningful as levels change.
    const maxDrones = Math.max(...levels.map((l) => l.droneCount));
    const maxSpeed = Math.max(...levels.map((l) => l.droneSpeed));
    const pipCount = (value, max) => Phaser.Math.Clamp(Math.round(value / max * 5), 1, 5);

    const gap = 20;
    const cardW = Math.min(220, (c.width - 60 - gap * (levels.length - 1)) / levels.length);
    const cardH = 200;
    const startX = c.width / 2 - ((levels.length - 1) * (cardW + gap)) / 2;
    const cardY = 285;
    this.cards = levels.map((lv, i) => {
      const box = this.add.rectangle(0, 0, cardW, cardH, 0x0a1120, 0.92)
        .setStrokeStyle(2, 0x34445e).setInteractive({ useHandCursor: true });
      const name = this.add.text(0, -72, `LEVEL ${i + 1}`,
        { font: 'bold 24px monospace', color: '#ffffff' }).setOrigin(0.5);
      const stats = this.add.text(-cardW / 2 + 16, -44, [
        `Coins   ${lv.coins}`,
        `Time    ${lv.seconds}s`,
        'Drones',
        'Speed'
      ].join('\n'), { font: '15px monospace', color: '#c9d6e8', lineSpacing: 8 });
      // Five difficulty pips per row, lit in the drone colour.
      const lineH = stats.height / 4;
      const pipRows = [pipCount(lv.droneCount, maxDrones), pipCount(lv.droneSpeed, maxSpeed)].flatMap((lit, row) =>
        Array.from({ length: 5 }, (_, p) => this.add.rectangle(
          -cardW / 2 + 92 + p * 16, -44 + lineH * (2.5 + row), 11, 11,
          p < lit ? c.colors.drone : 0x24334b)));
      const go = this.add.text(0, 74, 'PLAY ▶',
        { font: 'bold 16px monospace', color: hex(c.colors.player) }).setOrigin(0.5);
      const card = this.add.container(startX + i * (cardW + gap), cardY, [box, name, stats, go, ...pipRows]);
      box.on('pointerover', () => this.select(i));
      box.on('pointerdown', () => { CoinSound.unlock(); this.select(i); this.startLevel(); });
      return { card, box, go };
    });

    // Music selector: one small button per track, cycled with T or Up/Down.
    const names = CoinSound.trackNames || [];
    const btnW = 96;
    const btnGap = 10;
    const musicY = 432;
    const rowX = c.width / 2 + 40 - ((names.length - 1) * (btnW + btnGap)) / 2;
    this.add.text(rowX - btnW / 2 - 14, musicY, '♪ MUSIC',
      { font: 'bold 14px monospace', color: '#8a9bb5' }).setOrigin(1, 0.5);
    this.trackButtons = names.map((label, i) => {
      const box = this.add.rectangle(rowX + i * (btnW + btnGap), musicY, btnW, 28, 0x0a1120, 0.92)
        .setStrokeStyle(2, 0x34445e).setInteractive({ useHandCursor: true });
      const text = this.add.text(box.x, musicY, label.toUpperCase(),
        { font: 'bold 13px monospace', color: '#c9d6e8' }).setOrigin(0.5);
      box.on('pointerdown', () => { CoinSound.unlock(); this.pickTrack(i); });
      return { box, text };
    });

    this.add.text(c.width / 2, c.height - 22,
      '← → or 1-' + levels.length + ' level · Enter / Space / click to play · T / ↑ ↓ music · M mute',
      { font: '13px monospace', color: '#8a9bb5' }).setOrigin(0.5);

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.select(this.selected - 1, true));
    kb.on('keydown-A', () => this.select(this.selected - 1, true));
    kb.on('keydown-RIGHT', () => this.select(this.selected + 1, true));
    kb.on('keydown-D', () => this.select(this.selected + 1, true));
    kb.on('keydown-ENTER', () => this.startLevel());
    kb.on('keydown-SPACE', () => this.startLevel());
    kb.on('keydown-T', () => this.pickTrack(CoinSound.currentTrack() + 1));
    kb.on('keydown-DOWN', () => this.pickTrack(CoinSound.currentTrack() + 1));
    kb.on('keydown-S', () => this.pickTrack(CoinSound.currentTrack() + 1));
    kb.on('keydown-UP', () => this.pickTrack(CoinSound.currentTrack() - 1));
    kb.on('keydown-W', () => this.pickTrack(CoinSound.currentTrack() - 1));
    kb.on('keydown', (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= levels.length) this.select(n - 1, true);
    });
    // Menu music: plays the chosen track once audio is unlocked (first key or click).
    this.input.on('pointerdown', () => { CoinSound.unlock(); CoinSound.musicStart(); });
    CoinSound.musicStart();
    this.highlight();
    this.highlightTrack();
  }

  pickTrack(index) {
    if (!CoinSound.setTrack) return;
    CoinSound.setTrack(index); // saved in localStorage, restarts the music if it is playing
    CoinSound.musicStart();     // preview it (no-op until audio is unlocked)
    this.highlightTrack();
  }

  highlightTrack() {
    const c = COIN_DASH;
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');
    const cur = CoinSound.currentTrack ? CoinSound.currentTrack() : 0;
    this.trackButtons.forEach(({ box, text }, i) => {
      const on = i === cur;
      box.setStrokeStyle(on ? 3 : 2, on ? c.colors.coin : 0x34445e).setFillStyle(on ? 0x16243c : 0x0a1120, 0.92);
      text.setColor(on ? hex(c.colors.coin) : '#c9d6e8');
    });
  }

  select(index, wrap = false) {
    const count = this.cards.length;
    const next = wrap ? (index + count) % count : index;
    if (next === this.selected) return;
    this.selected = next;
    CoinSound.coin(); // short blip on every selection change
    this.highlight();
  }

  highlight() {
    const c = COIN_DASH;
    this.cards.forEach(({ card, box, go }, i) => {
      const on = i === this.selected;
      box.setStrokeStyle(on ? 4 : 2, on ? c.colors.coin : 0x34445e).setFillStyle(on ? 0x16243c : 0x0a1120, 0.92);
      go.setVisible(on);
      this.tweens.killTweensOf(card);
      this.tweens.add({ targets: card, scale: on ? 1.06 : 1, duration: 120, ease: 'Back.easeOut' });
    });
  }

  startLevel() {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.flash(150, 255, 209, 102);
    this.time.delayedCall(150, () => this.scene.start('CoinDash', { level: this.selected + 1, score: 0 }));
  }
}
