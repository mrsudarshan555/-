import React from 'react';
import { AssistantStatus, AppearanceConfig, OrbStyleType, OrbColorType } from '../../types';
import { MayraOrb } from './MayraOrb';

interface MiniMayraAvatarProps {
  status: AssistantStatus;
  size?: number;
  appearanceConfig?: AppearanceConfig;
  orbStyle?: OrbStyleType;
  orbColor?: OrbColorType;
}

export const MiniMayraAvatar: React.FC<MiniMayraAvatarProps> = ({
  status,
  size = 64,
  appearanceConfig,
  orbStyle,
  orbColor
}) => {
  const selectedStyle: OrbStyleType = orbStyle || appearanceConfig?.orbStyle || 'particle_swirl';
  const selectedColor: OrbColorType = orbColor || appearanceConfig?.orbColor || 'spectrum';
  const selectedSize = size || appearanceConfig?.orbSize || 64;

  return (
    <div 
      className="relative flex items-center justify-center shrink-0"
      style={{ width: selectedSize, height: selectedSize }}
    >
      <MayraOrb
        style={selectedStyle}
        color={selectedColor}
        size={selectedSize}
        status={status}
      />
    </div>
  );
};
