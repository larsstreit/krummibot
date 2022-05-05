/* eslint-disable no-case-declarations */
const tmi = require('tmi.js');
const fs = require('fs');
const appvar = require('./var');
const filepath = require('./path');
const opts = require('./botconfig');
const commandHandler = require('./commandHandler');
const bot = new tmi.client(opts);
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const helmet = require('helmet');
const https = require('https');
const cookieParser = require('cookie-parser');
const app = express();
const session = require('express-session');
const cors = require('cors');
const redUri = 'https://localhost/auth/twitch/callback' || 'https://www.krummibot.de/auth/twitch/callback';
const scanallusecommands = require('./allusecommands');
const RateLimit = require('express-rate-limit');
const limiter =  RateLimit({
	windowMs: 15*60*1000, // 15 minute
	max: 100
});
const csrf = require('csurf');

const WebSocketClient = require('websocket').client;
const client = new WebSocketClient();
const wsschannel = '#mrkrummschnabel';

client.on('connectFailed', function(error) {
	console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
	console.log('WebSocket Client Connected');
	connection.sendUTF('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
	connection.sendUTF(`PASS ${process.env.BOT_OAUTH}`);
	connection.sendUTF('NICK krummibot');
	connection.sendUTF(`JOIN ${wsschannel}`);
	//connection.send(`PRIVMSG ${wsschannel} : WEBSOCKET CONNECTION ESTABLISHED`);
	connection.on('message',function(message){
		// Parses an IRC message and returns a JSON object with the message's 
		// component parts (tags, source (nick and host), command, parameters). 
		// Expects the caller to pass a single message. (Remember, the Twitch 
		// IRC server may send one or more IRC messages in a single message.)
		if (message.type === 'utf8') {
			let rawMessage = message.utf8Data.trimEnd();
			console.log(`Message received (${new Date().toISOString()}): '${rawMessage}'\n`);

			let messages = rawMessage.split('\r\n');  // The IRC message may contain one or more messages.
			messages.forEach(message => {
				let parsedMessage = parseMessage(message, rawMessage);
            
				if (parsedMessage) {
					//console.log(`Message command: ${parsedMessage.command.command}`);
					console.log(`\n${JSON.stringify(parsedMessage, null, 3)}`);

					switch (parsedMessage.command.command) {
					case 'PRIVMSG':
						//console.log(parsedMessage.command.botCommand);
						
                            
						break;
					case 'CLEARMSG':
						//what for?
				
							
						break;
					case 'WHISPER':
						//what for?
				
							
						break;
					case 'PING':
						connection.sendUTF('PONG ' + parsedMessage.parameters);
						break;
					case '001':
						// Successfully logged in, so join the channel.
						connection.sendUTF(`JOIN ${wsschannel}`); 
						break; 
					case 'JOIN':				
						break;
					case 'PART':
						console.log('The channel must have banned (/ban) the bot.');
						break;
					case 'NOTICE': 
						// If the authentication failed, leave the channel.
						// The server will close the connection.
						if ('Login authentication failed' === parsedMessage.parameters) {
							console.log(`Authentication failed; left ${wsschannel}`);
							connection.sendUTF(`PART ${wsschannel}`);
						}
						else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
							console.log(`No permission. Check if the access token is still valid. Left ${wsschannel}`);
							connection.sendUTF(`PART ${wsschannel}`);
						}
						break;
					default:
						break; // Ignore all other IRC messages.
					}
				}
			});
		}

	});
	connection.on('close', function() {
		console.log('Connection Closed');
		console.log(`close description: ${connection.closeDescription}`);
		console.log(`close reason code: ${connection.closeReasonCode}`);
	});
});

