import React, { useEffect, useState, useRef } from 'react';
import { AssistantStatus } from '../../types';
import { getSpeechAudioAnalyser } from '../../utils/speechEngine';

interface AudioWaveformIconProps {
  status: AssistantStatus;
  isListeningMode?: boolean;
  className?: string;
  barCount?: number;
}

export const AudioWaveformIcon: React.FC<AudioWaveformIconProps> = ({
  status,
  isListeningMode = false,
  className = '',
  barCount = 4
}) => {
  const [levels, setLevels] = useState<number[]>([0.4, 0.7, 0.5, 0.8]);
  const animationFrameRef = useRef<number | null>(null);

  const isActive = isListeningMode || status === 'LISTENING' || status === 'SPEAKING' || status === 'THINKING';

  useEffect(() => {
    let phase = 0;
    const frequencyData = new Uint8Array(32);

    const updateWaveform = () => {
      phase += 0.18;
      const analyser = getSpeechAudioAnalyser();

      if (analyser) {
        try {
          analyser.getByteFrequencyData(frequencyData);
          // Sample across frequency bands
          const step = Math.max(1, Math.floor(frequencyData.length / barCount));
          const newLevels = Array.from({ length: barCount }, (_, i) => {
            const rawVal = frequencyData[i * step] || 0;
            const normalized = rawVal / 255;
            // Floor at 0.2, ceiling at 1.0
            return Math.min(1.0, Math.max(0.2, normalized * 1.5 + Math.sin(phase + i * 1.2) * 0.15));
          });
          setLevels(newLevels);
        } catch {
          // Fallback animated sine wave
          const newLevels = Array.from({ length: barCount }, (_, i) => {
            const val = 0.35 + 0.55 * Math.abs(Math.sin(phase + i * 0.9));
            return Math.min(1.0, Math.max(0.2, val));
          });
          setLevels(newLevels);
        }
      } else if (isActive) {
        // High energy animated equalizer
        const speed = status === 'LISTENING' ? 0.25 : status === 'SPEAKING' ? 0.3 : 0.15;
        phase += speed;
        const newLevels = Array.from({ length: barCount }, (_, i) => {
          const val = 0.3 + 0.65 * Math.abs(Math.sin(phase + i * 1.1));
          return Math.min(1.0, Math.max(0.25, val));
        });
        setLevels(newLevels);
      } else {
        // Subtle resting baseline equalizer
        const newLevels = [0.35, 0.75, 0.5, 0.9, 0.4].slice(0, barCount);
        setLevels(newLevels);
      }

      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      }
    };

    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } else {
      setLevels([0.35, 0.8, 0.55, 0.9].slice(0, barCount));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, status, isListeningMode, barCount]);

  return (
    <div className={`flex items-center justify-center gap-[3px] h-6 w-6 pointer-events-none select-none ${className}`}>
      {levels.map((lvl, index) => {
        // Scale bar height between 5px and 22px
        const heightPx = Math.max(5, Math.round(lvl * 22));
        
        let barColor = 'bg-slate-200';
        if (status === 'LISTENING' || isListeningMode) {
          barColor = index % 2 === 0 ? 'bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]';
        } else if (status === 'SPEAKING') {
          barColor = 'bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
        } else if (status === 'THINKING') {
          barColor = 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
        }

        return (
          <div
            key={index}
            className={`w-[3.5px] rounded-full transition-all duration-75 ease-out ${barColor}`}
            style={{
              height: `${heightPx}px`,
            }}
          />
        );
      })}
    </div>
  );
};
