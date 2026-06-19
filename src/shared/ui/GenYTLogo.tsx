import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface GenYTLogoProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function GenYTLogo({ size = 28, color = 'currentColor', strokeWidth = 2.5 }: GenYTLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10 9a.5.5 0 0 1 .75-.43l5 3a.5.5 0 0 1 0 .86l-5 3A.5.5 0 0 1 10 15V9Z" fill={color} stroke="none" />
      <Rect width="20" height="14" x="2" y="5" rx="4" />
    </Svg>
  );
}
