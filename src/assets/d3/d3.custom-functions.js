
// data change

// data 


let root = d3.hierarchy(packageJson, function(d) {
    if(typeof d == "object")
     return Object.keys(d).filter(d=>d!="$name").map(k=>{
       if(typeof d[k] == "object") d[k].$name = k;
       else d[k] = k + " : " + d[k];
       return d[k];
     }); 
  })

// layout function 


//  *******************************************************************





// create hierarchiic graph



function graph(
  root,
  {
    // label = d => d.data.id,
    // highlight = () => false,
    marginLeft = 40,
  } = {}
) {
  // Research -- deconstructing  line 32

  // Research -- linkHorizontal  was macht das
  // WHY unklar
  const treeLink = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x);

  // geändert Treelayout
  root = treeLayout(root);

  let x0 = Infinity;
  let x1 = -x0;
  root.each((d) => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, 33, x1 - x0 + dx * 2])
    .style("overflow", "visible");

  const g = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("transform", `translate(${marginLeft},${dx - x0})`);

  const link = g
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")

    // .attr("stroke", d => highlight(d.source) && highlight(d.target) ? "red" : null)
    // .attr("stroke-opacity", d => highlight(d.source) && highlight(d.target) ? 1 : null)

    .attr("d", treeLink);

  const node = g
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.y},${d.x})`);

  // node.append("circle")
  //     .attr("fill", d => highlight(d) ? "red" : d.children ? "#555" : "#999")
  //     .attr("r", 2.5);

  // node.append("text")
  //     .attr("fill", d => highlight(d) ? "red" : null)
  //     .attr("dy", "0.31em")
  //     .attr("x", d => d.children ? -6 : 6)
  //     .attr("text-anchor", d => d.children ? "end" : "start")
  //     .text(label)
  //   .clone(true).lower()
  //     .attr("stroke", "white");

  //     d3.select(divRef).append(function(){return svg.node();});

  return svg.node();
}

