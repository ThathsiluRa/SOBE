'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronRight, User, CheckCircle, XCircle, Clock, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface Application {
  id: string;
  customerId: string;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  monthlyIncome: string | null;
  status: string;
  idDocumentType: string | null;
  idNumber: string | null;
  idConfidence: number | null;
  faceMatchScore: number | null;
  livenessPass: boolean;
  selectedProducts: string | null;
  transcript: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  in_progress: { label: 'In Progress', icon: <Clock className="h-4 w-4" />, class: 'bg-yellow-100 text-yellow-700' },
  submitted: { label: 'Pending Review', icon: <Clock className="h-4 w-4" />, class: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', icon: <CheckCircle className="h-4 w-4" />, class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: <XCircle className="h-4 w-4" />, class: 'bg-red-100 text-red-700' },
};

function DetailView({ id }: { id: string }) {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/applications?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data);
        setReviewNotes(data.reviewNotes || '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reviewNotes }),
      });
      setApp((prev) => prev ? { ...prev, status, reviewNotes } : null);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!app) return <div className="p-8 text-center text-gray-400">Application not found</div>;

  const transcript = app.transcript ? JSON.parse(app.transcript) : [];
  const selectedProducts = app.selectedProducts ? JSON.parse(app.selectedProducts) : [];

  return (
    <div className="p-8 max-w-4xl">
      <button
        onClick={() => router.push('/admin/applications')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{app.customerId}</h1>
          <p className="text-gray-500 mt-1">{app.fullName || 'Unknown applicant'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[app.status]?.class || 'bg-gray-100 text-gray-600'}`}>
            {STATUS_CONFIG[app.status]?.icon}
            {STATUS_CONFIG[app.status]?.label || app.status}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(`/api/pdf?id=${app.id}`, '_blank')}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-3">
            {[
              ['Full Name', app.fullName],
              ['Date of Birth', app.dateOfBirth],
              ['Gender', app.gender],
              ['Phone', app.phone],
              ['Email', app.email],
              ['Address', app.address],
              ['Occupation', app.occupation],
              ['Monthly Income', app.monthlyIncome],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">—</span>}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Verification Status</h2>
          <div className="space-y-3">
            {[
              ['Document Type', app.idDocumentType],
              ['Document Number', app.idNumber],
              ['ID Confidence', app.idConfidence ? `${(app.idConfidence * 100).toFixed(1)}%` : null],
              ['Face Match', app.faceMatchScore ? `${(app.faceMatchScore * 100).toFixed(1)}%` : null],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">—</span>}</span>
              </div>
            ))}
            <div className="flex gap-3">
              <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">Liveness</span>
              <span className={`text-sm font-medium ${app.livenessPass ? 'text-green-600' : 'text-red-500'}`}>
                {app.livenessPass ? '✓ Passed' : '✗ Not completed'}
              </span>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Products</h3>
              <div className="space-y-1">
                {selectedProducts.map((p: string, i: number) => (
                  <div key={i} className="text-xs text-cyan-700 bg-cyan-50 px-2 py-1 rounded">{p}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review section */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Review Decision</h2>
        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-2">Review Notes</label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
            rows={3}
            placeholder="Add notes about this application..."
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => updateStatus('approved')}
            loading={updating}
            disabled={app.status === 'approved'}
            className="bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={() => updateStatus('rejected')}
            loading={updating}
            disabled={app.status === 'rejected'}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Conversation Transcript</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {transcript.map((entry: { role: string; content: string }, i: number) => (
              <div key={i} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${entry.role === 'assistant' ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {entry.role === 'assistant' ? 'B' : 'C'}
                </div>
                <div className={`text-xs px-3 py-2 rounded-xl max-w-xs ${entry.role === 'assistant' ? 'bg-gray-100 text-gray-700' : 'bg-cyan-500 text-white'}`}>
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationsList() {
  const searchParams = useSearchParams();
  const detailId = searchParams.get('id');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!detailId) {
      const url = statusFilter ? `/api/applications?status=${statusFilter}` : '/api/applications';
      fetch(url)
        .then((r) => r.json())
        .then(setApps)
        .finally(() => setLoading(false));
    }
  }, [detailId, statusFilter]);

  if (detailId) return <DetailView id={detailId} />;

  const filtered = apps.filter((a) =>
    !search ||
    (a.customerId?.toLowerCase().includes(search.toLowerCase())) ||
    (a.fullName?.toLowerCase().includes(search.toLowerCase())) ||
    (a.phone?.includes(search))
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">{apps.length} total applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
        >
          <option value="">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No applications found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Customer ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/applications?id=${app.id}`)}
                >
                  <td className="px-6 py-4 font-mono text-sm text-cyan-600 font-medium">{app.customerId}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{app.fullName || <span className="text-gray-300 italic">Unknown</span>}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[app.status]?.class || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_CONFIG[app.status]?.label || app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <ApplicationsList />
    </Suspense>
  );
}
