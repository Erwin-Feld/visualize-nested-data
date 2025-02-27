import { cloneDeep } from "lodash";

// d3.hierarchy funciton inside
// use if function is to create clone of data
function customHierarchy(d3, parentData, makeDataHirarchic) {
  if (Array.isArray(parentData)) {
    // packs Array inside Object
    // to not display a huge array /to cut it off
    const packInsideObject = { array: parentData };
    const clone = cloneDeep(packInsideObject);

    return d3.hierarchy(clone, makeDataHirarchic);
  } else {
    // create shallow copy of data to prevent mutation from
    const clone = cloneDeep(parentData);

    return d3.hierarchy(clone, makeDataHirarchic);
  }
}

// takes json and js objects trnasforms them
//  for d3.hirarchy function exabtable

function makeDataHirarchic(d) {
  if (typeof d === "object")
    return Object.keys(d)
      .filter((d) => d !== "$name")
      .map((k) => {
        if (typeof d[k] === "object") d[k].$name = k;
        else d[k] = k + " : " + d[k];
        return d[k];
      });
}

// Adjust Graph size and font on current windowWidth

function scaleGraphSize(currentScreenWidth) {
  // base stats
  const dx = 60;
  const dy = 80;

  const fontSize = 9;
  const textPositionX = -10;
  const textPositionY = -10;

  const linkWidth = 1.8;

  const radiusActiveEnd = 6;
  const radiusDeadEnd = 3;
  const radiusFill = 3;

  // mobile and tablet
  if (currentScreenWidth < 768) {
    return {
      dx: dx + 10,
      dy: dy + 20,
      fontSize,
      textPositionX,
      textPositionY,
      linkWidth,
      radiusActiveEnd,
      radiusDeadEnd,
      radiusFill,
    };

    // Laptop 1024
  } else if (currentScreenWidth > 768 && currentScreenWidth <= 1440) {
    return {
      dx: dx + 25,
      dy: dy + 90,
      fontSize: fontSize + 4,
      textPositionX: textPositionX - 10, // - because base stats are minus adding
      textPositionY: textPositionY - 15,
      linkWidth: linkWidth + 2,
      radiusActiveEnd: radiusActiveEnd + 4,
      radiusDeadEnd: radiusDeadEnd + 2,
      radiusFill: radiusFill + 1,
    };

    // Desktop 1440
  } else {
    return {
      dx: dx + 50,
      dy: dy + 160,
      fontSize: fontSize + 6,
      textPositionX: textPositionX - 10, // - because base stats are minus adding
      textPositionY: textPositionY - 15,
      linkWidth: linkWidth + 2,
      radiusActiveEnd: radiusActiveEnd + 7,
      radiusDeadEnd: radiusDeadEnd + 4,
      radiusFill: radiusFill + 2,
    };

  }
}

function zoomGraph(d3, root, divRef, currentWidth) {
  // d3 --> library
  //  root --> data transformed hirarchically
  // divRef ref ---> for selecting parent div container

  const {
    dx,
    dy,
    fontSize,
    textPositionX,
    textPositionY,
    linkWidth,
    radiusActiveEnd,
    radiusDeadEnd,
    radiusFill,
  } = scaleGraphSize(currentWidth);

  // maps the nodes
  const tree = d3.tree().nodeSize([dx, dy]);

  //  horizontal positiion of the graph
  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x);

  // ****************

  root.x0 = 0;
  root.y0 = dy / 2;
  // --> starting coordinates from the root object
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth) d.children = null;
  });

  const svg = d3
    .create("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    // spans the svg over whole avaible space
    .attr("width", "100%")
    .attr("height", "100%")
    .classed("svg-graph", true)
    .style("font", `${fontSize}px monospace`)
    .style("user-select", "none");

  const g = svg
    .append("g")
    // positon of g element
    .attr("class", "parent-g");

  const gLink = g
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", linkWidth);
  // **************** zoom event ************************

  const gNode = g
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  const zoomBehaviours = d3
    .zoom()
    .scaleExtent([0.1, 3]) //zoom scale
    // find correct scale level
    .on("zoom", (event, d) => {
      //  https://observablehq.com/@d3/d3v6-migration-guide
      // ****changed to version 7****
      g.attr("transform", event.transform);
    });

  svg.call(zoomBehaviours);

  setTimeout(() => {
    // gets reactive size  of parent width to place graph at calculated position
    const parentWidth = divRef.value.clientWidth;
    const parentHeight = divRef.value.clientHeight;
    zoomBehaviours.translateTo(svg, parentWidth / 4, parentHeight / 6), 100;
  });

  update(root);

  function update(source) {
    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    const transition = svg
      .transition()
      .duration(duration)
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      //  .attr("classed", (d) => (d._children ? "node" : "leaf"))
      // ****changed to version 7****
      .on("click", (event, d) => {
        // console.log(`click event ${d}`)
        d.children = d.children ? null : d._children;
        update(d);
        // ****changed to version 7****
        if (event && event.altKey) {
          setTimeout(() => {
            zoomToFit();
          }, duration + 100);
        }
      });

    const nodeShape = nodeEnter
      .append("circle")
      .attr("classed", (d) => (d._children ? "node-" : "leaf"))
      // .attr("r", 8)
      .attr("r", (d) => (d._children ? radiusActiveEnd : radiusDeadEnd))
      .attr("fill", (d) => (d._children ? "none" : "#999"))
      .attr("stroke", (d) => (d._children ? "#F8485E" : "#999"))
      .attr("stroke-width", radiusFill);

    nodeEnter
      .append("text")
      .text(function(d) {
        return d.data.$name || d.data;
      })
      .attr("y", textPositionY)
      .attr("x", textPositionX)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("text-anchor", "middle");

    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path").data(links, (d) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d) => {
        const o = { y: source.x0, x: source.y0 };
        return diagonal({ source: o, target: o });
      });
    // Transition links to their new position.
    link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d) => {
        const o = { y: source.x, x: source.y };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      d.y0 = d.x;
      d.x0 = d.y;
    });
  }

  function zoomToFit(paddingPercent) {
    const bounds = g.node().getBBox();
    const parent = svg.node().parentElement;
    const fullWidth = parent.clientWidth;
    const fullHeight = parent.clientHeight;

    const width = bounds.width;
    const height = bounds.height;

    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width == 0 || height == 0) return; // nothing to fit

    const scale =
      (paddingPercent || 0.75) /
      Math.max(width / fullWidth, height / fullHeight);
    const translate = [
      fullWidth / 2 - scale * midX,
      fullHeight / 2 - scale * midY,
    ];

    const transform = d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale);

    svg
      .transition()
      .duration(500)
      .call(zoomBehaviours.transform, transform);
  }

  return svg.node();
}

export { zoomGraph, scaleGraphSize, makeDataHirarchic, customHierarchy };
