const tmi = require('tmi.js');
const fs = require('fs');
const objvar = require('./var');
const filepath = require('./path.js');
const commandHandler = require('./commandHandler');
const opts = require('./config');
require('dotenv').config();
try {
	if(fs.existsSync(filepath.botuserspath) && fs.existsSync(filepath.packagepath) && fs.existsSync(filepath.logpath)) {
		let botusersfile = fs.readFileSync(filepath.botuserspath);
		objvar.botusers = JSON.parse(botusersfile);
	}
} catch (err) {
	console.error(err);
}

const bot = new tmi.client(opts);
bot.connect().then(() => {
	for (const key in objvar.botusers) {
		if (objvar.botusers[key].joined === true) {
			bot.join(key)
				.then((data) => {
					console.log(data);
				}).catch((err) => {
					console.log(err);
				});
			objvar.joinedchannel.push(key);
			setTimeout(() => {
				bot.say(key, `Hallo @${key.replace('#', '')}`);
				bot.say(key, `testing ${objvar.package.name} version ${objvar.package.version}`);
			}, 3000);
		}
		for (const t in objvar.botusers[`${key}`].channelcommands) {
			if (objvar.botusers[`${key}`].channelcommands[t].timer && objvar.botusers[`${key}`].channelcommands[t].timer === typeof Number) {
				setInterval(() => {
					bot.say(`${key}`, objvar.botusers[`${key}`].channelcommands[t].say);


				}, objvar.botusers[`${key}`].channelcommands[t].timer * 60000);
			}
		}
	}
},console.log).catch(console.error);

bot.on('message', messageHandler);
bot.on('raided', raidHandler);


//Event Handler
function raidHandler(channel, raider, viewers) {
	bot.say(channel, `${raider}, raidet mit ${viewers} Flamingos`);
	setTimeout(async () => {
		await bot.say(channel, `Schaut mal bei ${raider} vorbei. twitch.tv/${raider.replace('@', '')}`);
	}, 2000);
}



function messageHandler(channel, userstate, message, self) {
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
}


