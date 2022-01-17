const tmi = require('tmi.js');
const pokemon = require('pokemon');
const fs = require('fs');
const { log } = require('console');
const path = "./users.json";
const botuserspath = "./botusers.json"
var users = {}
var botusers = {}
try {
    if (fs.existsSync(path)) {
        let userfile = fs.readFileSync(path)
        //console.log(userfile)
        users = JSON.parse(userfile);
    }
    if (fs.existsSync(botuserspath)) {
        let botusersfile = fs.readFileSync(botuserspath)
        //console.log(userfile)
        botusers = JSON.parse(botusersfile);
    }
} catch(err) {
    console.error(err)
}

/*
const Database = require('better-sqlite3');
const db = new Database('database.db', { verbose: console.log });
(function(){
	let stmt = db.prepare('CREATE TABLE IF NOT EXISTS "users" ("id" TEXT NOT NULL, "username" TEXT NOT NULL, "data" TEXT, PRIMARY KEY("id"));');
    stmt.run()
}());
*/



require('dotenv').config();

const opts = {
    options: { debug: true, messagesLogLevel: "info" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.BOT_NAME,
		password: process.env.BOT_OAUTH
	},
	channels: [  "krummibot" ]
};
const bot = new tmi.client(opts);
bot.connect().then(()=>{
    for (const key in botusers) {
        if(botusers[key].joined === true){
            bot.join(key)
            .then((data) => {
            console.log(data);
            }).catch((err) => {
            console.log(err);
            });
        }
    }
},
console.log).catch(console.error);

bot.on('message', messageHandler);
bot.on('raided', raidHandler)
//Event Handler
function raidHandler(channel, raider, viewers){
    bot.say(channel, `${raider}, raidet mit ${viewers} Flamingos`);
    setTimeout(async() => {
        await bot.say(channel, `!so ${raider}`) 
    }, 2000);
}


function messageHandler(channel, userstate, message, self){
    if (self) return;
    if (!(userstate["user-id"] in users)){
        console.log("user not exist")

        users[userstate["user-id"]] = {
            login: userstate["username"],
            pokemon:{
                list: [],
                catchable: false,
                current:"",
                tries: "",
                actualpoints: "",
                pointstocatch: "",
                runningRound: false,
                lvl: ""
            }
        }
    }else{
        users[userstate["user-id"]].login = userstate["username"];
    }

    commandHandler(channel,message, userstate)
    //console.log(users[userstate["user-id"]])
    fs.writeFileSync(path,JSON.stringify(users, null, '\t'))
}

