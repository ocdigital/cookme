import _React from 'react';

const LG = {
  green: '#3FA365',
  amber: '#F3A82A',
  ink: '#1E1A14',
  paper: '#FBF7EF',
};

interface LogoIconProps {
  size?: number;
  color?: string;
  spark?: string;
  className?: string;
}

export function LogoIcon({ size = 80, color = LG.green, spark = LG.amber, className }: LogoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      {/* pot body */}
      <path d="M14 46 Q14 64 22 64 L58 64 Q66 64 66 46 Z" fill={color} />
      {/* lid (shifted up) */}
      <g transform="translate(0,-3)">
        <ellipse cx="40" cy="38" rx="30" ry="6" fill={color} opacity={0.9} />
        <rect x="36" y="29" width="8" height="8" rx="2" fill={color} />
      </g>
      {/* sparkles */}
      <path d="M24 22 L25 18 L26 22 L30 23 L26 24 L25 28 L24 24 L20 23 Z" fill={spark} />
      <path d="M52 14 L52.7 11 L53.5 14 L56.5 14.5 L53.5 15 L52.7 18 L52 15 L49 14.5 Z" fill={spark} />
      <circle cx="40" cy="20" r="2" fill={spark} />
    </svg>
  );
}

interface CookmeLogoHorizontalProps {
  size?: number;
  dark?: boolean;
  className?: string;
}

export function CookmeLogoHorizontal({ size = 36, dark = false, className }: CookmeLogoHorizontalProps) {
  const ts = Math.round(size * 0.72);
  const textColor = dark ? LG.paper : LG.ink;
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoIcon size={size} />
      <span
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: ts,
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        cookme<span style={{ color: LG.amber }}>.</span>
      </span>
    </div>
  );
}

interface CookmeLogoProps {
  size?: number;
  textSize?: number;
  dark?: boolean;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
}

export function CookmeLogo({
  size = 80,
  textSize,
  dark = false,
  showTagline = false,
  tagline = 'Sua despensa inteligente',
  className,
}: CookmeLogoProps) {
  const ts = textSize ?? Math.round(size * 0.4);
  const textColor = dark ? LG.paper : LG.ink;

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ''}`}>
      <div
        style={{
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) * 0.25,
          backgroundColor: '#EDF7F1',
          border: '1px solid #C4E8D1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LogoIcon size={size} />
      </div>
      <span
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: ts,
          fontWeight: 800,
          color: textColor,
          letterSpacing: ts > 24 ? '-0.06em' : '-0.04em',
          lineHeight: 1,
        }}
      >
        cookme<span style={{ color: LG.amber }}>.</span>
      </span>
      {showTagline && (
        <span style={{ fontSize: 13, color: dark ? 'rgba(251,247,239,0.7)' : '#6B7280' }}>{tagline}</span>
      )}
    </div>
  );
}
