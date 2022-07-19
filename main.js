import * as t3 from 'three';
import { OrbitControls } from 'OrbitControls';

import fragment from './shaders/fragment.js';
import vertex from './shaders/vertex.js';
import { Vector3 } from 'three';

const scene = new t3.Scene();
const camera = new t3.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new t3.WebGLRenderer( {
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);

camera.position.setX(100);
camera.position.setY(50);
camera.lookAt(0., 0., 0.);
// camera.position.setZ(2000);

var heightMap = new t3.TextureLoader().load( 'images/heightmapblur.png' );
// heightMap.wrapS = t3.RepeatWrapping;
// heightMap.wrapT = t3.RepeatWrapping;
heightMap.magFilter = t3.LinearFilter;
heightMap.minFilter = t3.LinearFilter;
heightMap.generateMipmaps = true;
// heightMap.anisotropy = 16;

function createMesh() {
  const geometry = new t3.PlaneBufferGeometry(1, 1);
  const material = new t3.ShaderMaterial({
    fragmentShader: fragment,
    vertexShader: vertex,
    uniforms:{
      time:{type:"f", value:0},
      resolution:{ type:"v2", value:new t3.Vector2( window.innerWidth, window.innerHeight) },
      cameraTransform:{type:"mat4", value: camera.matrixWorld},
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
  controls.update();

  time++;
  plane.material.uniforms.time.value = time;
  plane.material.uniforms.cameraTransform.value = camera.matrixWorld;
  plane.material.uniforms.lightPosition.value = new Vector3(35. * Math.cos(time*0.005), 35., 35. * Math.sin(time*0.005))

  if (Math.cos(time * 0.005) == 1) {
    time = 0;
  }
  renderer.render(scene, camera);
  setTimeout(() => {
    requestAnimationFrame(animate);
  }, 1000 / fps);
}
  
animate();