function commandHandler(channel, message, userstate){
    const checklove = message.split(" ")
    const command = message
    //console.log(userstate)
    //console.log(channel);
    // let test = command.substring(command.indexOf(">"+1))
    // log(test)

    if(channel === "#krummibot"|| channel === "#mrkrummschnabel") {
        if(command === "!joinchannel"){
            if (!(`${"#"+userstate.username}` in botusers)){
                console.log("user not exist")

                botusers[`${"#"+userstate.username}`] = {
                    joined: true,
                    channelcommands: {
                        
                    },
                    allusecommands: ["!so" , "!pokemon", "!commands", "!love", "!games", "!coin", "!würfel"]
                
                }
            }else{
                //user exsist 
                return
            }
            fs.writeFileSync(botuserspath,JSON.stringify(botusers, null, '\t'))
                 bot.join(userstate.username)
                 .then((data) => {
                 console.log(data);
                 }).catch((err) => {
                 console.log(err);
                 });
        }
    }




     if(`${"#"+userstate.username}` in botusers){
         log("#"+userstate.username)
         if(botusers[`${"#"+userstate.username}`].channelcommands){
             // log(botusers[channel].channelcommands[command].function)
             if(botusers[`${"#"+userstate.username}`].channelcommands[command])
                bot.say(channel, botusers[`${"#"+userstate.username}`].channelcommands[command].say)
         }
         else{
             log("command else")
         }
     }
     else{
         log("User not exist in botuser")
     }


    if(userstate.username === "mrkrummschnabel"){
        if(command === "!shutdown"){
            shutdownbot().then(setTimeout(()=>{
                process.exit(0)
            },3000)).catch(err=>{log.error(err)})
 
        }
        if(command === "!getchannels"){
            console.log(bot.getChannels())
        }
        if(command.startsWith("!so")){
            let so = command.split(" ")
            if (so.length > 1){
                bot.say(channel, `Schaut mal bei ${so[1]} vorbei und verschenkt Liebe. https://twitch.tv/${so[1].replace("@", "")}`)
            }
        }
    }
    
    if(userstate['mod']){
        if(command.startsWith("!so")){
            let so = command.split(" ")
            if (so.length > 1){
                bot.say(channel, `Schaut mal bei ${so[1]} vorbei und verschenkt Liebe. https://twitch.tv/${so[1].replace("@", "")}`)
            }
        }
    }
    
    if(userstate.username === "pentiboy"){
        if(command.includes("wie geht es mir")){
            bot.say(channel, `@${userstate.username} ${pentiboy()}`)
        }

    }
    // if(command === "!website"){
    //     bot.say(channel, "Schaut mal auf meiner Website oder meinem Shop vorbei. Website: krummschnabel.de / Shop: shop.krummschnabel.de")    
    //  }
    // if(command === "!Schnabelcoins"){
    //     bot.say(channel, "Dieser Command ist noch in Arbeit | Später wird er mit !Schnabelcoins funktionieren :)")
    // }
    if(command === "!lurk"){
        bot.say(channel, "mrkrummschnabel ist jetzt im Lurk, er / sie benötigt noch ein paar Äste für seinen / ihren Nistplatz. Sie / Er lässt aber Fische für dich hier <3")
    } 
    if(command === "!krummi"){
        bot.say(channel, "ich kann genauso wenig wie mein Ersteller... nicht wahr @MrKrummschnabel!\r\nVersuch mal !command")
        
    }
    if (command ==="!command" ) {
        bot.say(channel, "Folgende Kommandos funktionieren: !krummi, !miesmuschel <Frage>, !command, !love <Username>, !würfel, !coin, !games")
    }
    if(command.slice(0, message.indexOf(" ")) === "!miesmuschel"){
        bot.say(channel, `@${userstate.username} ${selectRandomQuote()}`);
    }
    if(command === "!würfel") {
        rollDice(channel);
    }
    if(command.slice(0, message.indexOf(" ")) === "!love"){
        makelove(userstate,channel, checklove)
    }
    if(command === "!coin"){
        throwCoin(channel)
    }
    
    if(userstate['user-id'] === userstate['room-id']){
        if(command === "!leavechannel"){
            if(botusers["#"+userstate.username].joined === true){
                botusers["#"+userstate.username].joined= false
                fs.writeFileSync(botuserspath,JSON.stringify(botusers, null, '\t'))
            }
            for (const key in botusers) {
                if(botusers[key].joined === false){
                    bot.part(channel).then((data) => {
                        console.log(data);
                        }).catch((err) => {
                        console.error(err)
                        });
                }
            }
        }
        if(command.startsWith("!addcommand")){
            let addcommand = command.split(" ")
            console.log(botusers[`${"#"+userstate.username}`].channelcommands);
                botusers[`${"#"+userstate.username}`].channelcommands[addcommand[1]] = ""
            
            fs.writeFileSync(botuserspath,JSON.stringify(botusers, null, '\t'))
        }
        if(command.startsWith("!definecommand")){
            let defiinecommand = command.split(" ")
            let say = command.substring(command.indexOf(">")+1)
            if(defiinecommand[1] in botusers[`${"#"+userstate.username}`].channelcommands){
                // log(botusers[channel].channelcommands[defiinecommand[1]]);
                botusers[`${"#"+userstate.username}`].channelcommands[defiinecommand[1]] = {
                    say: (defiinecommand[2] == "say"? `${say}`: ""), 
                    
                }
                fs.writeFileSync(botuserspath,JSON.stringify(botusers, null, '\t'))
    
            }
        }
        if(command.startsWith("!removecommand")){
            let removecommand = command.split(" ")
            if(removecommand[1] in botusers[`${"#"+userstate.username}`].channelcommands){
                delete botusers["#"+userstate.username].channelcommands[removecommand[1]]
                
            }
            fs.writeFileSync(botuserspath,JSON.stringify(botusers, null, '\t'))
        }
    }
    if(command === "!games"){
        bot.say(channel, "Folgende Spiele stehen zur Verfügung: Pokemon. Um mehr zu erfahren verwende !pokemon help")
    }

//Pokemon
    if(command === "!pokemon"){
        startpokemongame(channel, userstate)
    }
    if(command === "!catch"){
        catchpokemon(channel, userstate)
    }
    if(command === "!index"){
        pokeindex(channel, userstate)
    }
    if(command === "!pokemon help"){
        bot.say(channel, "Mit !pokemon startest du eine Runde. Verwende !catch um das Pokemon zu fangen Das Pokemon muss zuerst gefangen werden oder verschwinden bevor du eine neue Runde starten kannst Mit !index siehst du wie viele und welche Pokemons du bereits gefangen hast")
    }
}

