'use client';

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Plus, Trash2 } from 'lucide-react';

interface FlowEditorProps {
  flow: {
    id: string;
    name: string;
    nodes: string;
    edges: string;
    isPublished: boolean;
  };
  onSave: (flowId: string, nodes: unknown[], edges: unknown[]) => Promise<void>;
}

const NODE_TYPES_CONFIG = [
  { type: 'greeting', label: 'Greeting', color: '#06B6D4', icon: '👋' },
  { type: 'collect_info', label: 'Collect Info', color: '#8B5CF6', icon: '📝' },
  { type: 'id_scan', label: 'ID Scan', color: '#F59E0B', icon: '🪪' },
  { type: 'selfie', label: 'Selfie & Liveness', color: '#10B981', icon: '📸' },
  { type: 'products', label: 'Products', color: '#3B82F6', icon: '💳' },
  { type: 'condition', label: 'Condition', color: '#EF4444', icon: '🔀' },
  { type: 'complete', label: 'Complete', color: '#22C55E', icon: '✅' },
];

function CustomNode({ data }: { data: { label: string; type?: string; icon?: string; color?: string } }) {
  const config = NODE_TYPES_CONFIG.find((n) => n.type === data.type) || NODE_TYPES_CONFIG[0];
  return (
    <div
      className="px-4 py-3 rounded-xl shadow-md border-2 bg-white min-w-[140px] text-center"
      style={{ borderColor: config.color }}
    >
      <div className="text-lg mb-1">{config.icon}</div>
      <div className="text-sm font-semibold text-gray-800">{data.label || config.label}</div>
      {data.type && (
        <div className="text-xs mt-0.5" style={{ color: config.color }}>
          {config.label}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function FlowEditor({ flow, onSave }: FlowEditorProps) {
  const initialNodes = useMemo(() => {
    const parsed = JSON.parse(flow.nodes || '[]') as Node[];
    return parsed.map((n) => ({ ...n, type: 'custom', data: { ...n.data, type: n.data?.type || n.type } }));
  }, [flow.nodes]);

  const initialEdges = useMemo(() => {
    const parsed = JSON.parse(flow.edges || '[]') as Edge[];
    return parsed.map((e) => ({
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#06B6D4', strokeWidth: 2 },
    }));
  }, [flow.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#06B6D4', strokeWidth: 2 },
    }, eds));
  }, [setEdges]);

  const addNode = (type: string) => {
    const config = NODE_TYPES_CONFIG.find((n) => n.type === type)!;
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'custom',
      position: { x: 200 + Math.random() * 200, y: 100 + nodes.length * 100 },
      data: { label: config.label, type, color: config.color },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveNodes = nodes.map((n) => ({
        id: n.id,
        type: n.data.type || 'custom',
        position: n.position,
        data: n.data,
      }));
      const saveEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      }));
      await onSave(flow.id, saveNodes, saveEdges);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <Background color="#e5e7eb" gap={24} />

        {/* Top toolbar */}
        <Panel position="top-left" className="flex items-center gap-2 !m-3">
          <div className="bg-white shadow-md rounded-xl p-2 flex items-center gap-2 border border-gray-100">
            <span className="text-sm font-semibold text-gray-700 px-2">{flow.name}</span>
            {flow.isPublished && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Published</span>
            )}
          </div>
        </Panel>

        <Panel position="top-right" className="flex items-center gap-2 !m-3">
          {/* Add node buttons */}
          <div className="bg-white shadow-md rounded-xl p-2 border border-gray-100 flex gap-1">
            {NODE_TYPES_CONFIG.map((n) => (
              <button
                key={n.type}
                onClick={() => addNode(n.type)}
                title={`Add ${n.label}`}
                className="flex flex-col items-center gap-0.5 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                style={{ minWidth: 48 }}
              >
                <span className="text-sm">{n.icon}</span>
                <span className="text-xs text-gray-500" style={{ fontSize: 9 }}>{n.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={deleteSelected}
            title="Delete selected"
            className="p-2.5 bg-white shadow-md rounded-xl border border-gray-100 text-gray-500 hover:text-red-500 hover:border-red-200 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl shadow-md hover:bg-cyan-600 transition-colors text-sm font-medium disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Flow'}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