function parseMessage(message, rawMessage) {

	let parsedMessage = {  // Contains the component parts.
		raw: rawMessage,
		tags: null,
		source: null,
		command: null,
		parameters: null
	};

	// The start index. Increments as we parse the IRC message.

	let idx = 0; 

	// The raw components of the IRC message.

	let rawTagsComponent = null;
	let rawSourceComponent = null; 
	let rawCommandComponent = null;
	let rawParametersComponent = null;

	// If the message includes tags, get the tags component of the IRC message.

	if (message[idx] === '@') {  // The message includes tags.
		let endIdx = message.indexOf(' ');
		rawTagsComponent = message.slice(1, endIdx);
		idx = endIdx + 1; // Should now point to source colon (:).
	}

	// Get the source component (nick and host) of the IRC message.
	// The idx should point to the source part; otherwise, it's a PING command.

	if (message[idx] === ':') {
		idx += 1;
		let endIdx = message.indexOf(' ', idx);
		rawSourceComponent = message.slice(idx, endIdx);
		idx = endIdx + 1;  // Should point to the command part of the message.
	}

	// Get the command component of the IRC message.

	let endIdx = message.indexOf(':', idx);  // Looking for the parameters part of the message.
	if (-1 == endIdx) {                      // But not all messages include the parameters part.
		endIdx = message.length;                 
	}

	rawCommandComponent = message.slice(idx, endIdx).trim();

	// Get the parameters component of the IRC message.

	if (endIdx != message.length) {  // Check if the IRC message contains a parameters component.
		idx = endIdx + 1;            // Should point to the parameters part of the message.
		rawParametersComponent = message.slice(idx);
	}

	// Parse the command component of the IRC message.

	parsedMessage.command = parseCommand(rawCommandComponent);

	// Only parse the rest of the components if it's a command
	// we care about; we ignore some messages.

	if (null == parsedMessage.command) {  // Is null if it's a message we don't care about.
		return null; 
	}
	else {
		if (null != rawTagsComponent) {  // The IRC message contains tags.
			parsedMessage.tags = parseTags(rawTagsComponent);
		}

		parsedMessage.source = parseSource(rawSourceComponent);

		parsedMessage.parameters = rawParametersComponent;
		//if starts with 
		/*if (rawParametersComponent && rawParametersComponent[0] === '!') {  
			// The user entered a bot command in the chat window.            
			parsedMessage.command = parseParameters(rawParametersComponent, parsedMessage.command);
		}*/
	}

	return parsedMessage;
}

// Parses the tags component of the IRC message.

function parseTags(tags) {
	// badge-info=;badges=broadcaster/1;color=#0000FF;...

	const tagsToIgnore = {  // List of tags to ignore.
		'client-nonce': null,
		'flags': null
	};

	let dictParsedTags = {};  // Holds the parsed list of tags.
	// The key is the tag's name (e.g., color).
	let parsedTags = tags.split(';'); 

	parsedTags.forEach(tag => {
		let parsedTag = tag.split('=');  // Tags are key/value pairs.
		let tagValue = (parsedTag[1] === '') ? null : parsedTag[1];

		switch (parsedTag[0]) {  // Switch on tag name
		case 'badges':
		case 'badge-info':
			// badges=staff/1,broadcaster/1,turbo/1;

			if (tagValue) {
				let dict = {};  // Holds the list of badge objects.
				// The key is the badge's name (e.g., subscriber).
				let badges = tagValue.split(','); 
				badges.forEach(pair => {
					let badgeParts = pair.split('/');
					dict[badgeParts[0]] = badgeParts[1];
				});
				dictParsedTags[parsedTag[0]] = dict;
			}
			else {
				dictParsedTags[parsedTag[0]] = null;
			}
			break;
		case 'emotes':
			// emotes=25:0-4,12-16/1902:6-10

			if (tagValue) {
				let dictEmotes = {};  // Holds a list of emote objects.
				// The key is the emote's ID.
				let emotes = tagValue.split('/');
				emotes.forEach(emote => {
					let emoteParts = emote.split(':');

					let textPositions = [];  // The list of position objects that identify
					// the location of the emote in the chat message.
					let positions = emoteParts[1].split(',');
					positions.forEach(position => {
						let positionParts = position.split('-');
						textPositions.push({
							startPosition: positionParts[0],
							endPosition: positionParts[1]    
						});
					});

					dictEmotes[emoteParts[0]] = textPositions;
				});

				dictParsedTags[parsedTag[0]] = dictEmotes;
			}
			else {
				dictParsedTags[parsedTag[0]] = null;
			}

			break;
		case 'emote-sets':
			// emote-sets=0,33,50,237

			let emoteSetIds = tagValue.split(',');  // Array of emote set IDs.
			dictParsedTags[parsedTag[0]] = emoteSetIds;
			break;
		default:
			// If the tag is in the list of tags to ignore, ignore
			// it; otherwise, add it.

			// eslint-disable-next-line no-prototype-builtins
			if (tagsToIgnore.hasOwnProperty(parsedTag[0])) { 
				return;
			}
			else {
				dictParsedTags[parsedTag[0]] = tagValue;
			}
		} 
	});

	return dictParsedTags;
}

// Parses the command component of the IRC message.

