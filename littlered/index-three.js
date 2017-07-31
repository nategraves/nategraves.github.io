var canvas = document.getElementById('interactive');
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, canvas.innerWidth / canvas.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( canvas.innerWidth, canvas.innerHeight );
canvas.appendChild( renderer.domElement );