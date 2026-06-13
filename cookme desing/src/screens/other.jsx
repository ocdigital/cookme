// ═══════════════════════════════════════════════════════════════════════
// DETALHE DA RECEITA · OCR CÂMERA · LISTA DE COMPRAS · NOTIFICAÇÕES
// ═══════════════════════════════════════════════════════════════════════

// ─── Detalhe da receita ────────────────────────────────────────────────
const INGREDIENTS = [
  { n: 'Peito de frango', q: '500g', has: true },
  { n: 'Cebola', q: '1 un', has: true },
  { n: 'Alho', q: '3 dentes', has: true },
  { n: 'Creme de leite', q: '200g', has: false },
  { n: 'Ketchup', q: '2 colheres', has: true },
  { n: 'Mostarda', q: '1 colher', has: false },
  { n: 'Champignon', q: '200g', has: true },
];

const STEPS = [
  'Corte o peito de frango em cubos e tempere com sal e pimenta.',
  'Em uma panela, doure o alho e a cebola picados com azeite.',
  'Adicione o frango e refogue até dourar por todos os lados.',
  'Junte o ketchup, a mostarda e o champignon fatiado.',
  'Finalize com o creme de leite em fogo baixo sem ferver.',
];

const ScreenRecipeDetail = () => (
  <CMPhone>
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <FoodPhoto hue={35} h={260} radius={0} label="~740px hero"/>
      <div style={{ position: 'absolute', top: 10, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(10px)', color: T.ink[900], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.back size={20}/>
        </button>
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(10px)', color: T.ink[900], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.more size={20}/>
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
        <Badge tone="amber" leading={<I.warning size={11} sw={2.4}/>}>Faltam 2 ingredientes</Badge>
      </div>
    </div>

    <div style={{ flex: 1, overflow: 'auto', marginTop: -24, background: T.ink[50], borderRadius: '24px 24px 0 0', padding: '22px 20px 20px', position: 'relative', zIndex: 2 }}>
      <div style={{ ...type.h1, color: T.ink[900] }}>Strogonoff de frango</div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...type.small, color: T.ink[600] }}>
          <I.clock size={15}/> 25 min
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...type.small, color: T.ink[600] }}>
          <I.users size={15}/> 4 porções
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...type.small, color: T.ink[600] }}>
          <I.flame size={15} sw={2}/> Fácil
        </div>
      </div>

      {/* Ingredientes */}
      <div style={{ ...type.h3, color: T.ink[900], marginBottom: 10 }}>Ingredientes</div>
      <Card padding={0} style={{ marginBottom: 20 }}>
        {INGREDIENTS.map((ing, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            borderBottom: i < INGREDIENTS.length - 1 ? `1px solid ${T.ink[150]}` : 'none',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 11,
              background: ing.has ? T.green[500] : T.ink[150],
              color: ing.has ? T.ink[0] : T.ink[400],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ing.has ? <I.check size={14} sw={3}/> : <I.close size={12} sw={2.5}/>}
            </div>
            <span style={{ ...type.body, color: ing.has ? T.ink[800] : T.ink[500], flex: 1 }}>{ing.n}</span>
            <span style={{ ...type.mono, color: T.ink[500] }}>{ing.q}</span>
          </div>
        ))}
        <div style={{ padding: '12px 14px', background: T.amber[50], display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${T.amber[100]}` }}>
          <I.cart size={16} style={{ color: T.amber[700] }}/>
          <span style={{ ...type.small, color: T.amber[700], flex: 1 }}>Adicionar os 2 faltantes à lista</span>
          <I.chevronR size={14} style={{ color: T.amber[700] }}/>
        </div>
      </Card>

      {/* Modo de preparo */}
      <div style={{ ...type.h3, color: T.ink[900], marginBottom: 10 }}>Modo de preparo</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
        {STEPS.map((s, i) => (
          <Card key={i} padding={14} style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 13, background: T.green[500], color: T.ink[0],
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontFamily: font.mono, fontSize: 13, fontWeight: 700,
            }}>{i+1}</div>
            <div style={{ ...type.bodyLoose, color: T.ink[700], paddingTop: 3, textWrap: 'pretty' }}>{s}</div>
          </Card>
        ))}
      </div>
    </div>

    {/* CTA fixo */}
    <div style={{ padding: '10px 20px 20px', background: T.ink[0], borderTop: `1px solid ${T.ink[150]}`, flexShrink: 0 }}>
      <CMButton full size="lg" leading={<I.chef size={20}/>}>Executar receita · dar baixa no estoque</CMButton>
    </div>
  </CMPhone>
);

// ─── OCR Câmera ────────────────────────────────────────────────────────
const ScreenScan = () => (
  <CMPhone>
    <div style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(180deg, oklch(0.22 0.01 80) 0%, oklch(0.14 0.008 85) 100%)`,
    }}>
      {/* Área "câmera" simulada */}
      <div style={{ position: 'absolute', inset: 0, background: `
        radial-gradient(ellipse at 50% 45%, oklch(0.35 0.03 70) 0%, oklch(0.12 0.01 80) 80%)
      `}}/>

      {/* Moldura de detecção */}
      <div style={{
        position: 'absolute', top: '18%', left: '8%', right: '8%', bottom: '24%',
        borderRadius: 12,
        boxShadow: '0 0 0 99999px rgba(0,0,0,.5)',
      }}>
        {/* cantos */}
        {[['tl','0','0','auto','auto'],['tr','0','auto','auto','0'],['bl','auto','0','0','auto'],['br','auto','auto','0','0']].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: 30, height: 30,
            top: c[1] === 'auto' ? 'auto' : c[1], left: c[2] === 'auto' ? 'auto' : c[2],
            bottom: c[3] === 'auto' ? 'auto' : c[3], right: c[4] === 'auto' ? 'auto' : c[4],
            borderTop: i < 2 ? `3px solid ${T.amber[500]}` : 'none',
            borderBottom: i >= 2 ? `3px solid ${T.amber[500]}` : 'none',
            borderLeft: (i % 2 === 0) ? `3px solid ${T.amber[500]}` : 'none',
            borderRight: (i % 2 === 1) ? `3px solid ${T.amber[500]}` : 'none',
            borderRadius: i === 0 ? '8px 0 0 0' : i === 1 ? '0 8px 0 0' : i === 2 ? '0 0 0 8px' : '0 0 8px 0',
          }}/>
        ))}

        {/* nota simulada */}
        <div style={{
          position: 'absolute', top: '18%', left: '12%', right: '12%', bottom: '18%',
          background: 'oklch(0.94 0.01 85)', borderRadius: 4,
          transform: 'rotate(-2deg)',
          boxShadow: '0 10px 30px rgba(0,0,0,.4)',
          padding: 14,
          fontFamily: font.mono, fontSize: 8, color: T.ink[700], lineHeight: 1.5,
        }}>
          <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: 4 }}>SUPERMERCADO DOM</div>
          <div style={{ textAlign: 'center', marginBottom: 6, opacity: .6 }}>CNPJ 00.000.000/0001-00</div>
          <div style={{ borderTop: `1px dashed ${T.ink[300]}`, paddingTop: 4 }}>
            <div>ARROZ T1 5KG     1x  R$ 24,90</div>
            <div>FEIJAO PRETO     1x  R$  8,50</div>
            <div>LEITE INT 1L     2x  R$ 11,80</div>
            <div>TOMATE ITAL KG   1x  R$  6,90</div>
            <div>DET NEUTRO       1x  R$  3,20</div>
          </div>
        </div>
      </div>

      {/* Badge "IA detectou" */}
      <div style={{
        position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(20,15,10,.75)', backdropFilter: 'blur(8px)',
        padding: '10px 16px', borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 8,
        color: T.ink[0],
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: T.amber[500], boxShadow: `0 0 8px ${T.amber[500]}` }}/>
        <span style={{ ...type.small, color: T.ink[0] }}>Nota detectada · mantenha firme</span>
      </div>

      {/* Header com close */}
      <div style={{ position: 'absolute', top: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: T.ink[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.close size={20}/>
        </button>
        <div style={{ padding: '10px 14px', borderRadius: 20, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', ...type.mono, color: T.ink[0] }}>
          3/10 fotos
        </div>
      </div>

      {/* Controles inferiores */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{ width: 48, height: 48, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: T.ink[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.image size={24}/>
        </button>
        <button style={{
          width: 76, height: 76, borderRadius: 38, border: `4px solid rgba(255,255,255,.3)`,
          background: T.ink[0], boxShadow: `inset 0 0 0 4px ${T.ink[0]}`, cursor: 'pointer',
        }}/>
        <button style={{
          height: 48, padding: '0 18px', borderRadius: 24,
          background: T.green[500], border: 'none', color: T.ink[0],
          fontFamily: font.sans, fontWeight: 700, fontSize: 14,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          Concluir <I.chevronR size={16} sw={2.5}/>
        </button>
      </div>
    </div>
  </CMPhone>
);

// ─── Lista de compras ─────────────────────────────────────────────────
const SHOPPING = [
  { n: 'Creme de leite', q: '200g', p: 4.90, bought: false, cat: 'Laticínios', hue: 85, suggested: true },
  { n: 'Mostarda', q: '1 un', p: 6.50, bought: false, cat: 'Condimentos', hue: 70, suggested: true },
  { n: 'Cebolinha', q: '1 maço', p: 3.00, bought: true, cat: 'Hortifruti', hue: 145 },
  { n: 'Pão francês', q: '500g', p: 8.00, bought: false, cat: 'Padaria', hue: 45 },
  { n: 'Banana prata', q: '1 kg', p: 5.99, bought: true, cat: 'Hortifruti', hue: 80 },
  { n: 'Ovos', q: '1 dz', p: 12.90, bought: false, cat: 'Proteína', hue: 50 },
];

const ScreenShopping = () => {
  const total = SHOPPING.reduce((s, i) => s + i.p, 0);
  const pending = SHOPPING.filter(i => !i.bought);
  const bought = SHOPPING.filter(i => i.bought);
  return (
    <CMPhone>
      <CMHeader subtitle="Lista ativa" title="Mercado da semana" trailing={
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: T.ink[100], color: T.ink[700], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.more size={20}/>
        </button>
      }/>

      {/* Totalizador */}
      <div style={{ padding: '0 20px 14px' }}>
        <Card padding={16} style={{ background: T.green[500], border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', color: T.ink[0] }}>
            <div>
              <div style={{ ...type.small, color: 'rgba(255,255,255,.8)' }}>Total estimado</div>
              <div style={{ ...type.display, fontSize: 28, color: T.ink[0], marginTop: 2 }}>
                R$ {total.toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...type.mono, color: 'rgba(255,255,255,.8)' }}>{pending.length} pendentes</div>
              <div style={{ ...type.mono, color: 'rgba(255,255,255,.8)' }}>{bought.length} comprados</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px' }}>
        <div style={{ ...type.micro, color: T.amber[700], marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.sparkle size={12}/> Sugeridos por receitas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {SHOPPING.filter(i => !i.bought && i.suggested).map((it, i) => (
            <ShoppingRow key={i} it={it}/>
          ))}
        </div>

        <div style={{ ...type.micro, color: T.ink[400], marginBottom: 8 }}>A comprar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {SHOPPING.filter(i => !i.bought && !i.suggested).map((it, i) => (
            <ShoppingRow key={i} it={it}/>
          ))}
        </div>

        <div style={{ ...type.micro, color: T.ink[400], marginBottom: 8 }}>No carrinho</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bought.map((it, i) => <ShoppingRow key={i} it={it}/>)}
        </div>
      </div>

      <CMTabBar active="list"/>
    </CMPhone>
  );
};

const ShoppingRow = ({ it }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', background: T.ink[0], borderRadius: radius.md,
    border: `1px solid ${T.ink[150]}`, opacity: it.bought ? .55 : 1,
  }}>
    <div style={{
      width: 24, height: 24, borderRadius: 6,
      background: it.bought ? T.green[500] : 'transparent',
      border: it.bought ? 'none' : `2px solid ${T.ink[200]}`,
      color: T.ink[0], display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {it.bought && <I.check size={14} sw={3}/>}
    </div>
    <ImgPlaceholder label="" w={40} h={40} hue={it.hue} radius={radius.sm}/>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...type.h3, fontSize: 14, color: T.ink[900], textDecoration: it.bought ? 'line-through' : 'none' }}>{it.n}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
        <span style={{ ...type.mono, color: T.ink[500], fontSize: 11 }}>{it.q}</span>
        <span style={{ ...type.small, color: T.ink[400] }}>· {it.cat}</span>
      </div>
    </div>
    <div style={{ ...type.mono, color: it.bought ? T.ink[400] : T.ink[800], fontWeight: 600 }}>
      R$ {it.p.toFixed(2).replace('.', ',')}
    </div>
  </div>
);

// ─── Notificações ──────────────────────────────────────────────────────
const NOTIFS = [
  { icon: 'sparkle', tone: 'green', title: 'Novas receitas geradas', msg: 'A IA encontrou 5 novas receitas com o que você comprou hoje.', time: '2 min' },
  { icon: 'warning', tone: 'amber', title: 'Azeite está acabando', msg: 'Baseado no seu consumo, você deve ter ~3 dias de azeite.', time: '1 h' },
  { icon: 'check', tone: 'green', title: 'Nota processada', msg: '14 itens catalogados · 11 com alta confiança.', time: '3 h' },
  { icon: 'chef', tone: 'neutral', title: 'Hora do jantar?', msg: 'Que tal um risoto de cogumelos? Você tem todos os ingredientes.', time: 'Ontem' },
  { icon: 'cart', tone: 'amber', title: '2 itens faltantes', msg: 'Para fazer "Strogonoff" faltam creme de leite e mostarda.', time: 'Ontem' },
];

const ScreenNotifs = () => (
  <CMPhone>
    <CMHeader showBack title="Notificações"/>
    {/* Tabs */}
    <div style={{ padding: '4px 20px 0', display: 'flex', gap: 22, borderBottom: `1px solid ${T.ink[150]}` }}>
      <div style={{ padding: '10px 0', borderBottom: `2px solid ${T.green[500]}`, ...type.body, fontWeight: 700, color: T.green[600] }}>Notificações</div>
      <div style={{ padding: '10px 0', ...type.body, fontWeight: 500, color: T.ink[400] }}>Atividade</div>
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 16px' }}>
      <div style={{ ...type.micro, color: T.ink[400], marginBottom: 10 }}>Hoje</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {NOTIFS.slice(0,3).map((n, i) => <NotifRow key={i} n={n}/>)}
      </div>
      <div style={{ ...type.micro, color: T.ink[400], marginBottom: 10 }}>Esta semana</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {NOTIFS.slice(3).map((n, i) => <NotifRow key={i} n={n}/>)}
      </div>
    </div>

    <CMTabBar active="home"/>
  </CMPhone>
);

const NotifRow = ({ n }) => {
  const tones = {
    green:   { bg: T.green[50], color: T.green[600] },
    amber:   { bg: T.amber[50], color: T.amber[700] },
    neutral: { bg: T.ink[100], color: T.ink[700] },
  };
  const IconEl = { sparkle: I.sparkle, warning: I.warning, check: I.check, chef: I.chef, cart: I.cart }[n.icon];
  const t = tones[n.tone];
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 21,
        background: t.bg, color: t.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IconEl size={20}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <span style={{ ...type.h3, fontSize: 14, color: T.ink[900] }}>{n.title}</span>
          <span style={{ ...type.small, color: T.ink[400], fontSize: 11, flexShrink: 0 }}>{n.time}</span>
        </div>
        <div style={{ ...type.small, color: T.ink[500], marginTop: 2, textWrap: 'pretty' }}>{n.msg}</div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenRecipeDetail, ScreenScan, ScreenShopping, ScreenNotifs });
