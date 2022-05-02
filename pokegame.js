const pokemon = require('pokemon');
const appvar = require('./var');
module.exports ={
	startpokemongame: function(channel, userstate, bot) {
		let randomPook = pokemon.random('de');
		let player = appvar.botusers[channel][userstate['user-id']];
		

		if (player.poke.runningRound == false) {
			player.poke.lvl = Math.floor(Math.random() * 100);
			bot.say(channel, `Ein wildes ${randomPook} mit LVL ${player.poke.lvl} erscheint`);
			player.poke.actualpoints = '';
			player.poke.current = randomPook;
			player.poke.catchable = true;
			player.poke.runningRound = true;
			player.poke.tries = Math.floor(Math.random() * 5);
			if (player.poke.tries == 0) {
				bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten denn ${player.poke.current} ist verschwunden`);
				player.poke.tries = '';
				player.poke.actualpoints = '';
				player.poke.pointstocatch = '';
				player.poke.catchable = false;
				player.poke.runningRound = false;
				player.poke.current = '';
				player.poke.lvl = '';
			} else {
				setTimeout(async () => {
					await bot.say(channel, `@${userstate.username} du hast  ${player.poke.tries} Versuche`);
				}, 2000);
			}
			player.poke.pointstocatch = Math.floor(Math.random() * 100);
		} else {
			bot.say(channel, 'Du befindest dich schon in einer Runde');
		}
    
		return randomPook;
	},
    
	catchpokemon: function(channel, userstate, bot) {
		let player = appvar.botusers[channel][userstate['user-id']];

		if (player.poke.catchable) {
			// can try a catch            
			if (player.poke.tries != 0) {
				player.poke.actualpoints = Math.floor(Math.random() * 50);
				if (player.poke.actualpoints == player.poke.pointstocatch || player.poke.actualpoints > player.poke.pointstocatch) {
					bot.say(channel, `Glückstrumpf du hast ${player.poke.current} mit LVL ${player.poke.lvl + ' '}gefangen.`);
					player.poke.list.push(`${'('+player.poke.current+ ' , '+ player.poke.lvl+')'}`);
					player.poke.lvl = '';
					player.poke.current = '';
					player.poke.actualpoints = '';
					player.poke.pointstocatch = '';
					player.poke.catchable = false;
					player.poke.runningRound = false;
					player.poke.tries = '';
				}
				player.poke.tries--;
    
				if (player.poke.tries == 0) {
					player.poke.lvl = '';
					player.poke.tries = '';
					player.poke.actualpoints = '';
					player.poke.pointstocatch = '';
					player.poke.catchable = false;
					player.poke.runningRound = false;
					bot.say(channel, `@${userstate.username}, ${player.poke.current} ist verschwunden`);
					player.poke.current = '';
    
				}
				if (player.poke.tries == -1) {
					player.poke.tries = '';
				}
    
			} else {
				player.poke.tries = '';
				player.poke.actualpoints = '';
				player.poke.pointstocatch = '';
				player.poke.catchable = false;
				player.poke.runningRound = false;
				bot.say(channel, `@${userstate.username}, ${player.poke.current} ist verschwunden`);
				player.poke.current = '';
    
    
			}
		} else {
			//not catchable
			if (player.poke.tries == 0 || player.poke.tries == '') {
				bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten`);
				player.poke.tries = '';
				player.poke.actualpoints = '';
				player.poke.pointstocatch = '';
				player.poke.catchable = false;
				player.poke.runningRound = false;
				player.poke.current = '';
			}
		}
	},
    
	pokeindex: function(channel, userstate, bot) {
		bot.say(channel, `@${userstate.username} deine Pokemeons siehst du hier www.krummibot.de/${channel.replace('#', '')}/${userstate.username}/pokemon `);
	}
};