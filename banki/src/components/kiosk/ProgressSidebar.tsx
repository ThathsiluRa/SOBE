'use client';

import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import type { KioskStep } from '@/types';

const STEPS: { id: KioskStep; label: string; icon: string }[] = [
  { id: 'greeting', label: 'Welcome', icon: '👋' },
  { id: 'personal_info', label: 'Personal Info', icon: '👤' },
  { id: 'id_scan', label: 'ID Scan', icon: '🪪' },
  { id: 'selfie', label: 'Selfie', icon: '📸' },
  { id: 'liveness', label: 'Verification', icon: '✅' },
  { id: 'products', label: 'Products', icon: '💳' },
  { id: 'review', label: 'Review', icon: '📋' },
  { id: 'complete', label: 'Complete', icon: '🎉' },
];

const STEP_ORDER = STEPS.map((s) => s.id);

interface ProgressSidebarProps {
  currentStep: KioskStep;
  customerName?: string;
}

export function ProgressSidebar({ currentStep, customerName }: ProgressSidebarProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full p-6">
      {/* Logo */}
      <div className="mb-8">
        <div className="text-3xl font-bold text-cyan-400 tracking-tight">BANKI</div>
        <div className="text-xs text-gray-400 mt-1">AI Banking Kiosk</div>
      </div>

      {/* Customer name if known */}
      {customerName && (
        <div className="mb-6 p-3 bg-gray-800 rounded-xl">
          <div className="text-xs text-gray-400">Welcome</div>
          <div className="text-sm font-semibold text-white mt-0.5">{customerName}</div>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 space-y-1">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isCurrent ? 'bg-cyan-500/20 border border-cyan-500/30' : ''
              }`}
            >
              {isDone ? (
                <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 text-cyan-400 flex-shrink-0 animate-spin" />
              ) : (
                <Circle className="h-5 w-5 text-gray-600 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isDone
                    ? 'text-cyan-400'
                    : isCurrent
                    ? 'text-white font-semibold'
                    : 'text-gray-500'
                }`}
              >
                {step.icon} {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round((currentIndex / (STEPS.length - 1)) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Powered by Gemini AI
      </div>
    </div>
  );
}
