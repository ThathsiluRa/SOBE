'use client';

import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface CameraCaptureProps {
  mode: 'id' | 'selfie';
  onCapture: (imageBase64: string) => void;
  onCancel?: () => void;
}

export function CameraCapture({ mode, onCapture, onCancel }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const capture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setCaptured(screenshot);
    }
  }, []);

  const confirm = () => {
    if (captured) {
      // Strip the data:image/jpeg;base64, prefix
      const base64 = captured.split(',')[1];
      onCapture(base64);
    }
  };

  const retake = () => setCaptured(null);

  const videoConstraints = mode === 'id'
    ? { width: 1280, height: 720, facingMode: 'environment' }
    : { width: 640, height: 640, facingMode: 'user' };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {mode === 'id' ? 'Scan Your ID Document' : 'Take a Selfie'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {mode === 'id'
            ? 'Hold your NIC/passport clearly in front of the camera'
            : 'Look directly at the camera and stay still'}
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
        {captured ? (
          <img src={captured} alt="Captured" className="w-full max-w-md rounded-2xl" />
        ) : cameraError ? (
          <div className="w-80 h-60 flex items-center justify-center text-center p-6">
            <div>
              <Camera className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{cameraError}</p>
            </div>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="rounded-2xl"
              onUserMediaError={(err) => setCameraError(`Camera error: ${err}`)}
            />
            {/* Guide overlay */}
            {mode === 'id' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-cyan-400 rounded-xl w-4/5 h-3/5 opacity-60" />
              </div>
            )}
            {mode === 'selfie' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-cyan-400 rounded-full w-64 h-64 opacity-60" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3">
        {captured ? (
          <>
            <Button variant="secondary" onClick={retake}>
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
            <Button onClick={confirm}>
              <Check className="h-4 w-4" />
              Use This Photo
            </Button>
          </>
        ) : (
          <>
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={capture} disabled={!!cameraError}>
              <Camera className="h-4 w-4" />
              {mode === 'id' ? 'Capture ID' : 'Take Selfie'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
