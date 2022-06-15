/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-case-declarations */
const axios = require('axios');
const tmi = require('tmi.js');
const botfunctions = require('./functions');
const fs = require('fs');
const appvar = require('./var');
const filepath = require('./path');
const opts = require('./botconfig');
const commandHandler = require('./commandHandler');
const bot = new tmi.client(opts);
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const https = require('https');
const cookieParser = require('cookie-parser');
const app = express();
const session = require('express-session');
const cors = require('cors');
const scanallusecommands = require('./allusecommands');
const RateLimit = require('express-rate-limit');
const limiter =  RateLimit({
	windowMs: 15*60*1000, // 15 minute
	max: 100
});
const csrf = require('csurf');
const routes = require('./routes/routes')

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


app.use('/', routes);

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
  
	bot.connect()
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
				if(!value.vips){
					appvar.botusers[key].vips = []
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
	console.log(raider);
	bot.say(channel, `${raider}, raidet mit ${viewers} Viewern`);
	setTimeout(async () => {
		await botfunctions.getTwitchApiData([{channel,raider},'RAID',bot])	
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


