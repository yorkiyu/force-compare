const fs = require('fs')

function getNodes (numbers) {
  return Array(numbers).fill(0).map((v, i) => {
    return {
      id: i,
      label: `节点${i}`
    }
  })
}

function getLinks (numbers) {
  return Array(numbers).fill(0).map((v, i) => {
    const info = {
      source: Math.floor(Math.sqrt(i)),
      target: i + 1
    };
    return {
      ...info,
      id: `${info.source}-${info.target}`,  
      label: `${info.source}-${info.target}`,  
    }
  })
}

fs.writeFileSync('../data/500.js', `window.data500 = ${JSON.stringify({
  nodes: getNodes(500),
  links: getLinks(500 - 1)
})}`)

fs.writeFileSync('../data/50.js', `window.data50 = ${JSON.stringify({
  nodes: getNodes(50),
  links: getLinks(50 - 1)
})}`)

fs.writeFileSync('../data/5000.js', `window.data5000 = ${JSON.stringify({
  nodes: getNodes(5000),
  links: getLinks(5000 - 1)
})}`)

fs.writeFileSync('../data/10000.js', `window.data10000 = ${JSON.stringify({
  nodes: getNodes(10000),
  links: getLinks(10000 - 1)
})}`)

fs.writeFileSync('../data/50000.js', `window.data50000 = ${JSON.stringify({
  nodes: getNodes(50000),
  links: getLinks(50000 - 1)
})}`)
