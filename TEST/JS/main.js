import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { TeapotGeometry } from "https://threejs.org/examples/jsm/geometries/TeapotGeometry.js";
import {render,onWindowResize} from "./render.js";

var scene, renderer, camera;
var pointLight;
var turn = true;
var angle = 0;
var teapots = [];
var meshMaterial;

function init(){
  
    scene = new THREE.Scene();
	
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
	
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.setClearColor(0x888888);


    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.y = 160;
    camera.position.z = 400;
    window.addEventListener('resize', onWindowResize, false);
    let controls = new OrbitControls(camera, renderer.domElement);

    var gridXZ = new THREE.GridHelper(200, 20, 'red', 'white');
    scene.add(gridXZ);

    pointLight = new THREE.PointLight(0xffffff);
    scene.add (pointLight);
    scene.add (new THREE.PointLightHelper(pointLight, 5));

    var ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

 
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
	
	var count = 0;
	for(var i = -90; i <= 90; i+=20){
	  for(var j = 90; j >= -90; j-=20){
		var geometry = new TeapotGeometry (4);
        var mesh = new THREE.Mesh(geometry, meshMaterial);
		mesh.position.set(j,0,i);
		teapots.push(mesh)
		scene.add(mesh);
	  }
	}
	console.log(teapots);
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
export{scene,camera,init,animate,renderer};