
/*

	dodgeball v2
	by H
	
	haha yes



	TODO:
	put same-site on cookies

*/




/* Requires */



const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const fs = require('fs');
const socketio = require('socket.io');


/* Config */


var levelOfFeedback = 4;

/*
	Level of feedback determines what gets sent to the console.
	LOF 4 sends everything
	LOF>3 sends logs
	LOF>2 sends warns
	LOF>1 sends errors
	LOF>0 sends info
*/

var analyticsCookieName = 'analytics cookie - only used for unique visitor count.';
var dontShowConsentCookie = "Don't show consent question";

/* Variables */

var visits = 0;
var uniqueVisitors = 0;
var port;
var isRoot = (process.getuid && (process.getuid() === 0));

/* Module setup */

var app = express();
var staticFiles = express.static("public");
var urlencoded = bodyParser.urlencoded({ extended: true });
app.use(cookieParser());
app.use(expressLayouts);
app.set("view engine", "ejs");
app.use(urlencoded);
app.use(staticFiles);

/* Set up console input */
var stdin = process.openStdin();
stdin.addListener('data',function(d) {
	try {
		console.log(eval(d.toString()));
	} catch(e) {
		console.error(e);
	}
});

/* Copy/paste of a function that hasn't been initialized yet. */
if (levelOfFeedback > 0) {
	console.info("[info]  [" + Date().substring(16, 24) + "] Setting up server... ");
}

if (isRoot) {
	var server = app.listen(80, onStartup);
	port = 80;
} else {
	var server = app.listen(process.env.PORT, onStartup);
	port = process.env.PORT;
}



/* Debug functions */

var con = {
	"log": function(a, b) { if (levelOfFeedback > 3) { 	console.log(	"[log]   [" + Date().substring(16, 24) + "] " + a); } },
	"warn": function(a) { if (levelOfFeedback > 2) { 	console.warn(	"[warn]  [" + Date().substring(16, 24) + "] " + a);} },
	"error": function(a) { if (levelOfFeedback > 1) { 	console.error(	"[error] [" + Date().substring(16, 24) + "] " + a);} },
	"info": function(a) { if (levelOfFeedback > 0) { 	console.info(	"[info]  [" + Date().substring(16, 24) + "] " + a); } }
}


/* end of copy/paste nodemailer example */

/* Other functions */

function onStartup() {
	con.info(`Server started at ${server.address().address}:${server.address().port}`);
	con.info("Working directory is " + process.cwd() + "/");
	con.info("Server is located at " + __dirname + "/");
}

const io = socketio.listen(server);

/* just blatantly stealing from the ejs utils file */
var _ENCODE_HTML_RULES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;'
};
var _MATCH_HTML = /[&<>'"]/g;

function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
}

/* done stealing :) */

function encodeHTML(a) {

	if (a !== String) {
		a = "" + a;
	}	
	
	var x = "";
	
	a.split("").forEach((b) => {
		x+=encode_char(b);
	});
	
	return x;
	
}

function createErrorPage(e) {
	// page is directly in the server.js file in case fs operations are the issue
return `
<html>
	<head>
		<meta charset="utf-8">
		<title>whoops</title>
		<style>
			#flex1 {
				width: 100vw;
				height: 100vh;
				position: fixed;
				left: 0;
				right: 0;
				top: 0;
				bottom: 0;
				display: flex;
				align-items: center;
				background-color: lightgrey;
				font-family: sans-serif;
			} 
		
			#flex2 {
				width: 100vw;
				display: flex;
				align-items: center;
				flex-direction: column;
			}
	
			#container {
				text-align: center;
				background-color: white;
				padding: 3vw;
				border-radius: 2vw;
			}
			
			#data {
				background-color:lightgray;
				color:black;
				border-radius: 20px;
				min-height: 15vh;
				max-height: 60vh;
				max-width: 50vw;
				text-align: left;
				padding: 10px;
				font-family: monospace;
				overflow-y: scroll;
				overflow-x: hidden;
				white-space: pre-line;
			}


		</style>
	</head>
	<body>
		<div id="flex1">
			<div id="flex2">
				<div id="container">
					<h1><u>bruh momento</u></h1>
					<h2>something went wrong and it's not your fault</h2>
					<h5>(error code 500: internal server error)</h5>
					<h3>error data:</h3>
					<div id="data">
						${encodeHTML(e.toString().replace(/hugh/g, 'hucario'))}
					</div>
				</div>
			</div>
		</div>
	</body>
</html>`;

}


