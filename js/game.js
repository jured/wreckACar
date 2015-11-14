CONTROLS1 = {up:38, back:40, left:37, right:39} // Smerne tipke
CONTROLS2 = {up:87, back:83, left:65, right:68} // WASD
CONTROLS3 = {up:0, back:0, left:0, right:0} // todo
CONTROLS4 = {up:0, back:0, left:0, right:0} // todo

CONTROLS = [CONTROLS1, CONTROLS2, CONTROLS3, CONTROLS4]

COLORS = {green:0x2D8633, blue:0x236467, red:0xAA3C39, orange:0xAA6D39}

PLAYER_NAMES = ['Bob', 'Richard', '42', 'Pina Collada']

PLAYERS = [];

var score_board;

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var renderer, render_stats, physics_stats, loader;
var scene, camera, light;
var cars = {}; // map of carName:carObject

init = function() {

		// todo: to  je copy paste, se je za poigrat pa mal odstrant dodat po zelji
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.shadowMap.enabled = true;
		renderer.shadowMapSoft = true;
		document.getElementById( 'viewport' ).appendChild( renderer.domElement );

		render_stats = new Stats();
		render_stats.domElement.style.position = 'absolute';
		render_stats.domElement.style.top = '0px';
		render_stats.domElement.style.zIndex = 100;
		document.getElementById( 'viewport' ).appendChild( render_stats.domElement );

		physics_stats = new Stats();
		physics_stats.domElement.style.position = 'absolute';
		physics_stats.domElement.style.top = '50px';
		physics_stats.domElement.style.zIndex = 100;
		document.getElementById( 'viewport' ).appendChild( physics_stats.domElement );

		// Scene
		scene = new Physijs.Scene;
		scene.setGravity(new THREE.Vector3( 0, -30, 0 ))
		scene.addEventListener('update', function() {
			scene.simulate(undefined, 2);
			physics_stats.update();
		});

		// Camera 
		// todo: tle nastimej da bo pravilna kamera
		camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 1000)
		camera.position.set( 0, 600, 0 );
		//camera.position.set( 60, 50, 60);
		camera.lookAt( scene.position );
		scene.add( camera );

		// Light
		// todo: to je copy-paste light, mal kostumizerejva
		light = new THREE.DirectionalLight( 0xFFFFFF );
		light.position.set( 20, 40, -15 );
		light.target.position.copy( scene.position );
		scene.add( light );

		loader = new THREE.TextureLoader();

		// UI
		initUI();

		NUMBER_OF_PLAYERS = parseInt(document.getElementById("player_num").value);
		MAX_LIFES = parseInt(document.getElementById("score_num").value);

		// Ground
		var ground = createGround(scene);

		// Car
		var p;
		for (var i = 0; i < NUMBER_OF_PLAYERS; i++) {
			var col = Object.keys(COLORS)[i];
			p = {
				index: i,
				name: PLAYER_NAMES[i],
				color: col,
				car: createCar(scene, COLORS[col], {x: 10*i, y:10, z:10*i}),
				lifes : MAX_LIFES
			}
			addCarControls(p.car, CONTROLS[i]);
			PLAYERS.push(p);
		}
	
		// start
		requestAnimationFrame( render );
		scene.simulate();
}

render = function() {
		checkPositionOfCars();

		requestAnimationFrame( render );
		renderer.render( scene, camera );
		render_stats.update();
}

initUI = function() {
	score_board = document.createElement('div');
	score_board.id = "score_board"
	score_board.style.position = 'absolute';
	score_board.style.zIndex = 100;
	score_board.style.width = 200;
	score_board.style.height = 500;
	score_board.style.top = 200 + 'px';
	score_board.style.left = 10 + 'px';
	score_board.style.color = "white"
	document.body.appendChild(score_board);
	updateLifes();

}

updateLifes = function() {
	var html = '2';
	for(var i = 0; i < PLAYERS.length; i++) {
		console.log(PLAYERS[i])
	}
	document.getElementById("score_board").innerHTML = "TODO: dodaj score" + html;
}

checkPositionOfCars = function() {
	for(var i = 0; i < PLAYERS.length; i++) {
		console.log(PLAYERS[i].car.body.position)
		if (PLAYERS[i].car.body.position.y < -50) {
			// TODO: car dies and respawns if it has enought score
			if (PLAYERS[i].lifes > 0) {
				PLAYERS[i].lifes = PLAYERS[i].lifes - 1;
				respawn(PLAYERS[i])
			}

		}
	}
}

