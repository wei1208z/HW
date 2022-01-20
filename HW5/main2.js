import * as THREE from "https://threejs.org/build/three.module.js";
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { TeapotGeometry } from "https://threejs.org/examples/jsm/geometries/TeapotGeometry.js";
import {render,onWindowResize} from "./render2.js";

var scene, renderer, camera,sceneRTT;
var mesh,pointLight, renderTarget;
var angle = 0;
var teapots = [];
var quad;
var imposterCam;
var imposterRadius;
var controls;

function init(){
  	sceneRTT = new THREE.Scene();
    scene = new THREE.Scene();
	
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
	
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.setClearColor(0x888888);


    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.y = 80;
    camera.position.z = 250;
    window.addEventListener('resize', onWindowResize, false);
    controls = new OrbitControls(camera, renderer.domElement);
	
	imposterCam = new THREE.PerspectiveCamera();
	imposterCam.copy (camera);

    pointLight = new THREE.PointLight(0xffffff);
    sceneRTT.add (pointLight);
    //sceneRTT.add (new THREE.PointLightHelper(pointLight, 5));

    var ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

 
    let meshMaterial = new THREE.ShaderMaterial({
        uniforms: {
        lightpos: {type: 'v3', value: new THREE.Vector3()}
        },
        vertexShader:[
			"uniform vec3 lightpos;",  // world coordinate
			"varying vec3 eyelightdir;",
			"varying vec3 eyenormal;" ,  
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
			"varying vec4 eyepos;",   
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
	for(var i = -90; i <= 90; i+= 20)
	  for(var j = 90; j >= -90; j-=20){
		var quad = new THREE.Mesh(plane,rttmaterial);
		quad.position.set(j,0,i);
		teapots.push(quad);
		scene.add(quad);
	  }
	  
    //scene.add (new THREE.AxesHelper (50));
}
function animate(){
	angle += 0.01;
    
    pointLight.position.set(50 * Math.cos(angle), 80, 50 * Math.sin(angle));    
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
export{scene,camera,init,animate,renderer};