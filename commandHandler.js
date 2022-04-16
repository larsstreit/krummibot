const filepath = require('./path');
const appvar = require('./var');
const pokeMethods = require('./pokegame');
const botfunctions = require('./functions');
const bannedwords = [
	'simp'
];
const scanallusecommands =require('./allusecommands')
module.exports = {
	commandHandler: function (channel, message, userstate, bot, fs) {
		const checklove = message.split(' ');
		const command = message;


		/**
		 * Check for channel // only these two let bot join to channel
		 */
		if (channel === '#krummibot' || channel === '#mrkrummschnabel') {
			console.log(channel, true);
			
			if (command === '!joinchannel') {
				if (!(`${'#'+userstate.username}` in appvar.botusers)) {
					console.log('user not exist');
					setTimeout(async () => {
						await bot.say(`${'#'+userstate.username}`, 'Ist es für dich okay, das mit !krummi für @MrKrummschnabel und nach 40min Werbung für den Bot gemacht wird? Wenn nicht verwende !removekrummi in deinem Chat um den Bot zu entfernen! Vielen Dank für deine Unterstützung');
					}, 2000);
				
						appvar.botusers[`${'#'+userstate.username}`] = {
						joined: true,
						channelcommands: {

						},
						allusecommands: scanallusecommands.allusecommands
					

					};
				} else {
					if (appvar.botusers[`${'#'+userstate.username}`].joined === false) {
						appvar.botusers[`${'#'+userstate.username}`].joined = true;

					} else {
						bot.say(`${'#'+userstate.username}`, 'du hast mich bereits aktiviert');
					}
				}
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
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
		if (`${channel}` in appvar.botusers) {
			let alluse = command.split(' ');

			console.log('check if channel exist in botuser');
			if (appvar.botusers[`${channel}`].channelcommands[command]) {
				console.log('check if command exist in botuser');
				if(command === '!lurk'){
					bot.say(channel, `@${userstate.username} `+appvar.botusers[`${channel}`].channelcommands[command].say)
				}
				else{
					bot.say(channel, appvar.botusers[`${channel}`].channelcommands[command].say);
			
				}
			}
			/**
			 * Check for commands useable for all
			 */
			else {
				if (appvar.botusers[`${channel}`].allusecommands.includes(alluse[0])) {
					console.log(alluse);
					switch (alluse[0]) {
					case '!help':
						bot.say(channel, 'Wobei brauchst du Hilfe?...')
						break;
					case '!channelcommands':
						/**
						 * check if there is "help" in command
						 */
						if (appvar.botusers[`${channel}`].allusecommands.includes(alluse[0] + ' ' + alluse[1])) {
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
						if (appvar.botusers[`${channel}`].allusecommands.includes(alluse[0] + ' ' + alluse[1])) {
							if(alluse[1] === 'help'){
								bot.say(channel, 'Mit !pokemon startest du eine Runde. Verwende !pokemon catch um das Pokemon zu fangen Das Pokemon muss zuerst gefangen werden oder verschwinden bevor du eine neue Runde starten kannst Mit !pokemon index siehst du wie viele und welche Pokemons du bereits gefangen hast');
							}
							else if(alluse[1] === 'catch'){
								pokeMethods.catchpokemon(channel, userstate, bot);	
							}
							else if(alluse[1] === 'index'){
								pokeMethods.pokeindex(channel, userstate, bot);
							}
							
						} 
						else
								pokeMethods.startpokemongame(channel, userstate, bot);
						break;
					case '!commands':
						(() => {
							let s = ' ';
							for (const key in appvar.botusers[channel].channelcommands) {
								s += key + ', ';
							}

							s = s.slice(0, (s.lastIndexOf(',')));
							s = s.length !== 0 ? ", " +s : ""
							bot.say(channel, 'Folgende Kommandos funktionieren: !krummi, !pokemon help !miesmuschel <Frage>, !commands, !love <Username>, !würfel, !coin, !games, !hug'+s);
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
					case '!hug':
						if (command.slice(0, message.indexOf(' ')) === '!hug') {
							bot.say(channel, `@${userstate.username} umarmt ${alluse[1].charAt(0) === "@" ? alluse[1].toLowerCase() : "@"+alluse[1].toLowerCase()} <3 <3`)
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

		//can be used in everychannel only by mrkrummschnabel
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
				bot.say(channel, bot.getChannels())
			}
		}

		//can only be used by channelowner / broadcaster
		if (userstate['user-id'] === userstate['room-id']) {
			if (command === '!leavechannel') {
				if (appvar.botusers['#' + userstate.username].joined === true) {
					appvar.botusers['#' + userstate.username].joined = false;
					fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
				}
				for (const key in appvar.botusers) {
					if (appvar.botusers[key].joined === false) {
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
				appvar.botusers[`${'#'+userstate.username}`].channelcommands[addcommand[1]] = {
					say: '',
					timer: ''
				},
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
			}
			if (command.startsWith('!definecommand')) {
				let definecommand = command.split(' ');
				let say = command.substring(command.indexOf('>') + 1);
				if (definecommand[1] in appvar.botusers[`${'#'+userstate.username}`].channelcommands) {
					switch (definecommand[2]) {
					case 'say':
						appvar.botusers[`${'#'+userstate.username}`].channelcommands[definecommand[1]].say = say;
						break;
					case 'timer':
						appvar.botusers[`${'#'+userstate.username}`].channelcommands[definecommand[1]].timer = parseInt(say);
						break;
					default:
						break;

					}

				}

				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));

			}

			if (command.startsWith('!removecommand')) {
				let removecommand = command.split(' ');
				if (removecommand[1] in appvar.botusers[`${'#'+userstate.username}`].channelcommands) {
					delete appvar.botusers['#' + userstate.username].channelcommands[removecommand[1]];

				}
				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
			}
			if(command === '!removekrummi') {
				delete appvar.botusers['#' + userstate.username];


				fs.writeFileSync(filepath.botuserspath, JSON.stringify(appvar.botusers, null, '\t'));
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