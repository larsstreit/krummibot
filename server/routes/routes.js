const express = require ('express')
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const appvar = require('../var');
const filepath = require('../path');
const scanallusecommands = require('../allusecommands');
let redUri = 'https://localhost/auth/twitch/callback' || 'https://krummibot.de/auth/twitch/callback';


const login = {
	email: '',
	name: '',
	id: ''
};
let users = [login];

router.get('/', (req, res) => {
	res.render('home');
});

router.get('/faq', (req, res) => {
	res.render('faq');	
});


router.get('/auth/twitch', async (req,res)=>{
	if(!req.session.callTwitchAuth === true && req.session.loggedin === true){
		res.redirect('../../login');
	}
	else{
		let state = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let statetext = '';
		for (let i = 0; i < 30; i++){
  			 statetext += state.charAt(Math.floor(Math.random() * state.length));  
		}
		//get user-acces token (Authorization code grant flow)
		res.redirect(`https://id.twitch.tv/oauth2/authorize?response_type=code&force_verify=true&client_id=${process.env.CLIENT_ID}&redirect_uri=${redUri}&scope=user:read:email&state=${statetext}`);
	}
});
router.get('/auth/twitch/callback', async (req,res)=>{
	try {
		const code = req.query.code;
		//gives back accesstoken data
		let response = await axios({
			method: 'post',
			url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_TOKEN}&code=${code}&grant_type=authorization_code&redirect_uri=${redUri}`
		});
		let validate = await axios({
			method: 'get',
			url: 'https://id.twitch.tv/oauth2/validate',
			headers: {
				'Authorization': 'Bearer ' + response.data.access_token
			}
		});
		console.log(validate.data);

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
		req.session.callTwitchAuth = null;
		res.redirect('../../account');

	} catch (error) {
		res.redirect('../../?error='+error);
	}
});
router.get('/impressum',(req, res)=>{
	res.render('impressum');
});
router.get('/dsgvo',(req, res)=>{
	res.render('dsgvo');
});
router.get('/login', (req, res) => {//provisorische Abfrage ob users exist, da user pushed in array
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		res.redirect('/account');
	}
	else{
		res.render('login', { csrfToken: req.csrfToken() });
	}
});
router.post('/login' , (req, res) => {
	req.session.callTwitchAuth = true;
	res.redirect('../auth/twitch');
});
router.get('/logout', (req,res)=>{
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		req.session.loggedin = null;
		users = [login];
		res.redirect('/?loggedout=true&message=succesfull&logout');
	}
	else{
		res.redirect('/?loggedin=false&message=you&are%not%loggedin');
	}
});
router.get('/loggers', (req, res)=>{
	if(req.session.loggedin && req.session.userid == '536841246' && users.find(obj => obj.id ==  req.session.userid)){
		res.send(users);
	}
	else{
		res.send('you are not permitted');
	}
});
router.get('/user/:channel',(req, res)=>{
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

router.get('/user/:channel/:user/pokemon',  (req, res)=>{
	let botusersfile = fs.readFileSync(filepath.botuserspath);
	appvar.botusers = JSON.parse(botusersfile);
	console.log(req.params);
	if(appvar.botusers['#'+req.params.channel]){
		let user = Object.values(appvar.botusers['#'+req.params.channel]).filter(x=> x.login === req.params.user);
		res.send(`<p>${user[0].poke.list}</p>`);
	}
});


router.post('/account', (req, res)=>{
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
					vips: [],
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
router.get('/account', (req, res) => {
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
router.get('/user/:channel', (req, res) => {
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
router.get('/users', (req, res) => {
	if(req.session.loggedin && users.find(obj => obj.id ==  req.session.userid)){
		res.json(Object.keys(appvar.botusers));
		res.end();
	}
	else{
		res.render('login', { csrfToken: req.csrfToken() });
	}
});
module.exports = router