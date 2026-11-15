import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  tone?: 'on-red' | 'on-white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  tone = 'on-red',
  size = 'md',
  customLogoUrl,
}) => {
  const circleSizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  }[size];

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-[42px] leading-tight',
  }[size];

  const isOnRed = tone === 'on-red';

  const iconEl = (
    <div
      className={`${circleSizes} rounded-full bg-[#5A0000] border-2 border-[#FFD700]/70 flex items-center justify-center shrink-0 shadow-md overflow-hidden`}
    >
      {customLogoUrl ? (
        <img src={customLogoUrl} alt="Institution Logo" className="w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="#7A0000" />
          {/* White graduation cap mortarboard top */}
          <path d="M50 23 L84 38 L50 53 L16 38 Z" fill="#FFFFFF" />
          {/* Gold/yellow cap base */}
          <polygon points="50,55 74,44 74,64 50,74 26,64 26,44" fill="#FFD700" />
          {/* Gold tassel */}
          <circle cx="84" cy="42" r="3.2" fill="#FFD700" />
          <path d="M84 42 L84 62" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );

  if (variant === 'icon') {
    return iconEl;
  }

  return (
    <div className="flex items-center gap-3 select-none">
      {iconEl}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-bold tracking-tight whitespace-nowrap ${titleSizes} ${
              isOnRed ? 'text-white' : 'text-[#7A0000]'
            }`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Smart ERP
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FFD700] text-[#7A0000]">
            AI-POWERED
          </span>
        </div>
        {variant === 'full' && (
          <div
            className={`text-[10px] font-bold tracking-[0.14em] uppercase mt-0.5 ${
              isOnRed ? 'text-[#FFD700]' : 'text-[#D4A017]'
            }`}
          >
            ATTENDANCE MANAGEMENT ERP
          </div>
        )}
      </div>
    </div>
  );
};
