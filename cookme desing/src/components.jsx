// Componentes de UI do CookMe
// Pequenos, genéricos, reutilizáveis. Consomem T/radius/shadow/font/type do tokens.jsx.

// ─── Botões ─────────────────────────────────────────────────────────────
const CMButton = ({ variant = 'primary', size = 'md', full = false, leading, trailing, children, style = {}, onClick }) => {
  const sizes = {
    sm: { h: 36, px: 14, fs: 14, r: radius.sm },
    md: { h: 48, px: 18, fs: 15, r: radius.md },
    lg: { h: 56, px: 22, fs: 16, r: radius.md },
  };
  const s = sizes[size];
  const variants = {
    primary:     { bg: T.green[500], color: T.ink[0], border: 'none', shadow: shadow.md },
    secondary:   { bg: T.ink[0], color: T.ink[800], border: `1px solid ${T.ink[200]}`, shadow: shadow.sm },
    ghost:       { bg: 'transparent', color: T.ink[700], border: 'none', shadow: 'none' },
    destructive: { bg: T.red[500], color: T.ink[0], border: 'none', shadow: shadow.sm },
    amber:       { bg: T.amber[500], color: T.ink[900], border: 'none', shadow: shadow.sm },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`, borderRadius: s.r,
      background: v.bg, color: v.color, border: v.border, boxShadow: v.shadow,
      fontFamily: font.sans, fontSize: s.fs, fontWeight: 600, letterSpacing: -0.1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: full ? '100%' : undefined, cursor: 'pointer',
      ...style,
    }}>
      {leading}{children}{trailing}
    </button>
  );
};

// ─── Chip / Pill ────────────────────────────────────────────────────────
const Chip = ({ active, leading, children, onClick, style = {} }) => (
  <button onClick={onClick} style={{
    height: 36, padding: '0 14px', borderRadius: radius.pill,
    background: active ? T.ink[900] : T.ink[0],
    color: active ? T.ink[0] : T.ink[700],
    border: active ? 'none' : `1px solid ${T.ink[200]}`,
    fontFamily: font.sans, fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    whiteSpace: 'nowrap',
    ...style,
  }}>
    {leading}{children}
  </button>
);

// ─── Badges ─────────────────────────────────────────────────────────────
const Badge = ({ tone = 'neutral', children, leading, style = {} }) => {
  const tones = {
    neutral: { bg: T.ink[100], color: T.ink[700] },
    success: { bg: T.green[50], color: T.green[700] },
    warn:    { bg: T.amber[50], color: T.amber[700] },
    danger:  { bg: T.red[50], color: T.red[600] },
    dark:    { bg: T.ink[900], color: T.ink[0] },
    amber:   { bg: T.amber[500], color: T.ink[900] },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 22, padding: '0 8px', borderRadius: radius.pill,
      background: t.bg, color: t.color,
      fontFamily: font.sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
      ...style,
    }}>{leading}{children}</span>
  );
};

// Badge específica para confiança da IA — usa cor + ícone
const AIConfidenceBadge = ({ confidence }) => {
  // ≥75% = alta (verde com check); <75% = baixa (âmbar com warning)
  const high = confidence >= 75;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 22, padding: '0 8px', borderRadius: radius.pill,
      background: high ? T.green[50] : T.amber[50],
      color: high ? T.green[700] : T.amber[700],
      fontFamily: font.sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.1,
    }}>
      {high ? <I.check size={12} sw={2.5}/> : <I.warning size={12} sw={2.2}/>}
      {confidence}%
    </span>
  );
};

// ─── Cartão base ────────────────────────────────────────────────────────
const Card = ({ children, style = {}, onClick, padding = 16 }) => (
  <div onClick={onClick} style={{
    background: T.ink[0], borderRadius: radius.lg, padding,
    boxShadow: shadow.sm, border: `1px solid ${T.ink[150]}`,
    ...style,
  }}>{children}</div>
);

// ─── Input ──────────────────────────────────────────────────────────────
const Input = ({ placeholder, leading, trailing, value, style = {} }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    height: 48, padding: '0 14px', borderRadius: radius.md,
    background: T.ink[100], border: `1px solid transparent`,
    ...style,
  }}>
    {leading && <span style={{ color: T.ink[400], display: 'flex' }}>{leading}</span>}
    <span style={{
      flex: 1, fontFamily: font.sans, fontSize: 14, fontWeight: 500,
      color: value ? T.ink[800] : T.ink[400],
    }}>{value || placeholder}</span>
    {trailing}
  </div>
);

// ─── Avatar (placeholder listrado com iniciais) ────────────────────────
const Avatar = ({ initials, size = 40, hue = 145 }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2,
    background: `oklch(0.88 0.06 ${hue})`,
    color: `oklch(0.38 0.12 ${hue})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: font.sans, fontSize: size * 0.4, fontWeight: 700,
    flexShrink: 0,
  }}>{initials}</div>
);

