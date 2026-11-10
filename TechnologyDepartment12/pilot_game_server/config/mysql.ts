module.exports = {

    'development': {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "root",
        database: "game_pilot"
    },
    'production': {
        // host: "localhost",
        // user: "game_pilot",
        // REDACTED,
        host: "database-1.cluster-cfuk48i8ixca.ap-south-1.rds.amazonaws.com",
        user: "admin",
        REDACTED,
        port: 3306,
        database: "game_pilot"
    },
    
    // 'development': {
    //     host: "47.98.196.167",
    //     port: 3306,
    //     user: "game_yy",
    //     REDACTED,
    //     database: "game_yy"
    // },
    // 'production': {
    //     host: "47.98.196.167",
    //     port: 3306,
    //     user: "game_yy",
    //     REDACTED,
    //     database: "game_yy"
    // },

    // 'development': {
    //     host: "127.0.0.1",
    //     port: 3306,
    //     user: "root",
    //     REDACTED,
    //     database: "pilot"
    // },
    // 'production': {
    //     host: "127.0.0.1",
    //     port: 3306,
    //     user: "root",
    //     REDACTED,
    //     database: "pilot"
    // }


    // aviator1
    // 'production': {
    //     host: "fishmysql.cf3o0wl3we3d.ap-east-1.rds.amazonaws.com",
    //     port: 3306,
    //     user: "aviator0",
    //     REDACTED,
    //     database: "aviator"
    // }
    // aviator2
    // 'production': {
    //     host: "fishmysql.cf3o0wl3we3d.ap-east-1.rds.amazonaws.com",
    //     port: 3306,
    //     user: "aviatorfb",
    //     REDACTED,
    //     database: "fb_aviator"
    // }

};
