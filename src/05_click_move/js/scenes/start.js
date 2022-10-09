import Phaser from "phaser"
import BubbleSprite from "../game-objects/bubble"

/**
 * https://blog.ourcade.co/posts/2020/phaser3-fog-of-war-field-of-view-roguelike/
 */
export default class Start extends Phaser.Scene {
  constructor() {
    super("start")

    this.controls = null
    this.player = null
  }

  preload() {
    this.load.image("tiles", "assets/tilesets/tuxmon-sample-32px-extruded.png")
    this.load.tilemapTiledJSON("map", "assets/tilemaps/tuxemon-town.json")

    // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
    // the player animations (walking left, walking right, etc.) in one image. For more info see:
    //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
    // If you don't use an atlas, you can do the same thing with a spritesheet, see:
    //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
    this.load.atlas("atlas", "assets/atlas/atlas.png", "assets/atlas/atlas.json")

    this.load.image("vision", "assets/images/mask1.png")

    // tilesprite used to make speech bubbles
    this.load.spritesheet("bubble", "assets/images/speech_bubble.png", { frameWidth: 50, frameHeight: 50 })
  }

  create() {
    const map = this.make.tilemap({ key: "map" })

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles")

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createLayer("Below Player", tileset, 0, 0)
    const worldLayer = map.createLayer("World", tileset, 0, 0)
    const aboveLayer = map.createLayer("Above Player", tileset, 0, 0)

    worldLayer.setCollisionByProperty({ collides: true })

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    aboveLayer.setDepth(10)

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = map.findObject("Objects", (obj) => obj.name === "Spawn Point")

    // Create a sprite with physics enabled via the physics system. The image used for the sprite has
    // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
    this.player = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
      .setSize(30, 40)
      .setOffset(0, 24)
    // .setSize(10, 10)
    // .setOffset(11, 40)

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.platformCollider = this.physics.add.collider(this.player, worldLayer)

    /******************** Start fog *********************/
    // make a RenderTexture that is the size of the screen
    const rt = this.make.renderTexture({ width: 1500, height: 1500 }, true)
    rt.fill(0x000000, 0.65) // fill it with black
    rt.draw(worldLayer) // draw the floorLayer into it
    rt.setTint(0x0a2948) // set a dark blue tint
    rt.setDepth(20)

    this.vision = this.make.image({
      x: this.player.x,
      y: this.player.y,
      key: "vision",
      add: false,
    })
    this.vision.scale = 2.5

    rt.mask = new Phaser.Display.Masks.BitmapMask(this, this.vision)
    rt.mask.invertAlpha = true
    /******************** Finish fog *********************/

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const anims = this.anims
    anims.create({
      key: "misa-left-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1,
    })
    anims.create({
      key: "misa-right-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1,
    })
    anims.create({
      key: "misa-front-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1,
    })
    anims.create({
      key: "misa-back-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1,
    })

    // Phaser supports multiple cameras, but you can access the default camera like this:
    this.camera = this.cameras.main
    this.camera.startFollow(this.player)
    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    // this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    this.cursors = this.input.keyboard.createCursorKeys()

    this.add
      .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
        font: "18px monospace",
        padding: { x: 20, y: 10 },
        backgroundColor: "#000000",
      })
      .setScrollFactor(0)
      .setDepth(30)

    // Debug graphics
    this.input.keyboard.once("keydown-D", (event) => {
      // Turn on physics debugging to show player's hitbox
      this.physics.world.createDebugGraphic()

      // Create worldLayer collision graphic above the player, but below the help text
      const graphics = this.add.graphics().setAlpha(0.75).setDepth(20)
      worldLayer.renderDebug(graphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
      })
    })

    this.bubble = new BubbleSprite(this, this.player.x, this.player.y, 100, 30, "Hello world")

    // start navmesh
    // Or, you can build one from your tilemap automatically:
    // this.navMesh = this.navMeshPlugin.buildMeshFromTilemap("mesh1", map, [worldLayer])
    this.navMesh = this.navMeshPlugin.buildMeshFromTilemap("mesh1", map, [worldLayer], false, 15)

    const graphics = this.add.graphics(0, 0).setAlpha(0.5)
    this.navMesh.enableDebug(graphics)

    this.initNavmesh()
  }

  update(time, deltaTime) {
    // this.playerMove()
    this.playerMoveToClick(deltaTime)

    if (this.vision) {
      this.vision.x = this.player.x
      this.vision.y = this.player.y
    }
  }

  initNavmesh() {
    this.path = null
    this.currentTarget = null

    // -- Instructions --
    const style = {
      font: "20px Josefin Sans",
      fill: "#ff0044",
      padding: { x: 20, y: 10 },
      backgroundColor: "#fff",
    }
    const uiTextLines = ["Click to find a path!", "Is mouse inside navmesh: false", "Press 'm' to see navmesh."]
    const uiText = this.add.text(10, 100, uiTextLines, style).setAlpha(0.9).setScrollFactor(0).setDepth(30)

    // Display whether the mouse is currently over a valid point in the navmesh
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer) => {
      const isInMesh = this.navMesh.isPointInMesh(pointer)
      uiTextLines[1] = `Is mouse inside navmesh: ${isInMesh ? "yes" : "no "}`
      uiText.setText(uiTextLines)
    })

    // On click
    this.input.on("pointerdown", (pointer) => {
      const { width, height } = this.sys.game.config
      const start = new Phaser.Math.Vector2(this.player.x, this.player.y)
      // const end = new Phaser.Math.Vector2(pointer.x, pointer.y)
      const end = new Phaser.Math.Vector2(
        pointer.x - Number(width) / 2 + this.player.x,
        pointer.y - Number(height) / 2 + this.player.y
      )
      console.log("go", start, "->", end)

      // Tell the follower sprite to find its path to the target
      this.goTo(end)

      // For demo purposes, let's recalculate the path here and draw it on the screen
      const startTime = performance.now()
      const path = this.navMesh.findPath(start, end)
      // -> path is now an array of points, or null if no valid path found
      const pathTime = performance.now() - startTime
      this.navMesh.debugDrawClear()
      this.navMesh.debugDrawPath(path, 0xffd900)

      const formattedTime = pathTime.toFixed(3)
      uiTextLines[0] = path ? `Path found in: ${formattedTime}ms` : `No path found (${formattedTime}ms)`
      uiText.setText(uiTextLines)
    })

    // Toggle the navmesh visibility on/off
    this.input.keyboard.on("keydown-M", () => {
      this.navMesh.debugDrawClear()
      this.navMesh.debugDrawMesh({
        drawCentroid: true,
        drawBounds: false,
        drawNeighbors: false,
        drawPortals: true,
      })
    })
  }

  playerMove() {
    const speed = 300
    const prevVelocity = this.player.body.velocity.clone()

    // Stop any previous movement from the last frame
    this.player.body.setVelocity(0)

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed)
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed)
    }

    // Vertical movement
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed)
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(speed)
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    this.player.body.velocity.normalize().scale(speed)

    // Update the animation last and give left/right animations precedence over up/down animations
    if (this.cursors.left.isDown) {
      this.player.anims.play("misa-left-walk", true)
    } else if (this.cursors.right.isDown) {
      this.player.anims.play("misa-right-walk", true)
    } else if (this.cursors.up.isDown) {
      this.player.anims.play("misa-back-walk", true)
    } else if (this.cursors.down.isDown) {
      this.player.anims.play("misa-front-walk", true)
    } else {
      this.player.anims.stop()

      // If we were moving, pick and idle frame to use
      if (prevVelocity.x < 0) this.player.setTexture("atlas", "misa-left")
      else if (prevVelocity.x > 0) this.player.setTexture("atlas", "misa-right")
      else if (prevVelocity.y < 0) this.player.setTexture("atlas", "misa-back")
      else if (prevVelocity.y > 0) this.player.setTexture("atlas", "misa-front")
    }
  }

  goTo(targetPoint) {
    // Find a path to the target
    this.path = this.navMesh.findPath(new Phaser.Math.Vector2(this.player.x, this.player.y), targetPoint)

    // If there is a valid path, grab the first point from the path and set it as the target
    if (this.path && this.path.length > 0) {
      this.currentTarget = this.path.shift()
      this.platformCollider.active = false
    } else {
      this.currentTarget = null
      this.platformCollider.active = true
    }
  }

  playerMoveToClick(deltaTime) {
    // Bugfix: Phaser's event emitter caches listeners, so it's possible to get updated once after
    // being destroyed
    if (!this.player.body) {
      return
    }

    // Stop any previous movement
    this.player.body.velocity.set(0)

    if (this.currentTarget) {
      // Check if we have reached the current target (within a fudge factor)
      const { x, y } = this.currentTarget
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y)

      if (distance < 5) {
        // If there is path left, grab the next point. Otherwise, null the target.
        if (this.path.length > 0) {
          this.currentTarget = this.path.shift()
        } else {
          this.currentTarget = null
          this.platformCollider.active = true
        }
      }

      // Slow down as we approach final point in the path. This helps prevent issues with the
      // physics body overshooting the goal and leaving the mesh.
      let speed = 300
      if (this.path.length === 0 && distance < 50) {
        speed = this.map(distance, 50, 0, 400, 50)
      }

      // Still got a valid target?
      if (this.currentTarget) {
        this.moveTowards(this.currentTarget, speed, deltaTime / 1000)
      }
    } else {
      this.player.anims.stop()
    }
  }

  map(value, min, max, newMin, newMax) {
    return ((value - min) / (max - min)) * (newMax - newMin) + newMin
  }

  moveTowards(targetPosition, maxSpeed = 200, elapsedSeconds) {
    const { x, y } = targetPosition
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, x, y)
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y)
    const targetSpeed = distance / elapsedSeconds
    const magnitude = Math.min(maxSpeed, targetSpeed)

    const getDirection = (angle) => {
      angle = angle * 100 * -1
      if (-90 < angle && angle <= 90) return "right"
      else if (90 < angle && angle <= 270) return "up"
      else if (270 < angle) return "left"
      else if (angle <= -270) return "left"
      else if (angle <= -90) return "down"
      else return "unknown"
    }

    const dir = getDirection(angle)
    if (dir === "left") {
      this.player.anims.play("misa-left-walk", true)
    } else if (dir === "right") {
      this.player.anims.play("misa-right-walk", true)
    } else if (dir === "up") {
      this.player.anims.play("misa-back-walk", true)
    } else if (dir === "down") {
      this.player.anims.play("misa-front-walk", true)
    } else {
      this.player.anims.stop()
      console.log("stop")
    }

    // this.scene.physics.velocityFromRotation(angle, magnitude, this.player.body.velocity)
    this.physics.velocityFromRotation(angle, magnitude, this.player.body.velocity)
    // this.player.rotation = angle
  }
}
