require('dotenv').config();

const wsClient = require('./wsClient')
const testBot = new wsClient({
	botname: process.env.BOT_NAME,
	oauth: process.env.BOT_OAUTH,
	channels: ""
})

testBot.connect().then(
	setTimeout(() => {
		testBot.join('#mrkrummschnabel').catch(err=> console.log(err))
	}, 6000),
    setTimeout(() => {
        testBot.say('#mrkrummschnabel', 'test')
    }, 8000)
	
);