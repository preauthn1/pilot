module.exports = {
    'syncPoint': {
        'required int32 multiple': 1,
        'optional string roundKey': 2,
        'optional int32 sequence': 3
    },
    'bet': {
        'required int32 userId': 1,
        'required int32 index': 2,
        'required string username': 3,
        'required int32 betCount': 4,
        'required string tag': 5

    },
    'betMines': {
        'required int32 userId': 1,
        'required int32 index': 2,
        'required string username': 3,
        'required int32 betCount': 4
    },
    'cancel': {
        'required int32 userId': 1,
        'required int32 index': 2

    },
    'cashOut': {
        'required int32 userId': 1,
        'required int32 index': 2,
        'required int32 multiple': 3,
        'required int32 cashOut': 4

    },
    'autoCashOut': {
        'required int32 index': 1,
        'required int32 multiple': 2,
        'required int32 cashOut': 3,
        'required int32 coin': 4

    },
    'status': {
        'required int32 status': 1,
        'optional int32 duration': 2,
        'optional int32 roundId': 3,
        'optional string roundKey': 4,
        'optional int32 endPoint': 5

    },
    'syncProp': {
        'required int32 coin': 1

    },

};
