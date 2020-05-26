import * as THREE from 'three';
import * as d3 from 'd3';
import cloneDeep from 'lodash/cloneDeep';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
    ForceProps,
    Extent,
    PathStrok,
    ColorWhite,
    Radius,
    CameraPositionZ,
    TriangleSegments
} from './Config';
import { getBoxSizing } from './utils';
import ForceWorkerString from 'web-worker:./ForceWorkerString.js';
const nodeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAXVBMVEVHcEzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMwFOyi9AAAAHnRSTlMA0BHa8CyIg/zFRKty/R9sFJnY3ip3wadLCi6KW5+O61oYAAABNklEQVRYw62X15bDIAxExyUGXBKXuDv6/8/Mw266nQDj+z5zDiCJEbDBtKjeNLHWcWN6tUxwYRxmo+UFbeZhtJSf205W6dqzhfygatmkVocf8jAP5CtBHn7Tp5n8JEu39adILIhOG/IyKcSKIinX9MdKrKmOK/qLOHD5cCgrcaJ6P0UijiRv91+4GhQvb5FG4kz0VA9hJh5kj5rMxYv83j+Bn0Fw6ywlnqj//q99Deq/+dCKNy0AjJ2/QTcCGIRgADAzBjMAwxgYYNKMgZ6wCMXiX0W3Wuo5g567QxGDhjNoEHMGMTRnoHkD+gj0JdLPSBcSXcp0M9HtTA8UfqTRQ5Ue6/THwn9t9OfKf+90wOAjDh2y+JjHB00+6tJhm4/7/MLBrzw7LF382scvnjusvjss327r/xU9OnbkMwnCfwAAAABJRU5ErkJggg==';
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let data = null;
let forceNodes = {
    geometry: null,
    positions: null,
    scale: null,
    material: null,
    mesh: null,
    nodes: null,
};
let forceLinks = {
    geometry: null,
    positions: null,
    colors: null,
    material: null,
    mesh: null,
    links: null,
};
let options = null;
let colorScale = null;
let workerInstance = null;
let rafId = null;
const dpr = window.devicePixelRatio;
const extent = Extent;
const radius = Radius;
const containerDom = document.getElementById('container');
const boxSizing = getBoxSizing(containerDom);

function init({ props }) {
    data = window[props.dataName];
    options = props;

    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true
    });
    renderer.setSize(boxSizing.width, boxSizing.height);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor('#fff');
    containerDom.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(45, boxSizing.width / boxSizing.height, 1, 10000);
    camera.position.set(0, 0, 1000)
    camera.up = new THREE.Vector3(0, 0, 1)
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);

    initWorker();
    initBasicMesh();
    installControls();
    start();
    startRender();
}

function initWorker() {
    workerInstance = new ForceWorkerString();
}

