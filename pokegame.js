const pokegame = module.exports = {
        startpokemongame: function(channel, userstate){
        let randomPook = pokemon.random('de');
            if(users[userstate["user-id"]].pokemon.runningRound == false){
                bot.say(channel, `Einwildes ${randomPook} erscheint` )
                users[userstate["user-id"]].pokemon.actualpoints = "";
                users[userstate["user-id"]].pokemon.current = randomPook;
                users[userstate["user-id"]].pokemon.catchable = true;
                users[userstate["user-id"]].pokemon.tries = Math.floor(Math.random()*5)
                users[userstate["user-id"]].pokemon.pointstocatch = Math.floor(Math.random()*100)
                users[userstate["user-id"]].pokemon.runningRound = true
            }
            else{
                bot.say(channel, "Du befindest dich schon in einer Runde")
            }
            
        return randomPook;
    },
    catchpokemon: function(channel, userstate){
        if (users[userstate["user-id"]].pokemon.catchable){
            // can try a catch            
            if(users[userstate["user-id"]].pokemon.tries != 0){
                users[userstate["user-id"]].pokemon.actualpoints = Math.floor(Math.random()*50)
                if(users[userstate["user-id"]].pokemon.actualpoints == users[userstate["user-id"]].pokemon.pointstocatch || users[userstate["user-id"]].pokemon.actualpoints > users[userstate["user-id"]].pokemon.pointstocatch){
                    bot.say(channel, `Glückstrumpf du hast ${users[userstate["user-id"]].pokemon.current} gefangen.`)
                    users[userstate["user-id"]].pokemon.list.push(users[userstate["user-id"]].pokemon.current)
                    users[userstate["user-id"]].pokemon.actualpoints = "";
                    users[userstate["user-id"]].pokemon.pointstocatch = "";
                    users[userstate["user-id"]].pokemon.catchable = false;
                    users[userstate["user-id"]].pokemon.runningRound = false
                    users[userstate["user-id"]].pokemon.tries = "";
                }
                users[userstate["user-id"]].pokemon.tries --;
                if(users[userstate["user-id"]].pokemon.tries == 0){
                    users[userstate["user-id"]].pokemon.tries = "";
                    users[userstate["user-id"]].pokemon.actualpoints = "";
                    users[userstate["user-id"]].pokemon.pointstocatch = "";
                    users[userstate["user-id"]].pokemon.catchable = false;
                    users[userstate["user-id"]].pokemon.runningRound = false
                    bot.say(channel, `@${userstate.username}, ${users[userstate["user-id"]].pokemon.current} ist verschwunden`)
                }
            }else{
                users[userstate["user-id"]].pokemon.tries = "";
                    users[userstate["user-id"]].pokemon.actualpoints = "";
                    users[userstate["user-id"]].pokemon.pointstocatch = "";
                    users[userstate["user-id"]].pokemon.catchable = false;
                    users[userstate["user-id"]].pokemon.runningRound = false
                    bot.say(channel, `@${userstate.username}, ${users[userstate["user-id"]].pokemon.current} ist verschwunden`)

            }
        }
        else{
            //not catchable
            if(users[userstate["user-id"]].pokemon.tries == 0 || users[userstate["user-id"]].pokemon.tries == ""){
                bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten`)
            }
        }
    }, 
    pokeindex: function(channel, userstate){
        let pokedex = pokemon.all('de')
            let counter = 0
            let actualpok = []
            for(t in pokedex){     
                if(users[userstate["user-id"]].pokemon.list.includes(pokedex[t])) {
                    counter ++;
                    actualpok.push(pokedex[t])
                }
            }
            bot.say(channel, `@${userstate.username}Du hast ${counter + " Pokémon " + actualpok } `)
    }
}
