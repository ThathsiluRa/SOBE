'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { useKioskStore } from '@/stores/kiosk-store';
import { Transcript } from './Transcript';
import type { GeminiMessage } from '@/lib/gemini';

interface VoiceChatProps {
  onStepChange?: (step: string) => void;
}

export function VoiceChat({ onStepChange }: VoiceChatProps) {
  const store = useKioskStore();
  const [isTyping, setIsTyping] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const conversationHistory = useRef<GeminiMessage[]>([]);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getContextInfo = useCallback(() => ({
    currentStep: store.currentStep,
    language: store.language,
    collectedData: {
      fullName: store.fullName,
      dateOfBirth: store.dateOfBirth,
      gender: store.gender,
      phone: store.phone,
      email: store.email,
      address: store.address,
      occupation: store.occupation,
      monthlyIncome: store.monthlyIncome,
    },
    idVerified: store.idConfirmed,
    idNumber: store.idExtractedData?.document_number,
    livenessPass: store.livenessPass,
    faceMatchScore: store.faceMatchScore,
    selectedProducts: store.selectedProductIds,
  }), [store]);

  const speakText = useCallback((text: string, lang: string = 'en') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'si' ? 'si-LK' : lang === 'ta' ? 'ta-LK' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    utterance.onstart = () => store.setSpeaking(true);
    utterance.onend = () => store.setSpeaking(false);
    utterance.onerror = () => store.setSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [store]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message to transcript
    store.addTranscriptEntry({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    store.setInputText('');
    setIsTyping(true);

    // Add to history for Gemini
    conversationHistory.current.push({ role: 'user', parts: [{ text: message }] });

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: conversationHistory.current.slice(-20), // Keep last 20 turns
          message,
          contextInfo: getContextInfo(),
        }),
      });

      const data = await res.json();
      const response = data.response || "I'm sorry, I didn't catch that. Could you repeat?";

      // Add to history
      conversationHistory.current.push({ role: 'model', parts: [{ text: response }] });

      // Add to transcript
      store.addTranscriptEntry({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      });

      // Speak the response
      speakText(response, store.language);

      // Parse step hints from response
      parseAndUpdateStep(response);

    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = "I'm having a little trouble connecting. Please try again.";
      store.addTranscriptEntry({
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toISOString(),
      });
      speakText(errorMsg);
    } finally {
      setIsTyping(false);
    }
  }, [store, getContextInfo, speakText]);

  const parseAndUpdateStep = (response: string) => {
    const lower = response.toLowerCase();
    const currentStep = store.currentStep;

    if (currentStep === 'greeting' && (
      lower.includes('full name') || lower.includes('your name') || lower.includes('date of birth')
    )) {
      store.setStep('personal_info');
      onStepChange?.('personal_info');
    } else if (currentStep === 'personal_info' && (
      lower.includes('identity card') || lower.includes('nic') || lower.includes('hold your') || lower.includes('camera')
    )) {
      store.setStep('id_scan');
      onStepChange?.('id_scan');
    } else if (currentStep === 'id_scan' && (
      lower.includes('selfie') || lower.includes('look at the camera') || lower.includes('photograph')
    )) {
      store.setStep('selfie');
      onStepChange?.('selfie');
    } else if (currentStep === 'selfie' && (
      lower.includes('blink') || lower.includes('liveness') || lower.includes('turn your head')
    )) {
      store.setStep('liveness');
      onStepChange?.('liveness');
    } else if (currentStep === 'liveness' && (
      lower.includes('recommend') || lower.includes('product') || lower.includes('account type')
    )) {
      store.setStep('products');
      onStepChange?.('products');
    } else if (currentStep === 'products' && (
      lower.includes('review') || lower.includes('summary') || lower.includes('confirm')
    )) {
      store.setStep('review');
      onStepChange?.('review');
    } else if (currentStep === 'review' && (
      lower.includes('congratulations') || lower.includes('reference number') || lower.includes('submitted')
    )) {
      store.setStep('complete');
      onStepChange?.('complete');
    }
  };

  const startVoiceInput = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Use Function constructor to avoid TypeScript issues with browser speech API
    type SpeechRecognitionLike = {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
      start: () => void;
      stop: () => void;
    };
    type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

    const win = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = store.language === 'si' ? 'si-LK' : store.language === 'ta' ? 'ta-IN' : 'en-US';

    recognition.onstart = () => setIsListeningVoice(true);
    recognition.onend = () => setIsListeningVoice(false);
    recognition.onerror = () => setIsListeningVoice(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [store.language, sendMessage]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListeningVoice(false);
  }, []);

  // Initial greeting
  useEffect(() => {
    const greet = async () => {
      await new Promise((r) => setTimeout(r, 500));
      await sendMessage('hello');
    };
    if (store.transcript.length === 0) {
      greet();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Transcript area */}
      <div className="flex-1 overflow-hidden p-4">
        <Transcript entries={store.transcript} isTyping={isTyping} />
      </div>

      {/* Speaking indicator */}
      {store.isSpeaking && (
        <div className="flex items-center gap-2 px-4 py-2 text-cyan-600 text-sm">
          <Volume2 className="h-4 w-4 animate-pulse" />
          <span className="text-xs">Banki is speaking...</span>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={store.inputText}
              onChange={(e) => store.setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(store.inputText);
                }
              }}
              placeholder="Type your response or use the microphone..."
              className="w-full resize-none px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 text-sm min-h-[52px] max-h-32"
              rows={1}
            />
          </div>

          {/* Voice button */}
          <button
            onClick={isListeningVoice ? stopVoiceInput : startVoiceInput}
            disabled={isTyping}
            className={`p-3.5 rounded-2xl transition-all flex-shrink-0 ${
              isListeningVoice
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-600 hover:bg-cyan-100 hover:text-cyan-600'
            }`}
          >
            {isListeningVoice ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(store.inputText)}
            disabled={!store.inputText.trim() || isTyping}
            className="p-3.5 bg-cyan-500 text-white rounded-2xl hover:bg-cyan-600 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {isListeningVoice && (
          <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            Listening... Click the mic to stop
          </div>
        )}
      </div>
    </div>
  );
}
