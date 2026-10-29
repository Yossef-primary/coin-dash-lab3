// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  // Levels are played in order; clearing the last one shows the win screen.
  levels: [
    { coins: 5, seconds: 45, droneCount: 3, droneSpeed: 105 },
    { coins: 8, seconds: 45, droneCount: 4, droneSpeed: 130 },
    { coins: 12, seconds: 50, droneCount: 5, droneSpeed: 155 }
  ],
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a }
};
