/* global Phaser, COIN_DASH */
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
    this.deadline = this.time.now + lv.seconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < lv.droneCount; i++) {
      const drone = this.add.rectangle((i + 0.5) * c.width / lv.droneCount, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * lv.droneSpeed, Math.sin(angle) * lv.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      if (this.score - this.levelStartScore >= lv.coins) this.completeLevel();
      else this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    // R retries the current level (score back to where it began); after a win it starts over.
    this.input.keyboard.on('keydown-R', () => this.scene.restart(
      this.won ? {} : { level: this.level, score: this.levelStartScore }));
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
    if (this.finished) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    const levelCoins = this.score - this.levelStartScore;
    this.hud.setText(`Level ${this.level}   Coins: ${levelCoins}/${this.levelConfig.coins}`
      + `   Total: ${this.score}   Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
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
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2, text,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const retry = this.won ? 'Press R to play again' : `Press R to retry level ${this.level}`;
    this.showMessage(`${reason}\n${this.score} coins collected\n${retry}`);
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