respawn = function(player) {
	var car = player.car;

	car.body.position.y = 10;
	car.body.position.x = 0;
	car.body.position.z = 0;

}

// todo: copy paste, daj parametrizerane kontrole, spremen obliko lastnosti avta
// dodaj parameter kje naj se spawna, tweekaj vrednosti, obliko barve
// naredi avto, ga postavi v svet in ga vrne
createCar = function(scene, color, position) {
	var k = 1;

	var car = {};

	data = {}
	data["car_material"] = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ color: color }),
			.8, // high friction
			10 // low restitution
		);
	data["wheel_material"] = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ color: 0x444444 }),
			1.0, // high friction
			0 // medium restitution
		);
	data["wheel_geometry"] = new THREE.CylinderGeometry( 2.5*k, 2.5*k, 1.5*k, 13 );
		
	car.body = new Physijs.BoxMesh(
		new THREE.BoxGeometry( 10*k, 2*k, 7*k ),
		data["car_material"],
		1000
	);
	car.body.position.y = 10 + position.y;
	car.body.position.x = position.x;
	car.body.position.z = position.z;

	scene.add( car.body );
	
	// Wheels
	wheel_pos = {x: 3.5, y: 10, z:5}

	car.wheel_fl = new Physijs.CylinderMesh(
		data["wheel_geometry"],
		data["wheel_material"],
		500
	);

	car.wheel_fl.rotation.x = Math.PI / 2;
	car.wheel_fl.position.set( (-wheel_pos.x + position.x)*k, (wheel_pos.y + position.y)*k, (wheel_pos.z  + position.z)*k);
	scene.add( car.wheel_fl );
	car.wheel_fl_constraint = new Physijs.DOFConstraint(
		car.wheel_fl, car.body, new THREE.Vector3((-wheel_pos.x + position.x)*k, (wheel_pos.y + position.y)*k, (wheel_pos.z  + position.z)*k)
	);
	scene.addConstraint( car.wheel_fl_constraint );
	car.wheel_fl_constraint.setAngularLowerLimit({ x: 0, y: -Math.PI / 8, z: 1 });
	car.wheel_fl_constraint.setAngularUpperLimit({ x: 0, y: Math.PI / 8, z: 0 });
	// end of front lef wheel

	car.wheel_fr = new Physijs.CylinderMesh(
		data["wheel_geometry"],
		data["wheel_material"],
		500
	);
	car.wheel_fr.rotation.x = Math.PI / 2;
	car.wheel_fr.position.set( -wheel_pos.x + position.x, wheel_pos.y + position.y, -wheel_pos.z + position.z );
	car.wheel_fr.receiveShadow = car.wheel_fr.castShadow = true;
	scene.add( car.wheel_fr );
	car.wheel_fr_constraint = new Physijs.DOFConstraint(
		car.wheel_fr, car.body, new THREE.Vector3(-wheel_pos.x + position.x, wheel_pos.y + position.y, -wheel_pos.z + position.z)
	);
	scene.addConstraint( car.wheel_fr_constraint );
	car.wheel_fr_constraint.setAngularLowerLimit({ x: 0, y: -Math.PI / 8, z: 1 });
	car.wheel_fr_constraint.setAngularUpperLimit({ x: 0, y: Math.PI / 8, z: 0 });
	
	car.wheel_bl = new Physijs.CylinderMesh(
		data["wheel_geometry"],
		data["wheel_material"],
		500
	);
	car.wheel_bl.rotation.x = Math.PI / 2;
	car.wheel_bl.position.set(wheel_pos.x + position.x, wheel_pos.y + position.y, wheel_pos.z + position.z);
	car.wheel_bl.receiveShadow = car.wheel_bl.castShadow = true;
	scene.add( car.wheel_bl );
	car.wheel_bl_constraint = new Physijs.DOFConstraint(
		car.wheel_bl, car.body, new THREE.Vector3(wheel_pos.x + position.x, wheel_pos.y + position.y, wheel_pos.z + position.z)
	);
	scene.addConstraint( car.wheel_bl_constraint );
	car.wheel_bl_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
	car.wheel_bl_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });
	
	car.wheel_br = new Physijs.CylinderMesh(
		data["wheel_geometry"],
		data["wheel_material"],
		500
	);
	car.wheel_br.rotation.x = Math.PI / 2;
	car.wheel_br.position.set(wheel_pos.x + position.x, wheel_pos.y + position.y, -wheel_pos.z + position.z);
	car.wheel_br.receiveShadow = car.wheel_br.castShadow = true;
	scene.add( car.wheel_br );
	car.wheel_br_constraint = new Physijs.DOFConstraint(
		car.wheel_br, car.body, new THREE.Vector3(wheel_pos.x + position.x, wheel_pos.y + position.y, -wheel_pos.z + position.z)
	);
	scene.addConstraint( car.wheel_br_constraint );
	car.wheel_br_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
	car.wheel_br_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });
	
	return car;
}

