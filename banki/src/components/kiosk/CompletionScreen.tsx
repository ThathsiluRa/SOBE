'use client';

import React from 'react';
import { CheckCircle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface CompletionScreenProps {
  customerId: string;
  applicationId: string;
  customerName?: string;
  onRestart: () => void;
}

export function CompletionScreen({ customerId, applicationId, customerName, onRestart }: CompletionScreenProps) {
  const handleDownload = () => {
    window.open(`/api/pdf?id=${applicationId}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {/* Success animation */}
      <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center mb-8 shadow-lg">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      {/* Message */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Application Submitted!
      </h1>
      {customerName && (
        <p className="text-lg text-gray-600 mb-2">
          Thank you, <span className="font-semibold text-cyan-600">{customerName}</span>!
        </p>
      )}
      <p className="text-gray-500 mb-8 max-w-md">
        Your account opening application has been received. A bank officer will review it shortly.
      </p>

      {/* Customer ID */}
      <div className="bg-gray-900 text-white rounded-2xl px-8 py-5 mb-8 shadow-xl">
        <div className="text-sm text-gray-400 mb-1">Your Customer Reference Number</div>
        <div className="text-3xl font-bold font-mono text-cyan-400 tracking-widest">
          {customerId}
        </div>
        <div className="text-xs text-gray-500 mt-2">Please note this number for future reference</div>
      </div>

      {/* Next steps */}
      <div className="bg-cyan-50 rounded-2xl p-5 mb-8 max-w-sm text-left">
        <h3 className="font-semibold text-cyan-800 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-cyan-700">
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 font-bold mt-0.5">1.</span>
            A bank officer reviews your application (1-2 business days)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 font-bold mt-0.5">2.</span>
            You'll receive an SMS when your account is ready
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 font-bold mt-0.5">3.</span>
            Visit any branch to collect your debit card
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="secondary" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download Summary
        </Button>
        <Button onClick={onRestart} variant="ghost">
          <RefreshCw className="h-4 w-4" />
          New Application
        </Button>
      </div>
    </div>
  );
}
