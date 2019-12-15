import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/build/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r110/examples/jsm/controls/OrbitControls.js';

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

		play.notePos = [-3, -1, 1, 3];
		play.interval = 2500;
		play.sounds = ['sound1', 'sound2', 'sound3', 'sound4'];

		const inputManager = new InputManager();

		const scene = new THREE.Scene();

		const boxWidth = 1;
		const boxHeight = 1;
		const boxDepth = 1;
		const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

		// const geometry2 = new THREE.BoxGeometry(1, 1, 1);

		const loader = new THREE.TextureLoader();

		const materialplane = new THREE.MeshBasicMaterial({
			//map: loader.load('https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcSBR32fWLz4gU2RlpSkhHFxfYnqb6dhvZGaZwHQsmpvCruLi0pj'), side: THREE.DoubleSide
			map: loader.load('assets/images.png'), side: THREE.DoubleSide
		});
		const planeset = [];
		var posset = -3;
		for (var i = 0; i < 4; i++) {
			const object = new THREE.Mesh(new THREE.PlaneBufferGeometry(1.7, 500, 1, 1), materialplane);
			object.rotation.x = -0.5 * Math.PI;
			object.position.set(posset, 0, -500 / 2);
			posset += 2;
			scene.add(object);
			planeset.push(object);
		}
		const cubes = [];  // just an array we can use to rotate the cubes

		const material = new THREE.MeshBasicMaterial({
			map: loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg'),
		});

		const cube = new THREE.Mesh(geometry, material);
		// cube.rotation.x = 90;

		scene.add(cube);
		cubes.push(cube);  // add to our list of cubes to rotate

		
		class NoteH{
			constructor(){
				this.flag = 1;
				this.posX = Math.floor(Math.random() * (4));
				//spawn note
				this._object = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.5), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
				this._object.position.x = play.notePos[this.posX];
				this._object.position.y = .5;
				this._object.position.z = -90;
				this._object.x = this.posX;
				notelist.push(this);
				scene.add(this._object);
			}
			move(){
				if (this._object.position.z <= 1) {
					//move note
					this._object.position.z += 1;
				}
				else {
					scene.remove(this._object);
				}
				//check note hit
				if (this._object.position.z >= -1 && this._object.position.z <= 1) {
					console.log('inrange')
					if (inputManager.keys.bt1.down && this.posX == 0 || inputManager.keys.bt2.down && this.posX == 1 ||
						inputManager.keys.bt3.down && this.posX == 2 || inputManager.keys.bt4.down && this.posX == 3)
						{
							// var soundID = play.sounds[1];
							// document.getElementById(soundID).play();
							console.log('got it')
							this.flag = 0;
							scene.remove(this._object);
						}
				}
			}
		}

		function moveNote(){
			var n = 0;
			for(n; n < notelist.length; n++)
			{
				notelist[n].move();
			}
		}

		function checknotehit(){
			var n = 0;
			for(n; n < notelist.length; n++)
			{
				if(!notelist[n].flag) notelist.splice(n, 1);
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

		var curpos = 0
		var interval = 0;
		function render(time) {
			interval += 1;
			// console.log(time);
			resizeRendererToDisplaySize();

			if (interval % 500 == 0) {
				new NoteH();
			}
			moveNote();
			checknotehit();

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