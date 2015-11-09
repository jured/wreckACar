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
		scene.setGravity(new THREE.Vector3( 0, -9.8, 0 ))
		scene.addEventListener('update', function() {
			scene.simulate(undefined, 2);
			physics_stats.update();
		});

		// Camera 
		// todo: tle nastimej da bo pravilna kamera
		camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 1, 1000)
		camera.position.set( 60, 50, 60 );
		camera.lookAt( scene.position );
		scene.add( camera );

		// Light
		// todo: to je copy-paste light, mal kostumizerejva
		light = new THREE.DirectionalLight( 0xFFFFFF );
		light.position.set( 20, 40, -15 );
		light.target.position.copy( scene.position );
		scene.add( light );

		loader = new THREE.TextureLoader();


		// Ground
		var ground = createGround(scene);

		// Car
		cars['avto1'] = createCar(scene);
		cars['avto2'] = createCar(scene);
		cars['avto3'] = createCar(scene);
		cars['avto4'] = createCar(scene);


		// exportej v fukcijo, ki nardi avto, + doda kontrole (bo vec moznih avtu)

		// start
		requestAnimationFrame( render );
		scene.simulate();
}

render = function() {
		requestAnimationFrame( render );
		renderer.render( scene, camera );
		render_stats.update();
}