function parseCommand(rawCommandComponent) {
	let parsedCommand = null;
	let commandParts = rawCommandComponent.split(' ');

	switch (commandParts[0]) {
	case 'JOIN':
	case 'PART':
	case 'NOTICE':
	case 'CLEARCHAT':
	case 'HOSTTARGET':
	case 'PRIVMSG':
	case 'CLEARMSG':
	case 'WHISPER':

		parsedCommand = {
			command: commandParts[0],
			channel: commandParts[1]
		};
		break;
	case 'PING':
		parsedCommand = {
			command: commandParts[0]
		};
		break;
	case 'CAP':
		parsedCommand = {
			command: commandParts[0],
			isCapRequestEnabled: (commandParts[2] === 'ACK') ? true : false,
			// The parameters part of the messages contains the 
			// enabled capabilities.
		};
		break;
	case 'GLOBALUSERSTATE':  // Included only if you request the /commands capability.
		// But it has no meaning without also including the /tags capability.
		parsedCommand = {
			command: commandParts[0]
		};
		break;               
	case 'USERSTATE':   // Included only if you request the /commands capability.
	case 'ROOMSTATE':   // But it has no meaning without also including the /tags capabilities.
		parsedCommand = {
			command: commandParts[0],
			channel: commandParts[1]
		};
		break;
	case 'USERNOTICE':
		parsedCommand = {
			command: commandParts[0],
			channel: commandParts[1]
		};
		break;
	case 'RECONNECT':  
		console.log('The Twitch IRC server is about to terminate the connection for maintenance.');
		parsedCommand = {
			command: commandParts[0]
		};
		break;
	case '421':
		console.log(`Unsupported IRC command: ${commandParts[2]}`);
		return null;
	case '001':  // Logged in (successfully authenticated). 
		parsedCommand = {
			command: commandParts[0],
			channel: commandParts[1]
		};
		break;
	case '002':  // Ignoring all other numeric messages.
	case '003':
	case '004':
	case '353':  // Tells you who else is in the chat room you're joining.
	case '366':
	case '372':
	case '375':
	case '376':
		console.log(`numeric message: ${commandParts[0]}`);
		return null;
	default:
		console.log(`\nUnexpected command: ${commandParts[0]}\n`);
		return null;
	}

	return parsedCommand;
}

// Parses the source (nick and host) components of the IRC message.

function parseSource(rawSourceComponent) {
	if (null == rawSourceComponent) {  // Not all messages contain a source
		return null;
	}
	else {
		let sourceParts = rawSourceComponent.split('!');
		return {
			nick: (sourceParts.length == 2) ? sourceParts[0] : null,
			host: (sourceParts.length == 2) ? sourceParts[1] : sourceParts[0]
		};
	}
}

// Parsing the IRC parameters component if it contains a command (e.g., !dice).

/*function parseParameters(rawParametersComponent, command) {
	let idx = 0;
	let commandParts = rawParametersComponent.slice(idx + 1).trim(); 
	let paramsIdx = commandParts.indexOf(' ');

	if (-1 == paramsIdx) { // no parameters
		command.botCommand = commandParts.slice(0); 
	}
	else {
		command.botCommand = commandParts.slice(0, paramsIdx); 
		command.botCommandParams = commandParts.slice(paramsIdx).trim();
		// TODO: remove extra spaces in parameters string
	}

	return command;
}*/



client.connect('wss://irc-ws.chat.twitch.tv:443');


//app settings

app.set('./views');
app.set('view engine', 'ejs');

app.use('/styles',express.static(__dirname + '/styles'));

app.use(limiter);
app.use(cookieParser());

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(csrf({ cookie: true }));

app.use(morgan('tiny'));
app.use(helmet({
	crossOriginEmbedderPolicy: false
}));
app.use(function (req, res, next) {
	res.setHeader(
		'Content-Security-Policy', 'default-src \'self\'; script-src \'self\' https://* \'unsafe-inline\'; style-src \'self\'; font-src \'self\'; img-src \'self\'; frame-src \'self\' https://* \'unsafe-inline\';',
	);
	next();
});

const login = {
	email: '',
	name: '',
	id: ''
};
let users = [login];

app.get('/', (req, res) => {
	res.render('home');

});



