const tmi = require("tmi.js");
const fs = require("fs");
const objvar = require("./var");
const filepath = require("./path");
const opts = require("./botconfig");
const commandHandler = require("./commandHandler");
const bot = new tmi.client(opts);
const express = require("express");
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require("helmet");
const https = require("https");
const cookieParser = require("cookie-parser");
const escape = require('escape-html');
var csrf = require('csurf')
const csrfProtection = csrf({ cookie: true })

const app = express();
const session = require('express-session');

app.use(cookieParser());

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
  cookie: { secure: true }
}));

app.use(csrfProtection)
app.use(morgan('tiny'));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('./views')
app.set("view engine", "ejs");
const login = {
  email: "admin@admin",
  name: "MrKrummschnabel",
  password: process.env.ADMIN_PASSWORD
}
var users = [login];
app.get("/", (req, res) => {
  res.render('home');
});
app.get("/login",csrfProtection, (req, res) => {
  //if user has acoount login with twitch
  res.render("login",{ csrfToken: req.csrfToken() });

});
app.post("/login" , (req, res) => {
  if (users.find(obj => obj.email === req.body.email) && users.find(obj => obj.password === req.body.password) ){
    		// Execute SQL query that'll select the account from the database based on the specified username and password
				// Authenticate the user
				req.session.loggedin = true;
				req.session.email = users.find(obj => obj.email === req.body.email).email ;
				// Redirect to home page
				res.redirect('/account');
			} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});
