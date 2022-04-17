require('dotenv').config();
module.exports =  {
	options: {
		debug: true,
		messagesLogLevel: 'info'
	},
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.BOT_NAME,
		password: process.env.BOT_OAUTH 
	},
	//channels: ["tinylittlestudio"]
};