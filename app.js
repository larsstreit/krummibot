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
//const escape = require('escape-html');
const app = express();
const session = require('express-session');
const cors = require('cors');
const redUri = 'https://localhost/auth/twitch/callback' || 'https://www.krummibot.de/auth/twitch/callback';
const scanallusecommands = require('./allusecommands');
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
	windowMs: 15 * 60 * 1000, // 15 minute
	max: 100
});
const csrf = require('csurf');
//app settings

app.set('./views');
app.set('view engine', 'ejs');

app.use('/styles', express.static(__dirname + '/styles'));

app.use(limiter);
app.use(cookieParser());

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: true
	}
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));

app.use(csrf({
	cookie: true
}));

app.use(morgan('tiny'));
app.use(helmet());
app.use(function (req, res, next) {
	res.setHeader(
		'Content-Security-Policy', 'default-src \'self\'; script-src \'self\'; style-src \'self\'; font-src \'self\'; img-src \'self\'; frame-src \'self\''
	);
	next();
});

let login = {
	email: '',
	name: '',
	id: ''
};
let users = [login];

app.get('/', (req, res) => {
	res.render('home');

});
app.get('/auth/twitch', async (req, res) => {
	res.redirect(`https://id.twitch.tv/oauth2/authorize?response_type=code&force_verify=true&client_id=${process.env.CLIENT_ID}&redirect_uri=${redUri}&scope=user:read:email&state=`);

});
app.get('/auth/twitch/callback', async (req, res) => {
	let code = req.query.code;
	try {
		let response = await axios({
			method: 'post',
			url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_TOKEN}&code=${code}&grant_type=authorization_code&redirect_uri=${redUri}`
		});

		let login = await axios({
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


		let temp = {
			id: login.data.data[0].id,
			email: login.data.data[0].email,
			name: login.data.data[0].login
		};

		users.push(temp);
		console.log(users.find(obj => obj.id == req.session.userid).name);
		res.redirect('../../account');
	} catch (error) {
		res.redirect('../../?error=' + error);
	}
});
app.get('/impressum', (req, res) => {
	res.render('impressum');
});
app.get('/dsgvo', (req, res) => {
	res.render('dsgvo');
});
app.get('/login', (req, res) => {
	if (req.session.loggedin) {
		res.redirect('/account');
	} else
		res.render('login', {
			csrfToken: req.csrfToken()
		});
});
app.post('/login', (req, res) => {
	res.redirect(`https://id.twitch.tv/oauth2/authorize?response_type=code&force_verify=true&client_id=${process.env.CLIENT_ID}&redirect_uri=${redUri}&scope=user:read:email`);
});
app.get('/logout', (req, res) => {
	if (req.session.loggedin) {
		req.session.loggedin = null;
		res.send('loged out');
		users = [login];
		res.end();
	} else {
		res.send('you are not logged in');
	}
});
app.get('/loggers', (req, res) => {
	if (req.session.loggedin && req.session.userid == '536841246') {
		res.send(users);
	} else {
		res.send('you are not permitted');
	}
});
app.post('/account', (req, res) => {
	let channelname = users.find(obj => obj.id == req.session.userid).name;
	let sessionId = appvar.botusers[`${'#'+channelname}`];

	if (req.body.activatebot) {
		if (req.body.activatebot === 'Remove Bot') {
			sessionId.joined = false;
			bot.part('#' + channelname).then().catch(err => console.log(err));
		} else if (req.body.activatebot === 'Add Bot') {
			if (!(`${'#'+users.find(obj => obj.id ===  req.session.userid).name}` in appvar.botusers)) {
				sessionId = {
					joined: true,
					channelcommands: {},
					allusecommands: scanallusecommands.allusecommands,
					commandconfig: {
						allusecommands: {

						}
					}
				};
				sessionId.commandconfig.allusecommands[[scanallusecommands.allusecommands].forEach(element => {
					console.log(element);
					for (let i = 0; i < element.length; i++) {
						if (!sessionId.commandconfig.allusecommands[element[i]]) {
							sessionId.commandconfig.allusecommands[element[i]] = {
								'active': true
							};
						}
					}
				})];

				setTimeout(async () => {
					await bot.say(`${'#'+users.find(obj => obj.id ===  req.session.userid).name}`, 'Ist es für dich okay, das mit !krummi für @MrKrummschnabel und nach 40min Werbung für den Bot gemacht wird? Wenn nicht verwende !removekrummi in deinem Chat um den Bot zu entfernen! Vielen Dank für deine Unterstützung');
				}, 2000);
				bot.join('#' + channelname).then().catch(err => console.log(err));
			} else {
				sessionId.joined = true;
				bot.join('#' + channelname).then().catch(err => console.log(err));

			}
		} else {
			sessionId.joined = true;
			bot.join('#' + channelname).then().catch(err => console.log(err));

		}
		fs.writeFileSync(
			filepath.botuserspath,
			JSON.stringify(appvar.botusers, null, '\t')
		);


	}
	else {
		if(appvar.botusers['#' + users.find(obj => obj.id === req.session.userid).name].commandconfig.allusecommands[Object.keys(req.body)[1]].active === true) {
			appvar.botusers['#' + users.find(obj => obj.id === req.session.userid).name].commandconfig.allusecommands[Object.keys(req.body)[1]].active = false;

		}
		else{
			appvar.botusers['#' + users.find(obj => obj.id === req.session.userid).name].commandconfig.allusecommands[Object.keys(req.body)[1]].active = true;	
		}
		fs.writeFileSync(
			filepath.botuserspath,
			JSON.stringify(appvar.botusers, null, '\t')
		);
	}
	res.redirect('account');
});
app.get('/account', (req, res) => {
	let test = [];
	// when first register user is not in botuser.json
	if (req.session.loggedin) {
		for (let index = 0; index < scanallusecommands.allusecommands.length; index++) {
			test.push({
				commandname: scanallusecommands.allusecommands[index],
				value: appvar.botusers['#' + users.find(obj => obj.id === req.session.userid).name].commandconfig.allusecommands[scanallusecommands.allusecommands[index]].active === true ? 'active' : 'deactive'
			});
			
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
	if (req.session.loggedin) {
		req.params;
		console.log(req.params.channel);
		if ('#' + req.params.channel in appvar.botusers) {
			res.json(appvar.botusers[`#${req.params.channel}`]);
		} else {
			res.status(404);
			res.send('User not exist');
		}
	} else {
		res.render('login');
	}
});
app.get('/users/', (req, res) => {
	if (req.session.loggedin) {
		res.json(Object.keys(appvar.botusers));
		res.end();
	} else {
		res.render('login');
	}
});



startapp();

function startapp() {
	startserver();
	startbot();
}

function startserver() {
	try {
		if (
			fs.existsSync('/etc/letsencrypt/live/krummibot.de/fullchain.pem') &&
      fs.existsSync('/etc/letsencrypt/live/krummibot.de/privkey.pem')
		) {
			const httpsServer = https.createServer({
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
			const httpsServer = https.createServer({
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
		} else {
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
				if (value.allusecommands != scanallusecommands) {
					appvar.botusers[key].allusecommands = scanallusecommands.allusecommands;
					fs.writeFileSync(
						filepath.botuserspath,
						JSON.stringify(appvar.botusers, null, '\t')
					);

				}
				if (!value.commandconfig) {
					appvar.botusers[key].commandconfig = {

					};
					fs.writeFileSync(
						filepath.botuserspath,
						JSON.stringify(appvar.botusers, null, '\t')
					);
				}
				if (!appvar.botusers[key].commandconfig.allusecommands) {
					appvar.botusers[key].commandconfig.allusecommands = {

					};
				}
				if (!appvar.botusers[key].commandconfig.allusecommands[[scanallusecommands.allusecommands].forEach(element => {
					//console.log(element);
					for (let i = 0; i < element.length; i++) {
						if (!appvar.botusers[key].commandconfig.allusecommands[element[i]]) {
							appvar.botusers[key].commandconfig.allusecommands[element[i]] = {
								'active': true
							};
						}
					}
				})]);
				fs.writeFileSync(
					filepath.botuserspath,
					JSON.stringify(appvar.botusers, null, '\t')
				);

				if (value.joined === true) {
					bot
						.join(key)
						.then((data) => {
							//shows which channel was joined
							console.log(data);
							setTimeout(() => {
								bot.say(key, 'Ich bin der von @MrKrummschnabel programmierte Bot! Wenn du mehr darüber erfahren willst schau unter: twitch.tv/mrkrummschnabel vorbei');
							}, 60000 * 10 * 4);
						})
						.catch((err) => {
							console.log(err);
						});
					//need when bot gets shutdown on every channel
					appvar.joinedchannel.push(key);
				}
			}
		})
		.catch(() => {
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
	if (self) {
		return;
	}
	if (appvar.botusers[channel]) {
		if (!appvar.botusers[channel][userstate['user-id']]) {
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
		commandHandler.commandHandler(channel, message, userstate, bot, fs);
	}
	fs.writeFileSync(
		filepath.botuserspath,
		JSON.stringify(appvar.botusers, null, '\t')
	);
	appvar.messages.push({
		channel: channel,
		user: userstate.username,
		message: message,
	});
}