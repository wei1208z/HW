import * as THREE from "https://threejs.org/build/three.module.js";
import {OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { TeapotGeometry } from "https://threejs.org/examples/jsm/geometries/TeapotGeometry.js";
import {render,onWindowResize} from "./render1.js";

var camera, scene, renderer;
var pointLight;
var angle = 0;
var meshMaterial;
var teapots = [];

function init(){
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor (0x888888);
	renderer.setSize(window.innerWidth,window.innerHeight);
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.set(200,400,0);
	let controls = new OrbitControls(camera, renderer.domElement);
	controls.minPolarAngle = THREE.Math.degToRad(30);
	controls.maxPolarAngle = THREE.Math.degToRad(80);
	controls.minDistance = 200;
	controls.maxDistance = 500;
	
	var loader = new THREE.TextureLoader();
	var texture = loader.load(
	//'https://threejs.org/examples/textures/hardwood2_diffuse.jpg',
       //'http://imgur.com/a/zhRiCYC', 
		'https://media.istockphoto.com/photos/blank-dish-picture-id1055053018?k=20&m=1055053018&s=612x612&w=0&h=xCongbY9kTTxchgElgHZCaHUlmJfNzLmifIAzBCY2z4=',
		function(texture) {
        },
			undefined, 
        function(xhr) {
          console.log('An error happened');
        }
        );
	texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(10,10);
	var texMat = new THREE.MeshBasicMaterial({
            map: texture,
            alphaTest:0.5
    });
		
		
	let floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),texMat);
	floor.rotation.x = - 1/2 * Math.PI;
	scene.add(floor);
	
	
	var gridXZ = new THREE.GridHelper(200, 20, 'red', 'white');
    scene.add(gridXZ);
	
	pointLight = new THREE.PointLight(0xffffff);
    scene.add (pointLight);
    scene.add (new THREE.PointLightHelper(pointLight, 5));
		
	

	meshMaterial = new THREE.ShaderMaterial({
        uniforms: {
        'lightpos': {type: 'v3', value: new THREE.Vector3()}
        },
        vertexShader:[
			"uniform vec3 lightpos;",
			"varying vec3 eyelightdir;",
			"varying vec3 eyenormal;",   
			"varying vec4 eyepos;",
			"void main() {",
			"gl_Position = projectionMatrix* modelViewMatrix * vec4( position, 1.0);",
			"eyepos = modelViewMatrix * vec4 (position, 1.0);",
			"vec4 eyelightpos= viewMatrix * vec4 (lightpos, 1.0);",
			"eyelightdir =  eyelightpos.xyz - eyepos.xyz;",
			"eyenormal = normalMatrix * normal;",
			"}"
		].join("\n"),
        fragmentShader:[
			"varying vec3 eyelightdir;",
			"varying vec3 eyenormal;",
			"varying vec4 eyepos;  " ,
			"void main() {",
			"float intensity = dot (normalize (eyenormal), normalize (eyelightdir));",
			"if (intensity > 0.8)",
				"intensity = 0.8;",
			"else if (intensity > 0.4)",
				"intensity = 0.4;",
			"else",
				"intensity = 0.0;",
			"vec3 diffuse = intensity*vec3 (1,1,1);",
			"gl_FragColor = vec4 (diffuse + vec3(0,0,0.13), 1.0);",
			"}"
		].join("\n")
    });
	
	for(var x=-90,z=90,i=0;i<100;i++,x+=20){
		var geometry = new TeapotGeometry (4);
        var mesh = new THREE.Mesh(geometry, meshMaterial);
		mesh.position.set(x,4,z);
		teapots.push(mesh)
		scene.add(mesh);
		if(x==90){
			x=-110;
			z-=20;
		}
	}
	
	
}



function animate(){
		
	angle += 0.01;
    
    pointLight.position.set(50 * Math.cos(angle), 80, 50 * Math.sin(angle));    
    //group.mesh.material.uniforms.lightpos.value.copy (pointLight.position);
	
    teapots.forEach(function(b){
	b.material.uniforms.lightpos.value.copy (pointLight.position);
	b.rotation.y = 1.3*angle;});
	
    //groups.rotation.y = 1.3*angle;
    requestAnimationFrame(animate);
    render();
}
export{camera, scene, renderer};
export{init,animate};
