'use client';

import React from 'react';
import Link from 'next/link';
import { Monitor, LayoutDashboard, Mic, CreditCard, Shield, GitBranch } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-8">
      {/* Logo */}
      <div className="text-center mb-16">
        <div className="text-7xl font-bold text-cyan-400 tracking-tight mb-3">BANKI</div>
        <div className="text-xl text-gray-300">AI-Powered Banking Kiosk Demo</div>
        <div className="mt-4 text-sm text-gray-500">
          Voice-guided account opening with KYC verification
        </div>
      </div>

      {/* Main CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-16">
        <Link
          href="/kiosk"
          className="group flex flex-col items-center gap-4 p-8 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
            <Monitor className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-2">Customer Kiosk</div>
            <div className="text-sm text-gray-400">
              Voice-guided account opening experience with AI assistant, ID scanning, and face verification
            </div>
          </div>
          <div className="mt-2 px-5 py-2 bg-cyan-500 text-white rounded-xl text-sm font-semibold group-hover:bg-cyan-400 transition-colors">
            Open Kiosk →
          </div>
        </Link>

        <Link
          href="/admin"
          className="group flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <LayoutDashboard className="h-8 w-8 text-gray-300" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-2">Admin Panel</div>
            <div className="text-sm text-gray-400">
              Review applications, manage products, configure flows, and track KYC statistics
            </div>
          </div>
          <div className="mt-2 px-5 py-2 bg-white/10 text-white rounded-xl text-sm font-semibold group-hover:bg-white/20 transition-colors">
            Open Admin →
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {[
          { icon: <Mic className="h-5 w-5" />, label: 'Voice AI', desc: 'Gemini 2.0 Flash' },
          { icon: <Shield className="h-5 w-5" />, label: 'KYC Verification', desc: 'ID + Face + Liveness' },
          { icon: <CreditCard className="h-5 w-5" />, label: 'Smart Products', desc: 'AI Recommendations' },
          { icon: <GitBranch className="h-5 w-5" />, label: 'Flow Editor', desc: 'Visual Builder' },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-cyan-400">{f.icon}</div>
            <div>
              <div className="text-sm font-semibold text-white">{f.label}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-xs text-gray-600">
        Local demo build — SQLite database, no cloud required
      </div>
    </div>
  );
}
