'use client';

import React, { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '@/types';

interface TranscriptProps {
  entries: TranscriptEntry[];
  isTyping?: boolean;
  /** Live streaming text from Gemini before the turn completes */
  pendingAssistantText?: string;
}

function BubbleB({ children, pending }: { children: React.ReactNode; pending?: boolean }) {
  return (
    <div className="flex justify-start">
      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
        B
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed ${pending ? 'bg-gray-100 text-gray-500 italic' : 'bg-gray-100 text-gray-800'}`}>
        {children}
      </div>
    </div>
  );
}

function BubbleUser({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed bg-cyan-500 text-white">
        {children}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 flex-shrink-0 mt-1">
        Y
      </div>
    </div>
  );
}

export function Transcript({ entries, isTyping = false, pendingAssistantText }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isTyping, pendingAssistantText]);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full pr-2">
      {entries.map((entry, i) =>
        entry.role === 'user' ? (
          <BubbleUser key={i}>{entry.content}</BubbleUser>
        ) : (
          <BubbleB key={i}>{entry.content}</BubbleB>
        )
      )}

      {/* Live streaming text — always show when present (even while audio is playing) */}
      {pendingAssistantText && (
        <BubbleB pending>{pendingAssistantText}</BubbleB>
      )}

      {/* Bouncing dots only while waiting for first token (nothing yet) */}
      {isTyping && !pendingAssistantText && (
        <BubbleB>
          <div className="flex gap-1 items-center h-4">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </BubbleB>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
