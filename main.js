import * as t3 from 'three';
import { OrbitControls } from 'OrbitControls';
import { FirstPersonControls } from 'FirstPersonControls';

import fragment from './shaders/fragment.js';
import vertex from './shaders/vertex.js';
import { Vector3 } from 'three';
import { myController } from './controller.js';

const scene = new t3.Scene();
const cameraRaymarching = new t3.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0001, 1000);
const camera = new t3.OrthographicCamera(- 10, 10, 10, -10, 0.0, 1000);

const renderer = new t3.WebGLRenderer( {
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);


// const controls = new OrbitControls(camera, renderer.domElement);
// cameraRaymarching.position.setX(-200);

cameraRaymarching.position.setX(0);
cameraRaymarching.position.setY(50);
cameraRaymarching.position.setZ(0);
cameraRaymarching.lookAt(0., 0., 1.);
const controls = new FirstPersonControls(cameraRaymarching, renderer.domElement);
controls.movementSpeed = 200.;
controls.lookSpeed = 1.0;

// controls.

// const myControls = new myController(camera, renderer.domElement);
// camera.position.setZ(2000);

var heightMap = new t3.TextureLoader().load( 'images/heightmapblur.png' );
// heightMap.wrapS = t3.RepeatWrapping;
// heightMap.wrapT = t3.RepeatWrapping;
heightMap.magFilter = t3.LinearFilter;
heightMap.minFilter = t3.LinearFilter;
heightMap.generateMipmaps = true;

// heightMap.anisotropy = 16;

function createMesh() {
  const geometry = new t3.PlaneBufferGeometry(1, 1, 1, 1);
  const material = new t3.ShaderMaterial({
    fragmentShader: fragment,
    vertexShader: vertex,
    uniforms:{
      time:{type:"f", value:0},
      resolution:{ type:"v2", value:new t3.Vector2( window.innerWidth, window.innerHeight) },
      cameraTransform:{type:"mat4", value: cameraRaymarching.matrixWorld},
      lightPosition:{type:"vec3", value: new Vector3(0.)},
      noise:{type:"t", value: new t3.TextureLoader().load( 'images/noisest.png' )},
      heightmap:{type:"t", value: heightMap}
            }
    , side: t3.DoubleSide});
  const mesh = new t3.Mesh(geometry, material);
  return mesh;
}


var time = 0;
var plane = createMesh();
scene.add(plane);

camera.matrixAutoUpdate = true;
const fps = 60;
function animate() {
  controls.update(1. / fps);
  // myControls.update(1. / fps);

  if (time % 60 == 0)
  {
    console.debug(cameraRaymarching.position);
  }
    

  // plane.quaternion.copy(camera.quaternion);

  time++;
  plane.material.uniforms.time.value = time;
  plane.material.uniforms.cameraTransform.value = cameraRaymarching.matrixWorld;
  // plane.material.uniforms.lightPosition.value = new Vector3(35. * Math.cos(time*0.005), 500., 35. * Math.sin(time*0.005))
  plane.material.uniforms.lightPosition.value = new Vector3(0., 500., 0.)

  if (Math.cos(time * 0.005) == 1) {
    time = 0;
  }
  renderer.render(scene, camera);
  setTimeout(() => {
    requestAnimationFrame(animate);
  }, 1000 / fps);
}
  
animate();