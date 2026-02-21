'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/shared/Card';
import { FileText, CheckCircle, Clock, XCircle, Users, TrendingUp } from 'lucide-react';

interface Stats {
  total: number;
  submitted: number;
  in_progress: number;
  approved: number;
  rejected: number;
}

interface RecentApp {
  id: string;
  customerId: string;
  fullName: string | null;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, in_progress: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState<RecentApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/applications');
        const apps: RecentApp[] = await res.json();

        const s: Stats = { total: apps.length, submitted: 0, in_progress: 0, approved: 0, rejected: 0 };
        apps.forEach((a) => {
          if (a.status === 'submitted') s.submitted++;
          else if (a.status === 'in_progress') s.in_progress++;
          else if (a.status === 'approved') s.approved++;
          else if (a.status === 'rejected') s.rejected++;
        });

        setStats(s);
        setRecent(apps.slice(0, 10));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    in_progress: { label: 'In Progress', class: 'bg-yellow-100 text-yellow-700' },
    submitted: { label: 'Submitted', class: 'bg-blue-100 text-blue-700' },
    approved: { label: 'Approved', class: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of BANKI kiosk activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={<FileText className="h-6 w-6" />}
          color="cyan"
        />
        <StatCard
          title="Pending Review"
          value={stats.submitted}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Additional stats row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <StatCard
          title="In Progress"
          value={stats.in_progress}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          subtitle="Currently being processed at kiosk"
        />
        <StatCard
          title="Approval Rate"
          value={stats.total > 0 ? `${Math.round((stats.approved / Math.max(stats.submitted + stats.approved + stats.rejected, 1)) * 100)}%` : '—'}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
          subtitle="Of reviewed applications"
        />
      </div>

      {/* Recent applications table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No applications yet. Start the kiosk to collect applications.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Customer ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <a
                      href={`/admin/applications?id=${app.id}`}
                      className="font-mono text-sm text-cyan-600 hover:text-cyan-800 font-medium"
                    >
                      {app.customerId}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {app.fullName || <span className="text-gray-300 italic">Unknown</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CONFIG[app.status]?.class || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_CONFIG[app.status]?.label || app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
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
