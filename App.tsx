import React, { useState, useMemo, useEffect, useCallback } from 'react';
import GraphVisualization from './components/GraphVisualization';
import Controls from './components/Controls';
import { GraphData, MoralType, Link, Node, NetworkState } from './types';

// --- Initial Data ---

const INITIAL_NODES: Node[] = [
  { id: 'self', label: '自我', isSelf: true, group: 0 },
  
  // --- 父亲线 (Paternal Line - Deep) ---
  // Level 1
  { id: 'father', label: '父亲', group: 1 },
  // Level 2
  { id: 'p_grandfather', label: '祖父', group: 1 },
  { id: 'p_uncle', label: '大伯', group: 1 },
  // Level 3
  { id: 'p_great_grandfather', label: '曾祖父', group: 1 },
  { id: 'clan_elder', label: '族长', group: 1 },
  { id: 'p_cousin', label: '堂兄', group: 1 },
  // Level 4
  { id: 'p_great_great_grandfather', label: '高祖父', group: 1 },
  { id: 'ancestral_hall_keeper', label: '宗祠守门人', group: 4 },
  // Level 5
  { id: 'lineage_ancestor', label: '列祖列宗', group: 5 },

  // --- 母亲线 (Maternal Line - Deep) ---
  // Level 1
  { id: 'mother', label: '母亲', group: 1 },
  // Level 2
  { id: 'm_grandmother', label: '外祖母', group: 1 },
  { id: 'm_grandfather', label: '外祖父', group: 1 },
  // Level 3
  { id: 'm_uncle', label: '舅舅', group: 1 },
  { id: 'm_aunt', label: '姨妈', group: 1 },
  // Level 4
  { id: 'm_clan_head', label: '外家家主', group: 1 },

  // --- 其他分支 (Other branches) ---
  { id: 'spouse', label: '配偶', group: 1 },
  { id: 'child1', label: '长子', group: 1 },
  { id: 'friend1', label: '挚友', group: 2 },
  { id: 'friend_old', label: '发小', group: 2 },
  { id: 'colleague1', label: '部门经理', group: 3 },
  { id: 'big_boss', label: '董事长', group: 3 },
];

const INITIAL_TYPES: MoralType[] = [
  { id: 'kinship', name: '血缘 (亲情)', color: '#ef4444', description: '基于血统的直接联系' },
  { id: 'affinity', name: '姻亲 (连理)', color: '#f97316', description: '基于婚姻的联系' },
  { id: 'friendship', name: '私人友谊 (交情)', color: '#3b82f6', description: '基于个人情感的联系' },
  { id: 'geo_work', name: '地缘/业缘 (公德)', color: '#64748b', description: '基于居住地或职业的联系' },
  { id: 'respect', name: '尊卑/师徒 (伦理)', color: '#8b5cf6', description: '基于社会地位或辈分的联系' },
];

const INITIAL_LINKS: Link[] = [
  // Self connections
  { source: 'self', target: 'father', typeId: 'kinship' },
  { source: 'self', target: 'mother', typeId: 'kinship' },
  { source: 'self', target: 'spouse', typeId: 'affinity' },
  { source: 'self', target: 'child1', typeId: 'kinship' },
  { source: 'self', target: 'friend1', typeId: 'friendship' },
  { source: 'self', target: 'colleague1', typeId: 'geo_work' },

  // Father Line (Deep Chains)
  { source: 'father', target: 'p_grandfather', typeId: 'kinship' },
  { source: 'father', target: 'p_uncle', typeId: 'kinship' },
  
  { source: 'p_grandfather', target: 'p_great_grandfather', typeId: 'kinship' },
  { source: 'p_grandfather', target: 'clan_elder', typeId: 'respect' },
  
  { source: 'p_uncle', target: 'p_cousin', typeId: 'kinship' },

  { source: 'p_great_grandfather', target: 'p_great_great_grandfather', typeId: 'kinship' },
  { source: 'clan_elder', target: 'ancestral_hall_keeper', typeId: 'respect' },
  
  { source: 'p_great_great_grandfather', target: 'lineage_ancestor', typeId: 'respect' }, // Deepest level

  // Mother Line (Deep Chains)
  { source: 'mother', target: 'm_grandmother', typeId: 'kinship' },
  { source: 'mother', target: 'm_grandfather', typeId: 'kinship' },
  
  { source: 'm_grandmother', target: 'm_aunt', typeId: 'kinship' },
  { source: 'm_grandfather', target: 'm_uncle', typeId: 'kinship' },
  
  { source: 'm_uncle', target: 'm_clan_head', typeId: 'respect' },

  // Other Extensions
  { source: 'friend1', target: 'friend_old', typeId: 'friendship' },
  { source: 'colleague1', target: 'big_boss', typeId: 'respect' },
];

