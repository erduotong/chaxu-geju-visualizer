import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData, Node, Link, MoralType, NetworkState } from '../types';

interface GraphVisualizationProps {
  data: GraphData;
  moralTypes: MoralType[];
  networkState: NetworkState;
  width?: number;
  height?: number;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  moralTypes,
  networkState,
  width = 800,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);

  // Initialize simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Deep copy data to avoid mutation issues in React strict mode or re-renders
    // D3 modifies the objects in place (string ids -> Node objects)
    const nodesCopy = data.nodes.map(n => ({...n}));
    const linksCopy = data.links.map(l => ({...l}));

    // Simulation setup
    const simulation = d3.forceSimulation<Node>(nodesCopy)
      .force("link", d3.forceLink<Node, Link>(linksCopy).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    simulationRef.current = simulation;

    // --- Draw Elements ---

    // Arrowhead markers
    const defs = svg.append("defs");
    moralTypes.forEach((type) => {
      defs.append("marker")
        .attr("id", `arrow-${type.id}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25) // Offset
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", type.color);
    });

    // Links Group
    const linkGroup = g.append("g").attr("class", "links");
    
    // Link Lines
    const link = linkGroup
      .selectAll("line")
      .data(linksCopy)
      .enter().append("line")
      .attr("stroke-width", 2)
      .attr("marker-end", (d) => `url(#arrow-${d.typeId})`);

    // Link Labels
    const linkLabel = linkGroup
      .selectAll("text")
      .data(linksCopy)
      .enter().append("text")
      .text((d) => moralTypes.find(t => t.id === d.typeId)?.name || '')
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("pointer-events", "none")
      // Halo effect for readability
      .style("text-shadow", "0 0 3px white, 0 0 3px white, 0 0 3px white");

    // Nodes Group
    const nodeGroup = g.append("g").attr("class", "nodes");
    
    const node = nodeGroup
      .selectAll("g")
      .data(nodesCopy)
      .enter().append("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node circles
    node.append("circle")
      .attr("r", (d) => d.isSelf ? 25 : 15)
      .attr("fill", (d) => d.isSelf ? "#ef4444" : "#f1f5f9")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2);

    // Node labels
    node.append("text")
      .text((d) => d.label)
      .attr("x", 0)
      .attr("y", (d) => d.isSelf ? 35 : 25)
      .attr("text-anchor", "middle")
      .attr("class", "text-xs font-semibold fill-slate-700 pointer-events-none select-none");

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      linkLabel
        .attr("x", (d) => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr("y", (d) => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      node
        .attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height, moralTypes]);

  // Update Visuals (Colors/Opacity)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const { activeNodeIds, activeLinkIndices } = networkState;

    const getTypeColor = (id: string) => moralTypes.find(t => t.id === id)?.color || '#94a3b8';

    // Update Links Lines
    svg.selectAll(".links line")
      .transition().duration(300)
      .attr("stroke", (d: any, i) => {
        const isActive = activeLinkIndices.has(i);
        return isActive ? getTypeColor(d.typeId) : "#e2e8f0";
      })
      .attr("opacity", (d: any, i) => activeLinkIndices.has(i) ? 1 : 0.1);

    // Update Link Labels
    svg.selectAll(".links text")
        .transition().duration(300)
        .attr("opacity", (d: any, i) => activeLinkIndices.has(i) ? 1 : 0)
        .text((d: any) => moralTypes.find(t => t.id === d.typeId)?.name || '');

    // Update Nodes
    svg.selectAll(".nodes circle")
      .transition().duration(300)
      .attr("fill", (d: any) => {
        if (d.isSelf) return "#ef4444";
        return activeNodeIds.has(d.id) ? "#fff" : "#f1f5f9";
      })
      .attr("stroke", (d: any) => {
         if (d.isSelf) return "#ef4444";
         return activeNodeIds.has(d.id) ? "#334155" : "#cbd5e1";
      })
      .attr("stroke-width", (d: any) => activeNodeIds.has(d.id) ? 3 : 1)
      .attr("opacity", (d: any) => (d.isSelf || activeNodeIds.has(d.id)) ? 1 : 0.4);

    svg.selectAll(".nodes text")
       .transition().duration(300)
      .attr("opacity", (d: any) => (d.isSelf || activeNodeIds.has(d.id)) ? 1 : 0.3);

  }, [networkState, moralTypes]); 

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-slate-50 border border-slate-200">
      <svg ref={svgRef} width={width} height={height} className="block w-full h-full cursor-move" />
    </div>
  );
};

export default GraphVisualization;