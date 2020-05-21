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

fs.writeFileSync('../data/500.json', JSON.stringify({
  nodes: getNodes(500),
  links: getLinks(500 - 1)
}))

fs.writeFileSync('../data/50.json', JSON.stringify({
  nodes: getNodes(50),
  links: getLinks(50 - 1)
}))

fs.writeFileSync('../data/5000.json', JSON.stringify({
  nodes: getNodes(5000),
  links: getLinks(5000 - 1)
}))

fs.writeFileSync('../data/10000.json', JSON.stringify({
  nodes: getNodes(10000),
  links: getLinks(10000 - 1)
}))

fs.writeFileSync('../data/50000.json', JSON.stringify({
  nodes: getNodes(50000),
  links: getLinks(50000 - 1)
}))
