import * as d3 from 'd3';
import {
    ForceProps,
    Extent,
    PathStrok,
    Radius
} from './Config'
import {
    getBoxSizing
} from './utils';

let svg = null;
let svgRootG = null;
let data = null;
let options = null;
let colorScale = null;
let paths = null;
let nodes = null;
const extent = Extent;
const pathStrok = PathStrok;
const radius = Radius;
const containerDom = document.getElementById('container');
const boxSizing = getBoxSizing(containerDom);

function init({ props }) {
    data = window[props.dataName];
    options = props;
    const container = d3.select('#container');
    svg = container.append('svg')
        .attr('width', boxSizing.width)
        .attr('height', boxSizing.height);
    svgRootG = svg.append('g');

    render();
    force();
    genZoom();
}

function force() {
    const simulation = d3.forceSimulation(data.nodes)
        .force(
            'link',
            d3.forceLink(data.links)
                .id(d => d.id)
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

    // 手动调用 tick 使布局达到稳定状态
    //const n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); 
    //for (let i = 0; i < n; ++i) {
    //    simulation.tick();
    //}
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
        .on('zoom', () => {
            svgRootG.attr('transform', d3.event.transform);
        });
    svg.call(zoom)
        .on('wheel', () => d3.event.preventDefault());
    svg.call(zoom.transform, d3.zoomIdentity);
}

function render() {
    paths = svgRootG.append('g')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('stroke-width', 1)
        .attr('stroke', pathStrok);
    nodes = svgRootG.append('g')
        .selectAll('circle')
        .data(data.nodes)
        .enter()
        .append('circle')
        .attr('r', radius)
        .attr('fill', d => getRandomColor(d.id));
}

function ticked() {
    paths.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    nodes.attr('cx', d => d.x)
        .attr('cy', d => d.y);
}

export default init;