const STORAGE_KEY = 'chaxu_geju_data_v1';

const App: React.FC = () => {
  // --- State Initialization ---
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [links, setLinks] = useState<Link[]>(INITIAL_LINKS);
  const [moralTypes, setMoralTypes] = useState<MoralType[]>(INITIAL_TYPES);
  
  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.links && parsed.moralTypes) {
          setNodes(parsed.nodes);
          setLinks(parsed.links);
          setMoralTypes(parsed.moralTypes);
        }
      }
    } catch (e) {
      console.error("Failed to load from local storage", e);
    }
  }, []);

  // Save to local storage whenever data changes
  useEffect(() => {
    const dataToSave = {
      nodes,
      // D3 modifies link objects, so we need to extract IDs when saving
      links: links.map(l => ({
        source: typeof l.source === 'object' ? (l.source as Node).id : l.source,
        target: typeof l.target === 'object' ? (l.target as Node).id : l.target,
        typeId: l.typeId
      })),
      moralTypes
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [nodes, links, moralTypes]);

  // Filter State
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(INITIAL_TYPES.map(t => t.id));
  const [depth, setDepth] = useState<number>(2); // Default slightly larger to see structure
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Update window size
  useEffect(() => {
    const handleResize = () => {
      setContainerSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Logic: BFS / Ripple Effect ---
  
  const networkState = useMemo<NetworkState>(() => {
    const activeNodeIds = new Set<string>();
    const activeLinkIndices = new Set<number>();
    
    // Always include Self
    activeNodeIds.add('self');
    
    // Optimize access
    const adj: Record<string, { target: string, typeId: string, index: number }[]> = {};
    
    // Build adjacency list (directed)
    links.forEach((l, i) => {
        const sourceId = typeof l.source === 'object' ? (l.source as Node).id : l.source as string;
        const targetId = typeof l.target === 'object' ? (l.target as Node).id : l.target as string;
        
        if (!adj[sourceId]) adj[sourceId] = [];
        adj[sourceId].push({ target: targetId, typeId: l.typeId, index: i });
    });

    if (depth > 0) {
        let currentQueue = ['self'];
        let nextQueue: string[] = [];
        let visited = new Set<string>(['self']);

        for (let d = 0; d < depth; d++) {
            nextQueue = [];
            for (const nodeId of currentQueue) {
                const neighbors = adj[nodeId] || [];
                for (const edge of neighbors) {
                    // Check if edge type is selected
                    if (selectedTypeIds.includes(edge.typeId)) {
                        activeLinkIndices.add(edge.index);
                        
                        if (!visited.has(edge.target)) {
                            visited.add(edge.target);
                            activeNodeIds.add(edge.target);
                            nextQueue.push(edge.target);
                        } else {
                            // If visited but valid path, ensure node is active
                            activeNodeIds.add(edge.target);
                        }
                    }
                }
            }
            if (nextQueue.length === 0) break;
            currentQueue = nextQueue;
        }
    }

    return { activeNodeIds, activeLinkIndices };
  }, [nodes, links, selectedTypeIds, depth]);


  // --- Handlers ---

  const handleToggleType = (id: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleToggleAllTypes = (selectAll: boolean) => {
    if (selectAll) {
        setSelectedTypeIds(moralTypes.map(t => t.id));
    } else {
        setSelectedTypeIds([]);
    }
  };

  const handleAddNode = (label: string, edgeType: string, parentId: string) => {
    const newId = 'node_' + Date.now();
    const newNode: Node = {
      id: newId,
      label: label,
      group: 2
    };

    const newLink: Link = {
        source: parentId,
        target: newId,
        typeId: edgeType
    };

    setNodes(prev => [...prev, newNode]);
    setLinks(prev => [...prev, newLink]);
  };

  const handleUpdateNode = (id: string, label: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n));
  };

  const handleDeleteNode = (id: string) => {
    if (id === 'self') return; // Cannot delete self
    setNodes(prev => prev.filter(n => n.id !== id));
    setLinks(prev => prev.filter(l => {
      const s = typeof l.source === 'object' ? (l.source as Node).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as Node).id : l.target;
      return s !== id && t !== id;
    }));
  };

  // --- Link Handlers ---
  const handleUpdateLink = (index: number, newLink: Link) => {
    setLinks(prev => {
        const copy = [...prev];
        // Ensure we preserve the object references if D3 has already processed them, 
        // OR rely on GraphVisualization to re-process if IDs change.
        // For simplicity, we just update the data. D3 might need a re-run or will handle it in the Effect.
        copy[index] = newLink;
        return copy;
    });
  };

  const handleDeleteLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  // --- Type Handlers ---
  const handleAddType = (name: string, color: string) => {
      const newType: MoralType = {
          id: 'type_' + Date.now(),
          name,
          color,
          description: 'Custom type'
      };
      setMoralTypes(prev => [...prev, newType]);
      setSelectedTypeIds(prev => [...prev, newType.id]); // Auto select
  };

  const handleUpdateMoralType = (id: string, name: string, color: string) => {
    setMoralTypes(prev => prev.map(t => t.id === id ? { ...t, name, color } : t));
  };

  const handleDeleteMoralType = (id: string) => {
    setMoralTypes(prev => prev.filter(t => t.id !== id));
    // Remove links associated with this type
    setLinks(prev => prev.filter(l => l.typeId !== id));
    // Remove from selection
    setSelectedTypeIds(prev => prev.filter(tid => tid !== id));
  };

  const handleReset = useCallback(() => {
    if (window.confirm("确定要重置所有数据吗？这将清除你自定义的所有人物和关系。")) {
      localStorage.removeItem(STORAGE_KEY);
      setNodes(INITIAL_NODES);
      setLinks(INITIAL_LINKS);
      setMoralTypes(INITIAL_TYPES);
      setDepth(2);
      setSelectedTypeIds(INITIAL_TYPES.map(t => t.id));
    }
  }, []);

  // Memoize graph data to prevent unnecessary re-renders of the visualization simulation
  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none">
        <div className="flex justify-between items-start">
             <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">差序格局 <span className="text-slate-400 font-light">| Chaxu Geju</span></h1>
                <p className="text-slate-600 max-w-lg mt-1 text-sm bg-white/50 backdrop-blur-sm p-2 rounded-lg pointer-events-auto">
                    费孝通《乡土中国》社会结构可视化。<br/>
                    “好像把一块石头丢在水里，水面上一圈圈推出去的波纹……每个人都是他社会影响所推出去的圈子的中心。” 
                </p>
             </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="absolute inset-0 z-0">
        <GraphVisualization 
            data={graphData}
            moralTypes={moralTypes}
            networkState={networkState}
            width={containerSize.width}
            height={containerSize.height}
        />
      </div>

      {/* Sidebar Controls */}
      <div className="absolute top-24 right-4 z-20 flex flex-col items-end gap-4 pointer-events-auto">
        <Controls 
            moralTypes={moralTypes}
            selectedTypeIds={selectedTypeIds}
            depth={depth}
            maxDepth={10} 
            nodes={nodes}
            links={links}
            onToggleType={handleToggleType}
            onToggleAllTypes={handleToggleAllTypes}
            onDepthChange={setDepth}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            onAddType={handleAddType}
            onUpdateMoralType={handleUpdateMoralType}
            onDeleteMoralType={handleDeleteMoralType}
            onReset={handleReset}
        />
      </div>
      
      {/* Legend / Key Stats */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-lg border border-slate-200 shadow-sm pointer-events-auto">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">当前可见网络 (VISIBLE NETWORK)</h4>
              <div className="flex gap-4 text-sm text-slate-700">
                  <div className="flex flex-col items-center">
                      <span className="font-bold text-lg">{networkState.activeNodeIds.size}</span>
                      <span className="text-xs text-slate-500">人物 (People)</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <span className="font-bold text-lg">{networkState.activeLinkIndices.size}</span>
                      <span className="text-xs text-slate-500">关系 (Bonds)</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default App;