import * as THREE from './three.module.js';

var play = {};
var notelist = [];

(function () {
	function main() {
		const canvas = document.querySelector('#c');
		const renderer = new THREE.WebGLRenderer({ canvas });

		const fov = 45;
		const aspect = 2;  // the canvas default
		const near = 0.1;
		const far = 100;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(0, 5, 10);
		camera.rotation.set(-0.25, 0, 0);

		// create an AudioListener and add it to the camera
		var listener = new THREE.AudioListener();
		camera.add(listener);

		// create a global audio source
		var sound = new THREE.Audio(listener);

		// load a sound and set it as the Audio object's buffer
		var audioLoader = new THREE.AudioLoader();

		class InputManager {
			constructor() {
				this.keys = {};
				const keyMap = new Map();

				const setKey = (keyName, pressed) => {
					const keyState = this.keys[keyName];
					keyState.justPressed = pressed && !keyState.down;
					keyState.down = pressed;
				};

				const addKey = (keyCode, name) => {
					this.keys[name] = { down: false, justPressed: false };
					keyMap.set(keyCode, name);
				};

				const setKeyFromKeyCode = (keyCode, pressed) => {
					const keyName = keyMap.get(keyCode);
					if (!keyName) {
						return;
					}
					setKey(keyName, pressed);
				};

				addKey(37, 'left');
				addKey(39, 'right');
				addKey(38, 'up');
				addKey(40, 'down');
				addKey(68, 'bt1');
				addKey(70, 'bt2');
				addKey(74, 'bt3');
				addKey(75, 'bt4');

				window.addEventListener('keydown', (e) => {
					setKeyFromKeyCode(e.keyCode, true);
				});
				window.addEventListener('keyup', (e) => {
					setKeyFromKeyCode(e.keyCode, false);
				});

				const sides = [
					{ elem: document.querySelector('#left'), key: 'left' },
					{ elem: document.querySelector('#right'), key: 'right' },
				];

				const clearKeys = () => {
					for (const { key } of sides) {
						setKey(key, false);
					}
				};

				const checkSides = (e) => {
					for (const { elem, key } of sides) {
						let pressed = false;
						const rect = elem.getBoundingClientRect();
						for (const touch of e.touches) {
							const x = touch.clientX;
							const y = touch.clientY;
							const inRect = x >= rect.left && x < rect.right &&
								y >= rect.top && y < rect.bottom;
							if (inRect) {
								pressed = true;
							}
						}
						setKey(key, pressed);
					}
				};
			}

			update() {
				for (const keyState of Object.values(this.keys)) {
					if (keyState.justPressed) {
						keyState.justPressed = false;
					}
				}
			}
		}

		const inputManager = new InputManager();

		const scene = new THREE.Scene();
		{
			const color = 0x000000;  // black
			const near = 10;
			const far = 100;
			scene.fog = new THREE.Fog(color, near, far);
		}

		const boxWidth = 1;
		const boxHeight = 1;
		const boxDepth = 1;
		const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

		// const geometry2 = new THREE.BoxGeometry(1, 1, 1);

		const loader = new THREE.TextureLoader();

		// create the particle variables
		var particleCount = 500,
			particles = new THREE.Geometry(),
			partext = loader.load("./assets/particle.png");
		partext.magFilter = THREE.NearestFilter;
		partext.minFilter = THREE.NearestFilter;
		const pMaterial = new THREE.PointsMaterial({
			size: 2.5,
			map: partext,
			color: 0x888888,
			blending: THREE.AdditiveBlending,
			transparent: true,
			fog: false,
			depthTest: false
		});

		// now create the individual particles
		for (var p = 0; p < particleCount; p++) {

			// create a particle with random
			// position values, -5 -> 5
			var pX = Math.random() * 100 - 50,
				pY = Math.random() * 100 - 50,
				pZ = Math.random() * (-300 - (-100)) - 100,
				particle = new THREE.Vector3(pX, pY, pZ);
			// create a velocity vector
			particle.velocity = new THREE.Vector3(
				0,				// x
				0,				// y
				2.5);	// z

			// add it to the geometry
			particles.vertices.push(particle);
		}

		// create the particle system
		var particleSystem = new THREE.Points(
			particles,
			pMaterial);

		scene.add(particleSystem);

		particleSystem.sortParticles = true;

		function particlemove() {

			var pCount = particleCount;
			while (pCount--) {
				// get the particle
				var particle = particles.vertices[pCount];

				// check if we need to reset
				if (particle.z > 5) {
					particle.z = Math.random() * (-300 - (-100)) - 100;
				}

				particle.add(particle.velocity);
			}
		}

		var textplane = loader.load('assets/images.png');
		textplane.wrapT = THREE.RepeatWrapping;
		textplane.repeat.y = 500;
		textplane.magFilter = THREE.NearestFilter;
		textplane.minFilter = THREE.NearestMipmapLinearFilter;
		const materialplane = new THREE.MeshBasicMaterial({
			map: textplane, side: THREE.DoubleSide
		});
		const planeset = [];
		var posset = -3;
		for (var i = 0; i < 4; i++) {
			const object = new THREE.Mesh(new THREE.PlaneBufferGeometry(1.6, 500, 1, 1), materialplane);
			object.rotation.x = -0.5 * Math.PI;
			object.position.set(posset, 0, -500 / 2);
			posset += 2;
			scene.add(object);
			planeset.push(object);
		}

		const boxset = [];
		posset = -3;
		for (var i = 0; i < 4; i++) {
			const object = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.125, 1.5), new THREE.MeshBasicMaterial({ color: 0x242424 }));
			object.position.set(posset, 0, 0);
			posset += 2;
			scene.add(object);
			boxset.push(object);
		}

		const cubes = [];  // just an array we can use to rotate the cubes
		const material = new THREE.MeshBasicMaterial({
			map: loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg'),
		});

		const cube = new THREE.Mesh(geometry, material);
		// cube.rotation.x = 90;

		scene.add(cube);
		cubes.push(cube);  // add to our list of cubes to rotate

		//sounds
		play.notePos = [-3, -1, 1, 3];
		play.sounds = ['sound1.ogg', 'sound2.ogg', 'sound3.ogg', 'sound4.ogg'];

		class NoteH {
			//status = great, good, atau miss
			//flag = apakah mencapai di atas? (atau masih jalan)
			constructor() {
				this.status = 0;
				this.flag = 1;
				this.posX = Math.floor(Math.random() * (4));
				//spawn note
				this._object = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0x4f4f4f }));
				this._object.position.x = play.notePos[this.posX];
				this._object.position.y = .5;
				this._object.position.z = -90;
				this._object.x = this.posX;
				notelist.push(this);
				scene.add(this._object);
			}
			//movegreat,good,dan miss untuk animasi, tapi masih ada beberapa kejanggalan dan masalah. :/
			movegreat() {
				this.status = 2;
				if (this._object.position.z <= 5) {
					//move note
					this._object.position.z += 0.5;
					this._object.position.y = -(Math.sqrt(2 - Math.pow(this._object.position.z, 2)) * 0.01) + 2;
					this._object.rotation.x += 1;
				}
				else {
					this.flag = 0;
				}
			}
			movegood() {
				this.status = 1;
				if (this._object.position.z <= 5) {
					//move note
					this._object.position.z += 0.25;
					this._object.position.y = -(Math.pow(this._object.position.z, 2) * 0.005) + 2;
					this._object.rotation.x += 0.5;
				}
				else {
					this.flag = 0;
				}
			}
			movemiss() {
				this.flag = 0;
			}
			move() {
				if (this._object.position.z <= 1.25) {
					//move note
					this._object.position.z += 1;
				}
				else if (this.status == 0 && this.flag) {
					this.status = -1;
					console.log('miss');
					// this.movemiss();
					this.flag = 0;
				}
				//check note hit
				if ((inputManager.keys.bt1.down && this.posX == 0 || inputManager.keys.bt2.down && this.posX == 1 ||
					inputManager.keys.bt3.down && this.posX == 2 || inputManager.keys.bt4.down && this.posX == 3) && (this.status == 0)) {
					if (this._object.position.z >= -0.75 && this._object.position.z <= 0.75) {
						console.log('great')
						// this.movegreat();
						this.status = 2;
						this.flag = 0;
						audioLoader.load('./libs/'+play.sounds[this.posX], function (buffer) {
							sound.setBuffer(buffer);
							sound.setLoop(false);
							sound.setVolume(0.75);
							if(sound.isPlaying) sound.stop();
							sound.play();
						});
					}
					else if (this._object.position.z >= -1 && this._object.position.z <= 1) {
						console.log('good')
						// this.movegood();
						this.status = 1;
						this.flag = 0;
						audioLoader.load('./libs/'+play.sounds[this.posX], function (buffer) {
							sound.setBuffer(buffer);
							sound.setLoop(false);
							sound.setVolume(0.5);
							if(sound.isPlaying) sound.stop();
							sound.play();
						});
					}
				}
			}
		}

		//moving all note resides from the array.
		function moveNote() {
			var n = 0;
			for (n; n < notelist.length; n++) {
				notelist[n].move();
			}
		}

		//checking for notes using flag
		function checknotehit() {
			var n = 0;
			for (n; n < notelist.length; n++) {
				if (!notelist[n].flag) {
					scene.remove(notelist[n]._object);
					notelist.splice(n, 1);
				}
			}
		}

		function resizeRendererToDisplaySize() {
			const canvas = renderer.domElement;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width != width || canvas.height != height;
			if (needResize) {
				renderer.setSize(width, height, false);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			}
		}

		var clock = new THREE.Clock();
		var time = 0;
		var delta = 0;
		var interval = 0;
		var curpos = 0;
		function render() {
			delta = clock.getDelta() * 1000;
			time += delta;
			interval = Math.floor(time);
			resizeRendererToDisplaySize();

			if (interval >= 1000) {
				// console.log(interval);
				time = 0;
				new NoteH();
			}
			moveNote();
			checknotehit();
			particlemove();
			particles.verticesNeedUpdate = true;

			cubes.forEach((cube, ndx) => {
				const speed = .2 + ndx * .1;
				// const rot = time * speed;
				if (inputManager.keys.bt1.down) { curpos = 0 }
				if (inputManager.keys.bt2.down) { curpos = 1 }
				if (inputManager.keys.bt3.down) { curpos = 2 }
				if (inputManager.keys.bt4.down) { curpos = 3 }
				cube.position.x = planeset[curpos].position.x;
			});

			renderer.render(scene, camera);

			requestAnimationFrame(render);
		}

		requestAnimationFrame(render);
	}

	main();

})()