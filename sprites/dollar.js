/* Angled 3D bundle of US-dollar bills, drawn with Phaser Graphics. */
/* global Phaser */
/* exported makeDollarTexture */
window.makeDollarTexture = function (scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 30, H = 24;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const P = (pts) => pts.map(([x, y]) => new Phaser.Geom.Point(x, y));

  // Soft drop shadow so the bundle pops on the dark navy background.
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(15, 21.5, 29, 5);

  // Dark outline silhouette (top face + front + right side), 1 px larger.
  g.fillStyle(0x08210f, 1);
  g.fillPoints(P([[5, 0], [30, 0], [30, 9], [26, 21], [0, 21], [0, 11]]), true);

  // Front thickness: stacked bill edges (alternating cream / green lines).
  for (let y = 12; y < 20; y++) {
    g.fillStyle(y % 2 ? 0x2f7a43 : 0xe6efd2, 1);
    g.fillRect(1, y, 24, 1);
  }
  // Right side thickness (darker, in shade) with slanted edge lines.
  g.fillStyle(0x1d5a2f, 1);
  g.fillPoints(P([[25, 12], [29, 1], [29, 8], [25, 20]]), true);
  g.lineStyle(1, 0x9cc9a4, 0.7);
  for (let i = 0; i < 7; i += 2) g.lineBetween(25.5, 13.5 + i, 29, 3.5 + i);

  // Top face: the front bill, green with a lighter inner border.
  g.fillStyle(0x2f8f4e, 1);
  g.fillPoints(P([[5, 1], [29, 1], [25, 12], [1, 12]]), true);
  g.lineStyle(1, 0x9be3ad, 1);
  g.strokePoints(P([[6.5, 2.5], [27.2, 2.5], [24, 10.5], [3.2, 10.5]]), true);
  // Corner value marks.
  g.fillStyle(0xc9f2d3, 1);
  g.fillRect(6, 4, 2, 1);
  g.fillRect(21, 8, 2, 1);

  // Paper band wrapping the middle (top face + front edge).
  g.fillStyle(0xfaf3dc, 1);
  g.fillPoints(P([[13, 1], [21, 1], [17, 12], [9, 12]]), true);
  g.fillStyle(0xd8cca6, 1);
  g.fillRect(9, 12, 8, 8);
  g.fillStyle(0xbfb38c, 1);
  for (let y = 13; y < 20; y += 2) g.fillRect(9, y, 8, 1);
  g.lineStyle(1, 0x7d7356, 1);
  g.lineBetween(9, 12, 9, 20);
  g.lineBetween(17, 12, 17, 20);

  // "$" on the band (pixel glyph, dark green).
  const glyph = [
    '..#..',
    '.####',
    '#.#..',
    '.###.',
    '..#.#',
    '####.',
    '..#..',
  ];
  g.fillStyle(0x0f4a24, 1);
  glyph.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '#') g.fillRect(13 + c, 3 + r, 1, 1);
  });

  g.generateTexture(key, W, H);
  g.destroy();
};
