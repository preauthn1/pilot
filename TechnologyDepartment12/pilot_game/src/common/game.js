import Phaser from 'phaser'
import store from '@/store'
import global from './config'
var game_num = 6;
// var game_num2 = 4;
// var suc_item = -1;
var moneyList = [];
var moneyImage = [];
var pointList = [];
// var moenyTime=null;
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene')
    }

    init() {
        this.scale.on('resize', this.handleResize, this)
    }

    shutdown() {
        this.scale.off('resize', this.handleResize, this)
    }

    // 加载资源
    preload() {
        this.load.image('background', require('@/assets/image/background.png'))
        this.load.image('movebg', require('@/assets/image/xiaohuojian/movebg.webp'))
        this.load.image('parachute', require('@/assets/image/parachute.png'))
        this.load.image('currency', require('@/assets/image/currency.png'))
        this.load.atlas('plane',
            require('@/assets/image/xiaohuojian/PlaneNew.png'),
            require('@/assets/image/xiaohuojian/PlaneNew.json')
        )
        this.load.audio('Boom', require('@/assets/audio/sprite_audio.mp3'))
        this.load.audio('bg_music', require('@/assets/audio/bg_music.mp3'))
        this.load.audio('sprite_audio', require('@/assets/audio/sprite_audio.mp3'))

        this.load.spritesheet('PlaneBoom', require('@/assets/image/baozha.png'), { frameWidth:300, frameHeight: 376 });

        //小火箭动画相关
        // this.load.spritesheet('plane', require('@/assets/image/xiaohuojian/Idel.png'), { frameWidth: 119, frameHeight: 190 })

        this.load.atlas('PlaneIdel',
            require('@/assets/image/xiaohuojian/PlaneIdel.png'),
            require('@/assets/image/xiaohuojian/PlaneIdel.json')
        )
        this.load.atlas('PlaneReady',
            require('@/assets/image/xiaohuojian/PlaneReady.png'),
            require('@/assets/image/xiaohuojian/PlaneReady.json')
        )
        this.load.atlas('PlaneRun',
            require('@/assets/image/xiaohuojian/PlaneRun.png'),
            require('@/assets/image/xiaohuojian/PlaneRun.json')
        )
        this.load.atlas('PlaneRun',
            require('@/assets/image/xiaohuojian/PlaneRun.png'),
            require('@/assets/image/xiaohuojian/PlaneRun.json')
        )
        // this.load.atlas('PlaneBoom',
        //     require('@/assets/image/xiaohuojian/PlaneBoom.png'),
        //     require('@/assets/image/xiaohuojian/PlaneBoom.json')
        // )
        //线条相关
        // this.load.spritesheet('LineFire', require('@/assets/image/xiaohuojian/LineFire.png'), { frameWidth: 374, frameHeight: 251 })
        // this.load.image('LineFire1', require('@/assets/image/xiaohuojian/LineFire1.png'))
        this.load.atlas('LineGrow',
            require('@/assets/image/xiaohuojian/LineGrow.png'),
            require('@/assets/image/xiaohuojian/LineGrow.json')
        )
        this.load.atlas('LineToOrange',
            require('@/assets/image/xiaohuojian/LineToOrange.png'),
            require('@/assets/image/xiaohuojian/LineToOrange.json')
        )
        this.load.atlas('LineToRed',
            require('@/assets/image/xiaohuojian/LineToRed.png'),
            require('@/assets/image/xiaohuojian/LineToRed.json')
        )

    }

    create() {
        const { height } = this.sys.canvas
        this.startPoint = { x: global.marginX, y: height - global.marginY }
        // 添加背景
        // this.bg = this.add.tileSprite(0, 0, 0, 0, 'background').setOrigin(0)
        // 添加背景音乐并播放
        // this.bgMusic = this.sound.add('bg_music')
        // this.bgMusic.play({ loop: true, volume: 0.3 })

        this.BoomSound = this.sound.add('Boom')

         // 添加背景音乐并播放
         this.bgMusic = this.sound.add('bg_music')
         this.bgMusic.play({ loop: true, volume: 0.3 })
 
         this.audio = this.sound.add('sprite_audio')
         this.audio.addMarker({name: 'finish', start: 2, duration: 2.58})
         this.audio.addMarker({name: 'start', start: 6, duration: 1.5})
         this.audio.addMarker({name: 'win', start: 9, duration: 4})

        // 添加坐标
        this.addAxis()
        this.addPoints()
        this.addMark()
        this.hideAll()
        this.setupMoveBg()



        //线条动画  线条画前面  不要挡到飞机
        // this.LineFire = this.add.sprite(this.startPoint.x, this.startPoint.y, 'LineFire').setOrigin(0.14, 1.05)
        // this.LineFire = this.add.tileSprite(this.startPoint.x - 2, this.startPoint.y + 50, 0, 0, 'LineFire1').setOrigin(0, 1)
        // this.LineFire.setScale(0.235)
        // this.LineFire.setAngle(328)
        // this.LineFire.visible = false
        // this.LineFire = this.add.tileSprite(this.startPoint.x, this.startPoint.y, 0, 0, 'LineFire1').setOrigin(0.14, 1.05)


        // this.LineFire1 = this.add.tileSprite(this.startPoint.x, this.startPoint.y + 50, 0, 0, 'LineFire1').setOrigin(0, 1)
        // this.LineFire1.setScale(0.235)
        // this.LineFire1.setAngle(328)
        // this.LineFire.visible = true

        // 添加背景
        // this.add.tileSprite(0, 0, 0, 0, 'background').setOrigin(0);
        // this.LineFire.visible = false
        this.path = { t: 0, vec: new Phaser.Math.Vector2() };
        this.curve = new Phaser.Curves.Spline([new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y)]);
        this.graphics = this.add.graphics();
        // 添加飞机
        this.plane = this.add.sprite(this.startPoint.x, this.startPoint.y, 'plane').setOrigin(0.5, 0.7)
        this.plane.visible = false  // 先隐藏
        this.anims.create({
            key: 'PlaneIdel',
            frames: this.anims.generateFrameNames('plane'),
            frameRate: 24,
            repeat: -1
        })
        this.anims.create({
            key: 'PlaneReady',
            frames: this.anims.generateFrameNames('plane'),
            frameRate: 24,
            repeat: -1
        })
        this.anims.create({
            key: 'PlaneRun',
            frames: this.anims.generateFrameNames('plane'),
            frameRate: 24,
            repeat: -1
        })
        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNames('plane'),
            frameRate: 24,
            repeat: -1
        })
        this.plane.anims.play('fly')
        // this.calculateLinefireScale()


        //线条动画
        // this.LineFire.anims.create({
        //     key: 'LineGrow',
        //     frames: this.anims.generateFrameNames('LineGrow'),
        //     duration: 6000,
        //     repeat: 0
        // });
        // this.LineFire.anims.create({
        //     key: 'LineToOrange',
        //     frames: this.anims.generateFrameNames('LineToOrange'),
        //     repeat: -1
        // });
        // this.LineFire.anims.create({
        //     key: 'LineToRed',
        //     frames: this.anims.generateFrameNames('LineToRed'),
        //     repeat: -1
        // });


        //飞机动画基础设置
        this.Plane_Angle = 20//飞机旋转角度
        this.Plane_ReadTime = 1000//飞机准备时倒下的时间 毫秒
        this.Ready_StarPlay = 7000//倒计时时 倒数几秒后播放倒下动画
        this.Plane_OffsetY = 5//飞机整体向下偏移
        this.Plane_OffsetX = 18//飞机整体向前偏移
        this.Plane_FloatRange = 8//飞机到头后上下浮动幅度
        this.Plane_FloatSpeed = 0.004//飞机到头后上下浮动速度
        // this.updateTime = 0//更新时间 秒
        this.OldValue = ''
        this.OldValueY = ''

        this.PlaneIdel_Bool = true
        this.PlaneRun_Bool = true
        this.PlaneReady_Bool = true


        //飞机动画
        // this.plane.anims.create({
        //     key: 'PlaneIdel',
        //     frames: this.anims.generateFrameNames('PlaneIdel'),
        //     repeat: -1
        // });
        // this.plane.anims.create({
        //     key: 'PlaneRun',
        //     frames: this.anims.generateFrameNames('PlaneRun'),
        //     frameRate:120,
        //     repeat: -1
        // });
        // this.plane.anims.create({
        //     key: 'PlaneReady',
        //     frames: this.anims.generateFrameNames('PlaneReady'),
        //     repeat: -1
        // });

        //爆炸动画
        this.PlaneBoom = this.add.sprite(100, 100, 'PlaneBoom')
        this.PlaneBoom.anims.create({
            key: 'boom',
            frames: this.anims.generateFrameNumbers('PlaneBoom'),
            frameRate: 100,
            repeat: 0
        });
        this.PlaneBoom.setScale(0.5)
        // this.plane.anims.play('boom')
        this.PlaneBoom.visible = false  // 先隐藏



        // 准备飞行曲线
        this.planeShiftDown = !0
        this.planeShiftDistance = 0
        this.running = false
        this.recalculateLayout()

        //  初始加载已经在游戏中
        let points = store.getters['game/syncPoint']
        let time = store.getters['game/gameStartTime']
        if (points && points.length > 0) {
            const elapsed = Date.now() - time
            this.startGame(elapsed)
            this.flyChart(elapsed)
            this.PlaneReady_Bool = false
            this.plane.anims.play('fly')
        }
        let pomelo = store.getters['client/pomelo']
        pomelo.on('cashOut', (res) => {
            this.jump(res)
        })
    }
    // gameGui() {

    //     // 准备飞行曲线
    //     this.path = { t: 0, vec: new Phaser.Math.Vector2() };
    //     this.curve = new Phaser.Curves.Spline([new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y)]);
    //     this.graphics = this.add.graphics();
    //     this.planeShiftDown = !0
    //     this.planeShiftDistance = 0
    //     this.PADDING_H = 1.5 * this.plane.displayHeight
    //     this.PADDING_W = 4 * this.plane.displayWidth
    //     this.widthIncrement = (this.sys.canvas.width - global.marginX - this.PADDING_W) / global.timeTillEndPoint
    //     this.heightIncrement = (this.sys.canvas.height - global.marginY - this.PADDING_H) / this.vu(global.timeTillEndPoint)
    //     this.running = false

    //     //  初始加载已经在游戏中
    //     let points = store.getters['game/syncPoint']
    //     let time = store.getters['game/gameStartTime']
    //     if (points && points.length > 0) {
    //         this.startGame(Date.now() - time)
    //     }
    //     let pomelo = store.getters['client/pomelo']
    //     pomelo.on('cashOut', () => {
          
    //         this.jump()
    //     })
    // }
    setupMoveBg() {
        const { width: canvasWidth, height: canvasHeight } = this.sys.canvas

        if (this.moveBgTween) {
            this.moveBgTween.stop()
            this.tweens.remove(this.moveBgTween)
            this.moveBgTween = null
        }
        if (this.moveBgContainer) {
            this.moveBgContainer.destroy(true)
            this.moveBgContainer = null
        }

        this.moveBgContainer = this.add.container(0, 0).setDepth(-10)

        const bg1 = this.add.sprite(0, 0, 'movebg').setOrigin(0, 0)
        const scale = Math.max(canvasWidth / bg1.width, canvasHeight / bg1.height)
        const displayWidth = bg1.width * scale
        const displayHeight = bg1.height * scale
        bg1.setDisplaySize(displayWidth, displayHeight)
        const bg2 = this.add.sprite(displayWidth, 0, 'movebg').setOrigin(0, 0)
        bg2.setDisplaySize(displayWidth, displayHeight)
        this.moveBgContainer.add([bg1, bg2])
        this.moveBgContainer.y = (canvasHeight - displayHeight) / 2

        this.moveBgTween = this.tweens.add({
            targets: this.moveBgContainer,
            x: -displayWidth,
            ease: 'linear',
            duration: 6000,
            loop: -1
        })
        this.moveBgTween.pause()
    }

    // 计算平面比例，放大缩小飞机
    calculatePlaneScale() {
        this.planeScale = Math.min(this.sys.canvas.width, this.sys.canvas.height) / 467
        let t = this.planeScale / 1.2;
        this.plane.setScale(t)
    }

    recalculateLayout() {
        const { width, height } = this.sys.canvas
        this.startPoint = { x: global.marginX, y: height - global.marginY }

        if (this.plane) {
            this.calculatePlaneScale()
            this.PADDING_H = 1.2 * this.plane.displayHeight
            this.PADDING_W = 2.1 * this.plane.displayWidth
            this.widthIncrement = (width - global.marginX - this.PADDING_W) / global.timeTillEndPoint
            this.heightIncrement = (height - global.marginY - this.PADDING_H) / this.vu(global.timeTillEndPoint)
            if (this.PlaneBoom) {
                this.PlaneBoom.setScale(this.planeScale / 2)
            }
        }

        if (this.pointsGroup) {
            const step = (width - this.startPoint.x) / 10
            this.pointsGroup.setXY(this.startPoint.x + 20, this.startPoint.y + 16, step)
            if (this.bottomRect) {
                this.bottomRect.setTo(this.startPoint.x, this.startPoint.y, width - this.startPoint.x, 20)
            }
            if (this.textGroupX) {
                let thisx = this.startPoint.x + 20
                for (let i = 0, count = 0; i < this.pointsGroup.getChildren().length; i++) {
                    if (this.pointsGroup.getChildren()[i].texture.key === 'point1') {
                        this.textGroupX[count].x = thisx
                        thisx += step + step
                        count++
                    }
                }
            }
        }

        if (this.markGroup) {
            const stepy = this.startPoint.y / 10
            this.markGroup.setXY(16, 20, 0, stepy)
            if (this.leftRect) {
                this.leftRect.setTo(14, 10, 10, this.startPoint.y)
            }
            if (this.textGroupY) {
                let thisY = 20
                for (let i = 0; i < this.markGroup.getChildren().length; i++) {
                    if (this.markGroup.getChildren()[i].texture.key === 'mark1') {
                        this.textGroupY[i].y = thisY
                        thisY += stepy + stepy
                    }
                }
            }
        }

        if (this.curve && this.startPoint) {
            this.curve.points = [new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y)]
        }

        if (this.moveBgContainer) {
            const wasPlaying = this.moveBgTween && this.moveBgTween.isPlaying()
            this.setupMoveBg()
            if (wasPlaying) {
                this.moveBgTween.resume()
            }
        }
    }

    handleResize() {
        this.recalculateLayout()

        const gameState = store.getters['game/status']
        if (gameState === global.gameState.ready && this.plane) {
            this.plane.x = this.startPoint.x - 8 + this.Plane_OffsetX
            this.plane.y = this.startPoint.y + 10 + this.Plane_OffsetY
        }
        if (this.running) {
            const startTime = store.getters['game/gameStartTime']
            this.flyChart(Date.now() - startTime)
        }
        if (this.PlaneBoom && this.PlaneBoom.visible && this.plane) {
            this.PlaneBoom.setPosition(this.plane.x - 50, this.plane.y)
        }
    }

    //计算平面比例 缩放位移线条
    calculateLinefireScale() {
        this.LinefireScale = this.sys.canvas.width / 205
        let t = this.LinefireScale / 2;
        // console.log(t);
        this.LineFire.setScale(t)
        //线条  黄色线条 初始位置调整
        const offset = this.LinefireScale * 20
        this.LineFire.setPosition(this.startPoint.x - offset, this.startPoint.y + offset)
        //  this.bg.setScale(t)
    }

    // 添加XY轴
    addAxis() {
        // this.xAxis = this.add.line(-20, 10, this.startPoint.x, this.startPoint.y, this.sys.canvas.width, this.startPoint.y, 0x234D6B, 0.6).setOrigin(0)
        // this.xAxis.setLineWidth(1)
        // this.yAxis = this.add.line(-20, 10, this.startPoint.x, this.startPoint.y, global.marginX, 6, 0x234D6B, 0.6).setOrigin(0)
        // this.yAxis.setLineWidth(1)
    }

    // 添加X轴时间点
    addPoints() {
        let point1 = this.make.graphics().fillStyle(0xffffff, 0).fillCircle(3, 3, 1.5);
        point1.generateTexture('point1', 10, 10);
        point1.destroy();
        let point2 = this.make.graphics().fillStyle(0x68a3b5, 1).fillCircle(3, 3, 1.5);
        point2.generateTexture('point2', 10, 10);
        point2.destroy()
        this.pointsGroup = this.add.group()
        this.pointsGroup.createMultiple({ key: ['point1', 'point2'], repeat: 4 })
        const step = (this.sys.canvas.width - this.startPoint.x) / 10
        this.pointsGroup.setXY(this.startPoint.x + 20, this.startPoint.y + 16, step)
        this.bottomRect = new Phaser.Geom.Rectangle(this.startPoint.x, this.startPoint.y, this.sys.canvas.width - this.startPoint.x, 20)

        this.textGroupX = new Array()
        let thisx = this.startPoint.x + 20

        for (let i = 0, count = 0; i < this.pointsGroup.getChildren().length; i++) {
            // window.console.log(this.pointsGroup.getChildren()[i].texture.key)
            if (this.pointsGroup.getChildren()[i].texture.key === 'point1') {
                this.textGroupX[count] = this.add.text(thisx, this.startPoint.y + 16, (count + 1) + 's', { fontSize: 12, color: '#F8F8FF' })
                // this.textGroupX[count].visible = false
                count++
                thisx += step + step
            }
        }

        // window.console.log(this.textGroupX)

    }

    // 添加Y轴刻度线
    addMark() {
        let mark1 = this.make.graphics().fillStyle(0x408da4, 0).fillRoundedRect(0, 0, 10, 2, 2);
        mark1.generateTexture('mark1', 10, 20);
        mark1.destroy();
        let mark2 = this.make.graphics().fillStyle(0x8bdbcb, 1).fillRoundedRect(0, 0, 7, 2, 2);
        mark2.generateTexture('mark2', 7, 20);
        mark2.destroy()
        this.markGroup = this.add.group()
        this.markGroup.createMultiple({ key: ['mark1', 'mark2'], repeat: 4 })
        const step = this.startPoint.y / 10
        this.markGroup.setXY(16, 20, 0, step)
        this.leftRect = new Phaser.Geom.Rectangle(14, 10, 10, this.startPoint.y)

        this.textGroupY = new Array()
        let thisY = 20
        for (let i = 0, count = 1.8; i < this.markGroup.getChildren().length; i++) {
            if (this.markGroup.getChildren()[i].texture.key === 'mark1') {
                this.textGroupY[i] = this.add.text(16, thisY, (count).toFixed(1) + 'x', { fontSize: 12, color: '#F8F8FF' })

                // this.textGroupY[i].visible = false
                count -= 0.2
                thisY += step + step
            }
        }

    }




    // 时间点滚动
    runPoint(val) {//val

        // this.moveBg.visible = true
        this.moveBgTween && this.moveBgTween.resume()

        // X轴时间点滚动
        Phaser.Actions.IncX(this.pointsGroup.getChildren(), -1)
        Phaser.Actions.WrapInRectangle(this.pointsGroup.getChildren(), this.bottomRect)


        // let nowTime = (time / 1000).toFixed(0)


        for (let i = 0, count = 0; i < this.pointsGroup.getChildren().length; i++) {
            if (this.pointsGroup.getChildren()[i].texture.key === 'point1') {
                this.textGroupX[count].x = this.pointsGroup.getChildren()[i].x
                //这里的   33   是左边第一个数字的位置  小于这个位置就隐藏并修改值
                //1秒内  仅修改一次
                let newValue = this.textGroupX[count]
                if (this.textGroupX[count].x < 33 && newValue != this.OldValue) {
                    this.OldValue = newValue

                    // this.textGroupX[count].text = (parseInt(this.textGroupX[count].text.replace('s', '')) + 5) + 's';
                    this.textGroupX[count].text = game_num + 's'
                    game_num += 1;
                }
                count++
            }
        }

        // this.textGroupX[game_num].text = (parseInt(this.textGroupX[game_num].text.replace('s', '')) + 1) + 's'
        // Y轴刻度线滚动
        // Phaser.Actions.IncY(this.markGroup.getChildren(), 0.5)
        // Phaser.Actions.WrapInRectangle(this.markGroup.getChildren(), this.leftRect)

        if (parseFloat(this.textGroupY[0].text.replace('x', ''))) {
            var nums = parseFloat(this.textGroupY[0].text.replace('x', ''));
            if ((val / 100) > nums) {
                var num = ((val / 100) + 0.8).toFixed(1);
                this.textGroupY[0].text = num + 'x';
                this.textGroupY[2].text = (num - 0.2).toFixed(1) + 'x';
                this.textGroupY[4].text = (num - 0.4).toFixed(1) + 'x';
                this.textGroupY[6].text = (num - 0.6).toFixed(1) + 'x';
                this.textGroupY[8].text = (num - 0.8).toFixed(1) + 'x';
            }
        }

    }

    calcPointAtTime(l, timer) {
        const shiftY = timer > 0 ? (this.planeShiftDistance * (l / timer) || 0) : 0
        const vuVal = this.vu(l)
        let y = this.sys.canvas.height - vuVal * this.heightIncrement + shiftY
        y = Math.min(y, this.sys.canvas.height)
        const x = l * this.widthIncrement
        return {
            x: x + global.marginX,
            y: y - global.marginY
        }
    }

    flyChart(t) {
        if (t > global.timeTillEndPoint) {
            this.timer = global.timeTillEndPoint
            this.addShift()
        } else {
            this.timer = t
            this.planeShiftDistance = 0
        }
        this.plane.setVisible(true)
        this.graphics.clear()
        this.graphics.fillStyle(0xee89ff, 0.22)
        this.graphics.lineStyle(3, 0xee89ff, 1)
        this.graphics.beginPath()
        this.graphics.moveTo(this.startPoint.x, this.startPoint.y)
        this.curve.points = [new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y)]

        let lastPoint = { x: this.startPoint.x, y: this.startPoint.y }
        for (let l = 0; l <= this.timer; l += global.frequency) {
            lastPoint = this.calcPointAtTime(l, this.timer)
            this.curve.addPoint(lastPoint.x, lastPoint.y)
            this.graphics.lineTo(lastPoint.x, lastPoint.y)
        }
        if (pointList.length === 0) {
            pointList.push({ x: this.startPoint.x, y: this.startPoint.y })
        }
        this.graphics.lineTo(lastPoint.x, this.startPoint.y)
        this.graphics.lineTo(this.startPoint.x, this.startPoint.y)
        this.graphics.closePath()
        this.graphics.fillPath()
        this.curve.draw(this.graphics)
        // 直接用公式定位，避免样条曲线端点插值抖动
        const planePos = this.calcPointAtTime(this.timer, this.timer)
        const planeX = planePos.x + this.Plane_OffsetX
        const planeY = planePos.y + this.Plane_OffsetY
        this.path.vec.set(planeX, planeY)
        this.plane.setPosition(planeX, planeY)



        // this.LineFire.width = ((this.path.vec.x) / 285) * 1500
        // this.LineFire.visible = true

        // this.bg.setPosition(this.path.vec.x - offset, this.bg.y)

        // window.console.log(this.path.vec.x)  //当前点x
        // window.console.log(n + this.startPoint.x)   //总长x


        // const bl = (this.path.vec.x) / (n + this.startPoint.x)

        // window.console.log((this.path.vec.x - offset),(n + this.startPoint.x))


    }

    vu(t) {
        return t / 1e3 * .7 * (t / 1e3) + t / 5e3
    }


    // 平面位移距离
    addShift() {
        this.planeShiftDistance = Math.sin(Date.now() * this.Plane_FloatSpeed) * this.Plane_FloatRange
    }

    jump(res) {//res
       
    //    console.log(res);
        // suc_item+=1;

        let parachute = this.add.image(this.path.vec.x + 20, this.path.vec.y, 'parachute').setOrigin(0.5, 0).setScale(0.5)
        const limit = this.startPoint.y - parachute.displayHeight
        if(res){
             let text1 = this.add.text(this.path.vec.x , this.path.vec.y,res.cashOut/100, { fill: '#3df2ff', fontSize: '16px' }).setOrigin(0, 1)
             let money1 = this.add.image(this.path.vec.x + 20, this.path.vec.y, 'currency').setOrigin(0.2, -0.2).setScale(0.5)
         
            if(pointList[0].x){
                this.tweens.add({
                    targets: [text1,money1],
                    x: pointList[0].x,
                    y: pointList[0].y,
                    ease: 'Sine.easeIn',
                    duration: 6000,
                    loop: 0,
                    onComplete:()=>{
                        text1.destroy();
                        text1.visible = false;
                        text1 = null;
                        money1.destroy();
                        money1.visible = false;
                        money1 = null;
                    }
                })
            }
           
        }
      

      
        let jump = setInterval(() => {
            parachute.y = parachute.y + 8;
            parachute.x = parachute.x - 2;
            
            if (parachute.y >= limit) {
                parachute.destroy();
                parachute.visible = false;
                parachute = null;
                clearInterval(jump);
            }
        }, 100);
    }
    //获取所有跳伞成功的

    // 游戏开始
    startGame(t) {
        if (this.running) return
        if (this.plane.x === this.startPoint.x - 8 + this.Plane_OffsetX && this.plane.y === this.startPoint.y + 10 + this.Plane_OffsetY) {
            this.audio.play('start')
        } else {
            this.audio.stop()
        }

        // 展示布局
        this.showAll()
        this.running = true
        this.TimeIsRead_angle = false
        this.timer = t
    }

    //游戏结束
    finishGame() {
       
        if (!this.running) return
        // this.audio.play('finish')
        this.BoomSound.play({ loop: false, volume: 1 })
        // this.moveBg.visible = false
        this.moveBgTween.pause()

        this.tweens.killTweensOf(this.plane)
        this.plane.setVisible(true)
        this.PlaneBoom.visible = false
        this.PlaneRun_Bool = true
        this.PlaneReady_Bool = true
        this.PlaneIdel_Bool = true

        game_num = 6;

        this.planeShiftDistance = 0
        // this.updateTime = 0
        this.running = false

        //重置火箭动画
        this.TimeIsRead = false
        this.TimeIsRead_angle = false

        this.tweens.add({
            targets: this.plane,
            x: this.sys.canvas.width + this.plane.displayWidth,
            y: this.plane.y - 180,
            ease: 'Sine.easeIn',
            duration: 700,
            onComplete: () => {
                this.plane.visible = false
                this.plane.angle = 0
                this.path.vec.x = this.startPoint.x
                this.path.vec.y = this.startPoint.y
                this.hideAll()
            }
        })

       
            for(var i=0;i<moneyList.length;i++){
               if(moneyList[i]&&moneyImage[i]){
                    moneyImage[i].destroy();
                    moneyImage[i].visible = false;
                    moneyImage[i] = null;
                    moneyList[i].destroy();
                    moneyList[i].visible = false;
                    moneyList[i] = null;
               }  
        }
        moneyImage = []
        moneyList = []
        pointList = []
    }

    hideAll() {
        // this.xAxis.setVisible(false)
        // this.yAxis.setVisible(false)

        const step = (this.sys.canvas.width - this.startPoint.x) / 10
        this.pointsGroup.setXY(this.startPoint.x + 20, this.startPoint.y + 16, step)

        for (let i = 0, count = 0; i < this.pointsGroup.getChildren().length; i++) {
            if (this.pointsGroup.getChildren()[i].texture.key === 'point1') {
                this.textGroupX[count].text = (count + 1) + 's'
                this.textGroupX[count].x = this.pointsGroup.getChildren()[i].x
                // this.textGroupX[count].setVisible(false)
                count++
            }
        }

        const stepy = this.startPoint.y / 10
        this.markGroup.setXY(16, 20, 0, stepy)

        for (let i = 0, count = 1.8; i < this.markGroup.getChildren().length; i++) {
            if (this.markGroup.getChildren()[i].texture.key === 'mark1') {
                this.textGroupY[i].text = (count).toFixed(1) + 'x'
                this.textGroupY[i].y = this.markGroup.getChildren()[i].y
                // this.textGroupY[i].visible = false
                count -= 0.2
            }
        }


        // this.pointsGroup.setVisible(false)
        // this.markGroup.setVisible(false)
        this.graphics && this.graphics.clear()
        this.curve && (this.curve.points = [new Phaser.Math.Vector2(this.startPoint.x, this.startPoint.y)])
    }

    showAll() {
        // this.xAxis.setVisible(true)
        // this.yAxis.setVisible(true)

        for (let i = 0; i < this.textGroupX.length; i++) {
            this.textGroupX[i].setVisible(true)
        }
        for (let i = 0; i < this.textGroupY.length; i += 2) {
            this.textGroupY[i].setVisible(true)
        }

        this.pointsGroup.setVisible(true)
        this.markGroup.setVisible(true)
    }


    update() {
        const gameState = store.getters['game/status']
        const startTime = store.getters['game/gameStartTime']
        const winSound = store.getters['game/winSound']
        const waitTime = store.getters['game/waitTime']
        const currentMultiple = store.getters['game/currentMultiple']

        // window.console.log(currentMultiple)
        // const openGame = store.getters['game/openGame']
        // if(openGame && game_num ===1){
        //     game_num+=1;
        //     this.gameGui();

        // }

        // window.console.log('gameState', gameState)

        //gameStop
        // 游戏准备,显示飞机
        if (gameState === global.gameState.ready) {
            this.hideAll()
            this.plane.x = this.startPoint.x - 8 + this.Plane_OffsetX
            this.plane.y = this.startPoint.y + 10 + this.Plane_OffsetY

            this.PlaneBoom.visible = false//爆炸
            // this.LineFire.visible = false

            this.plane.setVisible(true)


            //倒计时多少秒后运行准备动画
            if (!this.TimeIsRead) {
                this.TimeIsRead = true
                this.plane.anims.play('PlaneIdel')
                setTimeout(() => {
                    this.playReadyAnim()
                }, waitTime - this.Ready_StarPlay)//距离开始多少秒时开始播放准备动画
            }

            // window.console.log('waitTime', waitTime)

            // if (this.PlaneIdel_Bool && waitTime > waitTime - this.Ready_StarPlay) {
            //     this.PlaneIdel_Bool = false
            //     this.plane.anims.play('PlaneIdel')
            //     setTimeout(() => {
            //         this.playReadyAnim()
            //     }, waitTime - this.Ready_StarPlay)//距离开始多少秒时开始播放准备动画
            // } else {
            //     this.PlaneIdel_Bool = false
            //     this.plane.anims.play('PlaneIdel')
            //     this.plane.angle = this.Plane_Angle
            // }
        }
        // 游戏开始
        if (gameState === global.gameState.start) {
            const time = Date.now() - startTime
            this.startGame(time)

            if (this.running) {
                if (time > global.timeTillEndPoint) {
                    this.runPoint(currentMultiple)
                }
                this.flyChart(time)
            }

            if (this.PlaneReady_Bool) {
                this.PlaneReady_Bool = false
                this.plane.anims.play('fly')
            }

            // 起飞后平滑旋转，避免与位移叠加产生晃动感
            const plane_flytime = (currentMultiple - 100) / 40
            if (!this.TimeIsRead_angle && plane_flytime > 0.3) {
                this.TimeIsRead_angle = true
                this.tweens.add({
                    targets: this.plane,
                    angle: 0,
                    ease: 'Sine.easeInOut',
                    duration: 8000
                })
            }


            // window.console.log(this.textGroupY.length)

            // window.console.log(this.textGroupX)

        }
        // 游戏结束，飞机飞走
        if (gameState === global.gameState.end) {
            this.finishGame()
            game_num = 6;
            // game_num2 = 4;
        }
        // 结算音效
        if (winSound) {
            this.audio.play('win')
            store.commit('game/winSound', false)
        }
    }


    playReadyAnim() {

        this.tweens.add({
            targets: this.plane,
            angle: this.Plane_Angle,
            ease: 'Sine.easeOut',
            duration: this.Plane_ReadTime,
            onComplete: (tween) => {
                tween.targets[0].anims.play('PlaneReady')
            }
        })
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
                autoCenter: Phaser.Scale.Center.CENTER_BOTH
            },
            scene: [GameScene]
        }
        this.game = new Phaser.Game(config);
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true)
            this.game = null
        }
    }

}
