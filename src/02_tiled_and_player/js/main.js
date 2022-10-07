import Phaser from "phaser"
import TiledWithPlayer from "./scenes/tiledWithPlayer"

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 750,
  height: 750,
  // backgroundColor: "#fff",
  physics: {
    default: "arcade",
    arcade: {
      gravity: 0,
    },
  },
})

game.scene.add("tiled-with-player", TiledWithPlayer)
game.scene.start("tiled-with-player")
