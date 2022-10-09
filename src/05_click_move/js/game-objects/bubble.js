import Phaser from "phaser"

class BubbleSprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {*} x
   * @param {*} y
   * @memberof BubbleSprite
   */
  constructor(scene, x, y, width, height, quote) {
    this.scene = scene

    this.bubbleWidth = quote.length * 10
    this.bubbleHeight = height

    this.bubble = this.scene.add.graphics({ x, y })

    //  Bubble shadow
    this.bubble.fillStyle(0x222222, 0.5)
    this.bubble.fillRoundedRect(6, 6, this.bubbleWidth, this.bubbleHeight, 16)
    //  Bubble color and outline line style
    this.bubble.fillStyle(0xffffff, 1)
    this.bubble.lineStyle(4, 0x565656, 1)
    //  Bubble shape and outline
    this.bubble.strokeRoundedRect(0, 0, this.bubbleWidth, this.bubbleHeight, 16)
    this.bubble.fillRoundedRect(0, 0, this.bubbleWidth, this.bubbleHeight, 16)

    //  Calculate arrow coordinates
    // const arrowHeight = this.bubbleHeight / 4
    // var point1X = Math.floor(this.bubbleWidth / 7)
    // var point1Y = this.bubbleHeight
    // var point2X = Math.floor((this.bubbleWidth / 7) * 2)
    // var point2Y = this.bubbleHeight
    // var point3X = Math.floor(this.bubbleWidth / 7)
    // var point3Y = Math.floor(this.bubbleHeight + arrowHeight)
    // //  Bubble arrow shadow
    // this.bubble.lineStyle(4, 0x222222, 0.5)
    // this.bubble.lineBetween(point2X - 1, point2Y + 6, point3X + 2, point3Y)
    // //  Bubble arrow fill
    // this.bubble.fillTriangle(point1X, point1Y, point2X, point2Y, point3X, point3Y)
    // this.bubble.lineStyle(2, 0x565656, 1)
    // this.bubble.lineBetween(point2X, point2Y, point3X, point3Y)
    // this.bubble.lineBetween(point1X, point1Y, point3X, point3Y)

    const bubblePadding = 10
    this.content = this.scene.add.text(0, 0, quote, {
      fontFamily: "Arial",
      fontSize: 15,
      color: "#000000",
      align: "center",
      wordWrap: { width: this.bubbleWidth - bubblePadding * 2 },
    })

    scene.add.existing(this) // todo : ???
    scene.events.on("update", this.update, this)
    scene.events.once("shutdown", this.destroy, this)
  }

  update() {
    this.bubble.x = this.scene.player.x - this.bubbleWidth / 2
    this.bubble.y = this.scene.player.y - 50

    var b = this.content.getBounds()
    this.content.setPosition(
      this.bubble.x + this.bubbleWidth / 2 - b.width / 2,
      this.bubble.y + this.bubbleHeight / 2 - b.height / 2
    )
  }

  destroy() {
    if (this.scene) this.scene.events.off("update", this.update, this)
    super.destroy()
  }
}

export default BubbleSprite
