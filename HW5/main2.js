import * as THREE from "https://threejs.org/build/three.module.js";
import {OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { TeapotGeometry } from "https://threejs.org/examples/jsm/geometries/TeapotGeometry.js";
import {render,onWindowResize} from "./render2.js";

var camera, scene, renderer;
var pointLight;
var angle = 0;
var meshMaterial;
var teapots = [];
var mesh;
var sceneRTT,renderTarget;
var quad;
var imposterCam;
var imposterRadius;
var controls;


function init(){
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor (0x888888);
	renderer.setSize(window.innerWidth,window.innerHeight);
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	sceneRTT = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.set(200,400,0);
	controls = new OrbitControls(camera, renderer.domElement);
	controls.minPolarAngle = THREE.Math.degToRad(30);
	controls.maxPolarAngle = THREE.Math.degToRad(80);
	controls.minDistance = 200;
	controls.maxDistance = 500;
	imposterCam = new THREE.PerspectiveCamera();
	imposterCam.copy (camera);
	
	
	var loader = new THREE.TextureLoader();
	var texture = loader.load(
	//'https://threejs.org/examples/textures/hardwood2_diffuse.jpg',
    
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
	
	
	var geometry = new TeapotGeometry (4);
	geometry.computeBoundingSphere();
	imposterRadius = geometry.boundingSphere.radius;
    mesh = new THREE.Mesh(geometry, meshMaterial);
	sceneRTT.add(mesh);
	
	renderTarget = new THREE.WebGLRenderTarget(
      1024, 1024, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBFormat
      }
    );
		
	let plane = new THREE.PlaneBufferGeometry(30, 15);
    let rttmaterial = new THREE.ShaderMaterial({
  	  uniforms:{
  		mytex:{
    		type:"T",
    		value: renderTarget.texture
   	    }
 	  },
  	  side: THREE.DoubleSide,
      vertexShader:[
	    "varying vec2 vUv;",
		"void main() {",
		"gl_Position = projectionMatrix* modelViewMatrix * vec4( position, 1.0);",
		"vUv = uv;",
		"}"
	  ].join("\n"),
      fragmentShader:[
	    "uniform sampler2D mytex;",
		"varying vec2 vUv;",
 
		"void main() {",
		"vec4 myColor = texture2D(mytex,vUv);",
   
		"if(myColor.r == 1.0 && myColor.g == 1.0 && myColor.b == 0.0)",
			"discard;",
		"else",
			"gl_FragColor = myColor;",
		"}"
	  ].join("\n")
    });
	
	
	for(var x=-90,z=90,i=0;i<100;i++,x+=20){
		var quad = new THREE.Mesh(plane,rttmaterial);
		quad.position.set(x,4,z);
		teapots.push(quad)
		scene.add(quad);
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
	mesh.material.uniforms.lightpos.value.copy (pointLight.position);
    mesh.rotation.y = 1.3*angle;
	
	let d = imposterRadius/Math.sin(imposterCam.fov/180*Math.PI/2);
	imposterCam.position.copy ( (camera.position.clone().sub(controls.target)).setLength(d) );
	imposterCam.lookAt (0,0,0);
	
	
	renderer.setRenderTarget (renderTarget);
    renderer.setClearColor(0xffff00);
    renderer.render(sceneRTT, imposterCam);

    // render texture to quad
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x888888);
    renderer.render(scene, camera);
    teapots.forEach(function (b){b.lookAt(camera.position);});
	//quad.lookAt (camera.position);
	
   
    requestAnimationFrame(animate);
    render();
}
export{camera, scene, renderer};
export{init,animate};
