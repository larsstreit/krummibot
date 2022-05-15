const parser = require('./parser')
const ws = require('ws')
class client {
    constructor(opts){
        this.botname = opts.botname,
        this.oauth = opts.oauth,
        this.channels = opts.channels
    }
    openConn(){
    const url = 'wss://irc-ws.chat.twitch.tv:443/';
    this.ws = new ws(url, 'irc')
    this.ws.onmessage = this.onMessage.bind(this);
	this.ws.onerror = this.onError.bind(this);
	this.ws.onclose = this.onClose.bind(this);
	this.ws.onopen = this.onOpen.bind(this);
    }
    onError(message){
        console.log("error: "+ message);
    }
    onOpen(){
	if(!this.isConnected()) {
		return;
	}


	console.log('Connecting and authenticating...');	
	this.ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
	this.ws.send('PASS ' + this.oauth);
	this.ws.send('NICK ' + this.botname);
	this.ws.send('JOIN ' + this.channels);
		
		
    }
	isConnected (){
		return this.ws !== null && this.ws.readyState === 1;
	}
    onClose(){
        console.log('Disconnected from the chat server.');
    };
    close(){
        if(this.ws){
            this.ws.close();
        }
    };
	async join(channel) {
		this.ws.send('JOIN '+channel)
	}
	disconnect() {
		return new Promise((resolve, reject) => {
			if(this.ws !== null && this.ws.readyState !== 3) {
				this.wasCloseCalled = true;
				this.log.info('Disconnecting from server..');
				this.ws.close();
				this.ws.once('_promiseDisconnect', () => resolve([ 'disconn', 'discoon']));
			}
			else {
				this.log.error('Cannot disconnect from server. Socket is not opened or connection is already closing.');
				reject('Cannot disconnect from server. Socket is not opened or connection is already closing.');
			}
		});
	};
    connect(){

		return new Promise((resolve, reject) => {
	
			this.openConn();
		});

    }
	promiseDelay =  function( time ){ return new Promise(resolve => setTimeout(resolve, time))}
	getPromiseDelay() {
		return 600; 
	};
	say(channel, message) {
		if(!this.isConnected()){
			return
		}
		this.ws.send('PRIVMSG '+channel+' :'+message)
	}


    onMessage(message){
        
        //console.log(message.data);
        if (message.data) {
			let rawMessage = message.data.trimEnd();
			console.log(`Message received (${new Date().toISOString()}): '${rawMessage}'\n`);

			let messages = rawMessage.split('\r\n');  // The IRC message may contain one or more messages.
			messages.forEach(message => {
				let parsedMessage = parser.parseMessage(message, rawMessage);
            
				if (parsedMessage) {
					//console.log(`Message command: ${parsedMessage.command.command}`);
					console.log(`\n${JSON.stringify(parsedMessage, null, 3)}`);

					switch (parsedMessage.command.command) {
					case 'PRIVMSG':
						//console.log(parsedMessage.command.botCommand);
						switch(parsedMessage.parameters){
						case '!clear':
							this.ws.send(`PRIVMSG ${parsedMessage.command.channel} :/clear`)
							break;
						case '!hilfe': 
							this.ws.send(`@reply-parent-msg-id=${parsedMessage.tags.id} PRIVMSG ${parsedMessage.command.channel} :Wobei brauchst du Hilfe?`);
							break;
						default:
							break;
						}
                            
						break;
					case 'CLEARMSG':
						//what for?
				
							
						break;
					case 'WHISPER':
						//what for?
				
							
						break;
					case 'CLEARCHAT':
						console.log("cleared", parsedMessage);
						break;
					case 'PING':
						this.ws.send('PONG ' + parsedMessage.parameters);
						break;
					case '001':
						// Successfully logged in, so join the channel.
						this.ws.send(`JOIN ${this.channels}`); 
						break; 
					case 'JOIN':				
						break;
					case 'PART':
						console.log('parted');
						break;
					case 'USERSTATE':
						break;
					case 'ROOMSTATE':
						console.log("Roomstate", parsedMessage);
						break;
					case 'USERNOTICE':
						if(parsedMessage.tags['msg-id']){
							switch(parsedMessage.tags['msg-id']){
								case 'subgift':
								case 'sub':
								case 'giftpaidupgrade':
								case 'rewardgift':
								case 'anongiftpaidupgrade':
								case 'resub':
									console.log('subscription', parsedMessage.tags)
									break;
								case 'raid':
								case 'unraid':
									console.log('raid', parsedMessage.tags)
									break;
								case 'ritual':
									console.log('Ritual', parsedMessage.tags)
									break;
							}
						}

						break;
					case 'NOTICE': 
						// If the authentication failed, leave the channel.
						// The server will close the connection.
						if ('Login authentication failed' === parsedMessage.parameters) {
							console.log(`Authentication failed; left ${wsschannel}`);
							this.ws.send(`PART ${this.channels}`);
						}
						else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
							console.log(`No permission. Check if the access token is still valid. Left ${wsschannel}`);
							this.ws.send(`PART ${this.channels}`);
						}
						break;
					default:
						break; // Ignore all other IRC messages.
					}
				}
			});
		}
    };
}

module.exports = client