// todo: copy paste, daj parametrizerane kontrole, spremen obliko lastnosti avta
// dodaj parameter kje naj se spawna, tweekaj vrednosti, obliko barve
// naredi avto, ga postavi v svet in ga vrne
createCar = function(scene) {
	var car_material, wheel_material, wheel_geometry;
	var car = {};
	car_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ color: 0xff6666 }),
			.8, // high friction
			.2 // low restitution
		);
		
		wheel_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ color: 0x444444 }),
			1.0, // high friction
			1.0 // medium restitution
		);
		wheel_geometry = new THREE.CylinderGeometry( 2, 2, 1, 8 );
		
		car.body = new Physijs.BoxMesh(
			new THREE.BoxGeometry( 10, 5, 7 ),
			car_material,
			1000
		);
		car.body.position.y = 10;
		car.body.receiveShadow = car.body.castShadow = true;
		scene.add( car.body );
		
		car.wheel_fl = new Physijs.CylinderMesh(
			wheel_geometry,
			wheel_material,
			500
		);
		car.wheel_fl.rotation.x = Math.PI / 2;
		car.wheel_fl.position.set( -3.5, 6.5, 5 );
		car.wheel_fl.receiveShadow = car.wheel_fl.castShadow = true;
		scene.add( car.wheel_fl );
		car.wheel_fl_constraint = new Physijs.DOFConstraint(
			car.wheel_fl, car.body, new THREE.Vector3( -3.5, 6.5, 5 )
		);
		scene.addConstraint( car.wheel_fl_constraint );
		car.wheel_fl_constraint.setAngularLowerLimit({ x: 0, y: -Math.PI / 8, z: 1 });
		car.wheel_fl_constraint.setAngularUpperLimit({ x: 0, y: Math.PI / 8, z: 0 });
		
		car.wheel_fr = new Physijs.CylinderMesh(
			wheel_geometry,
			wheel_material,
			500
		);
		car.wheel_fr.rotation.x = Math.PI / 2;
		car.wheel_fr.position.set( -3.5, 6.5, -5 );
		car.wheel_fr.receiveShadow = car.wheel_fr.castShadow = true;
		scene.add( car.wheel_fr );
		car.wheel_fr_constraint = new Physijs.DOFConstraint(
			car.wheel_fr, car.body, new THREE.Vector3( -3.5, 6.5, -5 )
		);
		scene.addConstraint( car.wheel_fr_constraint );
		car.wheel_fr_constraint.setAngularLowerLimit({ x: 0, y: -Math.PI / 8, z: 1 });
		car.wheel_fr_constraint.setAngularUpperLimit({ x: 0, y: Math.PI / 8, z: 0 });
		
		car.wheel_bl = new Physijs.CylinderMesh(
			wheel_geometry,
			wheel_material,
			500
		);
		car.wheel_bl.rotation.x = Math.PI / 2;
		car.wheel_bl.position.set( 3.5, 6.5, 5 );
		car.wheel_bl.receiveShadow = car.wheel_bl.castShadow = true;
		scene.add( car.wheel_bl );
		car.wheel_bl_constraint = new Physijs.DOFConstraint(
			car.wheel_bl, car.body, new THREE.Vector3( 3.5, 6.5, 5 )
		);
		scene.addConstraint( car.wheel_bl_constraint );
		car.wheel_bl_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
		car.wheel_bl_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });
		
		car.wheel_br = new Physijs.CylinderMesh(
			wheel_geometry,
			wheel_material,
			500
		);
		car.wheel_br.rotation.x = Math.PI / 2;
		car.wheel_br.position.set( 3.5, 6.5, -5 );
		car.wheel_br.receiveShadow = car.wheel_br.castShadow = true;
		scene.add( car.wheel_br );
		car.wheel_br_constraint = new Physijs.DOFConstraint(
			car.wheel_br, car.body, new THREE.Vector3( 3.5, 6.5, -5 )
		);
		scene.addConstraint( car.wheel_br_constraint );
		car.wheel_br_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
		car.wheel_br_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });
		
		document.addEventListener(
			'keydown',
			function( ev ) {
				switch( ev.keyCode ) {
					case 37:
						// Left
						car.wheel_fl_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, 1, 200 );
						car.wheel_fr_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, 1, 200 );
						car.wheel_fl_constraint.enableAngularMotor( 1 );
						car.wheel_fr_constraint.enableAngularMotor( 1 );
						break;
					
					case 39:
						// Right
						car.wheel_fl_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, -1, 200 );
						car.wheel_fr_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, -1, 200 );
						car.wheel_fl_constraint.enableAngularMotor( 1 );
						car.wheel_fr_constraint.enableAngularMotor( 1 );
						break;
					
					case 38:
						// Up
						car.wheel_bl_constraint.configureAngularMotor( 2, 1, 0, 5, 2000 );
						car.wheel_br_constraint.configureAngularMotor( 2, 1, 0, 5, 2000 );
						car.wheel_bl_constraint.enableAngularMotor( 2 );
						car.wheel_br_constraint.enableAngularMotor( 2 );
						break;
					
					case 40:
						// Down
						car.wheel_bl_constraint.configureAngularMotor( 2, 1, 0, -5, 2000 );
						car.wheel_br_constraint.configureAngularMotor( 2, 1, 0, -5, 2000 );
						car.wheel_bl_constraint.enableAngularMotor( 2 );
						//car.wheel_br_constraint.enableAngularMotor( 2 );
						break;
				}
			}
		);
		
		document.addEventListener(
			'keyup',
			function( ev ) {
				switch( ev.keyCode ) {
					case 37:
						// Left
						car.wheel_fl_constraint.disableAngularMotor( 1 );
						car.wheel_fr_constraint.disableAngularMotor( 1 );
						break;
					
					case 39:
						// Right
						car.wheel_fl_constraint.disableAngularMotor( 1 );
						car.wheel_fr_constraint.disableAngularMotor( 1 );
						break;
					
					case 38:
						// Up
						car.wheel_bl_constraint.disableAngularMotor( 2 );
						car.wheel_br_constraint.disableAngularMotor( 2 );
						break;
					
					case 40:
						// Down
						car.wheel_bl_constraint.disableAngularMotor( 2 );
						car.wheel_br_constraint.disableAngularMotor( 2 );
						break;
				}
			}
		);

		return car;
}

// todo: copy paste, daj drugo obliko tal(random generirano?), drug material
createGround = function(scene) {
	var ground, ground_material;
	ground_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: loader.load( 'resources/rocks.jpg' ) }),
			.8, // high friction
			.4 // low restitution
		);
		ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
		ground_material.map.repeat.set( 3, 3 );

	ground = new Physijs.BoxMesh(
			new THREE.BoxGeometry(100, 1, 100),
			ground_material,
			0 // mass
		);
	scene.add( ground );
}

