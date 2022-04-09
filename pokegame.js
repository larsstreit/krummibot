const pokemon = require('pokemon');
const objvar = require('./var');
module.exports ={
	startpokemongame: function(channel, userstate, bot) {
		let randomPook = pokemon.random('de');
		if (objvar.botusers[channel][userstate['user-id']].poke.runningRound == false) {
			objvar.botusers[channel][userstate['user-id']].poke.lvl = Math.floor(Math.random() * 100);
			bot.say(channel, `Ein wildes ${randomPook} mit LVL ${objvar.botusers[channel][userstate['user-id']].poke.lvl} erscheint`);
			objvar.botusers[channel][userstate['user-id']].poke.actualpoints = '';
			objvar.botusers[channel][userstate['user-id']].poke.current = randomPook;
			objvar.botusers[channel][userstate['user-id']].poke.catchable = true;
			objvar.botusers[channel][userstate['user-id']].poke.runningRound = true;
			objvar.botusers[channel][userstate['user-id']].poke.tries = Math.floor(Math.random() * 5);
			if (objvar.botusers[channel][userstate['user-id']].poke.tries == 0) {
				bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten denn ${objvar.botusers[channel][userstate['user-id']].poke.current} ist verschwunden`);
				objvar.botusers[channel][userstate['user-id']].poke.tries = '';
				objvar.botusers[channel][userstate['user-id']].poke.actualpoints = '';
				objvar.botusers[channel][userstate['user-id']].poke.pointstocatch = '';
				objvar.botusers[channel][userstate['user-id']].poke.catchable = false;
				objvar.botusers[channel][userstate['user-id']].poke.runningRound = false;
				objvar.botusers[channel][userstate['user-id']].poke.current = '';
				objvar.botusers[channel][userstate['user-id']].poke.lvl = '';
			} else {
				setTimeout(async () => {
					await bot.say(channel, `@${userstate.username} du hast  ${objvar.botusers[channel][userstate['user-id']].poke.tries} Versuche`);
				}, 2000);
			}
			objvar.botusers[channel][userstate['user-id']].poke.pointstocatch = Math.floor(Math.random() * 100);
		} else {
			bot.say(channel, 'Du befindest dich schon in einer Runde');
		}
    
		return randomPook;
	},
    
	catchpokemon: function(channel, userstate, bot) {
		if (objvar.botusers[channel][userstate['user-id']].poke.catchable) {
			// can try a catch            
			if (objvar.botusers[channel][userstate['user-id']].poke.tries != 0) {
				objvar.botusers[channel][userstate['user-id']].poke.actualpoints = Math.floor(Math.random() * 50);
				if (objvar.botusers[channel][userstate['user-id']].poke.actualpoints == objvar.botusers[channel][userstate['user-id']].poke.pointstocatch || objvar.botusers[channel][userstate['user-id']].poke.actualpoints > objvar.botusers[channel][userstate['user-id']].poke.pointstocatch) {
					bot.say(channel, `Glückstrumpf du hast ${objvar.botusers[channel][userstate['user-id']].poke.current} mit LVL ${objvar.botusers[channel][userstate['user-id']].poke.lvl + ' '}gefangen.`);
					objvar.botusers[channel][userstate['user-id']].poke.list.push(`${'('+objvar.botusers[channel][userstate['user-id']].poke.current+ ' , '+ objvar.botusers[channel][userstate['user-id']].poke.lvl+')'}`);
					objvar.botusers[channel][userstate['user-id']].poke.lvl = '';
					objvar.botusers[channel][userstate['user-id']].poke.current = '';
					objvar.botusers[channel][userstate['user-id']].poke.actualpoints = '';
					objvar.botusers[channel][userstate['user-id']].poke.pointstocatch = '';
					objvar.botusers[channel][userstate['user-id']].poke.catchable = false;
					objvar.botusers[channel][userstate['user-id']].poke.runningRound = false;
					objvar.botusers[channel][userstate['user-id']].poke.tries = '';
				}
				objvar.botusers[channel][userstate['user-id']].poke.tries--;
    
				if (objvar.botusers[channel][userstate['user-id']].poke.tries == 0) {
					objvar.botusers[channel][userstate['user-id']].poke.lvl = '';
					objvar.botusers[channel][userstate['user-id']].poke.tries = '';
					objvar.botusers[channel][userstate['user-id']].poke.actualpoints = '';
					objvar.botusers[channel][userstate['user-id']].poke.pointstocatch = '';
					objvar.botusers[channel][userstate['user-id']].poke.catchable = false;
					objvar.botusers[channel][userstate['user-id']].poke.runningRound = false;
					bot.say(channel, `@${userstate.username}, ${objvar.botusers[channel][userstate['user-id']].poke.current} ist verschwunden`);
					objvar.botusers[channel][userstate['user-id']].poke.current = '';
    
				}
				if (objvar.botusers[channel][userstate['user-id']].poke.tries == -1) {
					objvar.botusers[channel][userstate['user-id']].poke.tries = '';
				}
    
			} else {
				objvar.botusers[channel][userstate['user-id']].poke.tries = '';
				objvar.botusers[channel][userstate['user-id']].poke.actualpoints = '';
				objvar.botusers[channel][userstate['user-id']].poke.pointstocatch = '';
				objvar.botusers[channel][userstate['user-id']].poke.catchable = false;
				objvar.botusers[channel][userstate['user-id']].poke.runningRound = false;
				bot.say(channel, `@${userstate.username}, ${objvar.botusers[channel][userstate['user-id']].poke.current} ist verschwunden`);
				objvar.botusers[channel][userstate['user-id']].poke.current = '';
    
    
			}
		} else {
			//not catchable
			if (objvar.botusers[channel][userstate['user-id']].poke.tries == 0 || objvar.botusers[channel][userstate['user-id']].poke.tries == '') {
				bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten`);
				objvar.botusers[channel][userstate['user-id']].poke.tries = '';
				objvar.botusers[channel][userstate['user-id']].poke.actualpoints = '';
				objvar.botusers[channel][userstate['user-id']].poke.pointstocatch = '';
				objvar.botusers[channel][userstate['user-id']].poke.catchable = false;
				objvar.botusers[channel][userstate['user-id']].poke.runningRound = false;
				objvar.botusers[channel][userstate['user-id']].poke.current = '';
			}
		}
	},
    
	pokeindex: function(channel, userstate, bot) {
		let pokedex = objvar.botusers[channel][userstate['user-id']].poke.list;
		let counter = 0;
		let actualpok = [];
		for (let t in pokedex) {
			counter++;
			actualpok.push(pokedex[t]);	
		}		
		bot.say(channel, `@${userstate.username} ${counter + ' Pokemons und zwar ' + actualpok } `);
	}
};