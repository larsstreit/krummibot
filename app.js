const tmi = require('tmi.js');
const fs = require('fs');
const objvar = require('./var');
const filepath = require('./path');
const opts = require('./config');
const commandHandler = require('./commandHandler')
const bot = new tmi.client(opts);
const express = require('express');
const https = require('https');
prestart();

function prestart(){
    try {
        if(fs.existsSync(filepath.botuserspath) && fs.existsSync(filepath.packagepath)) {
            let botusersfile = fs.readFileSync(filepath.botuserspath);
            objvar.botusers = JSON.parse(botusersfile);
            let packagefile = fs.readFileSync(filepath.packagepath);
            objvar.package = JSON.parse(packagefile);
            startbot();
            const app = express()
            app.get('/user/:channel', (req, res) => {
                req.params; 
                console.log(req.params.channel);
                if('#'+req.params.channel in objvar.botusers){
                    res.json(objvar.botusers[`#${req.params.channel}`])
                }
                else{
                    res.status(404)
                    res.send("User not exist")
                }
            });
            app.get('/users/', (req, res) => {
                res.json(Object.keys(objvar.botusers))
                res.end()

                
            });
            app.get('/messages', (req, res) => {
                //reload page to show new messages 
                res.send(`${JSON.stringify(objvar.messages)} <script>setTimeout(()=>{location.reload()},10000)</script>`)


            });
            try {
                if(fs.existsSync('/etc/letsencrypt/live/krummibot.de/fullchain.pem') && fs.existsSync('/etc/letsencrypt/live/krummibot.de/privkey.pem')){
                    const httpsServer = https.createServer({
                        key: fs.readFileSync('/etc/letsencrypt/live/krummibot.de/privkey.pem'),
                        cert: fs.readFileSync('/etc/letsencrypt/live/krummibot.de/fullchain.pem'),
                      }, app);
                      
                      httpsServer.listen(443, () => {
                          console.log('HTTPS Server running on port 443');
                      });
                }else{
                    const httpsServer = https.createServer({
                        key: fs.readFileSync('./etc/letsencrypt/live/krummibot.de/privkey.pem'),
                        cert: fs.readFileSync('./etc/letsencrypt/live/krummibot.de/fullchain.pem'),
                      }, app);
                      
                      httpsServer.listen(443, () => {
                          console.log('HTTPS Server running on port 443');
                      });
                }
                
            } catch (error) {
                console.log(error);
            }
            
        }
        else{
            prestart();
        }
    } catch (err) {
        console.error(err);
    }
}


function startbot(){
    bot.connect().then(() => {
        for (const [key, value] of Object.entries(objvar.botusers)) {
            //console.log(value);
            //console.log(key);
            // shows the value of botusers[key] console.log(objvar.botusers[key]) does the same as console.log(value);
            // key => #channelname etc. console.log(key)
            if (value.joined === true) {
                bot.join(key)
                    .then((data) => {
                        //shows which channel was joined
                        console.log(data);
                    }).catch((err) => {
                        console.log(err);
                    });
                //need when bot gets shutdown on every channel
                objvar.joinedchannel.push(key);
            }	
        }
    }).catch(console.error);
    
    bot.on('message', messageHandler);
    bot.on('raided', raidHandler);
    bot.on('subscription', subscriptionHandler);
    bot.on('anonsubmysterygift', subscriptionHandler)
    
}




function subscriptionHandler(channel, username, method, message, userstate){
    console.log(channel, username, method, message, userstate);
}
function subscriptionHandler(channel, numbOfSubs, methods, userstate){
    console.log(channel, numbOfSubs, methods, userstate);
}
function raidHandler(channel, raider, viewers) {
    bot.say(channel, `${raider}, raidet mit ${viewers} Flamingos`);
    setTimeout(async () => {
        await bot.say(channel, `Schaut mal bei ${raider} vorbei. twitch.tv/${raider.replace('@', '')}`);
    }, 2000);
}
function messageHandler(channel, userstate, message, self, app) {
	
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
        commandHandler.commandHandler(channel, message, userstate, bot, fs);
    } else {
        commandHandler.commandHandler(channel, message, userstate, bot, fs);
    }
    fs.writeFileSync(filepath.botuserspath, JSON.stringify(objvar.botusers, null, '\t'));
    objvar.messages.push({channel: channel, userstate: userstate, message: message})
}