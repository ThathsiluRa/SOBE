'use client';

import React, { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '@/types';

interface TranscriptProps {
  entries: TranscriptEntry[];
  isTyping?: boolean;
}

export function Transcript({ entries, isTyping = false }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isTyping]);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-gray-200">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {entry.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
              B
            </div>
          )}
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              entry.role === 'user'
                ? 'bg-cyan-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}
          >
            {entry.content}
          </div>
          {entry.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 flex-shrink-0 mt-1">
              Y
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
            B
          </div>
          <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
