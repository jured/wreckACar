CONTROLS1 = {up:38, back:40, left:37, right:39} // Smerne tipke
CONTROLS2 = {up:87, back:83, left:65, right:68} // WASD
CONTROLS3 = {up:0, back:0, left:0, right:0} // todo
CONTROLS4 = {up:0, back:0, left:0, right:0} // todo

CONTROLS = [CONTROLS1, CONTROLS2, CONTROLS3, CONTROLS4]
COLORS = {green:0x2D8633, blue:0x236467, red:0xAA3C39, orange:0xAA6D39}
PLAYER_NAMES = ['Bob', 'Richard', '42', 'Pina Collada']
PLAYERS = [];
KEYS = [];

BACKGROUND = {};

var ZERO = new THREE.Vector3(0,0,0);
var ONE = new THREE.Vector3(1,1, 1);
var SIX = new THREE.Vector3(.6,.6,.6);

var score_board;

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var renderer, render_stats, physics_stats, loader;
var scene, camera, light;

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
		initKeys();

		var p;
		var views = createViews(NUMBER_OF_PLAYERS);
		for (var i = 0; i < NUMBER_OF_PLAYERS; i++) {
			var col = Object.keys(COLORS)[i];

			p = {
				view: views[i],
				index: i,
				name: PLAYER_NAMES[i],
				color: col,
				controls: CONTROLS[i],
				car: createCar(scene, COLORS[col], {x: 10*i, y:10, z:10*i}),
				lifes : MAX_LIFES,
			}

			addCameraToPlayer(p);

			PLAYERS.push(p);
		}

		// Create background (has to be after players are created)
		createBackground();

		// Obstacles
		createObstacles(scene, 10);
	
		// start
		requestAnimationFrame( render );
		scene.simulate();
}

createBackground = function() {

	BACKGROUND.bg_neutral_material = new THREE.MeshBasicMaterial( 
		    		{ color: (0x6FC3DF), shading: THREE.FlatShading, 
		    			vertexColors: THREE.VertexColors } );

	BACKGROUND.mesh = new THREE.Mesh(
	  new THREE.PlaneGeometry(2, 2, 0),
	  BACKGROUND.bg_neutral_material
	);

	// The bg plane shouldn't care about the z-buffer.
	BACKGROUND.mesh.material.depthTest = false;
	BACKGROUND.mesh.material.depthWrite = false;


	BACKGROUND.scene = new THREE.Scene();
	BACKGROUND.camera = new THREE.Camera();
	BACKGROUND.scene.add(BACKGROUND.light);
	BACKGROUND.color_timer = setInterval(function() {
		var hsl = BACKGROUND.mesh.material.color.getHSL();
		BACKGROUND.mesh.material.color.setHSL(hsl.h, hsl.s, hsl.l * .995)
	}, 100);


	BACKGROUND.scene.add(BACKGROUND.camera)
	BACKGROUND.scene.add(BACKGROUND.mesh)

	BACKGROUND.refresh = function() {

		// update background
		renderer.autoClear = false;
		renderer.clear();
		renderer.render(BACKGROUND.scene, BACKGROUND.camera);
	}
}

addCameraToPlayer = function(p) {
	var camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 1000)
	var pos = p.car.body.position;
	camera.position.set(pos.x + 75, pos.y + 20, pos.z);
	camera.lookAt( pos );
	p.car.body.add(camera);
	p.camera = camera;
}

// If the player resizes the screen during gameplay
var windowHeight, windowWidth;
function updateSize() { 

	if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

		windowWidth  = window.innerWidth;
		windowHeight = window.innerHeight;

		renderer.setSize ( windowWidth, windowHeight );
	}

}

render = function() {
		checkPositionOfCars();
		refreshSpeeds();
		updateSize();

		for(var i = 0; i < PLAYERS.length; ++i){
			var view = PLAYERS[i].view;
			var camera = PLAYERS[i].camera;

			var left   = Math.floor( windowWidth  * view.left );
			var bottom = Math.floor( windowHeight * view.bottom );
			var width  = Math.floor( windowWidth  * view.width );
			var height = Math.floor( windowHeight * view.height );
			renderer.setViewport( left, bottom, width, height );
			renderer.setScissor( left, bottom, width, height ); // se mi zdi, de ne rabm
			renderer.enableScissorTest ( true );

			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			
			BACKGROUND.refresh();
			renderer.render( scene, camera );
		}

		requestAnimationFrame( render );
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

		// TODO: update lights
		PLAYERS[i].car.SpotLight.position.copy(PLAYERS[i].car.body.position);
		PLAYERS[i].car.SpotLight.__dirtyPosition = true;

		if (PLAYERS[i].car.body.position.y < -50) {
			if (PLAYERS[i].lifes > 0) {
				PLAYERS[i].lifes = PLAYERS[i].lifes - 1;
				respawn(PLAYERS[i])
			}

		}
	}
}

respawn = function(player) {
	var car = player.car;

	scene.remove(car.wheel_bl);
	scene.remove(car.wheel_br);
	scene.remove(car.wheel_fl);
	scene.remove(car.wheel_fr);
	scene.remove(car.body);

	player.car = createCar(scene, COLORS[player.color], {x: 0, y:100, z:0});
	addCameraToPlayer(player);
}

