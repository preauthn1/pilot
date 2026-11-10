module.exports = {
    'development': {
        'connector': [
            { 'id': 'connector-server', 'host': '127.0.0.1', 'port': 4050, 'clientHost': '0.0.0.0', 'clientPort': 3050, 'frontend': true, 'args': '--inspect=10001' }
        ],
        'aviator': [
            { 'id': 'aviator-server', 'host': '127.0.0.1', 'port': 5050, 'args': '--inspect=10004' }
        ],
        'pilotChicken': [
            { 'id': 'pilotChicken-server', 'host': '127.0.0.1', 'port': 5060, 'args': '--inspect=10019' }
        ],
        // 'mines': [
        //     { 'id': 'mines-server', 'host': '127.0.0.1', 'port': 5051, 'args': '--inspect=10010' }
        // ],
        // 'dice': [
        //     { 'id': 'dice-server', 'host': '127.0.0.1', 'port': 5052, 'args': '--inspect=10013' }
        // ],
        // 'pirate': [
        //     { 'id': 'pirate-server', 'host': '127.0.0.1', 'port': 5053, 'args': '--inspect=10012' }
        // ],
        // 'racing': [
        //     { 'id': 'racing-server', 'host': '127.0.0.1', 'port': 5054, 'args': '--inspect=10011' }
        // ],
        // 'triple': [
        //     { 'id': 'triple-server', 'host': '127.0.0.1', 'port': 5055, 'args': '--inspect=10014' }
        // ],
        // 'jump': [
        //     { 'id': 'jump-server', 'host': '127.0.0.1', 'port': 5057, 'args': '--inspect=10016' }
        // ],
        // 'superAce': [
        //     { 'id': 'superAce-server', 'host': '127.0.0.1', 'port': 5056, 'args': '--inspect=10015' }
        // ],
        // 'clearMines': [
        //     { 'id': 'clearMines-server', 'host': '127.0.0.1', 'port': 5058, 'args': '--inspect=10017' }
        // ],
        // 'tiger': [
        //     { 'id': 'tiger-server', 'host': '127.0.0.1', 'port': 5059, 'args': '--inspect=10018' }
        // ],
        'hall': [
            { 'id': 'hall-server', 'host': '127.0.0.1', 'port': 6050, 'args': '--inspect=10007' }
        ],
        'control': [
            { 'id': 'control-server', 'host': '127.0.0.1', 'port': 7050, 'clientHost': '0.0.0.0', 'clientPort': 8050, 'frontend': true, 'args': '--inspect=10009' }
        ]
    },
    'production': {
        'connector': [
            { 'id': 'connector-server', 'host': '127.0.0.1', 'port': 4050, 'clientHost': '0.0.0.0', 'clientPort': 3050, 'frontend': true }
        ],
        'aviator': [
            { 'id': 'aviator-server', 'host': '127.0.0.1', 'port': 5050, 'args': '--inspect=10004' }
        ],
        'pilotChicken': [
            { 'id': 'pilotChicken-server', 'host': '127.0.0.1', 'port': 5060 }
        ],
        // 'mines': [
        //     { 'id': 'mines-server', 'host': '127.0.0.1', 'port': 5051, 'args': '--inspect=10010' }
        // ],
        // 'dice': [
        //     { 'id': 'dice-server', 'host': '127.0.0.1', 'port': 5052, 'args': '--inspect=10013' }
        // ],
        // 'pirate': [
        //     { 'id': 'pirate-server', 'host': '127.0.0.1', 'port': 5053, 'args': '--inspect=10012' }
        // ],
        // 'racing': [
        //     { 'id': 'racing-server', 'host': '127.0.0.1', 'port': 5054, 'args': '--inspect=10011' }
        // ],
        // 'triple': [
        //     { 'id': 'triple-server', 'host': '127.0.0.1', 'port': 5055, 'args': '--inspect=10014' }
        // ],
        // 'jump': [
        //     { 'id': 'jump-server', 'host': '127.0.0.1', 'port': 5057, 'args': '--inspect=10016' }
        // ],
        // 'superAce': [
        //     { 'id': 'superAce-server', 'host': '127.0.0.1', 'port': 5056, 'args': '--inspect=10015' }
        // ],
        // 'clearMines': [
        //     { 'id': 'clearMines-server', 'host': '127.0.0.1', 'port': 5058, 'args': '--inspect=10017' }
        // ],
        // 'tiger': [
        //     { 'id': 'tiger-server', 'host': '127.0.0.1', 'port': 5059, 'args': '--inspect=10018' }
        // ],
        'hall': [
            { 'id': 'hall-server', 'host': '127.0.0.1', 'port': 6050 }
        ],
        'control': [
            { 'id': 'control-server', 'host': '127.0.0.1', 'port': 7050, 'clientHost': '0.0.0.0', 'clientPort': 8050, 'frontend': true }
        ]
    }
};
