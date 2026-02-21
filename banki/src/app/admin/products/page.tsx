'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';

interface Product {
  id: string;
  name: string;
  type: string;
  description: string;
  features: string;
  interestRate: number | null;
  eligibilityRules: string;
  isActive: boolean;
  displayOrder: number;
}

const PRODUCT_TYPES = [
  'savings', 'current', 'credit_card', 'debit_card', 'loan', 'fixed_deposit',
];

const defaultForm = {
  name: '',
  type: 'savings',
  description: '',
  features: '',
  interestRate: '',
  minAge: '',
  maxAge: '',
  minIncome: '',
  isActive: true,
  displayOrder: '0',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    const rules = JSON.parse(p.eligibilityRules || '{}');
    setForm({
      name: p.name,
      type: p.type,
      description: p.description,
      features: JSON.parse(p.features || '[]').join('\n'),
      interestRate: p.interestRate?.toString() || '',
      minAge: rules.minAge?.toString() || '',
      maxAge: rules.maxAge?.toString() || '',
      minIncome: rules.minIncome?.toString() || '',
      isActive: p.isActive,
      displayOrder: p.displayOrder.toString(),
    });
    setEditingId(p.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        description: form.description,
        features: form.features.split('\n').filter(Boolean),
        interestRate: form.interestRate ? parseFloat(form.interestRate) : null,
        eligibilityRules: {
          minAge: form.minAge ? parseInt(form.minAge) : undefined,
          maxAge: form.maxAge ? parseInt(form.maxAge) : undefined,
          minIncome: form.minIncome ? parseInt(form.minIncome) : undefined,
        },
        isActive: form.isActive,
        displayOrder: parseInt(form.displayOrder) || 0,
      };

      if (editingId) {
        await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      await load();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const handleToggle = async (p: Product) => {
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    await load();
  };

  const TYPE_COLORS: Record<string, string> = {
    savings: 'bg-green-100 text-green-700',
    current: 'bg-blue-100 text-blue-700',
    credit_card: 'bg-purple-100 text-purple-700',
    debit_card: 'bg-cyan-100 text-cyan-700',
    loan: 'bg-orange-100 text-orange-700',
    fixed_deposit: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage banking products offered through the kiosk</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="text-center p-12 text-gray-400">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center p-12 text-gray-400">
          <p className="mb-4">No products yet.</p>
          <Button onClick={openCreate}>Add your first product</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => {
            const features = JSON.parse(p.features || '[]') as string[];
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${p.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-600'}`}>
                      {p.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-2">{p.name}</h3>
                  </div>
                  <button onClick={() => handleToggle(p)} className="text-gray-400 hover:text-cyan-500">
                    {p.isActive ? <ToggleRight className="h-6 w-6 text-cyan-500" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>

                {p.interestRate && (
                  <div className="text-sm font-medium text-green-600 mb-2">
                    {p.interestRate}% p.a.
                  </div>
                )}

                {features.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {features.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                    {features.length > 3 && (
                      <li className="text-xs text-gray-400">+{features.length - 3} more</li>
                    )}
                  </ul>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-600 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Product Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                placeholder="e.g., Smart Savings Account"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
              rows={2}
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Features (one per line)</label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-400 resize-none"
              rows={3}
              placeholder="No minimum balance&#10;Free debit card&#10;Online banking"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Interest Rate %</label>
              <input
                type="number"
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                placeholder="5.0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Min Age</label>
              <input
                type="number"
                value={form.minAge}
                onChange={(e) => setForm({ ...form, minAge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                placeholder="18"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Max Age</label>
              <input
                type="number"
                value={form.maxAge}
                onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                placeholder="65"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Min Income LKR</label>
              <input
                type="number"
                value={form.minIncome}
                onChange={(e) => setForm({ ...form, minIncome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                placeholder="30000"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active (visible in kiosk)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editingId ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
