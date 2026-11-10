const isPilotChickenServer = process.argv.includes('serverType=pilotChicken')

const appenders = {
    'console': {
        'type': 'console'
    },
    'crash-log': {
        'type': 'file',
        'filename': '${opts:base}/logs/crash-${opts:serverId}.log',
        'maxLogSize': 1048576,
        'layout': {
            'type': 'basic'
        },
        'backups': 5
    },
    'pinus': {
        'type': 'file',
        'filename': '${opts:base}/logs/system-${opts:serverId}.log',
        'maxLogSize': 10485760,
        'layout': {
            'type': 'basic'
        },
        'backups': 10
    }
}

const categories = {
    'default': {
        'appenders': ['console', 'pinus'],
        'level': 'info'
    },
    'con-log': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'rpc-log': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'forward-log': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'rpc-debug': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'crash-log': {
        'appenders': ['crash-log'],
        'level': 'debug'
    },
    'admin-log': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'pinus-admin': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'pinus-rpc': {
        'appenders': ['pinus'],
        'level': 'debug'
    },
    'http-log': {
        'appenders': ['pinus'],
        'level': 'debug'
    }
}

if (isPilotChickenServer) {
    appenders['chicken-road2-log'] = {
        'type': 'file',
        'filename': '${opts:base}/logs/chicken-road2.log',
        'maxLogSize': 1048576,
        'layout': {
            'type': 'basic'
        },
        'backups': 5
    }
    categories['chicken-road2'] = {
        'appenders': ['chicken-road2-log'],
        'level': 'debug'
    }
}

module.exports = {
    'appenders': appenders,
    'categories': categories,
    'prefix': '${opts:serverId} ',
    'replaceConsole': true,
    'lineDebug': false,
    'errorStack': true
};
