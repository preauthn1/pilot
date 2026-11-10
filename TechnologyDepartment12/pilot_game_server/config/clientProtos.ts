module.exports = {
    // "connector.entryHandler.entry": {
    //     "required string token": 1
    // },
    "control.entryHandler.entry": {
        "required string token": 1
    },
    "aviator.aviatorHandler.enterRequest": {
        "optional int32 channelId": 1,
        "optional string tag": 2
    },
    // "mines.minesHandler.enterRequest": {
    //     "required string currency": 1,
    //     "required string tag": 2
    // },
    // "mines.minesHandler.betRequest": {
    //     "required int32 betCount": 1,
    //     "required int32 mines": 2,
    // },
    // "mines.minesHandler.clickMinesRequest": {
    //     "required int32 clickPos": 1
    // },
    // "dice.diceHandler.enterRequest": {
    //     "required string currency": 1,
    //     "required string tag": 2
    // },
    // "dice.diceHandler.betRequest": {
    //     "required int32 betCount": 1,
    //     "required int32 rollUnder": 2,
    //     "required int32 payout": 3,
    //     "required int32 payout": 3,
    // },
    // "aviator.aviatorHandler.betRequest":{
    //     "required int32 index": 1,
    //     "required int32 betCount": 2,
    //     "required bool auto": 3,
    //     "required int32 multiple": 4,
    // },
    "aviator.aviatorHandler.cancelRequest": {
        "required int32 index": 1,
    },
    "aviator.aviatorHandler.cashOutRequest": {
        "required int32 index": 1,
    },
    "hall.gameHandler.cashOutRank": {
        "optional string tag": 1
    },
    "hall.gameHandler.multipleRank": {
        "optional string tag": 1
    },
    "hall.gameHandler.userRecord": {
        "optional string tag": 1
    },
    "hall.gameHandler.previousRecord": {
        "optional string tag": 1
    },

};
