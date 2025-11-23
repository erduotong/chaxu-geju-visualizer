export interface Node {
  id: string;
  label: string;
  isSelf?: boolean;
  group?: number;
  // D3 force simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface MoralType {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface Link {
  source: string | Node; // D3 converts string IDs to Node objects
  target: string | Node;
  typeId: string; // References MoralType.id
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

// For BFS Calculation results
export interface NetworkState {
  activeNodeIds: Set<string>;
  activeLinkIndices: Set<number>;
}
