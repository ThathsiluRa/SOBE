'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Loader2,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useKioskStore } from '@/stores/kiosk-store';
import { Transcript } from './Transcript';
import { GeminiLiveClient } from '@/lib/gemini-live';
import { VOICE_ASSISTANT_SYSTEM_PROMPT } from '@/lib/prompts';

interface VoiceChatProps {
  onStepChange?: (step: string) => void;
}

type ConnectionStatus = 'initializing' | 'connecting' | 'connected' | 'error' | 'no-key';

export function VoiceChat({ onStepChange }: VoiceChatProps) {
  const store = useKioskStore();
  const [status, setStatus] = useState<ConnectionStatus>('initializing');
  const [statusMsg, setStatusMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<string | undefined>(undefined);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const greetedRef = useRef(false);

  const getContext = useCallback(
    () => ({
      currentStep: store.currentStep,
      language: store.language,
      customerName: store.fullName || undefined,
      collectedData: {
        fullName: store.fullName || undefined,
        dateOfBirth: store.dateOfBirth || undefined,
        gender: store.gender || undefined,
        phone: store.phone || undefined,
        email: store.email || undefined,
        address: store.address || undefined,
        occupation: store.occupation || undefined,
        monthlyIncome: store.monthlyIncome || undefined,
      },
      idVerified: store.idConfirmed,
      idNumber: store.idExtractedData?.document_number ?? undefined,
      livenessPass: store.livenessPass,
      faceMatchScore: store.faceMatchScore ?? undefined,
      selectedProductCount: store.selectedProductIds.length,
    }),
    [store]
  );

  const detectStepChange = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      const cur = store.currentStep;
      if (cur === 'greeting' && (lower.includes('full name') || lower.includes('your name') || lower.includes('date of birth'))) {
        store.setStep('personal_info'); onStepChange?.('personal_info');
      } else if (cur === 'personal_info' && (lower.includes('identity card') || lower.includes('hold your') || lower.includes('nic') || lower.includes('passport'))) {
        store.setStep('id_scan'); onStepChange?.('id_scan');
      } else if (cur === 'id_scan' && (lower.includes('selfie') || lower.includes('look at the camera') || lower.includes('photograph'))) {
        store.setStep('selfie'); onStepChange?.('selfie');
      } else if (cur === 'selfie' && (lower.includes('blink') || lower.includes('liveness') || lower.includes('turn your head'))) {
        store.setStep('liveness'); onStepChange?.('liveness');
      } else if (cur === 'liveness' && (lower.includes('recommend') || lower.includes('product') || lower.includes('account type'))) {
        store.setStep('products'); onStepChange?.('products');
      } else if (cur === 'products' && (lower.includes('review') || lower.includes('summary') || lower.includes('confirm'))) {
        store.setStep('review'); onStepChange?.('review');
      } else if (cur === 'review' && (lower.includes('congratulations') || lower.includes('reference number') || lower.includes('submitted'))) {
        store.setStep('complete'); onStepChange?.('complete');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.currentStep, onStepChange]
  );

  const connect = useCallback(async () => {
    setStatus('connecting');
    setStatusMsg('Connecting to Gemini Live...');

    let apiKey = '';
    try {
      const res = await fetch('/api/gemini/config');
      const cfg = await res.json() as { configured: boolean; apiKey: string };
      if (!cfg.configured) {
        setStatus('no-key');
        setStatusMsg('API key not configured');
        return;
      }
      apiKey = cfg.apiKey;
    } catch {
      setStatus('error');
      setStatusMsg('Could not load configuration');
      return;
    }

    clientRef.current?.disconnect();

    const client = new GeminiLiveClient({
      apiKey,
      systemPrompt: VOICE_ASSISTANT_SYSTEM_PROMPT,
      voiceName: 'Aoede',

      onConnected: () => {
        setStatus('connected');
        setStatusMsg('');
        if (!greetedRef.current) {
          greetedRef.current = true;
          setTimeout(() => client.sendText('hello', getContext()), 300);
        }
      },

      onText: (text, isFinal) => {
        setPendingEntry(text);
        if (isFinal) {
          store.addTranscriptEntry({ role: 'assistant', content: text, timestamp: new Date().toISOString() });
          setPendingEntry(undefined);
          detectStepChange(text);
        }
        setIsTyping(!isFinal);
      },

      onAudioStart: () => { setIsPlaying(true); store.setSpeaking(true); },
      onAudioDone: () => { setIsPlaying(false); store.setSpeaking(false); },
      onTurnComplete: () => setIsTyping(false),

      onError: (msg) => {
        console.error('[GeminiLive]', msg);
        setStatus('error');
        setStatusMsg(msg);
        store.setSpeaking(false);
        setIsPlaying(false);
        setIsTyping(false);
      },

      onDisconnected: () => {
        setStatus('error');
        setStatusMsg('Disconnected — click Retry');
        store.setSpeaking(false);
      },
    });

    clientRef.current = client;

    try {
      await client.connect();
    } catch (err) {
      setStatus('error');
      setStatusMsg(err instanceof Error ? err.message : 'Connection failed');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    connect();
    return () => { clientRef.current?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !clientRef.current?.isConnected) return;
      // Interrupt any ongoing audio playback before sending
      clientRef.current.stopAudio();
      setIsPlaying(false);
      store.setSpeaking(false);
      store.addTranscriptEntry({ role: 'user', content: trimmed, timestamp: new Date().toISOString() });
      store.setInputText('');
      setIsTyping(true);
      clientRef.current.sendText(trimmed, getContext());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getContext]
  );

  const startListening = useCallback(() => {
    const win = window as Window & { SpeechRecognition?: new () => { continuous: boolean; interimResults: boolean; lang: string; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((e: { results: ArrayLike<{ [k: number]: { transcript: string } }> }) => void) | null; start: () => void; stop: () => void; }; webkitSpeechRecognition?: typeof win.SpeechRecognition };
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Please use Chrome.'); return; }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = store.language === 'si' ? 'si-LK' : store.language === 'ta' ? 'ta-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (e) => { sendMessage(e.results[0][0].transcript); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [store.language, sendMessage]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  const isReady = status === 'connected';

  return (
    <div className="flex flex-col h-full">
      {/* Status banner */}
      {status === 'no-key' && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-sm text-amber-700">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>
            Gemini API key not configured.{' '}
            <a href="/admin/settings" className="underline font-medium">Add it in Admin → Settings</a>
            {' '}then reload.
          </span>
        </div>
      )}
      {status === 'error' && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center gap-2 text-sm text-red-700">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{statusMsg}</span>
          <button onClick={connect} className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
      {(status === 'connecting' || status === 'initializing') && (
        <div className="px-4 py-2 bg-cyan-50 border-b border-cyan-100 flex items-center gap-2 text-xs text-cyan-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Connecting to Gemini Live...
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-hidden p-4">
        <Transcript entries={store.transcript} isTyping={isTyping} pendingAssistantText={pendingEntry} />
      </div>

      {/* Audio indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-cyan-600 text-xs border-t border-gray-50">
          <Volume2 className="h-3.5 w-3.5 animate-pulse" />
          <span>Banki is speaking</span>
          <div className="flex gap-0.5 ml-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-0.5 bg-cyan-400 rounded-full animate-bounce" style={{ height: 12, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
          <button onClick={() => clientRef.current?.stopAudio()} className="ml-auto text-gray-400 hover:text-gray-600" title="Stop">
            <VolumeX className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 mb-2 text-xs">
          {isReady ? (
            <span className="flex items-center gap-1 text-green-600">
              <Wifi className="h-3 w-3" /> Gemini Live · Aoede voice
            </span>
          ) : status === 'no-key' ? (
            <a href="/admin/settings" className="flex items-center gap-1 text-amber-600 hover:underline">
              <Settings className="h-3 w-3" /> Configure API key
            </a>
          ) : null}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            value={store.inputText}
            onChange={(e) => store.setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(store.inputText); } }}
            placeholder={isReady ? 'Type or use the mic...' : 'Connecting...'}
            disabled={!isReady}
            className="flex-1 resize-none px-4 py-3 rounded-2xl border border-gray-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 text-sm min-h-[52px] max-h-32 disabled:bg-gray-50 disabled:text-gray-400"
            rows={1}
          />
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isReady}
            className={`p-3.5 rounded-2xl transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-cyan-100 hover:text-cyan-600 disabled:opacity-40'}`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={() => sendMessage(store.inputText)}
            disabled={!store.inputText.trim() || !isReady}
            className="p-3.5 bg-cyan-500 text-white rounded-2xl hover:bg-cyan-600 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {isListening && (
          <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            Listening — speak now
          </div>
        )}
      </div>
    </div>
  );
}