function initBasicMesh() {
    const color = new THREE.Color(0xffffff);
    forceNodes.geometry = new THREE.BufferGeometry();
    forceNodes.nodes = cloneDeep(data.nodes);
    forceNodes.positions = new Float32Array(data.nodes.length * 3);
    forceNodes.colors = new Float32Array(data.nodes.length * 3);
    forceNodes.sizes = new Float32Array(data.nodes.length);
    forceNodes.nodes.forEach((e, i) => {
        forceNodes.positions[i * 3] = -9999;
        forceNodes.positions[i * 3 + 1] = -9999;
        forceNodes.positions[i * 3 + 2] = 0;
        color.setStyle(getRandomColor(e.id));
        color.toArray(forceNodes.colors, i * 3);
        forceNodes.sizes[i] = radius * 2;
    });
    console.log(forceNodes);
    // forceNodes.material = new THREE.PointsMaterial({vertexColors: true, size: radius *  2});
    forceNodes.geometry.setAttribute('position', new THREE.BufferAttribute(forceNodes.positions, 3));
    forceNodes.geometry.setAttribute('ca', new THREE.BufferAttribute(forceNodes.colors, 3));
    forceNodes.geometry.setAttribute('size', new THREE.BufferAttribute(forceNodes.sizes, 1));
    forceNodes.geometry.attributes.position.needsUpdate = true;
    forceNodes.texture = new THREE.TextureLoader().load(nodeImage);
    forceNodes.texture.wrapS = THREE.RepeatWrapping;
    forceNodes.texture.wrapT = THREE.RepeatWrapping; 
    forceNodes.material = new THREE.ShaderMaterial( {
        uniforms: {
            color: { value: new THREE.Color( 0xffffff ) },
            pointTexture: { value: forceNodes.texture }
        },
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        transparent: true
    });
    forceNodes.geometry.computeBoundingSphere();
    forceNodes.mesh = new THREE.Points(forceNodes.geometry, forceNodes.material);
    forceNodes.mesh.name = 'nodes';
    scene.add(forceNodes.mesh);

    forceLinks.geometry = new THREE.BufferGeometry();
    forceLinks.positions = new Float32Array(data.links.length * 6);
    forceLinks.links = cloneDeep(data.links);
    forceLinks.material = new THREE.LineBasicMaterial({
        color: PathStrok,
        linewidth: 1,
    });
    forceLinks.links.forEach((e, i) => {
        forceLinks.positions[i * 6] = -9999;
        forceLinks.positions[i * 6 + 1] = -9999;
        forceLinks.positions[i * 6 + 2] = -0.001;
        forceLinks.positions[i * 6 + 3] = -9999;
        forceLinks.positions[i * 6 + 4] = -9999;
        forceLinks.positions[i * 6 + 5] = -0.001;
    });
    forceLinks.geometry.setAttribute('position', new THREE.BufferAttribute(forceLinks.positions, 3))
    forceLinks.geometry.attributes.position.needsUpdate = true
    forceLinks.geometry.computeBoundingSphere()
    
    forceLinks.mesh = new THREE.LineSegments(forceLinks.geometry, forceLinks.material)
    forceLinks.mesh.name = 'links'
    scene.add(forceLinks.mesh)
}

function start() {
    const message = {
        type: 'start',
        nodes: forceNodes.nodes,
        links: forceLinks.links,
        center: {
            x: boxSizing.width / 2,
            y: boxSizing.height / 2
        },
        manyBodyProps: {
            strength: ForceProps.manyBodyProps.strength,
            distanceMin: ForceProps.manyBodyProps.distanceMin,
            distanceMax: ForceProps.manyBodyProps.distanceMax
        },
        linkProps: {
            distance: ForceProps.linkProps.distance,
        },
        collideProps: {
            radius: ForceProps.collideProps.radius * 2,
        },
        alphaDecay: ForceProps.alphaDecay,
    }
    workerInstance.postMessage(message);
    workerInstance.onmessage = (event) => {
        switch (event.data.type) {
            case 'tick':
                forceNodes.nodes = event.data.nodes;
                forceLinks.links = event.data.links;
                ticked();
                break;
            case 'end':
                break;
        }
    };
}

function ticked() {
    forceLinks.links.forEach((e, i) => {
        forceLinks.positions[i * 6] = e.source.x;
        forceLinks.positions[i * 6 + 1] = e.source.y;
        forceLinks.positions[i * 6 + 2] = 0;
        forceLinks.positions[i * 6 + 3] = e.target.x;
        forceLinks.positions[i * 6 + 4] = e.target.y;
        forceLinks.positions[i * 6 + 5] = 0;
    });
    forceLinks.geometry.setAttribute('position', new THREE.BufferAttribute(forceLinks.positions, 3))
    forceLinks.geometry.attributes.position.needsUpdate = true
    forceLinks.geometry.computeBoundingSphere();
    
    forceNodes.nodes.forEach((e, i) => {
        forceNodes.positions[i * 3] = e.x;
        forceNodes.positions[i * 3 + 1] = e.y;
        forceNodes.positions[i * 3 + 2] = 0;
    });
    forceNodes.geometry.setAttribute('position', new THREE.BufferAttribute(forceNodes.positions, 3));
    forceNodes.geometry.attributes.position.needsUpdate = true
    forceNodes.geometry.computeBoundingSphere();
    startRender();
}


function startRender() {
    if (!rafId) {
        rafId = requestAnimationFrame(render);
    }
}

function render() {
    rafId = null;
    renderer.render(scene, camera);
    controls && controls.update();
    startRender();
}


function installControls () {
    controls = new MapControls(camera, renderer.domElement)
    controls.enableDamping = false;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2;
}

function getRandomColor(id) {
    if (!colorScale) {
        colorScale = d3.scaleOrdinal()
            .domain([0, data.nodes.length - 1])
            .range(d3.schemeCategory10);
    }
    return colorScale(id);
}


export default init;