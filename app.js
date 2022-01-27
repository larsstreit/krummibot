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
		let packagefile = fs.readFileSync(filepath.packagepath);
		objvar.package = JSON.parse(packagefile);
	}
} catch (err) {
	console.error(err);
}

const bot = new tmi.client(opts);
bot.connect().then(() => {
	for (const [key, value] of Object.entries(objvar.botusers)) {
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
			//need if bot gets shutdown on every channel
			objvar.joinedchannel.push(key);
			setTimeout(async() => {
				await bot.say(key, `Hallo @${key.replace('#', '')}`);
				await bot.say(key, `testing ${objvar.package.name} version ${objvar.package.version}`);
			}, 2000);
		}
		/*for (const [, comm] of Object.entries(value.channelcommands)){
			//console.log(comm);
			if(!objvar.test[comm.timer]){
				objvar.test[comm.timer] = [];
			}
			objvar.test[comm.timer].push(comm);
			
		}*/		
	}
	
	/*let timercount = 1;
	setInterval(()=>{
		if(objvar.test[timercount]){
			console.log(objvar.test[timercount]);
			if(objvar.test[timercount].length > 1 ){
				//bot.say()
				setTimeout(()=>{
					
				},60000*2);
			}
		}

		timercount++;
		if(timercount == 60){
			timercount = 0;
		}
	},10000);
	*/
	
}).catch(console.error);


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