// ─── Imagem placeholder (listrada) ─────────────────────────────────────
const ImgPlaceholder = ({ label, w = '100%', h = 160, hue = 70, radius: r = radius.md, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: r, overflow: 'hidden', position: 'relative',
    background: `repeating-linear-gradient(135deg, oklch(0.94 0.04 ${hue}) 0 10px, oklch(0.92 0.05 ${hue}) 10px 20px)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>
    <span style={{
      fontFamily: font.mono, fontSize: 10, fontWeight: 500,
      color: `oklch(0.40 0.08 ${hue})`, letterSpacing: 0.4,
      background: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 4,
    }}>{label}</span>
  </div>
);

// ─── Foto "real" estilizada como CSS (sem depender de URLs externas) ────
// Usa gradientes radiais sobrepostos pra simular prato de comida em tom quente
const FoodPhoto = ({ hue = 40, w = '100%', h = 160, radius: r = radius.md, label, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: r, overflow: 'hidden', position: 'relative',
    background: `
      radial-gradient(circle at 30% 40%, oklch(0.72 0.14 ${hue}) 0%, transparent 35%),
      radial-gradient(circle at 70% 60%, oklch(0.82 0.10 ${hue + 20}) 0%, transparent 40%),
      radial-gradient(circle at 50% 80%, oklch(0.55 0.12 ${hue - 15}) 0%, transparent 30%),
      linear-gradient(135deg, oklch(0.65 0.13 ${hue}) 0%, oklch(0.50 0.11 ${hue - 10}) 100%)
    `,
    ...style,
  }}>
    {label && (
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'rgba(20,15,10,0.55)', backdropFilter: 'blur(6px)',
        padding: '3px 8px', borderRadius: 4,
        fontFamily: font.mono, fontSize: 9, fontWeight: 500,
        color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4,
      }}>{label}</div>
    )}
  </div>
);

// ─── Progress Bar ───────────────────────────────────────────────────────
const ProgressBar = ({ value, color = T.green[500], bg = T.ink[150], h = 6, style = {} }) => (
  <div style={{
    width: '100%', height: h, borderRadius: h, background: bg, overflow: 'hidden',
    ...style,
  }}>
    <div style={{
      width: `${value}%`, height: '100%', background: color,
      transition: 'width .3s cubic-bezier(.2,.7,.3,1)',
    }}/>
  </div>
);

// ─── Divider ────────────────────────────────────────────────────────────
const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: T.ink[150], ...style }}/>
);

// ─── Tab Bar (inferior, baseada na ref mas refeita pro cookme) ─────────
const CMTabBar = ({ active = 'home', onChange }) => {
  const items = [
    { id: 'home', icon: I.home, label: 'Início' },
    { id: 'pantry', icon: I.pantry, label: 'Despensa' },
    { id: 'fab', fab: true, icon: I.camera },
    { id: 'list', icon: I.cart, label: 'Lista' },
    { id: 'profile', icon: I.user, label: 'Perfil' },
  ];
  return (
    <div style={{
      position: 'relative',
      background: T.ink[0], borderTop: `1px solid ${T.ink[150]}`,
      padding: '10px 8px 28px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
    }}>
      {items.map(it => {
        if (it.fab) {
          return (
            <button key={it.id} onClick={() => onChange && onChange(it.id)} style={{
              width: 58, height: 58, borderRadius: 29,
              background: T.green[500], color: T.ink[0],
              border: 'none', boxShadow: '0 8px 20px rgba(58,140,75,.35), 0 2px 6px rgba(58,140,75,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -22, cursor: 'pointer',
            }}>
              <it.icon size={26} sw={2}/>
            </button>
          );
        }
        const isActive = it.id === active;
        return (
          <button key={it.id} onClick={() => onChange && onChange(it.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: isActive ? T.green[600] : T.ink[400],
            flex: 1, padding: '4px 0',
          }}>
            <it.icon size={22}/>
            <span style={{ fontFamily: font.sans, fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Header reutilizável ───────────────────────────────────────────────
const CMHeader = ({ title, subtitle, showBack, trailing, onBack, style = {} }) => (
  <div style={{
    padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 12,
    ...style,
  }}>
    {showBack && (
      <button onClick={onBack} style={{
        width: 40, height: 40, borderRadius: 20, border: 'none',
        background: T.ink[100], color: T.ink[800],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}>
        <I.back size={20}/>
      </button>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      {subtitle && (
        <div style={{
          fontFamily: font.sans, fontSize: 11, fontWeight: 700,
          color: T.green[600], letterSpacing: 0.6, textTransform: 'uppercase',
        }}>{subtitle}</div>
      )}
      <div style={{
        fontFamily: font.sans, fontSize: 22, fontWeight: 700,
        color: T.ink[900], letterSpacing: -0.3,
      }}>{title}</div>
    </div>
    {trailing}
  </div>
);

// Wordmark "cookme"
const CMLogo = ({ size = 20, color = T.green[600] }) => (
  <span style={{
    fontFamily: font.sans, fontSize: size, fontWeight: 800,
    color, letterSpacing: -0.5, display: 'inline-flex', alignItems: 'center',
  }}>
    cookme<span style={{ color: T.amber[500] }}>.</span>
  </span>
);

Object.assign(window, {
  CMButton, Chip, Badge, AIConfidenceBadge, Card, Input, Avatar,
  ImgPlaceholder, FoodPhoto, ProgressBar, Divider, CMTabBar, CMHeader, CMLogo,
});
