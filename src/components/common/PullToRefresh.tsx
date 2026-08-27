import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  disabled = false
}) => {
  const [pullY, setPullY] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 64;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
      // Apply rubberband resistance
      const resistedY = Math.min(diff * 0.45, 90);
      setPullY(resistedY);
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(50);
      try {
        await onRefresh();
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 500);
      }
    } else {
      setPullY(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-y-auto ${className}`}
    >
      {/* MAYRA Custom Orb Pull Indicator */}
      <AnimatePresence>
        {(pullY > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: isRefreshing ? 52 : pullY }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center overflow-hidden pointer-events-none select-none z-20"
          >
            <div className="flex items-center gap-2 py-2 px-3 rounded-full bg-[#090D24]/90 backdrop-blur-xl border border-cyan-400/40 shadow-[0_4px_20px_rgba(6,182,212,0.3)]">
              {/* Miniature MAYRA Orb Spinner */}
              <div className="relative w-5 h-5 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-full h-full rounded-full border-2 border-t-cyan-400 border-r-purple-400 border-b-pink-400 border-l-transparent"
                />
                <div className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_6px_#22D3EE]" />
              </div>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                {isRefreshing ? 'Syncing MAYRA...' : pullY >= PULL_THRESHOLD ? 'Release to Refresh' : 'Pull to Refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
};
