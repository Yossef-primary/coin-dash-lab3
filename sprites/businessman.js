/* global COIN_DASH */
// Draws the businessman player texture in code (no image files). 24x30 px, front view.
window.createBusinessmanTexture = function (scene) {
  const key = 'businessman';
  if (scene.textures.exists(key)) return key;
  const teal = COIN_DASH.colors.player;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Legs and shoes
  g.fillStyle(0x5b6577).fillRect(7, 22, 4, 6).fillRect(13, 22, 4, 6);
  g.fillStyle(0x1b1b1b).fillRect(6, 28, 5, 2).fillRect(13, 28, 5, 2);
  // Arms (sleeves) and hands
  g.fillStyle(0x23806f).fillRect(2, 12, 3, 9).fillRect(19, 12, 3, 8);
  g.fillStyle(0xf1c27d).fillRect(2, 21, 3, 2).fillRect(19, 20, 3, 2);
  // Suit jacket with a teal outline so it still reads as "you"
  g.fillStyle(0x2a9d8f).fillRoundedRect(4, 11, 16, 13, 3);
  g.lineStyle(1, teal).strokeRoundedRect(4.5, 11.5, 15, 12, 3);
  // White shirt V and red tie
  g.fillStyle(0xffffff).fillTriangle(9, 11, 15, 11, 12, 18);
  g.fillStyle(0xd62839).fillRect(11, 12, 2, 2).fillTriangle(10.5, 14, 13.5, 14, 12, 19);
  // Jacket buttons
  g.fillStyle(0x0f3d36).fillRect(11, 20, 2, 1).fillRect(11, 22, 2, 1);
  // Head, hair and eyes
  g.fillStyle(0xf1c27d).fillCircle(12, 6, 5);
  g.fillStyle(0x3b2a1a).fillRect(7, 1, 10, 3).fillRect(7, 1, 2, 5);
  g.fillStyle(0x1b1b1b).fillRect(10, 6, 1, 1).fillRect(13, 6, 1, 1);
  // Briefcase in the right hand
  g.fillStyle(0x5a3a1e).fillRect(19, 19, 4, 1);
  g.fillStyle(0x8b5a2b).fillRect(17, 21, 7, 6);
  g.fillStyle(0xe0b44c).fillRect(20, 23, 1, 1);
  g.generateTexture(key, 24, 30);
  g.destroy();
  return key;
};
