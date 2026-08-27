import React from 'react';

interface ShimmerSkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  count = 1
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'h-3 rounded-md';
      case 'card':
        return 'rounded-2xl h-24 p-3';
      case 'rectangular':
      default:
        return 'rounded-xl';
    }
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          style={{ width, height }}
          className={`relative overflow-hidden bg-white/[0.06] border border-white/[0.04] backdrop-blur-md ${getVariantStyles()} ${className}`}
        >
          {/* Shimmer Light Beam Effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-cyan-400/[0.12] to-transparent" />
        </div>
      ))}
    </>
  );
};
