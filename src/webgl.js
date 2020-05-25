import * as THREE from 'three';
import * as d3 from 'd3';
import cloneDeep from 'lodash/cloneDeep';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ForceWorkerString from 'web-worker:./ForceWorkerString.js';
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
console.log('', ForceWorkerString);
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let data = null;
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
    data.forceNodes = cloneDeep(data.nodes); 
    data.forceLinks = cloneDeep(data.links); 
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
    installControls();
    start();
    genEle();
    startRender();
}

function initWorker() {
    workerInstance = new ForceWorkerString();
}

function genEle() {
    data.links.forEach((link) => {
        link.material = new THREE.LineBasicMaterial({color: PathStrok, linewidth: 1,});
        link.geometry = new THREE.BufferGeometry();
        link.line = new THREE.Line(link.geometry, link.material);
        scene.add(link.line);
    });
    data.nodes.forEach((node) => {
        node.geometry = new THREE.CircleBufferGeometry(radius, TriangleSegments);
        node.material = new THREE.MeshBasicMaterial({ color: getRandomColor(node.id) });
        node.circle = new THREE.Mesh(node.geometry, node.material);
        scene.add(node.circle);
    });
}

function start() {
    const message = {
        type: 'start',
        nodes: data.forceNodes,
        links: data.forceLinks,
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
                data.forceNodes = event.data.nodes;
                data.forceLinks = event.data.links;
                ticked();
                break;
            case 'end':
                break;
        }
    };
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

function ticked() {
    data.forceNodes.forEach((node, i) => {
        const {x, y} = node;
        data.nodes[i].circle.position.set(x, y, 0);
        data.nodes[i] = {
            ...data.nodes[i],
            ...node
        };
    });
    data.forceLinks.forEach((link, i) => {
        const {source, target} = link;
        data.links[i].line.geometry.setFromPoints([
            new THREE.Vector3(source.x, source.y, -1),
            new THREE.Vector3(target.x, target.y, -1),
        ]);
        data.links[i] = {
            ...data.links[i],
            ...link
        };
    })
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