app.get('/faq', (req, res) => {
	res.render('faq');

	
});
app.get('/auth/twitch', async (req,res)=>{
	res.redirect(`https://id.twitch.tv/oauth2/authorize?response_type=code&force_verify=true&client_id=${process.env.CLIENT_ID}&redirect_uri=${redUri}&scope=user:read:email&state=`);

});
app.get('/auth/twitch/callback', async (req,res)=>{
	const code = req.query.code;
	try {
		var response = await axios({
			method: 'post',
			url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_TOKEN}&code=${code}&grant_type=authorization_code&redirect_uri=${redUri}`
		});
  
		var login = await axios({
			url: 'https://api.twitch.tv/helix/users',
			method: 'GET',
			headers: {
				'Client-ID': process.env.CLIENT_ID,
				'Accept': 'application/vnd.twitchtv.v5+json',
				'Authorization': 'Bearer ' + response.data.access_token
			}
		});
		req.session.loggedin = true;
		req.session.userid = login.data.data[0].id;

		var temp={ 
			id:   login.data.data[0].id,
			email:  login.data.data[0].email,
			name:   login.data.data[0].login
		};
		
		if(users.find(obj => obj.id ==  req.session.userid)){
			console.log(users.find(obj => obj.id ==  req.session.userid));
		}
		else{
			users.push(temp);
		}
		console.log(users);
		res.redirect('../../account');
	} catch (error) {
		res.redirect('../../?error='+error);
	}
});
app.get('/impressum',(req, res)=>{
	res.render('impressum');
});
app.get('/dsgvo',(req, res)=>{
	res.render('dsgvo');
});
app.get('/login', (req, res) => {
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		res.redirect('/account');
	}
	else
		res.render('login', { csrfToken: req.csrfToken() });
});
app.post('/login' , (req, res) => {
	res.redirect(`https://id.twitch.tv/oauth2/authorize?response_type=code&force_verify=true&client_id=${process.env.CLIENT_ID}&redirect_uri=${redUri}&scope=user:read:email`);
});
app.get('/logout', (req,res)=>{
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		req.session.loggedin = null;
		users = [login];
		res.redirect('/?loggedout=true&message=succesfull&logout');
	}
	else{
		res.redirect('/?loggedin=false&message=you&are%not%loggedin');
	}
});
app.get('/loggers', (req, res)=>{
	if(req.session.loggedin && req.session.userid == '536841246' && users.find(obj => obj.id ==  req.session.userid)){
		res.send(users);
	}
	else{
		res.send('you are not permitted');
	}
});
app.get('/user/:channel',(req, res)=>{
	let botusersfile = fs.readFileSync(filepath.botuserspath);
	appvar.botusers = JSON.parse(botusersfile);
	console.log(req.params);
	if(appvar.botusers['#'+req.params.channel]){
		res.render('channel',{
			channel: req.params.channel
		});
	}else{
		res.redirect('../users');
	}
});

app.get('/user/:channel/:user/pokemon',  (req, res)=>{
	let botusersfile = fs.readFileSync(filepath.botuserspath);
	appvar.botusers = JSON.parse(botusersfile);
	console.log(req.params);
	if(appvar.botusers['#'+req.params.channel]){
		let user = Object.values(appvar.botusers['#'+req.params.channel]).filter(x=> x.login === req.params.user);
		res.send(`<p>${user[0].poke.list}</p>`);
	}
});


app.post('/account', (req, res)=>{
	const channelname = users.find(obj => obj.id ==  req.session.userid).name;
  

	if(req.body.activatebot){  
		if(req.body.activatebot === 'Remove Bot'){
			appvar.botusers['#'+channelname].joined = false;
			bot.part('#'+channelname).then().catch(err => console.log(err));
		}
		else if(req.body.activatebot === 'Add Bot'){
			if (!(`${'#'+users.find(obj => obj.id ===  req.session.userid).name}` in appvar.botusers)){
				appvar.botusers[`${'#'+users.find(obj => obj.id ===  req.session.userid).name}`] = {
					joined: true,
					channelcommands: {},
					allusecommands: scanallusecommands.allusecommands,
					commandconfig:{
						allusecommands: {

						}
					}
				};
				appvar.botusers[`${'#'+users.find(obj => obj.id ===  req.session.userid).name}`].commandconfig.allusecommands[[scanallusecommands.allusecommands].forEach(element =>{
					console.log(element);
					for (let i = 0; i < element.length; i++) {
						if(!appvar.botusers[`${'#'+users.find(obj => obj.id ===  req.session.userid).name}`].commandconfig.allusecommands[element[i]]) {
							appvar.botusers[`${'#'+users.find(obj => obj.id ===  req.session.userid).name}`].commandconfig.allusecommands[element[i]] = {
								'active': true
							};
						}
					}})];

				setTimeout(async () => {
					await bot.say(`${'#'+users.find(obj => obj.id ===  req.session.userid).name}`, 'Ist es für dich okay, das mit !krummi für @MrKrummschnabel und nach 40min Werbung für den Bot gemacht wird? Wenn nicht verwende !removekrummi in deinem Chat um den Bot zu entfernen! Vielen Dank für deine Unterstützung');
				}, 2000);
				bot.join('#'+channelname).then().catch(err => console.log(err));
			}
			else {
				appvar.botusers['#'+channelname].joined = true;
				bot.join('#'+channelname).then().catch(err => console.log(err));

			}
		}
		else{
			appvar.botusers['#'+channelname].joined = true;
			bot.join('#'+channelname).then().catch(err => console.log(err));

		}
		fs.writeFileSync(
			filepath.botuserspath,
			JSON.stringify(appvar.botusers, null, '\t')
		);
  
	}
	let commandnameCheck = Object.keys(req.body)[1];
	switch (commandnameCheck) {
	case commandnameCheck:
		if(req.body[commandnameCheck] === 'active'){
			appvar.botusers['#'+channelname].commandconfig.allusecommands[commandnameCheck].active = false;
		}
		else if(req.body[commandnameCheck] === 'deactive'){
			appvar.botusers['#'+channelname].commandconfig.allusecommands[commandnameCheck].active = true;
      
		}
		break;
  
	default:
		break;
	}
	
	fs.writeFileSync(
		filepath.botuserspath,
		JSON.stringify(appvar.botusers, null, '\t')
	);
	
	res.redirect('account');
});
app.get('/account', (req, res) => {
	let test = [];
	// when first register user is not in botuser.json
	if (req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		try {
			for (let index = 0; index < scanallusecommands.allusecommands.length; index++) {
				test.push({
					commandname: scanallusecommands.allusecommands[index],
					value: appvar.botusers['#' + users.find(obj => obj.id === req.session.userid).name].commandconfig.allusecommands[scanallusecommands.allusecommands[index]].active === true ? 'active' : 'deactive'
				});
			}
		} catch (error) {
			console.log(error);
		}
		res.render('account', {
			name: users.find(obj => obj.id === req.session.userid).name,
			title: 'Account',
			csrfToken: req.csrfToken(),
			activatebot: !('#' + users.find(obj => obj.id === req.session.userid).name in appvar.botusers) ? 'Add Bot' : appvar.botusers['#' + users.find(obj => obj.id === req.session.userid).name].joined === true ? 'Remove Bot' : 'Add Bot',
			test: test
		});
	} else {
		res.redirect('login');
	}

});
app.get('/user/:channel', (req, res) => {
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		req.params;
		console.log(req.params.channel);
		if ('#' + req.params.channel in appvar.botusers) {
			res.json(appvar.botusers[`#${req.params.channel}`]);
		} else {
			res.status(404);
			res.send('User not exist');
		}
	}
	else{
		res.render('login');
	}
});
app.get('/users', (req, res) => {
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		res.json(Object.keys(appvar.botusers));
		res.end();
	}
	else{
		res.render('login', { csrfToken: req.csrfToken() });
	}
});



