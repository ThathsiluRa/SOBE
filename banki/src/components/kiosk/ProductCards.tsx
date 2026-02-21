'use client';

import React from 'react';
import { CheckCircle, Circle, CreditCard, PiggyBank, TrendingUp, Banknote } from 'lucide-react';
import { useKioskStore } from '@/stores/kiosk-store';
import type { ProductRecommendation } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  savings: <PiggyBank className="h-6 w-6" />,
  current: <Banknote className="h-6 w-6" />,
  credit_card: <CreditCard className="h-6 w-6" />,
  debit_card: <CreditCard className="h-6 w-6" />,
  loan: <Banknote className="h-6 w-6" />,
  fixed_deposit: <TrendingUp className="h-6 w-6" />,
};

const TYPE_COLORS: Record<string, string> = {
  savings: 'bg-green-50 text-green-600',
  current: 'bg-blue-50 text-blue-600',
  credit_card: 'bg-purple-50 text-purple-600',
  debit_card: 'bg-cyan-50 text-cyan-600',
  loan: 'bg-orange-50 text-orange-600',
  fixed_deposit: 'bg-yellow-50 text-yellow-600',
};

interface ProductCardProps {
  recommendation: ProductRecommendation;
  isSelected: boolean;
  onToggle: () => void;
  productType?: string;
}

function ProductCard({ recommendation, isSelected, onToggle, productType = 'savings' }: ProductCardProps) {
  return (
    <div
      onClick={recommendation.eligible ? onToggle : undefined}
      className={`relative rounded-2xl border-2 p-5 transition-all duration-200 ${
        !recommendation.eligible
          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
          : isSelected
          ? 'border-cyan-400 bg-cyan-50 cursor-pointer shadow-md'
          : 'border-gray-200 bg-white cursor-pointer hover:border-cyan-300 hover:shadow-sm'
      }`}
    >
      {/* Selected check */}
      <div className="absolute top-4 right-4">
        {isSelected ? (
          <CheckCircle className="h-6 w-6 text-cyan-500" />
        ) : (
          <Circle className="h-6 w-6 text-gray-300" />
        )}
      </div>

      {/* Product icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${TYPE_COLORS[productType] || TYPE_COLORS.savings}`}>
        {TYPE_ICONS[productType] || TYPE_ICONS.savings}
      </div>

      {/* Name */}
      <h3 className="font-bold text-gray-900 text-base pr-8">{recommendation.product_name}</h3>

      {/* Reason */}
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{recommendation.reason}</p>

      {/* Ineligibility */}
      {!recommendation.eligible && recommendation.ineligibility_reason && (
        <p className="text-xs text-red-500 mt-2 font-medium">
          {recommendation.ineligibility_reason}
        </p>
      )}

      {/* Recommended badge */}
      {recommendation.eligible && (
        <div className="mt-3">
          <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
            Recommended for you
          </span>
        </div>
      )}
    </div>
  );
}

interface ProductCardsProps {
  recommendations: ProductRecommendation[];
  productTypes?: Record<string, string>;
}

export function ProductCards({ recommendations, productTypes = {} }: ProductCardsProps) {
  const { selectedProductIds, toggleProductSelection } = useKioskStore();

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>No products available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        Select the products you&apos;d like to include in your application:
      </div>
      <div className="grid grid-cols-1 gap-4">
        {recommendations.map((rec) => (
          <ProductCard
            key={rec.product_id}
            recommendation={rec}
            isSelected={selectedProductIds.includes(rec.product_id)}
            onToggle={() => toggleProductSelection(rec.product_id)}
            productType={productTypes[rec.product_id]}
          />
        ))}
      </div>
      {selectedProductIds.length > 0 && (
        <div className="text-xs text-cyan-600 font-medium text-center">
          {selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
