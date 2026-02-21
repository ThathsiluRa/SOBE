'use client';

import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useKioskStore } from '@/stores/kiosk-store';

interface FieldRowProps {
  label: string;
  field: string;
  value: string;
  type?: string;
}

function FieldRow({ label, field, value, type = 'text' }: FieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const setPersonalField = useKioskStore((s) => s.setPersonalField);

  const handleSave = () => {
    setPersonalField(field, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-36 text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">
        {label}
      </div>
      {editing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 text-sm px-3 py-1.5 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button onClick={handleSave} className="p-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleCancel} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between gap-2 group">
          <span className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">Not provided</span>}</span>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function EditableForm() {
  const store = useKioskStore();

  const fields = [
    { label: 'Full Name', field: 'fullName', value: store.fullName },
    { label: 'Date of Birth', field: 'dateOfBirth', value: store.dateOfBirth, type: 'date' },
    { label: 'Gender', field: 'gender', value: store.gender },
    { label: 'Phone', field: 'phone', value: store.phone, type: 'tel' },
    { label: 'Email', field: 'email', value: store.email, type: 'email' },
    { label: 'Address', field: 'address', value: store.address },
    { label: 'Occupation', field: 'occupation', value: store.occupation },
    { label: 'Monthly Income', field: 'monthlyIncome', value: store.monthlyIncome },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Pencil className="h-4 w-4 text-cyan-500" />
        <h3 className="text-sm font-semibold text-gray-700">Application Details</h3>
        <span className="text-xs text-gray-400 ml-auto">Hover to edit</span>
      </div>
      <div>
        {fields.map((f) => (
          <FieldRow key={f.field} {...f} />
        ))}
      </div>
      {store.idExtractedData?.document_number && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">ID Document</div>
          <div className="flex gap-2">
            <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-lg font-mono">
              {store.idExtractedData.document_number}
            </span>
            <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-lg capitalize">
              {store.idExtractedData?.document_type?.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
