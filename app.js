const tmi = require("tmi.js");
const fs = require("fs");
const objvar = require("./var");
const filepath = require("./path");
const opts = require("./config");
const commandHandler = require("./commandHandler");
const bot = new tmi.client(opts);
const express = require("express");
const https = require("https");
const axios = require("axios");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


prestart();

function prestart() {
  try {
    if (
      fs.existsSync(filepath.botuserspath) &&
      fs.existsSync(filepath.packagepath)
    ) {
      let botusersfile = fs.readFileSync(filepath.botuserspath);
      objvar.botusers = JSON.parse(botusersfile);
      let packagefile = fs.readFileSync(filepath.packagepath);
      objvar.package = JSON.parse(packagefile);
      startbot();
      app.set('./views')
      app.set("view engine", "ejs");
      app.get("/", (req, res) => {
        res.render('home');
      });
      app.get("/login", (req, res) => {
        //if user has acoount login with twitch
        res.render("login");

      });
      app.post("/login", (req, res) => {
        const login = req.body
      if(req.body.email && req.body.password){
        res.send(login)
        req.body = ""
        }
      });
      app.get("/register", (req, res)=>{
        res.send("hier kommt der registerbereich hin")
      });
      app.get("/account", (req, res) => {
        res.render("account");
      });
      app.get("/user/:channel", (req, res) => {
        req.params;
        console.log(req.params.channel);
        if ("#" + req.params.channel in objvar.botusers) {
          res.json(objvar.botusers[`#${req.params.channel}`]);
        } else {
          res.status(404);
          res.send("User not exist");
        }
      });
      app.get("/users/", (req, res) => {
        res.json(Object.keys(objvar.botusers));
        res.end();
      });
      app.get("/messages/:channel", (req, res) => {
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
          res.send("Not listening to channel " + req.params.channel);
        }
      });


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
        prestart();
      }
    } else {
      fs.writeFileSync("botusers.json", "{}");
      prestart();
    }
  } catch (err) {
    console.error(err);
    prestart();
  }
}

function startbot() {
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
    .catch(console.error);

  bot.on("message", messageHandler);
  bot.on("raided", raidHandler);
  bot.on("subscription", subscriptionHandler);
  bot.on("anonsubmysterygift", subscriptionHandler);
}

function subscriptionHandler(channel, username, method, message, userstate) {
  console.log(channel, username, method, message, userstate);
}
function subscriptionHandler(channel, numbOfSubs, methods, userstate) {
  console.log(channel, numbOfSubs, methods, userstate);
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
    userstate.username === "soundalerts" ||
    userstate.username === "streamelements" ||
    userstate.username === "streamlabs"
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
