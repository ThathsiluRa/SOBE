'use client';

import React, { useEffect, useState } from 'react';
import { useKioskStore } from '@/stores/kiosk-store';
import { ProgressSidebar } from '@/components/kiosk/ProgressSidebar';
import { VoiceChat } from '@/components/kiosk/VoiceChat';
import { CameraCapture } from '@/components/kiosk/CameraCapture';
import { LivenessCheck } from '@/components/kiosk/LivenessCheck';
import { EditableForm } from '@/components/kiosk/EditableForm';
import { ProductCards } from '@/components/kiosk/ProductCards';
import { CompletionScreen } from '@/components/kiosk/CompletionScreen';
import { Button } from '@/components/shared/Button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { KioskStep } from '@/types';

export default function KioskPage() {
  const store = useKioskStore();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [processingID, setProcessingID] = useState(false);
  const [processingFace, setProcessingFace] = useState(false);
  const [idError, setIDError] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<Record<string, string>>({});

  // Create application session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'en' }),
        });
        const app = await res.json();
        setApplicationId(app.id);
        store.setCustomerId(app.customerId);
        store.setSessionId(app.id);
      } catch (err) {
        console.error('Failed to create session:', err);
      }
    };

    if (!applicationId) {
      createSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save progress periodically
  useEffect(() => {
    if (!applicationId) return;

    const save = async () => {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicationId,
          fullName: store.fullName,
          dateOfBirth: store.dateOfBirth,
          gender: store.gender,
          phone: store.phone,
          email: store.email,
          address: store.address,
          occupation: store.occupation,
          monthlyIncome: store.monthlyIncome,
          language: store.language,
          idNumber: store.idExtractedData?.document_number,
          idDocumentType: store.idExtractedData?.document_type,
          idConfidence: store.idExtractedData?.confidence_score,
          livenessPass: store.livenessPass,
          faceMatchScore: store.faceMatchScore,
          selectedProducts: JSON.stringify(store.selectedProductIds),
          transcript: JSON.stringify(store.transcript),
          status: store.currentStep === 'complete' ? 'submitted' : 'in_progress',
        }),
      }).catch(console.error);
    };

    const timer = setInterval(save, 10000);
    return () => clearInterval(timer);
  }, [applicationId, store]);

  // Handle ID capture
  const handleIDCapture = async (base64: string) => {
    store.setIDCapture(base64);
    setProcessingID(true);
    setIDError(null);

    try {
      const res = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      });

      const { data, error } = await res.json();

      if (error || !data) {
        throw new Error(error || 'Extraction failed');
      }

      store.setIDExtracted(data);

      // Auto-fill form fields
      if (data.full_name) store.setPersonalField('fullName', data.full_name);
      if (data.date_of_birth) store.setPersonalField('dateOfBirth', data.date_of_birth);
      if (data.gender) store.setPersonalField('gender', data.gender);
      if (data.address) store.setPersonalField('address', data.address);

      store.setIDConfirmed(true);
      store.setStep('selfie');

    } catch (err) {
      setIDError(err instanceof Error ? err.message : 'Failed to extract ID data');
    } finally {
      setProcessingID(false);
    }
  };

  // Handle selfie capture
  const handleSelfieCapture = async (base64: string) => {
    store.setSelfieCapture(base64);

    if (store.idImageCapture) {
      setProcessingFace(true);
      setFaceError(null);

      try {
        const res = await fetch('/api/face-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idImageBase64: store.idImageCapture,
            selfieBase64: base64,
          }),
        });

        const result = await res.json();
        store.setFaceMatchScore(result.score);
        store.setStep('liveness');

      } catch (err) {
        console.error('Face match error:', err);
        setFaceError('Face matching unavailable - proceeding with manual review');
        store.setStep('liveness');
      } finally {
        setProcessingFace(false);
      }
    } else {
      store.setStep('liveness');
    }
  };

  // Handle liveness complete
  const handleLivenessComplete = async (passed: boolean) => {
    store.setLivenessPass(passed);

    // Get product recommendations
    try {
      const productsRes = await fetch('/api/products');
      const products = await productsRes.json();

      const types: Record<string, string> = {};
      products.forEach((p: { id: string; type: string }) => {
        types[p.id] = p.type;
      });
      setProductTypes(types);

      // Get recommendations from Gemini
      const customerAge = store.dateOfBirth
        ? Math.floor((Date.now() - new Date(store.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : undefined;

      const promptRes = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [],
          message: 'Recommend banking products based on customer profile',
          contextInfo: {
            task: 'product_recommendation',
            customerProfile: {
              age: customerAge,
              occupation: store.occupation,
              monthlyIncome: store.monthlyIncome,
            },
            availableProducts: products.map((p: {id: string; name: string; type: string; description: string; eligibilityRules: string; features: string}) => ({
              id: p.id,
              name: p.name,
              type: p.type,
              description: p.description,
              eligibilityRules: p.eligibilityRules,
            })),
          },
        }),
      });

      const promptData = await promptRes.json();

      // Try to parse recommendations from response
      try {
        const match = promptData.response?.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.recommendations) {
            store.setRecommendedProducts(parsed.recommendations);
          }
        }
      } catch {
        // Use default recommendations if parsing fails
        const defaultRecs = products.slice(0, 3).map((p: { id: string; name: string; type: string }) => ({
          product_id: p.id,
          product_name: p.name,
          reason: `A great ${p.type.replace('_', ' ')} option for your needs`,
          eligible: true,
        }));
        store.setRecommendedProducts(defaultRecs);
      }
    } catch (err) {
      console.error('Product recommendation error:', err);
    }

    store.setStep('products');
  };

  // Handle application submission
  const handleSubmit = async () => {
    if (!applicationId) return;

    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicationId,
          status: 'submitted',
          fullName: store.fullName,
          dateOfBirth: store.dateOfBirth,
          gender: store.gender,
          phone: store.phone,
          email: store.email,
          address: store.address,
          occupation: store.occupation,
          monthlyIncome: store.monthlyIncome,
          selectedProducts: JSON.stringify(store.selectedProductIds),
          transcript: JSON.stringify(store.transcript),
          livenessPass: store.livenessPass,
          faceMatchScore: store.faceMatchScore,
        }),
      });
      store.setStep('complete');
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const renderRightPanel = () => {
    switch (store.currentStep) {
      case 'greeting':
      case 'personal_info':
        return (
          <div className="h-full flex flex-col gap-4 p-4">
            <div className="flex-shrink-0">
              <EditableForm />
            </div>
          </div>
        );

      case 'id_scan':
        return (
          <div className="h-full overflow-y-auto p-4">
            {processingID ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
                <p className="text-gray-500">Extracting ID data...</p>
              </div>
            ) : store.idConfirmed ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-800">ID Verified</h3>
                <div className="w-full text-left">
                  <EditableForm />
                </div>
              </div>
            ) : (
              <div>
                {idError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {idError}
                  </div>
                )}
                <CameraCapture
                  mode="id"
                  onCapture={handleIDCapture}
                />
              </div>
            )}
          </div>
        );

      case 'selfie':
        return (
          <div className="h-full overflow-y-auto p-4">
            {processingFace ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
                <p className="text-gray-500">Matching face...</p>
              </div>
            ) : store.selfieCapture ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-gray-600 font-semibold">Selfie captured</p>
                {store.faceMatchScore && (
                  <p className="text-sm text-gray-400">
                    Face match: {(store.faceMatchScore * 100).toFixed(1)}%
                  </p>
                )}
                {faceError && <p className="text-xs text-amber-500">{faceError}</p>}
              </div>
            ) : (
              <CameraCapture
                mode="selfie"
                onCapture={handleSelfieCapture}
              />
            )}
          </div>
        );

      case 'liveness':
        return (
          <div className="h-full overflow-y-auto p-4">
            {store.livenessPass ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-lg font-semibold text-gray-800">Verification Complete</p>
                <p className="text-sm text-gray-500">Loading product recommendations...</p>
              </div>
            ) : (
              <LivenessCheck onComplete={handleLivenessComplete} />
            )}
          </div>
        );

      case 'products':
        return (
          <div className="h-full overflow-y-auto p-4">
            <ProductCards
              recommendations={store.recommendedProducts}
              productTypes={productTypes}
            />
            <div className="mt-4">
              <Button
                onClick={() => {
                  store.setStep('review');
                }}
                className="w-full"
              >
                Continue to Review
              </Button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <EditableForm />
            {store.selectedProductIds.length > 0 && (
              <div className="bg-cyan-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-cyan-800 mb-2">Selected Products</h3>
                <div className="space-y-1">
                  {store.recommendedProducts
                    .filter((p) => store.selectedProductIds.includes(p.product_id))
                    .map((p) => (
                      <div key={p.product_id} className="text-sm text-cyan-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {p.product_name}
                      </div>
                    ))}
                </div>
              </div>
            )}
            <Button onClick={handleSubmit} size="lg" className="w-full">
              Submit Application
            </Button>
          </div>
        );

      case 'complete':
        return (
          <div className="h-full">
            <CompletionScreen
              customerId={store.customerId || 'BANKI-2026-00001'}
              applicationId={applicationId || ''}
              customerName={store.fullName}
              onRestart={() => {
                store.reset();
                setApplicationId(null);
                window.location.reload();
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Left sidebar - Progress */}
      <ProgressSidebar
        currentStep={store.currentStep as KioskStep}
        customerName={store.fullName}
      />

      {/* Center - Voice chat */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Banki Voice Kiosk</h1>
            <p className="text-xs text-gray-400">AI-powered account opening</p>
          </div>
          <div className="flex items-center gap-2">
            {store.isSpeaking && (
              <span className="flex items-center gap-1 text-xs text-cyan-600">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                Speaking
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {store.customerId || 'Starting...'}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <VoiceChat onStepChange={(step) => store.setStep(step as KioskStep)} />
        </div>
      </div>

      {/* Right panel - Dynamic content */}
      <div className="w-96 flex flex-col bg-white border-l border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {store.currentStep === 'greeting' || store.currentStep === 'personal_info'
              ? 'Application Form'
              : store.currentStep === 'id_scan'
              ? 'ID Scanner'
              : store.currentStep === 'selfie'
              ? 'Selfie Capture'
              : store.currentStep === 'liveness'
              ? 'Liveness Check'
              : store.currentStep === 'products'
              ? 'Product Selection'
              : store.currentStep === 'review'
              ? 'Review & Submit'
              : 'Complete'}
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}
