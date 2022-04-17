## build a database
    const Database = require('better-sqlite3');
    const db = new Database('database.db', { verbose: console.log });
    (function(){
        let stmt = db.prepare('CREATE TABLE IF NOT EXISTS "users" ("id" TEXT NOT NULL, "username" TEXT NOT NULL, "data" TEXT, PRIMARY KEY("id"));');
        stmt.run()
    }());
- mongoDB -> empfohlen?
- sql ?
- update pokegame

## frontend
- vue?
- react?
- ...?

## login/registrationsystem
- login with twitch 
- accountsettings
    - (de)activate bot
    - (de)activate commands
    - (de)activate mini games
    - add paypalaccount ?
    - 

## ideas
- on first message from some chatter make a shout out 
    - const vip = {
        mrkrummschnabel: {
            firstMessOfDay: false,
            timer: 60000
            }
        }
    - if(vip[userstate.username]){
        if(vip[userstate.username].firstMessOfDay === false)
        {

        bot.say(channel, `Schaut mal bei ${userstate.username} vorbei. twitch.tv/${userstate.username}`) 
        vip[userstate.username].firstMessOfDay = true
        setTimeout(()=>{
        vip[userstate.username].firstMessOfDay = false
        },vip[userstate.username].timer)

        }
        else{
            return
        }
        }