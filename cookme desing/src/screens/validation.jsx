// ═══════════════════════════════════════════════════════════════════════
// VALIDAÇÃO PÓS-OCR — revisar produtos detectados antes de salvar
// ═══════════════════════════════════════════════════════════════════════

const OCR_ITEMS = [
  { id: 1, raw: 'ARROZ T1 5KG', name: 'Arroz tipo 1', cat: 'Grãos', conf: 96, food: true, hue: 85 },
  { id: 2, raw: 'FEIJAO PRETO 1KG', name: 'Feijão preto', cat: 'Grãos', conf: 92, food: true, hue: 30 },
  { id: 3, raw: 'DET. NEUTRO YPE 500M', name: 'Detergente neutro', cat: 'Limpeza', conf: 58, food: false, hue: 200 },
  { id: 4, raw: 'OLEO SOJA SOYA 900M', name: 'Óleo de soja', cat: 'Óleos', conf: 89, food: true, hue: 70 },
  { id: 5, raw: 'LT ZERO LAC 1L', name: 'Leite zero lactose', cat: 'Laticínios', conf: 67, food: true, hue: 85 },
  { id: 6, raw: 'TOMATE ITALIANO KG', name: 'Tomate italiano', cat: 'Hortifruti', conf: 94, food: true, hue: 20 },
];

const OCRItem = ({ it, validated }) => {
  const high = it.conf >= 75;
  return (
    <div style={{
      display: 'flex', gap: 12, padding: 14,
      background: T.ink[0], borderRadius: radius.md,
      border: `1px solid ${validated ? T.green[200] : (high ? T.ink[150] : T.amber[200])}`,
      opacity: validated ? 0.75 : 1,
      position: 'relative',
    }}>
      <ImgPlaceholder label="" w={44} h={44} hue={it.hue} radius={radius.sm}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...type.h3, fontSize: 15, color: T.ink[900], marginBottom: 1 }}>{it.name}</div>
        <div style={{ ...type.mono, color: T.ink[400], fontSize: 10, marginBottom: 6 }}>{it.raw}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Badge tone={it.food ? 'success' : 'neutral'}>
            {it.food ? 'Alimento' : 'Não-alimento'}
          </Badge>
          <span style={{ ...type.small, color: T.ink[500] }}>· {it.cat}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <AIConfidenceBadge confidence={it.conf}/>
        {high ? (
          <div style={{
            width: 28, height: 28, borderRadius: 14,
            background: T.green[500], color: T.ink[0],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <I.check size={16} sw={3}/>
          </div>
        ) : (
          <button style={{
            height: 28, padding: '0 10px', borderRadius: 14,
            background: T.ink[0], border: `1px solid ${T.amber[400]}`, color: T.amber[700],
            fontFamily: font.sans, fontSize: 11, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}>
            Não é alimento
          </button>
        )}
      </div>
    </div>
  );
};

const ScreenValidation = () => {
  const total = OCR_ITEMS.length;
  const validated = OCR_ITEMS.filter(i => i.conf >= 75).length;
  const pct = Math.round((validated / total) * 100);
  return (
    <CMPhone>
      <CMHeader showBack subtitle="Escaneado agora" title="Revisar produtos" trailing={
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: T.ink[100], color: T.ink[700], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.more size={20}/>
        </button>
      }/>

      {/* Progresso */}
      <div style={{ padding: '4px 20px 14px' }}>
        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ ...type.small, color: T.ink[500] }}>IA classificou automaticamente</div>
              <div style={{ ...type.h2, color: T.ink[900], marginTop: 2 }}>
                <span style={{ color: T.green[600] }}>{validated}</span>
                <span style={{ color: T.ink[400] }}> / {total}</span>
              </div>
            </div>
            <Badge tone="success" leading={<I.sparkle size={11}/>}>IA · {pct}%</Badge>
          </div>
          <ProgressBar value={pct}/>
          <div style={{ marginTop: 10, ...type.small, color: T.ink[500], textWrap: 'pretty' }}>
            Só precisa confirmar os <b style={{ color: T.amber[700] }}>{total - validated} itens</b> com confiança abaixo de 75%.
          </div>
        </Card>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px' }}>
        <div style={{ ...type.micro, color: T.amber[700], marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.warning size={12}/> Precisam de revisão
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {OCR_ITEMS.filter(i => i.conf < 75).map(it => <OCRItem key={it.id} it={it}/>)}
        </div>

        <div style={{ ...type.micro, color: T.green[600], marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.check size={12}/> Classificados pela IA
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OCR_ITEMS.filter(i => i.conf >= 75).map(it => <OCRItem key={it.id} it={it} validated/>)}
        </div>
      </div>

      {/* Footer fixo */}
      <div style={{
        padding: '12px 20px 20px', background: T.ink[0],
        borderTop: `1px solid ${T.ink[150]}`,
        display: 'flex', gap: 10,
      }}>
        <CMButton variant="secondary" size="lg" style={{ flex: 1 }}>Cancelar</CMButton>
        <CMButton size="lg" style={{ flex: 2 }} leading={<I.check size={20} sw={2.5}/>}>
          Confirmar tudo
        </CMButton>
      </div>
    </CMPhone>
  );
};

Object.assign(window, { ScreenValidation });
