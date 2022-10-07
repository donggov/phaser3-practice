import Phaser from "phaser"
import Start from "./scenes/start"

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

game.scene.add("start", Start)
game.scene.start("start")
