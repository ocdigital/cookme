// ═══════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — página de showcase dos tokens e componentes
// ═══════════════════════════════════════════════════════════════════════

const DSSwatch = ({ name, value, dark }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ width: '100%', aspectRatio: '1.2', background: value, borderRadius: 10, boxShadow: shadow.ring }}/>
    <div>
      <div style={{ fontFamily: font.sans, fontSize: 11, fontWeight: 700, color: T.ink[900] }}>{name}</div>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: T.ink[400] }}>{value.length > 22 ? value.slice(0,22)+'…' : value}</div>
    </div>
  </div>
);

const DSSection = ({ title, children, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
    <div style={{ fontFamily: font.sans, fontSize: 11, fontWeight: 800, color: T.ink[400], letterSpacing: 1, textTransform: 'uppercase' }}>{title}</div>
    {children}
  </div>
);

const DesignSystem = () => (
  <div style={{
    width: '100%', height: '100%', overflow: 'auto',
    background: T.ink[50], padding: 40,
    fontFamily: font.sans, color: T.ink[900],
  }}>
    {/* Cabeçalho */}
    <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid ${T.ink[200]}` }}>
      <CMLogo size={36}/>
      <div style={{ ...type.h1, marginTop: 14 }}>Design System</div>
      <div style={{ ...type.body, color: T.ink[500], marginTop: 4 }}>
        Fresco, apetitoso, confiável. Verde + âmbar sobre off-white quente.
      </div>
    </div>

    {/* Cores */}
    <DSSection title="Cores · Primária — Verde (natureza, confiança)" style={{ marginBottom: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
        {[50,100,200,400,500,600,700,900].map(k => (
          <DSSwatch key={k} name={`green/${k}`} value={T.green[k]}/>
        ))}
      </div>
    </DSSection>

    <DSSection title="Cores · Âmbar (culinária, calor)" style={{ marginBottom: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {[50,100,400,500,600,700].map(k => (
          <DSSwatch key={k} name={`amber/${k}`} value={T.amber[k]}/>
        ))}
        <DSSwatch name="red/500" value={T.red[500]}/>
      </div>
    </DSSection>

    <DSSection title="Cores · Neutros quentes" style={{ marginBottom: 36 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 10 }}>
        {[50,100,200,300,400,600,700,800,900].map(k => (
          <DSSwatch key={k} name={`ink/${k}`} value={T.ink[k]}/>
        ))}
      </div>
    </DSSection>

    {/* Tipografia */}
    <DSSection title="Tipografia · Plus Jakarta Sans + JetBrains Mono" style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20, background: T.ink[0], borderRadius: radius.lg, border: `1px solid ${T.ink[150]}` }}>
        <div>
          <div style={{ ...type.display, color: T.ink[900] }}>Feijoada de quinta</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.ink[400] }}>display · 32/38 · 700</div>
        </div>
        <div>
          <div style={{ ...type.h1, color: T.ink[900] }}>Receitas para sua despensa</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.ink[400] }}>h1 · 26/32 · 700</div>
        </div>
        <div>
          <div style={{ ...type.h2, color: T.ink[900] }}>Validar 14 produtos</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.ink[400] }}>h2 · 20/26 · 700</div>
        </div>
        <div>
          <div style={{ ...type.h3, color: T.ink[800] }}>Arroz branco integral</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.ink[400] }}>h3 · 17/22 · 600</div>
        </div>
        <div>
          <div style={{ ...type.body, color: T.ink[700] }}>Combine com sua despensa — sugerimos 12 receitas a partir do que você já tem em casa.</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.ink[400] }}>body · 15/21 · 500</div>
        </div>
        <div>
          <div style={{ ...type.mono, color: T.ink[700] }}>500g · 2 un · 98% confiança</div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.ink[400] }}>mono · 13 · medidas & stats</div>
        </div>
      </div>
    </DSSection>

    {/* Componentes */}
    <DSSection title="Botões" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <CMButton>Executar receita</CMButton>
        <CMButton variant="secondary">Editar</CMButton>
        <CMButton variant="amber" leading={<I.sparkle size={18}/>}>Gerar receitas</CMButton>
        <CMButton variant="destructive" leading={<I.trash size={18}/>}>Remover</CMButton>
        <CMButton variant="ghost">Cancelar</CMButton>
        <CMButton size="sm" variant="secondary">Small</CMButton>
        <CMButton size="lg">Large — full width</CMButton>
      </div>
    </DSSection>

    <DSSection title="Chips · Filtros" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip active leading={<I.flame size={14} sw={2}/>}>Alimentos</Chip>
        <Chip>Tudo</Chip>
        <Chip leading={<I.bolt size={14} sw={2}/>}>Rápidas</Chip>
        <Chip leading={<I.leaf size={14} sw={2}/>}>Vegetariano</Chip>
        <Chip>Baixa confiança</Chip>
      </div>
    </DSSection>

    <DSSection title="Badges · Confiança da IA" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <AIConfidenceBadge confidence={98}/>
        <AIConfidenceBadge confidence={86}/>
        <AIConfidenceBadge confidence={62}/>
        <AIConfidenceBadge confidence={41}/>
        <Badge tone="success">Pode fazer</Badge>
        <Badge tone="warn">Faltam 2</Badge>
        <Badge tone="neutral">500g</Badge>
        <Badge tone="amber" leading={<I.sparkle size={11}/>}>IA</Badge>
      </div>
    </DSSection>

    <DSSection title="Inputs" style={{ marginBottom: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input placeholder="Buscar produto ou receita…" leading={<I.search size={18}/>}/>
        <Input value="2 un" leading={<span style={{ ...type.mono, color: T.ink[600] }}>qt</span>}/>
      </div>
    </DSSection>

    <DSSection title="Progress · Validação OCR" style={{ marginBottom: 36 }}>
      <div style={{ padding: 16, background: T.ink[0], borderRadius: radius.lg, border: `1px solid ${T.ink[150]}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ ...type.small, color: T.ink[700] }}>Validando produtos</span>
          <span style={{ ...type.mono, color: T.green[600] }}>9 / 14</span>
        </div>
        <ProgressBar value={64}/>
      </div>
    </DSSection>

    {/* Raio + sombra */}
    <DSSection title="Raios · 6 · 10 · 14 · 18 · 24 · pill" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {Object.entries(radius).map(([k, v]) => (
          <div key={k} style={{
            width: 64, height: 64, background: T.ink[0], border: `1px solid ${T.ink[200]}`,
            borderRadius: v === 999 ? 999 : v,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...type.small, color: T.ink[500],
          }}>{k}</div>
        ))}
      </div>
    </DSSection>

    <DSSection title="Sombras · sm · md · lg">
      <div style={{ display: 'flex', gap: 20, padding: '14px 4px' }}>
        {['sm','md','lg'].map(k => (
          <div key={k} style={{
            width: 100, height: 64, background: T.ink[0], borderRadius: radius.md,
            boxShadow: shadow[k],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...type.small, color: T.ink[500],
          }}>{k}</div>
        ))}
      </div>
    </DSSection>
  </div>
);

Object.assign(window, { DesignSystem });
