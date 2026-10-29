/* global Phaser, COIN_DASH, CoinSound, makeDollarTexture, createBusinessmanTexture */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create(data = {}) {
    const c = COIN_DASH;
    this.level = data.level || 1;
    const lv = this.levelConfig = c.levels[this.level - 1];
    this.score = data.score || 0;
    this.levelStartScore = this.score;
    this.finished = false;
    this.won = false;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
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
    for (let i = 0; i < lv.droneCount; i++) {
      const drone = ROBBER.create(this, (i + 0.5) * c.width / lv.droneCount, 100);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * lv.droneSpeed, Math.sin(angle) * lv.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      CoinSound.coin();
      if (this.score - this.levelStartScore >= lv.coins) this.completeLevel();
      else this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish(ROBBER.caughtMessage));
    // Shooting: Space fires along the last move direction; ammo refills every level.
    this.ammo = c.shooting.ammoPerLevel;
    this.nextShotAt = 0;
    this.facing = new Phaser.Math.Vector2(1, 0);
    this.bullets = this.physics.add.group();
    this.physics.add.overlap(this.bullets, this.drones, (bullet, drone) => {
      if (this.finished) return;
      this.burst(drone.x, drone.y);
      bullet.destroy();
      drone.destroy();
      CoinSound.boom();
    });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R,SPACE');
    // R retries the current level (score back to where it began); after a win it starts over.
    this.input.keyboard.on('keydown-R', () => this.scene.restart(
      this.won ? {} : { level: this.level, score: this.levelStartScore }));
    // Esc goes back to the start screen, with the current level preselected.
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('StartScene', { level: this.level }));
    // An event (not JustDown polling) so quick taps that press and release within one frame still fire.
    this.input.keyboard.on('keydown-SPACE', (event) => this.shoot(event));
    this.showGreeting();
  }

  showGreeting() {
    // Freeze everything until the player presses a key or clicks; the level timer starts then.
    const c = COIN_DASH;
    const lv = this.levelConfig;
    this.started = false;
    this.physics.pause();
    this.hud.setText(`Level ${this.level}   Coins: 0/${lv.coins}   Total: ${this.score}   Time: ${lv.seconds}s   Ammo: ${this.ammo}`);
    const panel = this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    // A trailing right-to-left mark keeps Hebrew punctuation on the correct side while staying centred.
    const lines = c.greeting.split('\n').map(line => line + '\u200F').join('\n');
    const text = this.add.text(c.width / 2, c.height / 2, lines,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
    const start = (event) => {
      if (this.started) return;
      this.started = true;
      this.greetingEvent = event; // the key press that starts the round must not also fire
      panel.destroy();
      text.destroy();
      this.deadline = this.time.now + lv.seconds * 1000;
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
    if (dx || dy) this.facing.set(dx, dy).normalize();
    this.bullets.getChildren().slice().forEach(b => {
      if (!this.physics.world.bounds.contains(b.x, b.y)) b.destroy();
    });
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    const levelCoins = this.score - this.levelStartScore;
    this.hud.setText(`Level ${this.level}   Coins: ${levelCoins}/${this.levelConfig.coins}`
      + `   Total: ${this.score}   Time: ${seconds}s   Ammo: ${this.ammo}`);
    CoinSound.tick(seconds);
    if (seconds === 0) CoinSound.timeUp();
    if (seconds === 0) this.finish('Time is up!');
  }

  shoot(event) {
    const sh = COIN_DASH.shooting;
    if (!this.started || this.finished || event.repeat || event === this.greetingEvent) return;
    if (this.ammo <= 0 || this.time.now < this.nextShotAt) return;
    this.ammo--;
    this.nextShotAt = this.time.now + sh.cooldownMs;
    const bullet = this.add.circle(this.player.x + this.facing.x * 16, this.player.y + this.facing.y * 16,
      4, COIN_DASH.colors.coin);
    this.bullets.add(bullet);
    bullet.body.setCircle(4).setVelocity(this.facing.x * sh.bulletSpeed, this.facing.y * sh.bulletSpeed);
    this.time.delayedCall(sh.bulletLifeMs, () => bullet.destroy());
    CoinSound.shoot();
  }

  burst(x, y) {
    // Small explosion: a flash ring plus a few sparks flying outwards, all fading away.
    const ring = this.add.circle(x, y, 6).setStrokeStyle(3, 0xffffff);
    this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const spark = this.add.circle(x, y, 3, i % 2 ? COIN_DASH.colors.drone : COIN_DASH.colors.coin);
      this.tweens.add({ targets: spark, x: x + Math.cos(a) * 30, y: y + Math.sin(a) * 30, alpha: 0,
        duration: 350, ease: 'Cubic.easeOut', onComplete: () => spark.destroy() });
    }
  }

  completeLevel() {
    if (this.level >= COIN_DASH.levels.length) {
      this.won = true;
      this.finish('You win! All levels cleared!');
      return;
    }
    this.finished = true;
    this.physics.pause();
    this.showMessage(`Level ${this.level} complete!\nGet ready for level ${this.level + 1}...`);
    this.time.delayedCall(1800, () =>
      this.scene.restart({ level: this.level + 1, score: this.score }));
  }

  showMessage(text) {
    const c = COIN_DASH;
    const label = this.add.text(c.width / 2, c.height / 2, text,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5).setDepth(1);
    this.add.rectangle(c.width / 2, c.height / 2,
      Math.max(460, label.width + 60), Math.max(150, label.height + 40), 0x0a1120, 0.95);
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    if (!this.won) CoinSound.hit(); // no-op if timeUp() already ended the round
    this.physics.pause();
    const retry = this.won ? 'Press R to play again' : `Press R to retry level ${this.level}`;
    this.showMessage(`${reason}\n${this.score} coins collected\n${retry}\nEsc for level select`);
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
  scene: [StartScene, CoinDash]
});
