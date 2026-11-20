import React from 'react';
import { motion } from 'framer-motion';
import { useSerenity } from '../context/SerenityContext';

interface MbtButtonProps {
  color: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'lg' | 'md' | 'grid' | 'badge';
  interactive?: boolean;
}

export const MbtButton: React.FC<MbtButtonProps> = ({
  color,
  children,
  onClick,
  className = '',
  size = 'lg',
  interactive = true,
}) => {
  const { nightMode } = useSerenity();

  // Keep dark charcoal legible on dark twilight backgrounds
  const effectiveColor = nightMode && color.toLowerCase() === '#3b3b3b' ? '#d4d8eb' : color;
  const surfaceClass = nightMode
    ? 'bg-[#1c2033]/88 backdrop-blur-md'
    : 'bg-white/92 backdrop-blur-xs';

  const sizeClasses = {
    lg: 'h-[104px] w-full text-[24px] tracking-[-0.24px] px-5 py-3.5',
    md: 'h-[70px] text-[23px] tracking-[-0.23px] px-5 py-3',
    grid: 'h-[114px] w-full text-[20px] tracking-[-0.2px] px-3 py-3 leading-tight',
    badge: 'h-[54px] min-w-[165px] px-5 text-[20px] tracking-[-0.2px]',
  }[size];

  if (!interactive) {
    return (
      <div
        className={`${surfaceClass} border-[6px] border-solid rounded-[30px] flex items-center justify-center text-center font-ubuntu font-medium transition-colors duration-300 ${sizeClasses} ${className}`}
        style={{ borderColor: effectiveColor, color: effectiveColor }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      onClick={onClick}
      className={`${surfaceClass} border-[6px] border-solid rounded-[30px] flex items-center justify-center text-center font-ubuntu font-medium shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)] transition-shadow duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10 ${sizeClasses} ${className}`}
      style={{ borderColor: effectiveColor, color: effectiveColor }}
    >
      {children}
    </motion.button>
  );
};
