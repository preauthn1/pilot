export default {
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