startapp();

function startapp() {
	startserver();
	startbot();
}
function startserver(){
	try {
		if (
			fs.existsSync('/etc/letsencrypt/live/krummibot.de/fullchain.pem') &&
          fs.existsSync('/etc/letsencrypt/live/krummibot.de/privkey.pem')
		) {
			const httpsServer = https.createServer(
				{
					key: fs.readFileSync(
						'/etc/letsencrypt/live/krummibot.de/privkey.pem'
					),
					cert: fs.readFileSync(
						'/etc/letsencrypt/live/krummibot.de/fullchain.pem'
					),
				},
				app
			);

			httpsServer.listen(443, () => {
				console.log('HTTPS Server running on port 443');
			});
		} 

		//for local testing 
		else {
			const httpsServer = https.createServer(
				{
					key: fs.readFileSync(
						'./etc/letsencrypt/live/krummibot.de/privkey.pem'
					),
					cert: fs.readFileSync(
						'./etc/letsencrypt/live/krummibot.de/fullchain.pem'
					),
				},
				app
			);

			httpsServer.listen(443, () => {
				console.log('HTTPS Server running on port 443 https://localhost');
			});
		}
	} catch (error) {
		console.error(error);
		startserver();
	}
}

function startbot() {
	try {
		if (
		//path to json database
			fs.existsSync(filepath.botuserspath) &&
      fs.existsSync(filepath.packagepath)
		) {
			let botusersfile = fs.readFileSync(filepath.botuserspath);
			appvar.botusers = JSON.parse(botusersfile);
			let packagefile = fs.readFileSync(filepath.packagepath);
			appvar.package = JSON.parse(packagefile);
		}else {
			fs.writeFileSync('botusers.json', '{}');
			startbot();
		}
	} catch (err) {
		console.error(err);
		startbot();
	}
  
	bot
		.connect()
		.then(() => {
			for (const [key, value] of Object.entries(appvar.botusers)) {
				// shows the value of botusers[key] console.log(appvar.botusers[key]) does the same as console.log(value);
				// key => #channelname etc. console.log(key)
				if(value.allusecommands != scanallusecommands){
					appvar.botusers[key].allusecommands = scanallusecommands.allusecommands;
					fs.writeFileSync(
						filepath.botuserspath,
						JSON.stringify(appvar.botusers, null, '\t')
					);
  
				}
				if(!value.commandconfig){
					appvar.botusers[key].commandconfig = {
          
					};
					fs.writeFileSync(
						filepath.botuserspath,
						JSON.stringify(appvar.botusers, null, '\t')
					);
				}
				if(!appvar.botusers[key].commandconfig.allusecommands){
					appvar.botusers[key].commandconfig.allusecommands = {

					};
				}
				if(!appvar.botusers[key].commandconfig.allusecommands[[scanallusecommands.allusecommands].forEach(element =>{
					for (let i = 0; i < element.length; i++) {
						//console.log(element[i]);
						if(!appvar.botusers[key].commandconfig.allusecommands[element[i]]) {
							appvar.botusers[key].commandconfig.allusecommands[element[i]] = {
								'active': true
							};
						}
						for (let index = 0; index < Object.keys(appvar.botusers[key].commandconfig.allusecommands).length; index++) {
							//console.log(Object.keys(appvar.botusers[key].commandconfig.allusecommands)[index])
							if(element[i] === Object.keys(appvar.botusers[key].commandconfig.allusecommands)[index]){
								//console.log(element[i],Object.keys(appvar.botusers[key].commandconfig.allusecommands)[index]);
								return;
							}
						}
					}
					fs.writeFileSync(
						filepath.botuserspath,
						JSON.stringify(appvar.botusers, null, '\t')
					);
				})]);
          

		
        
				if (value.joined === true) {
					bot
						.join(key)
						.then((data) => {
							//shows which channel was joined
							console.log(data);
							setTimeout(() => {
								bot.say(key, 'Ich bin der von @MrKrummschnabel programmierte Bot! Wenn du mehr darüber erfahren willst schau unter: twitch.tv/mrkrummschnabel vorbei');
							}, 60000*10*4);
						})
						.catch((err) => {
							console.log(err);
						});
					//need when bot gets shutdown on every channel
					appvar.joinedchannel.push(key);
				}
			}
		})
		.catch(()=>{
			console.error;
			startbot();
		});

	bot.on('message', messageHandler);
	bot.on('raided', raidHandler);
}

