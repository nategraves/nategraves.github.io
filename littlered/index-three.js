var canvas = document.getElementById('interactive');
var scene = new THREE.Scene();
scene.background = new THREE.Color();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / canvas.clientHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, canvas.clientHeight );
canvas.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 3, 3, 3 );
var material = new THREE.MeshBasicMaterial( { color: 0xfd5139 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

// load a texture, set wrap mode to repeat
var logo = new THREE.TextureLoader().load( "logo.svg" );

var animate = function () {
  requestAnimationFrame( animate );

  cube.rotation.x += 0.005;
  cube.rotation.y += 0.005;

  renderer.render(scene, camera);
};

animate();