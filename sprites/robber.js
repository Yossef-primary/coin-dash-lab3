/* global Phaser */
// Mafia-robber art for the red drones, drawn in code (no image files).
// The texture is drawn at 2x and shown at half scale, so the drone stays 26x26.
window.ROBBER = {
  key: 'robber',
  size: 26,
  caughtMessage: 'שדדו אותך! המאפיונר לקח הכל\nוהוציא אותך מהמשחק',

  makeTexture(scene) {
    if (scene.textures.exists(this.key)) return this.key;
    const s = 2, n = this.size * s, red = 0xff657a;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Red danger badge behind the character.
    g.fillStyle(red, 0.3).fillRoundedRect(0, 0, n, n, 5 * s);
    g.lineStyle(1.5 * s, red, 1).strokeRoundedRect(0.75 * s, 0.75 * s, n - 1.5 * s, n - 1.5 * s, 5 * s);
    // Dark suit, white shirt collar and red tie.
    g.fillStyle(0x1b1d24, 1).fillRoundedRect(5 * s, 17 * s, 16 * s, 8 * s, { tl: 4 * s, tr: 4 * s, bl: 0, br: 0 });
    g.fillStyle(0xffffff, 1).fillTriangle(10.5 * s, 17 * s, 15.5 * s, 17 * s, 13 * s, 21 * s);
    g.fillStyle(red, 1).fillTriangle(12 * s, 18 * s, 14 * s, 18 * s, 13 * s, 24 * s);
    // Face with stubble.
    g.fillStyle(0xe8b48a, 1).fillCircle(13 * s, 13 * s, 5 * s);
    g.fillStyle(0x5a4034, 0.55).fillRoundedRect(9.5 * s, 15 * s, 7 * s, 2.6 * s, 1.3 * s);
    // Black eye-mask with white eyes.
    g.fillStyle(0x000000, 1).fillRoundedRect(7.5 * s, 10.6 * s, 11 * s, 3.2 * s, 1.4 * s);
    g.fillStyle(0xffffff, 1).fillCircle(11 * s, 12.2 * s, 0.9 * s).fillCircle(15 * s, 12.2 * s, 0.9 * s);
    // Black fedora with a red band.
    g.fillStyle(0x0b0b0f, 1).fillRoundedRect(4.5 * s, 8 * s, 17 * s, 2.2 * s, 1 * s);
    g.fillRoundedRect(8 * s, 3 * s, 10 * s, 6 * s, { tl: 2.5 * s, tr: 2.5 * s, bl: 0, br: 0 });
    g.fillStyle(red, 1).fillRect(8 * s, 6.6 * s, 10 * s, 1.5 * s);
    // Small money sack under one arm.
    g.fillStyle(0xc9a46a, 1).fillCircle(21 * s, 21.5 * s, 3.4 * s);
    g.fillStyle(0x8a6a3a, 1).fillRect(20 * s, 17.4 * s, 2 * s, 1.2 * s);
    g.fillStyle(0x2f7a3a, 1).fillRect(20.6 * s, 20 * s, 0.9 * s, 3.2 * s);
    g.generateTexture(this.key, n, n);
    g.destroy();
    return this.key;
  },

  create(scene, x, y) {
    return scene.add.image(x, y, this.makeTexture(scene)).setScale(0.5);
  }
};
