// ═══════════════════════════════════════════════════════════════════════
// INVENTÁRIO (Despensa) — lista de itens + filtros + empty state
// ═══════════════════════════════════════════════════════════════════════

const PANTRY = [
  { id: 1, name: 'Arroz branco', qty: '1 kg', cat: 'Grãos', conf: 98, food: true, hue: 85 },
  { id: 2, name: 'Feijão carioca', qty: '500 g', cat: 'Grãos', conf: 95, food: true, hue: 30 },
  { id: 3, name: 'Cebola', qty: '3 un', cat: 'Hortifruti', conf: 88, food: true, hue: 60 },
  { id: 4, name: 'Peito de frango', qty: '600 g', cat: 'Proteína', conf: 92, food: true, hue: 45 },
  { id: 5, name: 'Azeite extra virgem', qty: '500 ml', cat: 'Óleos', conf: 63, food: true, hue: 130 },
  { id: 6, name: 'Tomate italiano', qty: '5 un', cat: 'Hortifruti', conf: 78, food: true, hue: 20 },
  { id: 7, name: 'Leite integral', qty: '1 L', cat: 'Laticínios', conf: 97, food: true, hue: 85 },
  { id: 8, name: 'Detergente neutro', qty: '500 ml', cat: 'Limpeza', conf: 54, food: false, hue: 200 },
];

const PantryItem = ({ it }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', background: T.ink[0], borderRadius: radius.md,
    border: `1px solid ${T.ink[150]}`,
  }}>
    <ImgPlaceholder label="" w={48} h={48} hue={it.hue} radius={radius.sm}/>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ ...type.h3, color: T.ink[900], fontSize: 15 }}>{it.name}</span>
        {!it.food && <Badge tone="neutral">não-alimento</Badge>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...type.mono, color: T.ink[600] }}>{it.qty}</span>
        <span style={{ width: 3, height: 3, borderRadius: 2, background: T.ink[300] }}/>
        <span style={{ ...type.small, color: T.ink[500] }}>{it.cat}</span>
      </div>
    </div>
    <AIConfidenceBadge confidence={it.conf}/>
  </div>
);

const ScreenPantry = () => (
  <CMPhone>
    <CMHeader subtitle="Minha despensa" title="23 itens" trailing={
      <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: T.ink[100], color: T.ink[700], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I.search size={20}/>
      </button>
    }/>

    <div style={{ padding: '6px 20px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
      <Chip active leading={<I.flame size={13} sw={2}/>}>Alimentos · 21</Chip>
      <Chip>Tudo · 23</Chip>
      <Chip leading={<I.warning size={13} sw={2}/>}>Baixa conf · 3</Chip>
    </div>

    {/* Insight card */}
    <div style={{ padding: '0 20px 14px' }}>
      <Card padding={14} style={{ background: T.amber[50], border: `1px solid ${T.amber[100]}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.amber[500], color: T.ink[900], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.warning size={18} sw={2.2}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...type.small, fontWeight: 700, color: T.amber[700] }}>3 itens com baixa confiança</div>
          <div style={{ ...type.small, color: T.amber[700], opacity: .85 }}>Revisar categoria da IA?</div>
        </div>
        <CMButton size="sm" variant="secondary" style={{ background: T.ink[0], borderColor: T.amber[100] }}>Revisar</CMButton>
      </Card>
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px' }}>
      <div style={{ ...type.micro, color: T.ink[400], marginBottom: 8 }}>Adicionados hoje</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PANTRY.slice(0,5).map(it => <PantryItem key={it.id} it={it}/>)}
      </div>
      <div style={{ ...type.micro, color: T.ink[400], margin: '18px 0 8px' }}>Esta semana</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PANTRY.slice(5).map(it => <PantryItem key={it.id} it={it}/>)}
      </div>
    </div>

    <CMTabBar active="pantry"/>
  </CMPhone>
);

// ─── Variante: Despensa vazia ──────────────────────────────────────────
const ScreenPantryEmpty = () => (
  <CMPhone>
    <CMHeader subtitle="Minha despensa" title="Vamos começar"/>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
      <div style={{
        width: 140, height: 140, borderRadius: 70,
        background: `radial-gradient(circle, ${T.green[50]} 0%, ${T.ink[50]} 70%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px dashed ${T.green[200]}`,
      }}>
        <I.pantry size={56} style={{ color: T.green[500] }} sw={1.3}/>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...type.h2, color: T.ink[900], marginBottom: 6 }}>Despensa vazia</div>
        <div style={{ ...type.body, color: T.ink[500], maxWidth: 260, textWrap: 'pretty' }}>
          Fotografe a nota fiscal do seu mercado e a IA cataloga tudo pra você em segundos.
        </div>
      </div>
      <CMButton full size="lg" leading={<I.camera size={20}/>} style={{ width: '100%' }}>
        Escanear nota fiscal
      </CMButton>
      <CMButton variant="ghost" size="sm">Adicionar manualmente</CMButton>
    </div>
    <CMTabBar active="pantry"/>
  </CMPhone>
);

Object.assign(window, { ScreenPantry, ScreenPantryEmpty, PANTRY });
