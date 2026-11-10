import Phaser from 'phaser'
import store from '@/store'
const global = {
  marginX: 30,
  marginY: 30,
  timeTillEndPoint: 6e3, //飞到终点线时间
  frequency: 50,
  gameState: {
    wait: -1,
    ready: 0, // 游戏准备状态
    start: 1, // 游戏开始
    end: 2, // 游戏结束
  },
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }
  // 加载资源
  preload() {
    this.load.image('background', require('@/assets/image/background.jpg'))
    this.load.spritesheet('plane', require('@/assets/image/plane.png'), {
      frameWidth: 300,
      frameHeight: 184,
    })
  }

  create() {
    const { height } = this.sys.canvas
    this.startPoint = { x: global.marginX, y: height - global.marginY }
    // 添加背景
    this.bg = this.add.tileSprite(0, 0, 0, 0, 'background').setOrigin(0)
    this.bg.setScale(0.5)

    // 添加坐标
    this.addAxis()
    this.addPoints()
    this.addMark()
    this.hideAll()

    // 添加飞机
    this.plane = this.add
      .sprite(this.startPoint.x, this.startPoint.y, 'plane')
      .setOrigin(0, 1)
      .setScale(0.25)
    this.plane.visible = false // 先隐藏
    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('plane', { start: 0, end: 1 }),
      frameRate: 20,
      repeat: -1,
    })
    this.plane.anims.play('fly')

    // 准备飞行曲线
    this.path = { t: 0, vec: new Phaser.Math.Vector2() }
    this.curve = new Phaser.Curves.Spline([
      new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y),
    ])
    this.graphics = this.add.graphics()
    this.planeShiftDown = !0
    this.planeShiftDistance = 0
    this.PADDING_H = 2.5 * this.plane.displayHeight
    this.PADDING_W = 1.3 * this.plane.displayWidth
    this.widthIncrement =
      (this.sys.canvas.width - global.marginX - this.PADDING_W) /
      global.timeTillEndPoint
    this.heightIncrement =
      (this.sys.canvas.height - global.marginY - this.PADDING_H) /
      this.vu(global.timeTillEndPoint)
    this.running = false

    // 初始加载已经在游戏中
    let points = store.getters['game/syncPoint']
    let time = store.getters['game/gameStartTime']
    if (points && points.length > 0) {
      this.startGame(Date.now() - time)
    }
  }

  // 添加XY轴
  addAxis() {
    this.xAxis = this.add
      .line(
        0,
        0,
        this.startPoint.x,
        this.startPoint.y,
        this.sys.canvas.width,
        this.startPoint.y,
        0x234d6b,
        0.8
      )
      .setOrigin(0)
    this.yAxis = this.add
      .line(
        0,
        0,
        this.startPoint.x,
        this.startPoint.y,
        global.marginX,
        6,
        0x234d6b,
        0.8
      )
      .setOrigin(0)
  }

  // 添加X轴时间点
  addPoints() {
    let point1 = this.make
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillCircle(3, 3, 1.5)
    point1.generateTexture('point1', 10, 10)
    point1.destroy()
    let point2 = this.make
      .graphics()
      .fillStyle(0x68a3b5, 1)
      .fillCircle(3, 3, 1.5)
    point2.generateTexture('point2', 10, 10)
    point2.destroy()
    this.pointsGroup = this.add.group()
    this.pointsGroup.createMultiple({ key: ['point1', 'point2'], repeat: 3 })
    const step = (this.sys.canvas.width - this.startPoint.x) / 8
    this.pointsGroup.setXY(this.startPoint.x + 20, this.startPoint.y + 16, step)
    this.bottomRect = new Phaser.Geom.Rectangle(
      this.startPoint.x,
      this.startPoint.y,
      this.sys.canvas.width - this.startPoint.x,
      20
    )
  }

  // 添加Y轴刻度线
  addMark() {
    let mark1 = this.make
      .graphics()
      .fillStyle(0x408da4, 1)
      .fillRoundedRect(0, 0, 10, 2, 2)
    mark1.generateTexture('mark1', 10, 20)
    mark1.destroy()
    let mark2 = this.make
      .graphics()
      .fillStyle(0x8bdbcb, 1)
      .fillRoundedRect(0, 0, 7, 2, 2)
    mark2.generateTexture('mark2', 7, 20)
    mark2.destroy()
    this.markGroup = this.add.group()
    this.markGroup.createMultiple({ key: ['mark1', 'mark2'], repeat: 4 })
    const step = this.startPoint.y / 10
    this.markGroup.setXY(16, 20, 0, step)
    this.leftRect = new Phaser.Geom.Rectangle(
      14,
      20,
      10,
      this.startPoint.y - 10
    )
  }

  // 时间点滚动
  runPoint() {
    // X轴时间点滚动
    Phaser.Actions.IncX(this.pointsGroup.getChildren(), -1)
    Phaser.Actions.WrapInRectangle(
      this.pointsGroup.getChildren(),
      this.bottomRect
    )
    // Y轴刻度线滚动
    Phaser.Actions.IncY(this.markGroup.getChildren(), 1)
    Phaser.Actions.WrapInRectangle(this.markGroup.getChildren(), this.leftRect)
  }

  flyChart(t) {
    if (t > global.timeTillEndPoint) {
      this.timer = global.timeTillEndPoint
      this.addShift()
    } else {
      this.timer = t
    }
    this.plane.setVisible(true)
    this.graphics.clear()
    this.graphics.lineStyle(4, 0x9866EC, 1)
    this.graphics.fillStyle(0x9866EC, 0.3)
    this.graphics.beginPath()
    this.graphics.moveTo(this.curve.points[0].x, this.curve.points[0].y)
    this.curve.points = [
      new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y),
    ]

    let e = this.startPoint.y,
      n = this.startPoint.x
    for (let l = 0, i = 0; l <= this.timer; l += global.frequency, i++) {
      const t = this.vu(l)
      i = this.planeShiftDistance * (l / this.timer) || 0
      e = this.sys.canvas.height - t * this.heightIncrement + i
      e = Math.min(e, this.sys.canvas.height)
      n = l * this.widthIncrement + i
      this.graphics.lineTo(n + global.marginX, e - global.marginY)
      this.curve.addPoint(n + global.marginX, e - global.marginY)
    }
    this.graphics.lineTo(n + this.startPoint.x, this.startPoint.y)
    this.path.t = 1
    this.graphics.closePath()
    this.graphics.fillPath()
    this.curve.draw(this.graphics)
    // 飞机坐标
    this.curve.getPoint(this.path.t, this.path.vec)
    this.plane.setPosition(this.path.vec.x - 10, this.path.vec.y + 10)
  }

  vu(t) {
    return (t / 1e3) * 0.7 * (t / 1e3) + t / 5e3
  }

  // 平面位移距离
  addShift() {
    this.planeShiftDown && this.planeShiftDistance > -5
      ? this.planeShiftDistance--
      : this.planeShiftDistance <= -5
      ? ((this.planeShiftDown = !1), this.planeShiftDistance++)
      : !this.planeShiftDown && this.planeShiftDistance < 20
      ? this.planeShiftDistance++
      : this.planeShiftDistance >= 20 &&
        ((this.planeShiftDown = !0), this.planeShiftDistance--)
  }

  // 游戏开始
  startGame(t) {
    if (this.running) return

    this.runGameRef && clearInterval(this.runGameRef)
    // 展示布局
    this.showAll()
    this.running = true
    this.timer = t
    this.runGameRef = setInterval(() => {
      this.flyChart(this.timer)
      this.timer += 50
    }, 50)
  }

  //游戏结束
  finishGame() {
    if (!this.running) return
    this.tweens.add({
      targets: this.plane,
      x: this.sys.canvas.width + this.plane.displayWidth,
      y: this.plane.y - 200,
      ease: 'linear',
      duration: 500,
    })
    this.planeShiftDistance = 0
    this.running = false
    clearInterval(this.runGameRef)
    setTimeout(() => {
      this.hideAll()
    }, 1000)
  }

  hideAll() {
    this.xAxis.setVisible(false)
    this.yAxis.setVisible(false)
    this.pointsGroup.setVisible(false)
    this.markGroup.setVisible(false)
    this.graphics && this.graphics.clear()
    this.curve &&
      (this.curve.points = [
        new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y),
      ])
  }

  showAll() {
    this.xAxis.setVisible(true)
    this.yAxis.setVisible(true)
    this.pointsGroup.setVisible(true)
    this.markGroup.setVisible(true)
  }

  update() {
    const gameState = store.getters['game/status']
    const startTime = store.getters['game/gameStartTime']
    // 游戏准备,显示飞机
    if (gameState === global.gameState.ready) {
      this.hideAll()
      this.plane.x = this.startPoint.x
      this.plane.y = this.startPoint.y
      this.plane.setVisible(true)
    }
    // 游戏开始
    if (gameState === global.gameState.start) {
      // 背景滚动
      this.bg.tilePositionX += 1
      const time = Date.now() - startTime
      if (time > global.timeTillEndPoint) {
        this.runPoint()
      }
      this.startGame(time)
    }
    // 游戏结束，飞机飞走
    if (gameState === global.gameState.end) {
      this.finishGame()
    }
  }
}

export default class {
  constructor(e) {
    let config = {
      type: Phaser.AUTO,
      parent: e,
      width: '100%',
      height: '100%',
      transparent: true,
      canvasStyle: 'border-radius: 10px',
      scale: {
        mode: Phaser.Scale.ScaleModes.RESIZE,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH,
      },
      scene: [GameScene],
    }
    this.game = new Phaser.Game(config)
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
  }
}