app.get("/logout", (req,res)=>{
  if(req.session.loggedin){
    req.session.loggedin = null
    res.send("loged out")
    res.end()
  }
  else{
    res.send('you are not logged in')
  }
})
app.get("/register",csrfProtection, (req, res)=>{
  res.render("register")
});
app.post("/register" , (req, res)=>{
  req.session.loggedin = true;
  req.session.email = req.body.email
  if(users.find(obj => obj.email === req.body.email)){
    res.send("email already existing")
  }
  else{
    temp= {
        email: req.body.email,
        name: req.body.twitchname,
        password: req.body.password
      
    }
    users.push(temp)
    res.redirect("account")
  }
})
app.get("/loggers", (req, res)=>{
  if(req.session.loggedin && req.session.email === "admin@admin"){
    res.send(users)
  }
  else{
    res.send("you are not permitted")
  }
})
app.get("/account", (req, res) => {
  if(req.session.loggedin){
    res.render("account", {name: users.find(obj => obj.email === req.session.email).name})
  }
  else{
    res.render("login")
  }
});
app.get("/user/:channel", (req, res) => {
  if(req.session.loggedin){
    req.params;
    console.log(req.params.channel);
    if ("#" + req.params.channel in objvar.botusers) {
      res.json(objvar.botusers[`#${req.params.channel}`]);
    } else {
      res.status(404);
      res.send("User not exist");
    }
  }
  else{
    res.render("login")
  }
});
app.get("/users/", (req, res) => {
  if(req.session.loggedin){
    res.json(Object.keys(objvar.botusers));
    res.end();
  }
  else{
    res.render("login")
  }
});
app.get("/messages/:channel", (req, res) => {
  if(req.session.loggedin){
    var params = escape(req.params.channel)
    // TODO: using twitch api to check if channel is online otherwise to much data in arrays 'element'
    if (bot.getChannels().includes("#" + req.params.channel)) {
      let element = [];
      if (objvar.messages.length == 0) {
        res.send(element);
      } else {
        for (let i = 0; i < objvar.messages.length; i++) {
          if (objvar.messages[i].channel == "#" + req.params.channel) {
            element.push({
              username: objvar.messages[i].user,
              message: objvar.messages[i].message,
            });
          }
        }
        res.send(element);
      }
    } else {
      res.send("Not listening to channel " + params);
    }
  }
  else{
    res.render("login")
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
          fs.existsSync("/etc/letsencrypt/live/krummibot.de/fullchain.pem") &&
          fs.existsSync("/etc/letsencrypt/live/krummibot.de/privkey.pem")
        ) {
          const httpsServer = https.createServer(
            {
              key: fs.readFileSync(
                "/etc/letsencrypt/live/krummibot.de/privkey.pem"
              ),
              cert: fs.readFileSync(
                "/etc/letsencrypt/live/krummibot.de/fullchain.pem"
              ),
            },
            app
          );

          httpsServer.listen(443, () => {
            console.log("HTTPS Server running on port 443");
          });
        } 

        //for local testing 
        else {
          const httpsServer = https.createServer(
            {
              key: fs.readFileSync(
                "./etc/letsencrypt/live/krummibot.de/privkey.pem"
              ),
              cert: fs.readFileSync(
                "./etc/letsencrypt/live/krummibot.de/fullchain.pem"
              ),
            },
            app
          );

          httpsServer.listen(443, () => {
            console.log("HTTPS Server running on port 443");
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
      objvar.botusers = JSON.parse(botusersfile);
      let packagefile = fs.readFileSync(filepath.packagepath);
      objvar.package = JSON.parse(packagefile);
    }else {
      fs.writeFileSync("botusers.json", "{}");
      startapp();
    }
  } catch (err) {
    console.error(err);
    startapp();
  }
  
  bot
    .connect()
    .then(() => {
      for (const [key, value] of Object.entries(objvar.botusers)) {
        // shows the value of botusers[key] console.log(objvar.botusers[key]) does the same as console.log(value);
        // key => #channelname etc. console.log(key)
        if (value.joined === true) {
          bot
            .join(key)
            .then((data) => {
              //shows which channel was joined
              console.log(data);
              setTimeout(() => {
                bot.say(key, 'Ich bin der von @MrKrummschnabel programmierte Bot! Wenn du mehr darüber erfahren willst schau unter: twitch.tv/mrkrummschnabel vorbei')
              }, 60000*10*4);
            })
            .catch((err) => {
              console.log(err);
            });
          //need when bot gets shutdown on every channel
          objvar.joinedchannel.push(key);
        }
      }
    })
    .catch(()=>{
      console.error
      startbot()
    });

  bot.on("message", messageHandler);
  bot.on("raided", raidHandler);
  bot.on("subscription", subscriptionHandler);
  bot.on("anonsubmysterygift", subscriptionHandler);
}

function subscriptionHandler(channel, username, method, message, userstate) {
  console.log(channel, username, method, message, userstate);
}
function raidHandler(channel, raider, viewers) {
  bot.say(channel, `${raider}, raidet mit ${viewers} Flamingos`);
  setTimeout(async () => {
    await bot.say(
      channel, `Schaut mal bei ${raider} vorbei. https://www.twitch.tv/${raider.replace("@", "")}`)
  }, 2000);
}
function messageHandler(channel, userstate, message, self) {  
  if (
    self ||
    userstate.username === "streamelements" 
  )
    return;
  if (objvar.botusers[channel]) {
    if (!objvar.botusers[channel][userstate["user-id"]]) {
      console.log("user not exist");
      objvar.botusers[channel][userstate["user-id"]] = {
        login: userstate["username"],
        poke: {
          list: [],
          catchable: false,
          current: "",
          tries: "",
          actualpoints: "",
          pointstocatch: "",
          runningRound: false,
          lvl: "",
        },
        schnabelcoins: 0,
      };
    } else {
      objvar.botusers[channel][userstate["user-id"]].login = userstate.username;
    }
    commandHandler.commandHandler(channel, message, userstate, bot, fs);
  } else {
    commandHandler.commandHandler(channel, message, userstate, bot, fs);
  }
  fs.writeFileSync(
    filepath.botuserspath,
    JSON.stringify(objvar.botusers, null, "\t")
  );
  objvar.messages.push({
    channel: channel,
    user: userstate.username,
    message: message,
  });
}
