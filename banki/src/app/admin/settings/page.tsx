'use client';

import React, { useEffect, useState } from 'react';
import { Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface Settings {
  bankName: string;
  geminiApiKey: string;
  faceMatchThreshold: number;
  primaryColor: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    bankName: 'Demo Bank',
    geminiApiKey: '',
    faceMatchThreshold: 0.85,
    primaryColor: '06B6D4',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure BANKI kiosk settings</p>
      </div>

      <div className="space-y-6">
        {/* Bank Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Bank Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Bank Name</label>
              <input
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                placeholder="Demo Bank"
              />
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">AI Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-400"
                  placeholder="AIza..."
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Get your API key from{' '}
                <span className="text-cyan-600">Google AI Studio</span>
              </p>

              {!settings.geminiApiKey && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <strong>API key not configured.</strong> The kiosk will not be able to have voice conversations.
                    Add your Gemini API key to enable AI features.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Face Match Threshold: {(settings.faceMatchThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={settings.faceMatchThreshold}
                onChange={(e) => setSettings({ ...settings, faceMatchThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>More lenient (50%)</span>
                <span>More strict (99%)</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Minimum similarity score required for face matching to pass. Default: 85%.
              </p>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">Environment Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span className="text-gray-700 font-mono">SQLite (local)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Face Service</span>
              <span className="text-gray-700 font-mono">http://localhost:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kiosk URL</span>
              <span className="text-gray-700 font-mono">http://localhost:3000/kiosk</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
          {saved && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Settings saved!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
