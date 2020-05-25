// importScripts('file:///users/wanghaixia/Documents/York/Code/force-compare/node_modules/d3/dist/d3.min.js');
const d3 = require('d3/dist/d3.min.js');
const {
    ForceProps
} = require('./Config.js');

// use string-replace-loader to load js content
let simulation = null;
let nodesThreshold = 5000;
// 当前迭代
let index = null;
// 迭代次数
let iterate = null;
// 最小迭代
let minIterate = 50;

function startHandler(event) {
    const {
        links,
        nodes,
        center = {
            x: ForceProps.center.x,
            y: ForceProps.center.y 
        },
        manyBodyProps = {
            strength: ForceProps.manyBodyProps.strength,
            distanceMin: ForceProps.manyBodyProps.distanceMin,
            distanceMax: ForceProps.manyBodyProps.distanceMax 
        },
        linkProps = {
            distance: ForceProps.linkProps.distance,
        },
        collideProps = {
            radius: ForceProps.collideProps.radius,
        },
        alphaDecay = ForceProps.alphaDecay,
        alphaMin = ForceProps.alphaMin,
    } = event.data;

    simulation = d3.forceSimulation(nodes)
        .force(
            'link',
            d3.forceLink(links).id(d => d.id)
                .distance(linkProps.distance)
        )
        .force(
            'charge',
            d3.forceManyBody().strength(manyBodyProps.strength)
            .distanceMax(manyBodyProps.distanceMax)
            .distanceMin(manyBodyProps.distanceMin)
        )
        .force(
            'collision',
            d3.forceCollide().radius(collideProps.radius)
        )
        .force(
            'center',
            d3.forceCenter(center.x, center.y)
        );

    alphaDecay && simulation.alphaDecay(alphaDecay);
    alphaMin && simulation.alphaMin(alphaMin);
    
    simulation.on('tick', () => {
        const message = {
            type: 'tick',
            nodes,
            links,
        };
        postMessage(message);
    });
    simulation.on('end', () => {
        const message = {
            type: 'end',
            nodes,
            links,
        };
        postMessage(message);
    });
}

function stopHandler(event) {
    simulation.stop();
}

onmessage = (event) => {
    switch(event.data.type) {
        case 'start':
            startHandler(event);
            break;
        case 'stop':
            stopHandler(event);
            break;
    }
}