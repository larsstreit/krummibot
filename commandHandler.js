const filepath = require('./path');
const objvar = require('./var');
const pokeMethods = require('./pokegame');
const botfunctions = require('./functions');
const fs = require('fs');
const bannedwords = [
	'simp',
	'Airport',
	'Al Qaeda',
	'Alcohol Tobacco and Firearms (ATF)',
	'Al-Shabaab',
	'Ammonium nitrate',
	'AMTRAK.',
	'Anthrax',
	'Antiviral',
	'AQAP.',
	'AQIM',
	'Arellano-Felix',
	'Artistic Assassins',
	'Assassination',
	'Attack',
	'Attack',
	'Authorities',
	'Avalanche',
	'Avian',
	'Black out',
	'Blister agent',
	'Blizzard',
	'Body scanner',
	'Bomb (squad or threat)',
	'Border',
	'Border Patrol',
	'Botnet',
	'Breach',
	'Bridge',
	'Brown out',
	'Brown out',
	'Brush fire',
	'Brute forcing',
	'Burn',
	'Burst',
	'Bust'
];

module.exports = {
	commandHandler: function (channel, message, userstate, botusers, bot) {
		const checklove = message.split(' ');
		const command = message;


		/**
		 * Check for channel // only these two let bot join to channel 
		 */
		if (channel === '#krummibot' || channel === '#mrkrummschnabel') {
			if (command === '!joinchannel') {
				if (!(`${'#'+userstate.username}` in botusers)) {
					console.log('user not exist');
					bot.say(channel, 'Ist es für dich okay, das mit !krummi für @MrKrummschnabel Werbung gemacht wird? Wenn nicht verwende !removekrummi in deinem Chat');
					botusers[`${'#'+userstate.username}`] = {
						joined: true,
						channelcommands: {

						},
						allusecommands: [
							'!channelcommands',
							'!channelcommands help',
							'!krummi',
							'!so',
							'!pokemon',
							'!catch',
							'!index',
							'!pokemon help',
							'!commands',
							'!love',
							'!games',
							'!coin',
							'!würfel',
							'!miesmuschel'
						]

					};
				} else {
					
					if (botusers['#' + userstate.username].joined === false) {
						botusers['#' + userstate.username].joined = true;

					} else {
						bot.say(`${'#'+userstate.username}`, 'du hast mich bereits aktiviert');
					}
				}
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(file.botusers, null, '\t'));
				bot.join(userstate.username)
					.then((data) => {
						console.log(data);
					}).catch((err) => {
						console.log(err);
					});
			}
		}



		/**
		 * Check for exisiting channel // every channel might have his own commands
		 */
		if (`${channel}` in botusers) {
			let alluse = command.split(' ');

			console.log('check if channel exist in botuser');
			if (botusers[`${channel}`].channelcommands[command]) {
				console.log('check if command exist in botuser');
				bot.say(channel, botusers[`${channel}`].channelcommands[command].say);
			}
			/**
			 * Check for commands useable for alll 
			 */
			else {
				if (botusers[`${channel}`].allusecommands.includes(alluse[0])) {
					console.log(alluse);
					switch (alluse[0]) {
					case '!channelcommands':
						/**
						 * check if there is "help" in command
						 */
						if (botusers[`${channel}`].allusecommands.includes(alluse[0] + ' ' + alluse[1])) {
							bot.say(channel, 'Mit !addcommand <\'!\'+commandname> kannst du einen Command hinzufügen. Mit Mit !definecommand <\'!\'+commandname> say > <Nachricht> fügst du eine Nachricht hinzu. Mit !definecommand <\'!\'+commandname> timer > <Zahl in Min> fügst du ein Timer zu wann der Command automatisch ausgeführt werden soll (WICHTIG: Timer komplett weglassen, wenn Command nur durch manuelle Eingabe ausgeführt werden soll');
						} else {
							return;
						}
						break;
					case '!krummi':
						bot.say(channel, 'Ich bin der von @MrKrummschnabel programmierte Bot! Wenn du mehr darüber erfahren willst schau unter: twitch.tv/mrkrummschnabel vorbei');
						break;
					case '!so':
						if (userstate['mod'] || userstate['user-id'] === userstate['room-id']) {
							if (alluse.length > 1) {
								bot.say(channel, `Schaut mal bei ${alluse[1]} vorbei. twitch.tv/${alluse[1].replace('@', '')}`);
							}
						} else {
							bot.say(channel, `Dafür hast du keine Berechtigung  @${userstate.username}`);
						}
						break;
					case '!pokemon':
						/**
						 * check if there is "help" in command
						 */
						if (botusers[`${channel}`].allusecommands.includes(alluse[0] + ' ' + alluse[1])) {
							bot.say(channel, 'Mit !pokemon startest du eine Runde. Verwende !catch um das Pokemon zu fangen Das Pokemon muss zuerst gefangen werden oder verschwinden bevor du eine neue Runde starten kannst Mit !index siehst du wie viele und welche Pokemons du bereits gefangen hast');
						} else {
							pokeMethods.startpokemongame(channel, userstate, bot);
						}
						break;
					case '!catch':
						pokeMethods.catchpokemon(channel, userstate, bot);
						break;
					case '!index':
						pokeMethods.pokeindex(channel, userstate, bot);
						break;
					case '!commands':
						(() => {
							let s = ' ';
							for (const key in botusers[channel].channelcommands) {
								s += key + ', ';
							}
							s = s.slice(0, (s.lastIndexOf(',')));
							//console.log(s);
							bot.say(channel, 'Folgende Kommandos funktionieren: !krummi, !miesmuschel <Frage>, !commands, !love <Username>, !würfel, !coin, !games ' + s);
						})();

						break;
					case '!love':
						if (command.slice(0, message.indexOf(' ')) === '!love') {
							botfunctions.makelove(userstate, channel, checklove, bot);
						}
						break;
					case '!games':
						bot.say(channel, 'Folgende Spiele stehen zur Verfügung: Pokemon. Um mehr zu erfahren verwende !pokemon help');
						break;
					case '!würfel':
						botfunctions.rollDice(channel, bot);
						break;
					case '!coin':
						botfunctions.throwCoin(channel, bot);
						break;
					case '!miesmuschel':
						if (command.slice(0, message.indexOf(' ')) === '!miesmuschel') {
							bot.say(channel, `@${userstate.username} ${botfunctions.selectRandomQuote()}`);
						}
						break;


					default:
						break;
					}
				}
				/**
				 * Check for blocked words // These words are not allowed
				 */
				else if (bannedwords.includes(command.toLowerCase()) || bannedwords.includes(command)) {
					bot.deletemessage(channel, userstate.id);
					bot.say(channel, 'das Wort darfst du nicht verwenden');
					
					
				}

			}

		} else {
			console.log('User not exist in botuser');
		}

		//can be used in everychannel
		if (userstate.username === 'mrkrummschnabel') {
			if (command === '!shutdown') {
				//eventueller fehler beim "no rsponse from twitch"
				botfunctions.shutdownbot().then(setTimeout(() => {
					process.exit(0);
				}, 3000)).catch(err => {
					console.log.error(err);
				});

			}
			if (command === '!getchannels') {
				console.log(bot.getChannels());
			}
		}


		if (channel === '#mrkrummschnabel') {
			if (userstate.username === 'pentiboy') {
				if (command.includes('wie geht es mir')) {
					bot.say(channel, `@${userstate.username} ${botfunctions.pentiboy()}`);
				}

			}
		}


		if (userstate['user-id'] === userstate['room-id']) {
			if (command === '!leavechannel') {
				if (botusers['#' + userstate.username].joined === true) {
					botusers['#' + userstate.username].joined = false;
					fs.writeFileSync(filepath.botuserspath, JSON.stringify(objvar.botusers, null, '\t'));
				}
				for (const key in botusers) {
					if (botusers[key].joined === false) {
						bot.part(channel).then((data) => {
							console.log(data);
						}).catch((err) => {
							console.error(err);
						});
					}
				}
			}
			if (command.startsWith('!addcommand')) {
				let addcommand = command.split(' ');
				botusers[`${'#'+userstate.username}`].channelcommands[addcommand[1]] = {
					say: '',
					timer: ''
				},
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(objvar.botusers, null, '\t'));
			}
			if (command.startsWith('!definecommand')) {
				let definecommand = command.split(' ');
				let say = command.substring(command.indexOf('>') + 1);
				if (definecommand[1] in botusers[`${'#'+userstate.username}`].channelcommands) {
					switch (definecommand[2]) {
					case 'say':
						botusers[`${'#'+userstate.username}`].channelcommands[definecommand[1]].say = say;
						break;
					case 'timer':
						botusers[`${'#'+userstate.username}`].channelcommands[definecommand[1]].timer = parseInt(say);
						break;
					default:
						break;

					}

				}

				fs.writeFileSync(filepath.botuserspath, JSON.stringify(objvar.botusers, null, '\t'));

			}

			if (command.startsWith('!removecommand')) {
				let removecommand = command.split(' ');
				if (removecommand[1] in botusers[`${'#'+userstate.username}`].channelcommands) {
					delete botusers['#' + userstate.username].channelcommands[removecommand[1]];

				}
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(objvar.botusers, null, '\t'));
			}
			if (command === '!removekrummi') {
				delete botusers['#' + userstate.username];


				fs.writeFileSync(filepath.botuserspath, JSON.stringify(botusers, null, '\t'));
			}
			if (command === '!restart') {
				bot.say(channel, 'Ich starte kurz neu...Bitte warten');
				bot.part(channel).then(setTimeout(() => {
					bot.join(channel).then(log => (console.log(log))).catch(err => (console.log(err)));
					bot.say(channel, 'ich habe einen Neustart durchgerführt');
				}, 10000)).catch(err => (console.error(err)));

			}
		}

	}
};