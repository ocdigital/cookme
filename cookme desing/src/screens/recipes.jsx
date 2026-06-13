// ═══════════════════════════════════════════════════════════════════════
// RECEITAS SUGERIDAS — lista hero + cards com "pode fazer" / "faltam X"
// ═══════════════════════════════════════════════════════════════════════

const RECIPES = [
  { id: 1, name: 'Strogonoff de frango', time: 25, serves: 4, hue: 35, missing: 0, tag: 'Rápido' },
  { id: 2, name: 'Risoto de cogumelos', time: 40, serves: 2, hue: 55, missing: 0, tag: 'Vegetariano' },
  { id: 3, name: 'Feijoada completa', time: 90, serves: 6, hue: 25, missing: 2, tag: 'Fim de semana' },
  { id: 4, name: 'Salada de grão-de-bico', time: 15, serves: 2, hue: 140, missing: 0, tag: 'Fresco' },
  { id: 5, name: 'Macarrão ao sugo', time: 20, serves: 3, hue: 20, missing: 1, tag: 'Clássico' },
];

const RecipeCard = ({ r, big }) => {
  const canCook = r.missing === 0;
  return (
    <Card padding={0} style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
      <FoodPhoto hue={r.hue} h={big ? 200 : 140} radius={0} label={`~740px recipe photo`}/>
      {/* overlay top: badges */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <Badge tone={canCook ? 'dark' : 'amber'} leading={canCook ? <I.check size={11} sw={3}/> : <I.warning size={11} sw={2.4}/>}>
          {canCook ? 'Pode fazer agora' : `Faltam ${r.missing}`}
        </Badge>
        <Badge tone="dark" style={{ background: 'rgba(20,15,10,.55)', backdropFilter: 'blur(4px)' }}>{r.tag}</Badge>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ ...type.h3, color: T.ink[900], marginBottom: 6 }}>{r.name}</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...type.small, color: T.ink[500] }}>
            <I.clock size={14}/> {r.time} min
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...type.small, color: T.ink[500] }}>
            <I.users size={14}/> {r.serves}
          </span>
        </div>
      </div>
    </Card>
  );
};

const ScreenRecipes = () => (
  <CMPhone>
    {/* Header */}
    <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <CMLogo/>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: T.ink[100], color: T.ink[700], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <I.bell size={20}/>
          <div style={{ position: 'absolute', top: 7, right: 9, width: 8, height: 8, borderRadius: 4, background: T.amber[500], border: `2px solid ${T.ink[50]}` }}/>
        </button>
      </div>
    </div>

    {/* Saudação */}
    <div style={{ padding: '6px 20px 10px' }}>
      <div style={{ ...type.small, color: T.ink[500] }}>Boa tarde, Rafa</div>
      <div style={{ ...type.h1, color: T.ink[900], marginTop: 2 }}>
        O que <span style={{ color: T.green[600] }}>cozinhamos</span> hoje?
      </div>
    </div>

    {/* Scrollable content */}
    <div style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
      {/* Despensa pulse */}
      <div style={{ padding: '8px 20px 14px' }}>
        <Card padding={14} style={{ background: T.green[50], border: `1px solid ${T.green[100]}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: T.green[500], color: T.ink[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.sparkle size={20} sw={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...type.small, color: T.green[700] }}>Sua despensa tem</div>
            <div style={{ ...type.h3, color: T.green[900] }}>23 ingredientes · 12 receitas possíveis</div>
          </div>
          <I.chevronR size={18} style={{ color: T.green[600] }}/>
        </Card>
      </div>

      {/* Filtros */}
      <div style={{ padding: '0 20px 4px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        <Chip active>✨ Para você</Chip>
        <Chip leading={<I.bolt size={13} sw={2.4}/>}>Até 20 min</Chip>
        <Chip leading={<I.leaf size={13} sw={2}/>}>Vegetariano</Chip>
        <Chip>Rápido</Chip>
      </div>

      {/* Hero grande */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ ...type.h2, color: T.ink[900] }}>Sugeridas agora</div>
          <span style={{ ...type.small, color: T.green[600], display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Ver tudo <I.chevronR size={14} sw={2.2}/>
          </span>
        </div>
        <RecipeCard r={RECIPES[0]} big/>
      </div>

      {/* Grid 2-col */}
      <div style={{ padding: '8px 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {RECIPES.slice(1,5).map(r => <RecipeCard key={r.id} r={r}/>)}
      </div>
    </div>

    <CMTabBar active="home"/>
  </CMPhone>
);

// ─── Variante: Loading (IA gerando) ────────────────────────────────────
const ScreenRecipesLoading = () => (
  <CMPhone>
    <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <CMLogo/>
      <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: T.ink[100], color: T.ink[700], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I.bell size={20}/>
      </button>
    </div>
    <div style={{ padding: '6px 20px 16px' }}>
      <div style={{ ...type.small, color: T.ink[500] }}>Boa tarde, Rafa</div>
      <div style={{ ...type.h1, color: T.ink[900], marginTop: 2 }}>Pensando em receitas…</div>
    </div>

    <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* IA status */}
      <Card padding={16} style={{ background: T.amber[50], border: `1px solid ${T.amber[100]}` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: T.amber[500], color: T.ink[900], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.sparkle size={22} sw={2.2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...type.h3, color: T.amber[700] }}>IA analisando despensa</div>
            <div style={{ ...type.small, color: T.amber[700], opacity: .8 }}>Considerando 23 ingredientes…</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <ProgressBar value={72} color={T.amber[500]} bg={T.amber[100]} h={6}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ ...type.mono, color: T.amber[700] }}>combinando sabores</span>
          <span style={{ ...type.mono, color: T.amber[700] }}>72%</span>
        </div>
      </Card>

      {/* Skeletons */}
      {[0,1,2].map(i => (
        <Card key={i} padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ height: 140, background: `linear-gradient(90deg, ${T.ink[100]} 0%, ${T.ink[150]} 50%, ${T.ink[100]} 100%)`, backgroundSize: '200% 100%' }}/>
          <div style={{ padding: 14 }}>
            <div style={{ height: 14, width: '60%', background: T.ink[150], borderRadius: 6, marginBottom: 8 }}/>
            <div style={{ height: 10, width: '35%', background: T.ink[150], borderRadius: 5 }}/>
          </div>
        </Card>
      ))}
    </div>

    <div style={{ height: 16 }}/>
    <CMTabBar active="home"/>
  </CMPhone>
);

Object.assign(window, { ScreenRecipes, ScreenRecipesLoading, RecipeCard, RECIPES });
