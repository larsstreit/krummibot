const tmi = require('tmi.js');
const fs = require('fs');
const objvar = require('./var');
const filepath = require('./path');
const eventhandler = require('./handler')
const opts = require('./config');
const bot = new tmi.client(opts);

try {
	if(fs.existsSync(filepath.botuserspath) && fs.existsSync(filepath.packagepath)) {
		let botusersfile = fs.readFileSync(filepath.botuserspath);
		objvar.botusers = JSON.parse(botusersfile);
		let packagefile = fs.readFileSync(filepath.packagepath);
		objvar.package = JSON.parse(packagefile);
	}
} catch (err) {
	console.error(err);
}

bot.connect().then(() => {
	for (const [key, value] of Object.entries(objvar.botusers)) {
		console.log(value);s
		console.log(key);
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
			setTimeout(async () => {
				await bot.say(key, `Hallo @${key.replace('#', '')}`);
				await bot.say(key, `testing ${objvar.package.name} version ${objvar.package.version}`);
			}, 2000);
		}	
	}
}).catch(console.error);

bot.on('message', eventhandler.messageHandler);
bot.on('raided', eventhandler.raidHandler);
bot.on('subscription', eventhandler.subscriptionHandler);

