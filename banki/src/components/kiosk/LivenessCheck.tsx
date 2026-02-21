'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { CheckCircle, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface LivenessCheckProps {
  onComplete: (passed: boolean) => void;
}

type LivenessInstruction = 'blink' | 'turn_left' | 'turn_right';

interface Instruction {
  id: LivenessInstruction;
  label: string;
  icon: React.ReactNode;
}

const INSTRUCTIONS: Instruction[] = [
  { id: 'blink', label: 'Blink your eyes', icon: <Eye className="h-6 w-6" /> },
  { id: 'turn_left', label: 'Turn head left', icon: <ArrowLeft className="h-6 w-6" /> },
  { id: 'turn_right', label: 'Turn head right', icon: <ArrowRight className="h-6 w-6" /> },
];

export function LivenessCheck({ onComplete }: LivenessCheckProps) {
  const webcamRef = useRef<Webcam>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [countdown, setCountdown] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const completeStep = useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(currentStep);
      if (next.size === INSTRUCTIONS.length) {
        setTimeout(() => onComplete(true), 800);
      } else {
        setCurrentStep((s) => s + 1);
        setCountdown(3);
      }
      return next;
    });
  }, [currentStep, onComplete]);

  // Demo mode: auto-complete steps after countdown
  useEffect(() => {
    if (!isRunning) return;
    if (completedSteps.has(currentStep)) return;

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          completeStep();
          return 3;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentStep, completedSteps, completeStep]);

  const startLiveness = () => {
    setIsRunning(true);
    setIsDemoMode(true);
  };

  const currentInstruction = INSTRUCTIONS[currentStep];
  const allDone = completedSteps.size === INSTRUCTIONS.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800">Liveness Check</h3>
        <p className="text-sm text-gray-500 mt-1">Follow the instructions to verify you&apos;re real</p>
        {isDemoMode && (
          <span className="inline-block mt-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
            Demo Mode — Auto-completing
          </span>
        )}
      </div>

      {/* Webcam */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{ width: 480, height: 360, facingMode: 'user' }}
          className="rounded-2xl"
        />
        {/* Face guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`border-4 rounded-full w-48 h-64 transition-colors duration-300 ${
            allDone ? 'border-green-400' : isRunning ? 'border-cyan-400' : 'border-white/30'
          }`} />
        </div>
      </div>

      {/* Instructions */}
      <div className="flex gap-3">
        {INSTRUCTIONS.map((inst, i) => (
          <div
            key={inst.id}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              completedSteps.has(i)
                ? 'border-green-400 bg-green-50'
                : i === currentStep && isRunning
                ? 'border-cyan-400 bg-cyan-50 scale-105'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className={completedSteps.has(i) ? 'text-green-500' : i === currentStep && isRunning ? 'text-cyan-500' : 'text-gray-400'}>
              {completedSteps.has(i) ? <CheckCircle className="h-6 w-6" /> : inst.icon}
            </div>
            <span className="text-xs font-medium text-gray-600">{inst.label}</span>
            {i === currentStep && isRunning && !completedSteps.has(i) && (
              <div className="text-2xl font-bold text-cyan-500">{countdown}</div>
            )}
          </div>
        ))}
      </div>

      {allDone ? (
        <div className="flex items-center gap-2 text-green-600 font-semibold">
          <CheckCircle className="h-5 w-5" />
          Liveness verified!
        </div>
      ) : !isRunning ? (
        <Button onClick={startLiveness} size="lg">
          Start Liveness Check
        </Button>
      ) : (
        <div className="text-center">
          <p className="text-sm font-semibold text-cyan-600">
            {currentInstruction?.label}
          </p>
          <p className="text-xs text-gray-400 mt-1">Hold for {countdown}s...</p>
        </div>
      )}

      <button
        onClick={() => onComplete(true)}
        className="text-xs text-gray-400 underline hover:text-gray-600 mt-2"
      >
        Skip (demo)
      </button>
    </div>
  );
}
