const appvar = require('./var');
const filepath = require('./path');
const axios = require('axios');
const bot = require('./app')

module.exports = {
	getTwitchApiData: async function(args){
		let [data, type, bot] = args
		this.accesstoken = await axios({
			url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_TOKEN}&grant_type=client_credentials`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		console.log(this.accesstoken);
		switch(type){
			case "TEST":
				try {
					this.logindata = await axios({
						url: `https://api.twitch.tv/helix/users?login=${data.name}`,
						method: 'GET',
						headers: {
							'Client-ID': process.env.CLIENT_ID,
							'Authorization': 'Bearer ' + this.accesstoken.data.access_token
						}
					});
					console.log(data)
					//console.log(this.logindata.data)
					this.raiddata = await axios({
						url: `https://api.twitch.tv/helix/channels?broadcaster_id=${this.logindata.data.data[0].id}`,
						method: 'GET',
						headers: {
							'Client-ID': process.env.CLIENT_ID,
							'Authorization': 'Bearer ' + this.accesstoken.data.access_token
						}
					});
					bot.say(data.channel, `${JSON.stringify(this.raiddata.data.data[0])}`)
				} catch (error) {
					console.log(error);
					if(error){
						bot.say(data.channel, "user not found")
					}
				}
				break;
			case "RAID":
				this.accesstoken = await axios({
					url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_TOKEN}&grant_type=client_credentials`,
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				});
				this.logindata = await axios({
					url: `https://api.twitch.tv/helix/users?login=${data.raider}`,
					method: 'GET',
					headers: {
						'Client-ID': process.env.CLIENT_ID,
						'Authorization': 'Bearer ' + this.accesstoken.data.access_token
					}
				});
				//console.log(logindata.data);
				 this.raiddata = await axios({
					url: `https://api.twitch.tv/helix/channels?broadcaster_id=${this.logindata.data.data[0].id}`,
					method: 'GET',
					headers: {
						'Client-ID': process.env.CLIENT_ID,
						'Authorization': 'Bearer ' + this.accesstoken.data.access_token
					}
				});
				console.log(this.raiddata.data);
				await bot.say(data.channel, `Schaut mal bei ${this.raiddata.data.data[0].broadcaster_name} vorbei. 
					https://www.twitch.tv/${this.raiddata.data.data[0].broadcaster_login}. 
					Zu letzt wurde: ${(this.raiddata.data.data[0].game_name != "" ? this.raiddata.data.data[0].game_name : 'Nichts')} ${(this.raiddata.data.data[0].title != "" ? this.raiddata.data.data[0].title: "")} 
					gestreamt`);
				break;
			default:
				break
		}
	},

	shutdownbot: async function(bot) {
		appvar.joinedchannel.forEach(channel => {
			console.log(channel);
			bot.say(channel, 'Bot wird ausgeschaltet');
			bot.part(channel);
		});
	},
    
    
    
	throwCoin: function (channel, bot, guess, userstate, fs) {
		//if guess => add coins
		const sides = 2;
		const kante = 1;
		const fall = Math.floor(Math.random() * sides + Math.random() * kante / Math.PI);
		if(guess){
			console.log(fall);
			if (fall == 0 && guess === 'head') {
				bot.say(channel, 'Du hast Kopf geworfen');
				appvar.botusers[channel][userstate['user-id']].coins += 1;
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
			}
			else if (fall == 1 && guess === 'tail')  {
				bot.say(channel, 'Du hast Zahl geworfen');
				appvar.botusers[channel][userstate['user-id']].coins += 1;
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));

			}
			else if (fall == 2) {
				bot.say(channel, 'Du hast die Münze im Gras versenkt');
			}
			else{
				bot.say(channel, 'Ein Satz mit x');
			}
		}else
		{
			console.log('no guess');
		}

	},
    
	makelove: function (userstate, channel, checklove, bot ) {
		let usersplit = userstate['user-id'].split('');
		let userA = 0,
			userB = 0;
		for (const iterator of usersplit) {
			userA += iterator.charCodeAt(0);
		}
		usersplit = checklove.slice(checklove.indexOf(' ')).toString().replace('@', '');
		for (const iterator of usersplit) {
			userB += iterator.charCodeAt(0);
		}
		let min = Math.min(userA, userB);
		let max = Math.max(userA, userB);
    
		let matching = Math.round((min / max) * 100);
    
    
		bot.say(channel, `${userstate.username} du und @${usersplit} passen zu ${matching}% zusammen`);
	},
    
	// Function called when the "dice" command is issued
	rollDice: function (channel, bot, num, userstate, fs) {
		const sides = 1;
		let ranNum = Math.floor(Math.random() * sides) + 1;
		bot.say(channel, `Du hast eine ${ranNum} gewürfelt`);
		if(num === ranNum.toString()){
			console.log(true);
			appvar.botusers[channel][userstate['user-id']].coins += 1;
			fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
		}
	},
    
	//remove to miesmuschel.js then export and import 
	selectRandomQuote: function () {
		let quote = {
			yes: [
				'Ja',
				'Ja definitiv',
				'Positiv',
				'Hättest du etwas anderes erwartet?',
				'Nur mit guter bezahlung'
			],
			no: [
				'Nein',
				'Weils du bist NEIN',
				'Nö',
				'Kener hat die Absicht hier Ja zu sagen.',
				'Gegenfrage würdest du nackt und mit Fleisch behängt vor einem hungrigen Tiger tanzen?',
				'Deswegen wird er auch nicht größer also nein!',
				'Ich musste dich jetzt einfach darauf Hinweisen. Du bist so hüpsch wie ein Badewannenstöpsel deswegen muss ich deine Anfrage leider ablehnen.',
				'Nein du stinkst geh dich erstmal waschen!',
				'Sprich mit meiner Hand.',
				'Ihre Bestellung wurde erfolgreich aufgenommen es werden 2502,35€ von ihrem Konto abgebucht. Danke',
				'Nein ich bin tot. Leg den Kranz hin und lass mich in Frieden ruhen',
				'Nein, das ist flüssiger Sonnenschein.',
				'Nein, ich lüge',
				'Nein. Ich bin gerade damit beschäftigt Menschen zu beobachten wie sie sich zum Affen machen.',
				'Diese Sache finde ich genauso positiv wie Durchfall!',
				'NEIN und wenn du nochmal so dämliches zeug frägst werfe ich dich ins Feuer und opfere dich der Göttin Brutzla'
			]
		};
		let a = Math.floor(Math.random() * 2);
		let randomNumber;
		switch (a) {
		case 0:
			randomNumber = Math.floor(Math.random() * (quote.yes.length));
			return `${quote.yes[randomNumber]}`;
		case 1:
			randomNumber = Math.floor(Math.random() * (quote.no.length));
			return `${quote.no[randomNumber]}`;
		default:
			return 'something went wrong';
		}
	},
	
};