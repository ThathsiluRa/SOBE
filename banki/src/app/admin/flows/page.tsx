'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Save, Play, Square, Trash2, GitBranch } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with ReactFlow
const FlowEditor = dynamic(() => import('@/components/admin/FlowEditor'), { ssr: false });

interface Flow {
  id: string;
  name: string;
  description: string | null;
  nodes: string;
  edges: string;
  isPublished: boolean;
  isTemplate: boolean;
  createdAt: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/flows');
    const data = await res.json();
    setFlows(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createFlow = async () => {
    setSaving(true);
    try {
      const defaultNodes = [
        { id: '1', type: 'greeting', position: { x: 100, y: 100 }, data: { label: 'Greeting', message: 'Welcome to BANKI!' } },
        { id: '2', type: 'collect_info', position: { x: 100, y: 220 }, data: { label: 'Collect Info', fields: ['name', 'dob', 'phone'] } },
        { id: '3', type: 'id_scan', position: { x: 100, y: 340 }, data: { label: 'ID Scan' } },
        { id: '4', type: 'selfie', position: { x: 100, y: 460 }, data: { label: 'Selfie & Liveness' } },
        { id: '5', type: 'products', position: { x: 100, y: 580 }, data: { label: 'Product Selection' } },
        { id: '6', type: 'complete', position: { x: 100, y: 700 }, data: { label: 'Complete' } },
      ];
      const defaultEdges = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e4-5', source: '4', target: '5' },
        { id: 'e5-6', source: '5', target: '6' },
      ];

      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlowName || 'New Flow',
          description: newFlowDesc,
          nodes: defaultNodes,
          edges: defaultEdges,
        }),
      });

      const flow = await res.json();
      await load();
      setSelectedFlow(flow);
      setCreateModalOpen(false);
      setNewFlowName('');
      setNewFlowDesc('');
    } finally {
      setSaving(false);
    }
  };

  const handleFlowSave = useCallback(async (
    flowId: string,
    nodes: unknown[],
    edges: unknown[]
  ) => {
    await fetch('/api/flows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flowId, nodes, edges }),
    });
    await load();
  }, []);

  const togglePublish = async (flow: Flow) => {
    await fetch('/api/flows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flow.id, isPublished: !flow.isPublished }),
    });
    await load();
    if (selectedFlow?.id === flow.id) {
      setSelectedFlow({ ...selectedFlow, isPublished: !flow.isPublished });
    }
  };

  const deleteFlow = async (id: string) => {
    if (!confirm('Delete this flow?')) return;
    await fetch('/api/flows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (selectedFlow?.id === id) setSelectedFlow(null);
    await load();
  };

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Flow List Sidebar */}
      <div className="w-72 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Flows</h2>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="p-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Click a flow to edit its nodes</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center p-6 text-gray-400 text-sm">Loading...</div>
          ) : flows.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No flows yet
            </div>
          ) : (
            flows.map((flow) => (
              <div
                key={flow.id}
                onClick={() => setSelectedFlow(flow)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedFlow?.id === flow.id
                    ? 'border-cyan-300 bg-cyan-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{flow.name}</p>
                    {flow.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{flow.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {flow.isPublished && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        Live
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePublish(flow); }}
                    className={`text-xs flex items-center gap-1 ${flow.isPublished ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                  >
                    {flow.isPublished ? <><Square className="h-3 w-3" /> Unpublish</> : <><Play className="h-3 w-3" /> Publish</>}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id); }}
                    className="text-xs text-red-400 hover:text-red-600 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Flow Editor */}
      <div className="flex-1 bg-gray-50">
        {selectedFlow ? (
          <FlowEditor
            key={selectedFlow.id}
            flow={selectedFlow}
            onSave={handleFlowSave}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <GitBranch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Select a Flow to Edit</h3>
              <p className="text-sm text-gray-400 mb-6">Choose a flow from the left panel, or create a new one.</p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Flow
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Flow">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Flow Name</label>
            <input
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
              placeholder="e.g., Standard Account Opening"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description (optional)</label>
            <textarea
              value={newFlowDesc}
              onChange={(e) => setNewFlowDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
              rows={2}
              placeholder="What is this flow for?"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={createFlow} loading={saving} className="flex-1">Create Flow</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