function ezRoute(name, path, obj) {
	con.log("[ezRoute] setup " + name + " from view " + path);

	app.get(name, function(req, res) {
		latestreq = req;
		con.log("[ezRoute] Was asked for '" + path + "'")
		try {
			wrappedRender(req, res, path, obj);
		} catch(e) {
			console.log(`[ezRoute] ${name} (${path}) experienced an error: `, e);
			res.status(500).send(createErrorPage(e));
		}
	});
}
let latestreq;
function wrappedRender(req, res, path, obj) {
	if (!obj) {
		obj = {};
	}
	visits++;
	let showConsentQuestion = false;
	if (req.cookies && req.cookies[dontShowConsentCookie] == undefined) {
		showConsentQuestion = true;
		res.cookie(dontShowConsentCookie, true, {'Max-Age': Date.now() + 18144000000}); // 1 month
	}
	
	obj.showConsentQuestion = (obj.showConsentQuestion!=undefined?obj.showConsentQuestion:showConsentQuestion);
	res.render(path, obj);
}


function exit(a) {
	console.log('exit() has been called.  exit code: '+a);
	console.log('trace: ');
	console.trace();
	process.exit();
}

/* Socketio */

var gamers = [] // gaming

var gameSettings = {
	screenRatio: 1 // height * screenRatio = width
}

io.on('connect', (socket) => {
	let thisSocketUser = {
		socket: socket,
		isFirstJoin: (gamers.length==0),
		position: {
			x: 0,
			y: 0
		},
		velocity: {
			x: 0,
			y: 0
		},
		name: 'gamer '+Math.floor(Math.random()*10),
		id: gamers.length,
		connected: true,
		hasBroadcastDisconnect: false
	}

	socket.emit('you are', thisSocketUser.id)
	if (thisSocketUser.isFirstJoin) {
		socket.on('IHAVETHEPOWER', (d) => {
			// I refuse to take anything seriously
			if (!NaN(d)) {
				gameSettings.screenRatio = d;
			}
		})
	}
	socket.emit('game settings for ya', {
		screenRatio: gameSettings.screenRatio
	})

	socket.on('mypos', (position, velocity) => {
		thisSocketUser.velocity = velocity;
		thisSocketUser.position = position;
		if (thisSocketUser.velocity.x < -175) {
			thisSocketUser.velocity.x = -175;
		}
		if (thisSocketUser.velocity.x > 175) {
			thisSocketUser.velocity.x = 175;
		}
		if (thisSocketUser.velocity.y < -175) {
			thisSocketUser.velocity.y = -175;
		}
		if (thisSocketUser.velocity.y > 175 ) {
			thisSocketUser.velocity.y = 175;
		}
		
	});
	socket.on('namechange', (name) => {
		name = name.substring(0, 12);
		thisSocketUser.name = name;
	})
	socket.on('disconnect', () => {
		thisSocketUser.connected = false;
		thisSocketUser.hasBroadcastDisconnect = false;
	})

	gamers.push(thisSocketUser);
});


setInterval(() => {
	let temp;
	for (let i = 0; i < gamers.length; i++) {
		temp = [];
		for (let b = 0; b < gamers.length; b++) {
			if (gamers[b].id != gamers[i].id) {
				if (gamers[b].connected) {
					temp.push({
						position: gamers[b].position,
						velocity: gamers[b].velocity,
						name: gamers[b].name,
						connected: true
					})
				} else if (!gamers[b].hasBroadcastDisconnect) {
					temp.push({
						position: gamers[b].position,
						velocity: gamers[b].velocity,
						name: gamers[i].name,
						connected: false
					})
					if (i == gamers.length-1) {
						gamers[b].hasBroadcastDisconnect = true;
					}
				}
				gamers[i].socket.emit('players', temp)
			}
		}
	}
}, 50)

/* Routing */

ezRoute('/', 'index');
ezRoute('/500', '500error');
app.get('/consent/trackme', (req,res) => {
	res.cookie(analyticsCookieName,Math.random());
	uniqueVisitors++;
	res.send('Thanks :)');
});

/* 404s */

app.post('*', function(req, res) {
	res.status(404).send();
})

app.get('*', (req, res) => {
	wrappedRender(res.status(404), res, '404');
});

/* Event Listening */

process.on('exit', () => {
	console.info('Server has stopped.');
});



