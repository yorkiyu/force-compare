import * as d3 from 'd3';
import { getBoxSizing } from './utils';
import dataJson from '../data';

let svg = null;
let data = null;
let options = null;
const pathStrok = '#E5E5E5';
const radius = 10;
const containerDom = document.getElementById('container');
const boxSizing = getBoxSizing(containerDom);

function init({ props }) {
    data = dataJson[props.dataName];
    options = props;
    const container = d3.selection(containerDom);
    svg = container.append('svg')
        .attr('width', boxSizing.width)
        .attr('height', boxSizing.height);

    force();
    render();
}

function force() {
    // 创建一个弹簧力，根据 link 的 strength 值决定强度
    const linkForce = d3.forceLink(data.links) 
        .id(d => d.id)
        // 资源节点与信息节点间的 strength 小一点，信息节点间的 strength 大一点
        .strength(1);
   
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', linkForce)
        // 在 y轴 方向上施加一个力把整个图形压扁一点
        .force('yt', d3.forceY().strength(() => 0.025)) 
        .force('yb', d3.forceY(boxSizing.height).strength(() => 0.025))
        // 节点间相互排斥的电磁力
        .force('charge', d3.forceManyBody().strength(-400))
        // 避免节点相互覆盖
        .force('collision', d3.forceCollide().radius(d => 4))
        .force('center', d3.forceCenter(boxSizing.width / 2, boxSizing.height / 2))
        .stop();


    // 手动调用 tick 使布局达到稳定状态
    const n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); 
    for (let i = 0; i < n; ++i) {
        simulation.tick();
    }
}

function getRandomColor(id) {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    return colorScale(id);
}

function render() {
    const path = svg.append('g')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('stroke-width', 1)
        .attr('stroke', pathStrok)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    const node = svg.append('g')
        .selectAll('circle')
        .data(data.nodes)
        .enter()
        .append('circle')
        .attr('r', radius)
        .attr('fill', d => getRandomColor(d.id))
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
}

export default init;