import React, { useState } from 'react';
import { MoralType, Node, Link } from '../types';

interface ControlsProps {
  moralTypes: MoralType[];
  selectedTypeIds: string[];
  depth: number;
  maxDepth: number;
  onToggleType: (id: string) => void;
  onToggleAllTypes: (selectAll: boolean) => void;
  onDepthChange: (val: number) => void;
  
  // Node Actions
  onAddNode: (label: string, edgeType: string, parentId: string) => void;
  onUpdateNode: (id: string, label: string) => void;
  onDeleteNode: (id: string) => void;

  // Link Actions
  onUpdateLink: (index: number, newLink: Link) => void;
  onDeleteLink: (index: number) => void;

  // Type Actions
  onAddType: (name: string, color: string) => void;
  onUpdateMoralType: (id: string, name: string, color: string) => void;
  onDeleteMoralType: (id: string) => void;
  
  onReset: () => void;
  nodes: Node[];
  links: Link[];
}

const Controls: React.FC<ControlsProps> = ({
  moralTypes,
  selectedTypeIds,
  depth,
  maxDepth,
  onToggleType,
  onToggleAllTypes,
  onDepthChange,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onUpdateLink,
  onDeleteLink,
  onAddType,
  onUpdateMoralType,
  onDeleteMoralType,
  onReset,
  nodes,
  links,
}) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'add' | 'manage'>('filter');
  const [manageSubTab, setManageSubTab] = useState<'nodes' | 'links' | 'types'>('nodes');
  
  // Add Node Form State
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newLinkParent, setNewLinkParent] = useState('self');
  const [newLinkType, setNewLinkType] = useState(moralTypes[0]?.id || '');

  // Add Type Form State
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#000000');
  
  // Edit State for Node
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeLabel, setEditNodeLabel] = useState('');

  // Edit State for Link
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editLinkSource, setEditLinkSource] = useState('');
  const [editLinkTarget, setEditLinkTarget] = useState('');
  const [editLinkType, setEditLinkType] = useState('');

  // Edit State for Type
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeColor, setEditTypeColor] = useState('');

  // Helper to safely get ID from Link Source/Target (which can be object or string)
  const getId = (item: string | Node) => typeof item === 'object' ? item.id : item;
  const getLabel = (id: string) => nodes.find(n => n.id === id)?.label || id;

  const startEditingNode = (node: Node) => {
    setEditingNodeId(node.id);
    setEditNodeLabel(node.label);
  };

  const saveEditNode = () => {
    if (editingNodeId && editNodeLabel) {
      onUpdateNode(editingNodeId, editNodeLabel);
      setEditingNodeId(null);
    }
  };

  const startEditingLink = (index: number, link: Link) => {
    setEditingLinkIndex(index);
    setEditLinkSource(getId(link.source));
    setEditLinkTarget(getId(link.target));
    setEditLinkType(link.typeId);
  };

  const saveEditLink = () => {
    if (editingLinkIndex !== null) {
      onUpdateLink(editingLinkIndex, {
        source: editLinkSource,
        target: editLinkTarget,
        typeId: editLinkType
      });
      setEditingLinkIndex(null);
    }
  };

  const startEditingType = (type: MoralType) => {
      setEditingTypeId(type.id);
      setEditTypeName(type.name);
      setEditTypeColor(type.color);
  }

  const saveEditType = () => {
      if(editingTypeId && editTypeName) {
          onUpdateMoralType(editingTypeId, editTypeName, editTypeColor);
          setEditingTypeId(null);
      }
  }


  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-4 max-h-[85vh] overflow-y-auto w-full md:w-80">
      <div className="flex border-b border-slate-200 mb-2">
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'filter' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('filter')}
        >
          视图
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'add' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('add')}
        >
          添加
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'manage' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('manage')}
        >
          管理
        </button>
      </div>

      {activeTab === 'filter' && (
        <div className="space-y-6">
          {/* Depth Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">波纹推演 (层级)</label>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{depth}</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxDepth}
              value={depth}
              onChange={(e) => onDepthChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-xs text-slate-500 italic">
              0层代表自我。拖动滑块，根据选中的“系维”（道德类型）查看人际关系如何像水波一样向外推出去。
            </p>
          </div>

          {/* Moral Type Filters */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-700">道德系维 (选择类型)</h3>
                <div className="space-x-2">
                    <button onClick={() => onToggleAllTypes(true)} className="text-xs text-indigo-600 hover:underline">全选</button>
                    <button onClick={() => onToggleAllTypes(false)} className="text-xs text-indigo-600 hover:underline">全不选</button>
                </div>
            </div>
            <div className="space-y-2">
              {moralTypes.map((type) => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedTypeIds.includes(type.id)}
                    onChange={() => onToggleType(type.id)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></span>
                  <span className="text-sm text-slate-700">{type.name}</span>
                </label>
              ))}
            </div>
          </div>
          
           <div className="pt-4 border-t border-slate-200">
             <button 
               onClick={onReset}
               className="w-full text-xs text-slate-400 hover:text-red-500 transition underline"
             >
               重置为默认状态
             </button>
           </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="space-y-6">
          {/* Add Node Section */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">添加人物 / 角色</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">称呼 / 角色名</label>
              <input
                type="text"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="例如：二叔"
                className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1">连接至 (谁的关系)</label>
              <select
                value={newLinkParent}
                onChange={(e) => setNewLinkParent(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">道德连结 (关系类型)</label>
              <select
                value={newLinkType}
                onChange={(e) => setNewLinkType(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded px-2 py-1"
              >
                {moralTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (newNodeLabel) {
                    onAddNode(newNodeLabel, newLinkType, newLinkParent);
                    setNewNodeLabel('');
                }
              }}
              disabled={!newNodeLabel}
              className="w-full bg-slate-800 text-white text-sm py-1.5 rounded hover:bg-slate-700 transition disabled:opacity-50"
            >
              加入圈子
            </button>
          </div>

          {/* Add Type Section */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">定义新道德/关系类型</h3>
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="类型名称 (例如：商业伙伴)"
              className="w-full text-sm border border-slate-300 rounded px-2 py-1"
            />
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={newTypeColor}
                    onChange={(e) => setNewTypeColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-0"
                />
                 <span className="text-xs text-slate-500">选择颜色</span>
            </div>
            <button
              onClick={() => {
                  if(newTypeName) {
                      onAddType(newTypeName, newTypeColor);
                      setNewTypeName('');
                  }
              }}
              disabled={!newTypeName}
              className="w-full bg-slate-200 text-slate-800 text-sm py-1.5 rounded hover:bg-slate-300 transition"
            >
              添加类型
            </button>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
           {/* Manage Sub-tabs */}
           <div className="flex bg-slate-100 p-1 rounded-lg">
               <button 
                  className={`flex-1 text-xs py-1 rounded-md transition ${manageSubTab === 'nodes' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  onClick={() => setManageSubTab('nodes')}
                >
                  人物
               </button>
               <button 
                  className={`flex-1 text-xs py-1 rounded-md transition ${manageSubTab === 'links' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  onClick={() => setManageSubTab('links')}
                >
                  关系
               </button>
               <button 
                  className={`flex-1 text-xs py-1 rounded-md transition ${manageSubTab === 'types' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  onClick={() => setManageSubTab('types')}
                >
                  类型
               </button>
           </div>
           
           {/* Manage Nodes List */}
           {manageSubTab === 'nodes' && (
             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
               {nodes.map(node => (
                 <div key={node.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 hover:border-indigo-200 transition">
                   {editingNodeId === node.id ? (
                     <div className="flex flex-1 gap-1 items-center">
                        <input 
                          className="flex-1 text-xs px-1 border border-indigo-300 rounded h-7" 
                          value={editNodeLabel} 
                          onChange={(e) => setEditNodeLabel(e.target.value)}
                          autoFocus
                        />
                        <button onClick={saveEditNode} className="text-xs text-green-600 hover:text-green-800 px-1">保存</button>
                        <button onClick={() => setEditingNodeId(null)} className="text-xs text-slate-400 hover:text-slate-600 px-1">取消</button>
                     </div>
                   ) : (
                     <>
                       <span className={`text-sm ${node.isSelf ? 'font-bold text-red-600' : 'text-slate-700'}`}>
                         {node.label}
                       </span>
                       {!node.isSelf && (
                         <div className="flex gap-2">
                           <button onClick={() => startEditingNode(node)} className="text-xs text-blue-500 hover:text-blue-700">编辑</button>
                           <button onClick={() => onDeleteNode(node.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                         </div>
                       )}
                     </>
                   )}
                 </div>
               ))}
             </div>
           )}

           {/* Manage Links List */}
           {manageSubTab === 'links' && (
               <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                   {links.map((link, idx) => {
                       const isEditing = editingLinkIndex === idx;
                       return (
                           <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 hover:border-indigo-200 transition">
                               {isEditing ? (
                                   <div className="flex flex-col gap-2">
                                       <div className="flex gap-1">
                                           <select 
                                                value={editLinkSource} 
                                                onChange={e => setEditLinkSource(e.target.value)}
                                                className="w-1/2 text-xs border rounded h-6"
                                            >
                                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                                           </select>
                                           <span className="text-slate-400">→</span>
                                           <select 
                                                value={editLinkTarget} 
                                                onChange={e => setEditLinkTarget(e.target.value)}
                                                className="w-1/2 text-xs border rounded h-6"
                                            >
                                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                                           </select>
                                       </div>
                                       <select 
                                            value={editLinkType} 
                                            onChange={e => setEditLinkType(e.target.value)}
                                            className="w-full text-xs border rounded h-6"
                                       >
                                            {moralTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                       </select>
                                       <div className="flex justify-end gap-2 mt-1">
                                           <button onClick={() => setEditingLinkIndex(null)} className="text-xs text-slate-500">取消</button>
                                           <button onClick={saveEditLink} className="text-xs text-green-600 font-medium">保存修改</button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="flex items-center justify-between">
                                       <div className="flex flex-col">
                                           <span className="text-xs text-slate-800 font-medium">
                                               {getLabel(getId(link.source))} <span className="text-slate-400">→</span> {getLabel(getId(link.target))}
                                           </span>
                                           <span className="text-[10px] text-slate-500">
                                               {moralTypes.find(t => t.id === link.typeId)?.name || '未知类型'}
                                           </span>
                                       </div>
                                       <div className="flex gap-2">
                                            <button onClick={() => startEditingLink(idx, link)} className="text-xs text-blue-500 hover:text-blue-700">编辑</button>
                                            <button onClick={() => onDeleteLink(idx)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                                       </div>
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>
           )}

           {/* Manage Types List */}
           {manageSubTab === 'types' && (
               <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                   {moralTypes.map(type => (
                       <div key={type.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 hover:border-indigo-200 transition">
                           {editingTypeId === type.id ? (
                               <div className="flex flex-1 gap-1 items-center">
                                   <input 
                                     type="color" 
                                     value={editTypeColor}
                                     onChange={(e) => setEditTypeColor(e.target.value)}
                                     className="h-6 w-6 rounded border-0 cursor-pointer p-0"
                                   />
                                   <input 
                                     className="flex-1 text-xs px-1 border border-indigo-300 rounded h-7" 
                                     value={editTypeName} 
                                     onChange={(e) => setEditTypeName(e.target.value)}
                                   />
                                   <button onClick={saveEditType} className="text-xs text-green-600 hover:text-green-800 px-1">保存</button>
                                   <button onClick={() => setEditingTypeId(null)} className="text-xs text-slate-400 hover:text-slate-600 px-1">取消</button>
                               </div>
                           ) : (
                               <>
                                   <div className="flex items-center gap-2">
                                       <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: type.color }}></span>
                                       <span className="text-sm text-slate-700">{type.name}</span>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => startEditingType(type)} className="text-xs text-blue-500 hover:text-blue-700">编辑</button>
                                       <button onClick={() => onDeleteMoralType(type.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                                   </div>
                               </>
                           )}
                       </div>
                   ))}
               </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Controls;