import * as d3 from 'd3';
import {
    ForceProps,
    Extent,
    PathStrok,
    Radius
} from './Config';
import { getBoxSizing } from './utils';

let canvas = null;
let context = null;
let data = null;
let options = null;
let colorScale = null;
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
    
    genZoom();
    force();
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

function force() {
    const simulation = d3.forceSimulation(data.nodes)
        .force(
            'link',
            d3.forceLink(data.links)
                .id(d => d.id)
                .distance(ForceProps.linkProps.distance)
        )
        // 在 y轴 方向上施加一个力把整个图形压扁一点
        // .force('yt', d3.forceY().strength(() => 0.025)) 
        // .force('yb', d3.forceY(boxSizing.height).strength(() => 0.025))
        // 节点间相互排斥的电磁力
        .force(
            'charge',
            d3.forceManyBody()
                .strength(ForceProps.manyBodyProps.strength)
                .distanceMin(ForceProps.manyBodyProps.distanceMin)
                .distanceMax(ForceProps.manyBodyProps.distanceMax)
        )
        // 避免节点相互覆盖
        .force(
            'collision',
            d3.forceCollide()
                .radius(d => ForceProps.collideProps.radius * 2)
        )
        .force(
            'center',
            d3.forceCenter(boxSizing.width / 2, boxSizing.height / 2)
        );

    ForceProps.alphaDecay && simulation.alphaDecay(ForceProps.alphaDecay);
    ForceProps.alphaMin && simulation.alphaMin(ForceProps.alphaMin);

    // 创建一个弹簧力，根据 link 的 strength 值决定强度
    simulation
      .on('tick', ticked);
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