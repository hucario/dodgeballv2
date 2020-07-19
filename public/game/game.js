var gameSettings = {
	screenRatio: 1,
}

var socket = io();
socket.on('game settings for ya', (d) => {
	gameSettings.screenRatio = d.screenRatio;
})
socket.on('you are', id => {
	myPlayer.id = id;
})
var playersById = {

}
socket.on('players', (d) => {
	for (let i = 0; i < d.length; i++) {
		if (myPlayer.id && d[i].id == myPlayer.id) {
			Matter.World.remove(engine.world, playersById[d[i].id].body)
			Matter.World.remove(engine.world, playersById[d[i].id].nameElem)
			continue;
		}
		if (d[i].connected == false && playersById[d[i].id]) {
			Matter.World.remove(engine.world, playersById[d[i].id].body)
			Matter.World.remove(engine.world, playersById[d[i].id].nameElem)
			console.log('removed '+d[i].name, d[i])
			continue
		}
		if (!playersById[d[i].id]) {
			playersById[d[i].id] = new Player(d[i].position.x, d[i].position.y, d[i].velocity, d[i].name)
		} else {
			Matter.Body.setVelocity(playersById[d[i].id].body, d[i].velocity);
			Matter.Body.setPosition(playersById[d[i].id].body, d[i].position);
		}
	}
})


var field = document.getElementById('field');

var Engine = Matter.Engine,
	Render = Matter.Render,
	Runner = Matter.Runner,
	Events = Matter.Events,
	Composites = Matter.Composites,
	Common = Matter.Common,
	Constraint = Matter.Constraint,
	MouseConstraint = Matter.MouseConstraint,
	Mouse = Matter.Mouse,
	World = Matter.World,
	Vector = Matter.Vector,
	Bounds = Matter.Bounds,
	Bodies = Matter.Bodies;


// create an engine
var engine = Engine.create();

// create a renderer

gameSettings.width = window.innerHeight * gameSettings.screenRatio;
gameSettings.height = window.innerHeight;

var render = Render.create({
	element: document.getElementsByClassName('main')[0],
	canvas: document.getElementById('field'),
	engine: engine,
	options: {
		width: gameSettings.width,
		height: gameSettings.height,
		pixelRatio: 1,
		showVelocity: true, 
        wireframes: false,
		hasBounds: true
	}
});



engine.world.gravity.y = 0;

var mouse = Mouse.create(render.canvas),
mouseConstraint = MouseConstraint.create(engine, {
	mouse: mouse,
	constraint: {
		stiffness: 0.2,
		render: {
			visible: true
		}
	}
});

Events.on(engine, 'afterUpdate', function(event) {
	for (let i = 0; i < players.length; i++) {
		Matter.Body.setPosition(players[i].nameElem, { 
			x: players[i].body.position.x,
			y: players[i].body.position.y - 80
		})
	}
	var translate = {
		x: myPlayer.body.velocity.x,
		y: myPlayer.body.velocity.y
	};
	if (activeKeys["ArrowLeft"] || activeKeys["a"]) {
		translate = {
			x: translate.x-myPlayer.moveSpeed,
			y: translate.y
		}
	}
	if (activeKeys["ArrowRight"] || activeKeys["d"]) {
		translate = {
			x: translate.x+myPlayer.moveSpeed,
			y: translate.y
		}
	}
	if (activeKeys["ArrowDown"] || activeKeys["s"]) {
		translate = {
			x: translate.x,
			y: translate.y+myPlayer.moveSpeed
		}
	}
	if (activeKeys["ArrowUp"] || activeKeys["w"]) {
		translate = {
			x: translate.x,
			y: translate.y-myPlayer.moveSpeed
		};
	}
	Matter.Body.setVelocity(myPlayer.body, translate)
})

setInterval(() => {
	socket.emit('mypos', myPlayer.body.position, myPlayer.body.velocity)
}, 50)

World.add(engine.world, mouseConstraint);

class Player {
	constructor(x, y, v={x: 0, y: 0}, name="gamer "+Math.floor(Math.random()*50)) {


		this.moveSpeed = 1.5;
		this.name = name;
		this.x = x;
		this.y = y;
		this.body = Matter.Bodies.circle(x, y, 50);
		Matter.Body.setVelocity(this.body, v)
		this.nameElem = Bodies.rectangle(x, y - 80, 400, 60, {
			render: {
				sprite: {
					texture: text(name),
					xScale: 1,
					yScale: 1
				}
			}
		})
		this.body.frictionAir = 0.1;
		this.nameElem.collisionFilter = {
			'group': -1,
			'category': 2,
			'mask': 0,
		};
		World.add(engine.world, [
			this.body,
			this.nameElem
		]);
		players.push(this);
	}
}

var players = [

]

var myPlayer = new Player(gameSettings.width/2, gameSettings.height/2, {x: 0, y: 0}, "Me");

addEventListener('keydown', (e) => {
	activeKeys[e.key] = true;
})
addEventListener('keyup', (e) => {
	activeKeys[e.key] = false;
})

var activeKeys = {}

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(450, 50, 80, 80);




// add all of the bodies to the world
World.add(engine.world, [
	boxA,
	boxB,
	Bodies.rectangle(gameSettings.width/2, gameSettings.height - 15, gameSettings.width, 30, { isStatic: true }),
	Bodies.rectangle(15, gameSettings.height/2, 30, gameSettings.height, { isStatic: true}),
	Bodies.rectangle(gameSettings.width - 15, gameSettings.height / 2, 30, gameSettings.height, { isStatic: true }),
	Bodies.rectangle(gameSettings.width/2, 15, gameSettings.width, 30, { isStatic: true})
]);

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);

function text(str, size=20, color=currentTheme["text-normal"]) {

    let drawing = document.createElement("canvas");

    drawing.width = '500'
    drawing.height = '150'

    let ctx = drawing.getContext("2d");
	ctx.fillStyle = color;
    ctx.font = size+"pt 'Open Sans'";
    ctx.textAlign = "center";
    ctx.fillText(str, 250, 85);
    return drawing.toDataURL("image/png");
}


