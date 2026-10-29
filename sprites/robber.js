/* global Phaser */
// Mafia-robber art for the red drones, drawn in code (no image files).
// The texture is drawn at 4x and shown at quarter scale, so the drone stays 26x26.
window.ROBBER = {
  key: 'robber',
  size: 26,
  scale: 4, // texture resolution multiplier
  caughtMessage: "You've been robbed!\nThe mafia took it all — you're out of business.",

  makeTexture(scene) {
    if (scene.textures.exists(this.key)) return this.key;
    // Drawn on a 26-unit grid at 4x, then shown at 1/4 scale so it stays crisp on hi-DPI screens.
    const s = this.scale, n = this.size * s, u = v => v * s, red = 0xff657a;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Red danger halo so it still reads as the enemy on the navy grid.
    g.fillStyle(red, 0.24).fillCircle(u(13), u(13), u(12.6));
    g.lineStyle(u(1.2), red, 1).strokeCircle(u(13), u(13), u(12.4));
    // Ground shadow.
    g.fillStyle(0x000000, 0.4).fillEllipse(u(13), u(24.2), u(17), u(2.6));
    // Dark outline pass: slightly larger silhouette behind hat, head and body.
    g.fillStyle(0x05060a, 0.9);
    g.fillRoundedRect(u(4.2), u(15.2), u(17.6), u(9.8), { tl: u(5.5), tr: u(5.5), bl: u(1), br: u(1) });
    g.fillCircle(u(13), u(12.6), u(5.3));
    g.fillEllipse(u(13), u(8.7), u(18.6), u(4.2));
    g.fillRoundedRect(u(7.8), u(2.3), u(10.4), u(7), u(2.8));
    // Pinstripe suit with wide dark lapels.
    g.fillStyle(0x262934, 1).fillRoundedRect(u(5), u(16), u(16), u(8.6), { tl: u(5), tr: u(5), bl: u(0.6), br: u(0.6) });
    g.fillStyle(0x4c5266, 1);
    [7, 9, 17, 19].forEach(x => g.fillRect(u(x), u(17.2), u(0.35), u(7)));
    g.fillStyle(0xffffff, 1).fillTriangle(u(10), u(16), u(16), u(16), u(13), u(21.5));
    g.fillStyle(0x121319, 1)
      .fillTriangle(u(7.6), u(16.4), u(10.6), u(16), u(12.4), u(22.5))
      .fillTriangle(u(18.4), u(16.4), u(15.4), u(16), u(13.6), u(22.5));
    // Red tie.
    g.fillStyle(0xe8364f, 1).fillRect(u(12.3), u(16.2), u(1.4), u(1.2))
      .fillTriangle(u(12.1), u(17.3), u(13.9), u(17.3), u(13), u(21.6));
    // Face, jaw shadow and stubble.
    g.fillStyle(0xd9a07a, 1).fillCircle(u(13), u(12.6), u(4.6));
    g.fillStyle(0x7a4e3a, 0.45).fillEllipse(u(13), u(15.2), u(7.4), u(2.6));
    // Hat brim shadow across the eyes.
    g.fillStyle(0x000000, 0.35).fillRect(u(8.6), u(9.6), u(8.8), u(1.6));
    // Narrowed eyes under angry brows.
    g.fillStyle(0xffffff, 1).fillRect(u(10.2), u(11.6), u(2), u(0.8)).fillRect(u(13.8), u(11.6), u(2), u(0.8));
    g.fillStyle(0x000000, 1).fillRect(u(11.3), u(11.6), u(0.8), u(0.8)).fillRect(u(13.9), u(11.6), u(0.8), u(0.8));
    g.lineStyle(u(0.7), 0x1a1210, 1).lineBetween(u(9.9), u(10.6), u(12.4), u(11.3)).lineBetween(u(16.1), u(10.6), u(13.6), u(11.3));
    // Moustache and cigar with a glowing tip.
    g.fillStyle(0x2b1d17, 1).fillRoundedRect(u(10.8), u(13.7), u(4.4), u(1), u(0.5));
    g.fillStyle(0x8b5a2b, 1).fillRect(u(14.6), u(14.6), u(3.8), u(1));
    g.fillStyle(0xff8a3d, 1).fillRect(u(18.2), u(14.6), u(0.7), u(1));
    g.fillStyle(0xc8d0de, 0.55).fillCircle(u(19.6), u(13.4), u(0.6)).fillCircle(u(20.4), u(12.2), u(0.45));
    // Black fedora: wide brim, pinched crown, red band, sheen.
    g.fillStyle(0x0d0e13, 1).fillEllipse(u(13), u(8.7), u(17.4), u(3.2));
    g.fillRoundedRect(u(8.5), u(3), u(9), u(6.2), { tl: u(2.4), tr: u(2.4), bl: 0, br: 0 });
    g.fillStyle(0x05060a, 1).fillTriangle(u(11.5), u(3), u(14.5), u(3), u(13), u(4.4));
    g.fillStyle(red, 1).fillRect(u(8.5), u(6.9), u(9), u(1.3));
    g.fillStyle(0x5a6070, 0.6).fillRect(u(9.4), u(4.3), u(1.2), u(2.2));
    // Money sack with a green "$" under one arm.
    g.fillStyle(0x05060a, 0.9).fillCircle(u(21.4), u(21.4), u(3.7));
    g.fillStyle(0xc9a46a, 1).fillCircle(u(21.4), u(21.4), u(3.2));
    g.fillStyle(0x8a6a3a, 1).fillRect(u(20.3), u(17.6), u(2.2), u(1.1));
    g.lineStyle(u(0.55), 0x1f7a3a, 1)
      .lineBetween(u(21.4), u(19.2), u(21.4), u(23.6))
      .lineBetween(u(22.5), u(20.2), u(20.4), u(20.2))
      .lineBetween(u(20.4), u(20.2), u(22.4), u(22.6))
      .lineBetween(u(22.4), u(22.6), u(20.3), u(22.6));
    g.generateTexture(this.key, n, n);
    g.destroy();
    return this.key;
  },

  create(scene, x, y) {
    return scene.add.image(x, y, this.makeTexture(scene)).setScale(1 / this.scale);
  }
};
