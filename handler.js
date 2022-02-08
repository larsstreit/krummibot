const fs = require('fs');
const commandHandler = require('./commandHandler');
const objvar = require('./var');
module.exports = {
    subscriptionHandler(channel, username, method, message, userstate){
    console.log(channel, username, method, message, userstate);

},
raidHandler(channel, raider, viewers) {
    bot.say(channel, `${raider}, raidet mit ${viewers} Flamingos`);
    setTimeout(async () => {
        await bot.say(channel, `Schaut mal bei ${raider} vorbei. twitch.tv/${raider.replace('@', '')}`);
    }, 2000);
},
messageHandler(channel, userstate, message, self) {
    console.log(message, "true");
    if (self || userstate.username === 'soundalerts' || userstate.username === 'streamelements' || userstate.username === 'streamlabs') return;
    if (objvar.botusers[channel]) {
        if (!objvar.botusers[channel][userstate['user-id']]) {
            console.log('user not exist');
            objvar.botusers[channel][userstate['user-id']] = {
                login: userstate['username'],
                poke: {
                    list: [],
                    catchable: false,
                    current: '',
                    tries: '',
                    actualpoints: '',
                    pointstocatch: '',
                    runningRound: false,
                    lvl: ''
                },
                schnabelcoins: 0
            };
        } else {
            objvar.botusers[channel][userstate['user-id']].login = userstate.username;
        }
    } else {
        return;
    }
    commandHandler.commandHandler(channel, message, userstate, objvar.botusers,bot, fs);
    fs.writeFileSync(filepath.botuserspath, JSON.stringify(objvar.botusers, null, '\t'));
}}