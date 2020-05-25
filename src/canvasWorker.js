import * as d3 from 'd3';
import ForceWorkerString from 'web-worker:./ForceWorkerString'
import {
    ForceProps,
    Extent,
    PathStrok,
    Radius
} from './Config'
import {
    getBoxSizing
} from './utils';

let canvas = null;
let context = null;
let data = null;
let options = null;
let colorScale = null;
let workerInstance = null;
let transform = d3.zoomIdentity;
const dpr = window.devicePixelRatio;
const extent = Extent;
const pathStrok = PathStrok;
const radius = Radius;
const containerDom = document.getElementById('container');
const boxSizing = getBoxSizing(containerDom);

function init({ props }) {
    data = window[props.dataName];
    options = props;
    canvas = createCanvas();
    context = canvas.getContext('2d');
    context.scale(dpr, dpr);
    
    initWorker();
    genZoom();
    start();
}

function createCanvas() {
    const canvasDom = document.createElement('canvas');
    canvasDom.style.width = `${boxSizing.width}px`;
    canvasDom.style.height = `${boxSizing.height}px`;
    canvasDom.width = boxSizing.width * dpr;
    canvasDom.height = boxSizing.height * dpr;
    containerDom.appendChild(canvasDom);
    return canvasDom;
}

function initWorker() {
    workerInstance = new ForceWorkerString();
}

function start() {
    const message = {
        type: 'start',
        nodes: data.nodes,
        links: data.links,
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
                data.nodes = event.data.nodes;
                data.links = event.data.links;
                ticked();
                break;
            case 'end':
                break;
        }
    };
}

function getRandomColor(id) {
    if (!colorScale) {
        colorScale = d3.scaleOrdinal()
            .domain([0, data.nodes.length - 1])
            .range(d3.schemeCategory10);
    }
    return colorScale(id);
}

function genZoom() {
    const zoom = d3.zoom()
        .scaleExtent(extent)
        .on('zoom', zoomed);
    d3.select(canvas)
        .call(zoom)
        .on('wheel', () => d3.event.preventDefault());
    d3.select(canvas)
        .call(zoom.transform, d3.zoomIdentity);
}

function zoomed() {
    transform = d3.event.transform;
    ticked();
}

function ticked() {
    context.save();
    context.clearRect(0, 0, boxSizing.width, boxSizing.height);
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    data.links.forEach(d => {
        context.beginPath();
        context.save();
        context.moveTo(d.source.x, d.source.y);
        context.lineTo(d.target.x, d.target.y);
        context.strokeStyle = pathStrok;
        context.stroke();
        context.restore();
    });

    data.nodes.forEach(d => {
        context.save();
        context.beginPath();
        context.moveTo(d.x, d.y);
        context.arc(d.x, d.y, radius, 0, 2 * Math.PI);
        context.fillStyle = getRandomColor(d.id);
        context.fill();
        context.restore();
    });
    context.restore();
}


export default init;