addCarControls = function(car, controls) {

	//constraint.configureAngularMotor(
    //	which, // which angular motor to configure - 0,1,2 match x,y,z
    //	low_limit, // lower limit of the motor
    //	high_limit, // upper limit of the motor
    //	velocity, // target velocity
    //	max_force // maximum force the motor can apply
	//);

	m = {low_limit:1, hight_limit:0, velocity_forward:200, velocity_bacward:-5, max_force:1000};
	t = {low_limit:-Math.PI / 2, hight_limit:Math.PI / 2, velocity_left:1, velocity_right:-1, max_force:400};


	document.addEventListener(
		'keydown',
		function( ev ) {
			switch( ev.keyCode ) {	
				case controls.up:
					car.wheel_bl_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, m.velocity_forward, m.max_force);
					car.wheel_br_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, m.velocity_forward, m.max_force);
					car.wheel_bl_constraint.enableAngularMotor( 2 );
					car.wheel_br_constraint.enableAngularMotor( 2 );
					break;
				case controls.back:
					car.wheel_bl_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, m.velocity_bacward, m.max_force);
					car.wheel_br_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, m.velocity_bacward, m.max_force);
					car.wheel_bl_constraint.enableAngularMotor( 2 );
					car.wheel_br_constraint.enableAngularMotor( 2 );
					break;
				case controls.left:
					car.wheel_fl_constraint.configureAngularMotor( 1, t.low_limit, t.high_limit, t.velocity_left, t.max_force);
					car.wheel_fr_constraint.configureAngularMotor( 1, t.low_limit, t.high_limit, t.velocity_left, t.max_force);
					car.wheel_fl_constraint.enableAngularMotor( 1 );
					car.wheel_fr_constraint.enableAngularMotor( 1 );
					break;
				case controls.right:
					car.wheel_fl_constraint.configureAngularMotor( 1, t.low_limit, t.high_limit, t.velocity_right, t.max_force);
					car.wheel_fr_constraint.configureAngularMotor( 1, t.low_limit, t.high_limit, t.velocity_right, t.max_force);
					car.wheel_fl_constraint.enableAngularMotor( 1 );
					car.wheel_fr_constraint.enableAngularMotor( 1 );
					break;
			}
		}
	);
	
	document.addEventListener(
		'keyup',
		function( ev ) {
			switch( ev.keyCode ) {
				case controls.up:
					car.wheel_bl_constraint.disableAngularMotor( 2 );
					car.wheel_br_constraint.disableAngularMotor( 2 );
					break;
				case controls.back:
					car.wheel_bl_constraint.disableAngularMotor( 2 );
					car.wheel_br_constraint.disableAngularMotor( 2 );
					break;
				case controls.left:
					car.wheel_fl_constraint.disableAngularMotor( 1 );
					car.wheel_fr_constraint.disableAngularMotor( 1 );
					break;
				case controls.right:
					car.wheel_fl_constraint.disableAngularMotor( 1 );
					car.wheel_fr_constraint.disableAngularMotor( 1 );
					break;
			}
		}
	);

}



// todo: copy paste, daj drugo obliko tal(random generirano?), drug material
createGround = function(scene) {
	var ground, ground_material;
	ground_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: loader.load( 'resources/rocks.jpg' ) }),
			5, // high friction
			1.0 // low restitution
		);
		ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
		ground_material.map.repeat.set( 3, 3 );

	ground = new Physijs.CylinderMesh(
				new THREE.CylinderGeometry( 200, 2, 1, 32 ),
			ground_material,
			0 // mass
		);
	scene.add( ground );
}