initKeys = function() {
	window.addEventListener("keydown",
    function(e){
        KEYS[e.keyCode] = true;
    }, false);

    window.addEventListener('keyup',
    function(e){
        KEYS[e.keyCode] = false;
    }, false);

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
			1, // high friction
			0.2 // medium restitution
		);
	data["wheel_geometry"] = new THREE.CylinderGeometry( 2.5*k, 2.5*k, 1.5*k, 8 );
		
	car.body = new Physijs.BoxMesh(
		new THREE.BoxGeometry( 10*k, 2*k, 7*k ),
		data["car_material"],
		1000
	);
	car.body.position.set(position.x, 10 + position.y, position.z);

	scene.add( car.body );

	//THREE.CameraHelper( light.shadow )
	// head light
	car.SpotLight = new THREE.SpotLight( 0xffffff, 5, 15, Math.PI/2, 1 );
	car.SpotLight.position.set(position.x, 10 + 2 + position.y, position.z);
	car.SpotLight.castShadow = true;
	car.SpotLight.shadowDarkness = 0.5;
	scene.add(car.SpotLight);

	
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
	car.wheel_fl_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
	car.wheel_fl_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });
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
	car.wheel_fr_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
	car.wheel_fr_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });
	
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

m = {low_limit:1, hight_limit:0, velocity_forward:20, velocity_bacward:-5, max_force:10000};
t = {low_limit:-Math.PI / 2, hight_limit:Math.PI / 2, velocity_left:1, velocity_right:-1, max_force:400};
refreshSpeeds = function() {
	for(var i = 0; i < PLAYERS.length; i++) {
		var p = PLAYERS[i];
		var car = p.car;

		var l = 1;
		var r = 1;
		if (! (KEYS[p.controls.left] == true && KEYS[p.controls.right] == true )) {
			var l = KEYS[p.controls.left] == true ? 0 : 1; // left
			var r = KEYS[p.controls.right] == true ? 0 : 1; // right
		} 

		car.body.setAngularFactor(SIX);
		if (KEYS[p.controls.up] == true) {
			car.wheel_bl_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, l*m.velocity_forward, m.max_force);
			car.wheel_br_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, r*m.velocity_forward, m.max_force);
			car.wheel_fl_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, l*m.velocity_forward, m.max_force);
			car.wheel_fr_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, r*m.velocity_forward, m.max_force);

			car.wheel_bl_constraint.enableAngularMotor( 2 );
			car.wheel_br_constraint.enableAngularMotor( 2 );
			car.wheel_fl_constraint.enableAngularMotor( 2 );
			car.wheel_fr_constraint.enableAngularMotor( 2 );
		} else if (KEYS[p.controls.back] == true) {
			car.wheel_bl_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, -l*m.velocity_forward, m.max_force);
			car.wheel_br_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, -r*m.velocity_forward, m.max_force);
			car.wheel_fl_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, -l*m.velocity_forward, m.max_force);
			car.wheel_fr_constraint.configureAngularMotor( 2, m.low_limit, m.high_limit, -r*m.velocity_forward, m.max_force);

			car.wheel_bl_constraint.enableAngularMotor( 2 );
			car.wheel_br_constraint.enableAngularMotor( 2 );
			car.wheel_fl_constraint.enableAngularMotor( 2 );
			car.wheel_fr_constraint.enableAngularMotor( 2 );
		} 
		else {
			car.wheel_bl_constraint.disableAngularMotor( 2 );
			car.wheel_br_constraint.disableAngularMotor( 2 );
			car.wheel_fl_constraint.disableAngularMotor( 2 );
			car.wheel_fr_constraint.disableAngularMotor( 2 );
		}    


	}

}

createViews = function(number) {
	var views;
	switch( number ) {
		case 2:
			views = [
				{ left: 0, bottom: 0, width: 0.5, height: 1.0}, 	// left side
				{ left: 0.5, bottom: 0, width: 0.5, height: 1.0} 	// right side
			];
			break;
		case 3:
			views = [
				{ left: 0, bottom: 0, width: 0.5, height: 1.0 }, 	// left side 
				{ left: 0.5, bottom: 0, width: 0.5, height: 0.5}, 	// bottom right 
				{ left: 0.5, bottom: 0.5, width: 0.5, height: 0.5} 	// top right
			];
			break;
		case 4:
			views = [
				{ left: 0, bottom: 0, width: 0.5, height: 0.5}, 	// bottom left side
				{ left: 0, bottom: 0.5, width: 0.5, height: 0.5}, 	// top left side
				{ left: 0.5, bottom: 0, width: 0.5, height: 0.5}, 	// bottom right
				{ left: 0.5, bottom: 0.5, width: 0.5, height: 0.5} 	// top right
			];
			break;
		default:
			alert("Napacno stevilo igralcev");
			return;
	}
	return views;
}

// todo: copy paste, daj drugo obliko tal(random generirano?), drug material
createGround = function(scene) {
	var ground, ground_material;
	ground_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: loader.load( 'resources/rocks.jpg' ) }),
			1, // high friction
			0.3 // low restitution
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

createObstacles = function(scene, num){
	var material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: loader.load( 'resources/rocks.jpg' ) }),
			.8, // low friction
			.6 // high restitution
		);
	//material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
	material.map.repeat.set( .25, .25 );
	
	for(var i = 0; i < num; ++i){ 
		var box = new Physijs.BoxMesh(
			new THREE.BoxGeometry( Math.random() * 15 + 5, 
								   Math.random() * 15 + 5,
								   Math.random() * 15 + 5 ),
			material
		);


		box.castShadow = true;
		box.receiveShadow = true;
		
		var x = Math.floor(Math.random()*50) + 10; // this will get a number between 1 and 99;
		x *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
		var y = Math.floor(Math.random()*50) + 10; // this will get a number between 1 and 99;
		y *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
				
		box.position.set( x, 30, y );
		
		scene.add( box );
	}
}

