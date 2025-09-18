import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3-force';
import type { Dealership, EnrichedSale } from '../types';

interface DealershipNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  radius: number;
  dealership: Dealership;
}

interface MapChartProps {
  dealerships: Dealership[];
  sales: EnrichedSale[];
  onDealershipClick: (dealership: Dealership) => void;
}

const MapChart: React.FC<MapChartProps> = ({ dealerships, sales, onDealershipClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<DealershipNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const salesByDealership = useMemo(() => {
    return sales.reduce((acc, sale) => {
      acc[sale.dealershipId] = (acc[sale.dealershipId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [sales]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateDimensions();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const initialNodes: DealershipNode[] = dealerships.map(d => {
      const salesCount = salesByDealership[d.id] || 0;
      return {
        id: d.id,
        name: d.name,
        radius: 15 + Math.sqrt(salesCount) * 4, // Adjusted size
        x: d.coords.x % dimensions.width,
        y: d.coords.y % dimensions.height,
        dealership: d,
      };
    });

    setNodes(initialNodes);

    const simulation = d3.forceSimulation(initialNodes)
      .force('charge', d3.forceManyBody().strength(10))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as DealershipNode).radius + 4))
      .on('tick', () => {
        setNodes([...initialNodes]);
      });

    return () => simulation.stop();
  }, [dealerships, salesByDealership, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        <defs>
          <radialGradient id="bubble-gradient" cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2d3748" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={() => onDealershipClick(node.dealership)}
            className="cursor-pointer group"
          >
            <circle
              r={node.radius}
              fill="url(#bubble-gradient)"
              stroke="#4fd1c5"
              strokeWidth="2"
              className="transition-all duration-300 ease-in-out group-hover:stroke-white group-hover:stroke-width-4"
            />
            <text
              textAnchor="middle"
              dy=".3em"
              fill="white"
              fontSize={`${Math.max(10, node.radius / 3.5)}px`}
              fontWeight="bold"
              className="pointer-events-none transition-all duration-300 ease-in-out group-hover:fill-cyan-300"
            >
              {node.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MapChart;