function raidHandler(channel, raider, viewers) {
	bot.say(channel, `${raider}, raidet mit ${viewers} Menschen oder Maschninen`);
	setTimeout(async () => {
		await bot.say(
			channel, `Schaut mal bei ${raider} vorbei. https://www.twitch.tv/${raider.replace('@', '')}`);
	}, 2000);
}
function messageHandler(channel, userstate, message, self) {
	//id of krummibot // self => for instance
	if(self || userstate['user-id']=== '675332182'){
		return;
	}  
	if (appvar.botusers[channel]) {
		if (!appvar.botusers[channel][userstate['user-id']] ) {
			console.log('user not exist');
			appvar.botusers[channel][userstate['user-id']] = {
				login: userstate['username'],
				poke: {
					list: [],
					catchable: false,
					current: '',
					tries: '',
					actualpoints: '',
					pointstocatch: '',
					runningRound: false,
					lvl: '',
				},
				coins: 0,
			};
		} else {
			appvar.botusers[channel][userstate['user-id']].login = userstate.username;  

		}
		commandHandler.commandHandler(channel, message, userstate, bot, fs);
	} else {
		//commandHandler.commandHandler(channel, message, userstate, bot, fs);
	}
	fs.writeFileSync(
		filepath.botuserspath,
		JSON.stringify(appvar.botusers, null, '\t')
	);
}
