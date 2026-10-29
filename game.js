/* global Phaser, COIN_DASH, CoinSound, makeDollarTexture, createBusinessmanTexture */
// Phaser splits the `font` shorthand on spaces, so a family list must go in fontFamily.
const GAME_FONT = '"Avenir Next", "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
const PANEL_TEXT = {
  fontFamily: GAME_FONT, fontSize: '24px', fontStyle: 'bold',
  color: '#f5f8ff', align: 'center', lineSpacing: 10, wordWrap: { width: 520 }
};
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.add.rectangle(c.width / 2, 22, c.width, 44, 0x070d19, 0.75);
    this.add.rectangle(c.width / 2, 44, c.width, 2, 0xffd166, 0.35);
    this.hud = this.add.text(18, 12, '', {
      fontFamily: GAME_FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffd166'
    }).setShadow(0, 2, '#000000', 3);
    this.player = this.add.image(c.width / 2, c.height / 2, createBusinessmanTexture(this));
    this.physics.add.existing(this.player);
    this.player.body.setSize(24, 24).setOffset(0, 3);
    this.player.body.setCollideWorldBounds(true);
    makeDollarTexture(this, 'dollar');
    this.coin = this.add.image(100, 100, 'dollar');
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9, this.coin.width / 2 - 9, this.coin.height / 2 - 9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = ROBBER.create(this, 90 + i * 270, 100);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      CoinSound.coin();
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish(ROBBER.caughtMessage));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.showGreeting();
  }

  showGreeting() {
    // Freeze everything until the player presses a key or clicks; the timer starts then.
    const c = COIN_DASH;
    this.started = false;
    this.physics.pause();
    this.hud.setText(`Coins: ${this.score}                       Time: ${c.roundSeconds}s`);
    const panel = this.drawPanel(560, 170);
    const text = this.add.text(c.width / 2, c.height / 2, c.greeting,
      PANEL_TEXT
    ).setOrigin(0.5);
    const start = () => {
      if (this.started) return;
      this.started = true;
      panel.destroy();
      text.destroy();
      this.deadline = this.time.now + c.roundSeconds * 1000;
      CoinSound.start();
      this.physics.resume();
    };
    this.input.keyboard.once('keydown', start);
    this.input.once('pointerdown', start);
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update() {
    if (this.finished || !this.started) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    if (dx) this.player.setFlipX(dx < 0);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s`);
    CoinSound.tick(seconds);
    if (seconds === 0) CoinSound.timeUp();
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    CoinSound.hit(); // no-op if timeUp() already ended the round
    this.physics.pause();
    const c = COIN_DASH;
    this.drawPanel(560, 210);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n$${this.score} collected\nPress R to try again`,
      PANEL_TEXT
    ).setOrigin(0.5);
  }

  drawPanel(w, h) {
    // Rounded, gold-bordered card for the greeting and end-of-round messages.
    const c = COIN_DASH;
    const x = (c.width - w) / 2, y = (c.height - h) / 2;
    return this.add.graphics()
      .fillStyle(0x000000, 0.35).fillRoundedRect(x + 4, y + 8, w, h, 16)
      .fillStyle(0x0a1120, 0.96).fillRoundedRect(x, y, w, h, 16)
      .lineStyle(2, 0xffd166, 0.85).strokeRoundedRect(x, y, w, h, 16);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