async function shutdownbot(){
    return bot.getChannels().forEach(channel => {
        bot.say(channel, "Bot wird ausgeschaltet")
        bot.part(channel)
    })
}
function startpokemongame(channel, userstate){
    let randomPook = pokemon.random('de');
        if(users[userstate["user-id"]].pokemon.runningRound == false){
            users[userstate["user-id"]].pokemon.lvl = Math.floor(Math.random()*100)
            bot.say(channel, `Ein wildes ${randomPook} mit LVL ${users[userstate["user-id"]].pokemon.lvl} erscheint` )
            users[userstate["user-id"]].pokemon.actualpoints = "";
            users[userstate["user-id"]].pokemon.current = randomPook;
            users[userstate["user-id"]].pokemon.catchable = true;
            users[userstate["user-id"]].pokemon.tries = Math.floor(Math.random()*5)
            if(users[userstate["user-id"]].pokemon.tries == 0){
                bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten denn ${users[userstate["user-id"]].pokemon.current} ist verschwunden`)
                users[userstate["user-id"]].pokemon.tries = "";
                users[userstate["user-id"]].pokemon.actualpoints = "";
                users[userstate["user-id"]].pokemon.pointstocatch = "";
                users[userstate["user-id"]].pokemon.catchable = false;
                users[userstate["user-id"]].pokemon.runningRound = false
                users[userstate["user-id"]].pokemon.current = "";
                users[userstate["user-id"]].pokemon.lvl = "";
                return
            }
            else{
                setTimeout(async () => {
                    await bot.say(channel, `@${userstate.username} du hast  ${users[userstate["user-id"]].pokemon.tries} Versuche`) 
                }, 2000);
            }
            users[userstate["user-id"]].pokemon.pointstocatch = Math.floor(Math.random()*100)
            users[userstate["user-id"]].pokemon.runningRound = true
        }
        else{
            bot.say(channel, "Du befindest dich schon in einer Runde")
        }
        
    return randomPook;
}
function catchpokemon(channel, userstate){
    if (users[userstate["user-id"]].pokemon.catchable){
        // can try a catch            
        if(users[userstate["user-id"]].pokemon.tries != 0 ){
            users[userstate["user-id"]].pokemon.actualpoints = Math.floor(Math.random()*50)
            if(users[userstate["user-id"]].pokemon.actualpoints == users[userstate["user-id"]].pokemon.pointstocatch || users[userstate["user-id"]].pokemon.actualpoints > users[userstate["user-id"]].pokemon.pointstocatch){
                bot.say(channel, `Glückstrumpf du hast ${users[userstate["user-id"]].pokemon.current} mit LVL ${users[userstate["user-id"]].pokemon.lvl + " "}gefangen.`)
                users[userstate["user-id"]].pokemon.list.push(users[userstate["user-id"]].pokemon.current)
                users[userstate["user-id"]].pokemon.lvl = ""
                users[userstate["user-id"]].pokemon.current = "";
                users[userstate["user-id"]].pokemon.actualpoints = "";
                users[userstate["user-id"]].pokemon.pointstocatch = "";
                users[userstate["user-id"]].pokemon.catchable = false;
                users[userstate["user-id"]].pokemon.runningRound = false
                users[userstate["user-id"]].pokemon.tries = "";
            }
            users[userstate["user-id"]].pokemon.tries --;

            if(users[userstate["user-id"]].pokemon.tries == 0){
                users[userstate["user-id"]].pokemon.lvl = ""
                users[userstate["user-id"]].pokemon.tries = "";
                users[userstate["user-id"]].pokemon.actualpoints = "";
                users[userstate["user-id"]].pokemon.pointstocatch = "";
                users[userstate["user-id"]].pokemon.catchable = false;
                users[userstate["user-id"]].pokemon.runningRound = false
                bot.say(channel, `@${userstate.username}, ${users[userstate["user-id"]].pokemon.current} ist verschwunden`)
                users[userstate["user-id"]].pokemon.current = "";

            }
            if(users[userstate["user-id"]].pokemon.tries == -1){
                users[userstate["user-id"]].pokemon.tries = "";
            }

        }else{
            users[userstate["user-id"]].pokemon.tries = "";
            users[userstate["user-id"]].pokemon.actualpoints = "";
            users[userstate["user-id"]].pokemon.pointstocatch = "";
            users[userstate["user-id"]].pokemon.catchable = false;
            users[userstate["user-id"]].pokemon.runningRound = false
            bot.say(channel, `@${userstate.username}, ${users[userstate["user-id"]].pokemon.current} ist verschwunden`)
            users[userstate["user-id"]].pokemon.current = "";


        }
    }
    else{
        //not catchable
        if(users[userstate["user-id"]].pokemon.tries == 0 || users[userstate["user-id"]].pokemon.tries == ""){
            bot.say(channel, `@${userstate.username} Du musst erst eine neue runde Starten`)
            users[userstate["user-id"]].pokemon.tries = "";
            users[userstate["user-id"]].pokemon.actualpoints = "";
            users[userstate["user-id"]].pokemon.pointstocatch = "";
            users[userstate["user-id"]].pokemon.catchable = false;
            users[userstate["user-id"]].pokemon.runningRound = false
            users[userstate["user-id"]].pokemon.current = "";
         }
    }
}
function pokeindex(channel, userstate){
    let pokedex = pokemon.all('de')
        let counter = 0
        let actualpok = []
        for(t in pokedex){     
            if(users[userstate["user-id"]].pokemon.list.includes(pokedex[t])) {
                counter ++;
                actualpok.push(pokedex[t])
            }
        }
        bot.say(channel, `@${userstate.username}  ${counter + " Pokemons und zwar " + actualpok } `)
}
function throwCoin(channel){
    const sides = 2;
    const kante = 1;
    const fall = Math.floor(Math.random() * sides + Math.random() * kante/Math.PI);
    if(fall == 0){
        bot.say(channel, `Du hast Kopf geworfen`);
    }
    if(fall == 1){
        bot.say(channel, `Du hast Zahl geworfen`);
    }
    if(fall == 2){
        bot.say(channel, `Du hast die Kante im Gras versenkt`);
    }
}

function makelove(userstate,channel, checklove){
    let usersplit = userstate["user-id"].split("") 
        let userA = 0, userB = 0 
        for (const iterator of usersplit) {
            userA += iterator.charCodeAt(0)
        }
        usersplit = checklove.slice(checklove.indexOf(" ")).toString().replace("@", "");
        //console.log(usersplit);
        for(const iterator of usersplit){
            userB += iterator.charCodeAt(0)
        }
        let min = Math.min(userA,userB)
		let max = Math.max(userA,userB)

		let matching = Math.round((min/max)*100)


        bot.say(channel, `${userstate.username} du und @${usersplit} passen zu ${matching}% zusammen`)
}

// Function called when the "dice" command is issued
function rollDice (channel) {
  const sides = 6;
  bot.say(channel, `Du hast eine ${Math.floor(Math.random() * sides) + 1} gewürfelt`);
}

//remove to miesmuschel.js then export and import 
function selectRandomQuote(){
    let quote = {
        yes: [
            "Ja",
            "Ja definitiv",
            "Positiv",
            "Hättest du etwas anderes erwartet?",
            "Nur mit guter bezahlung"
        ],
        no: [
            "Nein",
            "Weils du bist NEIN",
            "Nö",
            "Kener hat die Absicht hier Ja zu sagen.",
            "Gegenfrage würdest du nackt und mit Fleisch behängt vor einem hungrigen Tiger tanzen?",
            "Deswegen wird er auch nicht größer also nein!",
            "Ich musste dich jetzt einfach darauf Hinweisen. Du bist so hüpsch wie ein Badewannenstöpsel deswegen muss ich deine Anfrage leider ablehnen.",
            "Nein du stinkst geh dich erstmal waschen!",
            "Sprich mit meiner Hand.",
            "Ihre Bestellung wurde erfolgreich aufgenommen es werden 2502,35€ von ihrem Konto abgebucht. Danke",
            "Nein ich bin tot. Leg den Kranz hin und lass mich in Frieden ruhen",
            "Nein, das ist flüssiger Sonnenschein.",
            "Nein, ich lüge",
            "Nein. Ich bin gerade damit beschäftigt Menschen zu beobachten wie sie sich zum Affen machen.",
            "Diese Sache finde ich genauso positiv wie Durchfall!",
            "NEIN und wenn du nochmal so dämliches zeug frägst werfe ich dich ins Feuer und opfere dich der Göttin Brutzla"
        ]
    };
    let a = Math.floor(Math.random() * 2);
    let randomNumber;
    //console.log(a);

    switch(a) {
        case 0:
            randomNumber = Math.floor(Math.random() * (quote.yes.length));
            return `${quote.yes[randomNumber]}`;
        case 1:
            randomNumber = Math.floor(Math.random() * (quote.no.length));
            return `${quote.no[randomNumber]}`;
        default:
            return `something went wrong`
    }
}

function pentiboy(){
    let quote = [
            "Dir geht es Scheiße",
            "Weil du es bist sei still",
            "Nö, frag einfach nicht",
            "Kener hat die Absicht hier was gutes zu sagen.",
            "Gegenfrage würdest du nackt und mit Fleisch behängt vor einem hungrigen Tiger tanzen?",
            "du stinkst geh dich erstmal waschen!",
            "Sprich mit meiner Hand.",
        ]
    let randomNumber;
    //console.log(a);
    randomNumber = Math.floor(Math.random() * (quote.length));
    return `${quote[randomNumber]}`
}
