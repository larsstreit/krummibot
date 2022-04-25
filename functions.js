const appvar = require('./var');

module.exports = {
	shutdownbot: async function(bot) {
		appvar.joinedchannel.forEach(channel => {
			console.log(channel);
			bot.say(channel, 'Bot wird ausgeschaltet');
			bot.part(channel);
		});
	},
    
    
    
	throwCoin: function (channel, bot) {
		const sides = 2;
		const kante = 1;
		const fall = Math.floor(Math.random() * sides + Math.random() * kante / Math.PI);
		if (fall == 0) {
			bot.say(channel, 'Du hast Kopf geworfen');
		}
		if (fall == 1) {
			bot.say(channel, 'Du hast Zahl geworfen');
		}
		if (fall == 2) {
			bot.say(channel, 'Du hast die Kante im Gras versenkt');
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
	rollDice: function (channel, bot) {
		const sides = 6;
		bot.say(channel, `Du hast eine ${Math.floor(Math.random() * sides) + 1} gewürfelt`);
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