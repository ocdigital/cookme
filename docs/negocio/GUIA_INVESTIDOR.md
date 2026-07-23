# Guia do Fundador — Do App em Produção à Conversa com Investidor

> Para o momento: CookMe publicado, primeiros usuários reais, sinais iniciais de "ok".
> Guia prático, com números realistas do ecossistema brasileiro.
> Nada aqui é consultoria jurídica — antes de ASSINAR qualquer coisa, advogado especializado em venture (custa R$ 3-8 mil e já salvou empresas inteiras).

---

## 1. Entenda o que o investidor compra em cada estágio

Investidor não compra ideia. Compra **evidência de que algo está funcionando + capacidade do fundador de executar**. O que muda por estágio é qual evidência:

| Estágio | O que compra | Cheque típico (BR) | Equity cedido |
|---|---|---|---|
| **Anjo / Pré-seed** | Fundador + problema real + protótipo com sinal de tração | R$ 100k – 1M | 5–15% |
| **Seed** | Tração comprovada + máquina de crescimento nascendo | R$ 1M – 5M | 10–20% |
| **Série A** | Unit economics saudáveis + crescimento previsível | R$ 10M+ | 15–25% |

Você está mirando **anjo/pré-seed**. Nesse estágio a conversa é 60% sobre você, 30% sobre os números iniciais, 10% sobre o mercado. Isso muda tudo no preparo: os números precisam ser **honestos e bem medidos**, não grandes.

---

## 2. "Quantos usuários preciso ter?"

Pergunta errada → resposta errada. O número absoluto importa menos que a **curva**. Referências realistas para app consumer BR em pré-seed:

| Métrica | Mínimo para conversar | Bom | Excelente |
|---|---|---|---|
| Usuários ativos mensais (MAU) | 500–1.000 | 3.000–10.000 | 10.000+ |
| Retenção D30 | > 8% (2x a mediana da categoria, que é ~4%) | > 15% | > 25% |
| Crescimento semanal (orgânico) | 3–5% | 7–10% | > 10% sustentado |
| Uso do core loop (cupom escaneado/usuário ativo/mês) | ≥ 1 | ≥ 2 | ≥ 4 |
| Pagantes (se paywall ligado) | qualquer > 0 com conversão medida | conversão ≥ 2% | ≥ 4% + churn mensal < 8% |

**As três frases que abrem carteira em pré-seed:**
1. "Retenção D30 de X% numa categoria cuja mediana é 4%" ← a mais forte para o CookMe
2. "Crescendo X% por semana há N semanas, sem gastar em mídia"
3. "X% dos usuários que escaneiam 2+ cupons no primeiro mês continuam ativos 90 dias depois"

Repare: todas dependem da instrumentação da Fase 5 do `PLANO_CORRECOES.md`. **Sem métricas confiáveis, não há conversa** — investidor experiente fareja número inventado em 30 segundos.

Com 500 usuários e D30 de 20%, você tem conversa. Com 50.000 usuários e D30 de 3%, você não tem.

---

## 3. Como monetizar (o que apresentar como modelo)

Apresente **um modelo principal + um expansível**. Mais que isso soa como "não sei qual funciona".

**Principal — Assinatura (CookMe+):**
- Freemium: grátis escaneia X cupons/mês e Y receitas; pago = ilimitado + validade/alertas + gastos do mês + modos de dieta.
- Preço de referência BR: R$ 9,90–19,90/mês. Ancoragem: "menos que um delivery".
- Números que o investidor vai pedir: conversão free→paid (benchmark consumer: 2–5%), churn mensal (< 8% é ok, < 5% é bom), LTV = ticket ÷ churn, CAC por canal.

**Expansível — mencionar sem prometer data:**
- **API de ingestão de cupom B2B** (o pivô C da `ANALISE_MERCADO.md`): parsing + canonização por transação para apps de finanças/nutrição/cashback. Mostra que o mesmo ativo tem segunda avenida de receita — investidor gosta de opcionalidade.
- **Afiliados/parcerias** (módulo já existe no código): receita → lista de compras → mercado parceiro/entrega.

**O que NÃO apresentar como modelo:**
- "Vender dados de consumo" — Horus/Scanntech dominam, e soa mal com LGPDs na mesa. Se perguntarem, a resposta é: "dados agregados são opcionalidade futura, com consentimento e anonimização; não é o plano".
- Publicidade — precisa de milhões de usuários; em pré-seed é fantasia.

---

## 4. O kit de fundraising (prepare ANTES do primeiro contato)

**a) Pitch deck — 10-12 slides, nesta ordem:**
1. Capa + uma frase ("Fotografe a nota do mercado. O CookMe diz o que cozinhar.")
2. Problema (as 3 dores: decisão diária, desperdício, delivery caro — com o dado dos ~128kg/Embrapa)
3. Solução (o loop: cupom → despensa automática → receita → economia) — demo em vídeo de 30s aqui
4. Por que agora (IA barateou OCR/geração; NFC-e padronizada nacionalmente)
5. Diferencial ("entende CR LEITE ITALAC → creme de leite"; taxonomia culinária BR; ninguém lê cupom brasileiro)
6. Tração (as curvas da seção 2 — slide mais importante do deck)
7. Modelo de negócio (assinatura + opcionalidade B2B)
8. Mercado (TAM/SAM/SOM honesto: X milhões de lares que cozinham e fazem mercado, bottom-up, não "1% de um mercado de trilhões")
9. Concorrência (matriz honesta incluindo Samsung Food/SuperCook — e por que o cupom BR é a cunha)
10. Time (você: full-stack, produto no ar sozinho — em pré-seed isso É o slide)
11. O pedido: quanto, para quê, até que marco (ex: "R$ 500k para 18 meses → 30k MAU e R$ 50k MRR")

**b) Data room mínimo** (pasta organizada para due diligence):
- Contrato social/CNPJ, cap table (mesmo que seja "100% fundador")
- Métricas exportáveis (dashboards, não prints soltos)
- Registro de marca no INPI (ver seção 6)
- Contratos relevantes (Stripe, termos de uso, política de privacidade LGPD)

**c) One-pager** — resumo de 1 página para mandar em intro por e-mail/WhatsApp.

---

## 5. Como achar investidor no Brasil

**Ordem de eficiência para o seu estágio:**

1. **Programas gratuitos que dão selo + rede** (começar aqui, custo zero):
   - InovAtiva Brasil (aceleração gratuita do governo federal, turmas semestrais)
   - Sebrae/Sebraetec, programas estaduais (SEED-MG, Startup SP, etc.)
2. **Aceleradoras com investimento**: ACE, Darwin Startups, Ventiur, Cotidiano. Cheque pequeno + rede + demo day. Cuidado com equity cobrado (ver armadilhas).
3. **Anjos organizados**: Anjos do Brasil, GVAngels, Poli Angels, BR Angels, Harvard Angels Brazil. Anjo de food/consumer/apps > anjo genérico.
4. **Micro-VCs de pré-seed**: Bossanova Investimentos (alto volume de cheques pequenos), Domo VC, Honey Island, We Ventures. Canary/Astella/ONEVC são seed — guardar para a próxima rodada.
5. **Y Combinator** — aceita solo founder brasileiro, aplicação gratuita, vale tentar a cada batch (o "não" não custa nada e o formulário organiza seu pensamento).

**Como abordar (a parte que ninguém conta):**
- **Warm intro vale 10x cold email.** Caminho: outros fundadores investidos > LinkedIn direto. Fundador que já recebeu cheque de um anjo apresentando você = melhor canal que existe. Vá a eventos de startup da sua cidade e conheça FUNDADORES, não investidores.
- Cold outreach quando necessário: e-mail de 5 linhas — 1 frase do produto, 2 números de tração, 1 pedido claro ("15 min semana que vem?") + one-pager anexo. Nada de deck de 40 slides no primeiro contato.
- **Fundraising é funil**: espere ~50 conversas para 1-3 propostas. Rode como sprint de 6-8 semanas com todas as conversas em paralelo (cria urgência natural), não uma reunião por mês durante um ano.
- Investidor que diz "me procura quando tiver mais tração" = "não" educado. Anote, mande update mensal de métricas (e-mail curto), e volte quando a curva provar que ele errou. Esse e-mail mensal de updates é a ferramenta de fundraising mais subestimada que existe.

---

## 6. Como não deixar "roubarem a ideia"

Verdade desconfortável primeiro: **ideias valem quase nada; execução + dados acumulados valem tudo.** O medo de contar a ideia mata mais startups do que o roubo dela. Dito isso, proteções reais:

1. **Marca no INPI — faça JÁ** (isso sim rouba-se fácil): registro de "CookMe" nas classes de software/app (classe 9 e 42). ~R$ 300-700 por classe fazendo sozinho no site do INPI. Se o nome estiver tomado, melhor descobrir agora.
2. **Nunca peça NDA a investidor** — nenhum VC/anjo sério assina (eles veem 500 pitches/ano do mesmo setor) e pedir marca você como amador. O pitch conta O QUE o produto faz; não precisa contar COMO.
3. **O que não detalhar no pitch**: a mecânica interna da canonização (dicionários, pipeline de estágios, a KB), os prompts, o pulo do gato do QR/hash. Diga "temos tecnologia proprietária de leitura e canonização de cupom fiscal brasileiro" — resultado, não receita.
4. **Seu moat real** (e é isso que responde "e se a Samsung copiar?"):
   - A knowledge base que cresce a cada cupom (dado acumulado ≠ copiável)
   - Taxonomia culinária BR codificada
   - Retenção/hábito instalado na base de usuários
   - Velocidade: você entrega em dias o que uma BigCo entrega em trimestres
5. **Higiene societária**: código em repositório seu, sem "sócio verbal" (quem ajudou 3 semanas no começo e some — formalize ou corte AGORA, antes de ter valor em jogo; é a briga jurídica nº 1 de startup brasileira).

---

## 7. Armadilhas clássicas (como não cair)

**Societárias/contratuais — as que mais matam:**
- **Ceder equity demais cedo**: > 20% no pré-seed é bandeira vermelha para TODAS as rodadas futuras (VC de seed passa longe de cap table onde o fundador já tem pouco). Anjo pedindo 30-40%? Levante e agradeça.
- **"Sócio-conselheiro" por equity**: advisor que pede 5-15% "pela mentoria e contatos". Advisor de verdade recebe 0,25-1% com vesting. Mais que isso é predador.
- **Mútuo conversível com cláusulas tóxicas**: juros altos + vencimento curto + conversão obrigatória com desconto agressivo = dívida disfarçada. Peça cap E desconto razoáveis (cap de valuation + 15-25% de desconto é padrão).
- **Termos para revisar com advogado SEMPRE**: liquidation preference acima de 1x não participativa, veto amplo do investidor em operação do dia a dia, drag along sem piso de preço, tag along ausente para você, não-diluição perpétua, exclusividade de negociação longa (> 30-45 dias).
- **Vesting reverso do fundador sem cliff justo**: normal existir (protege o investidor de você sumir), mas os termos precisam ser simétricos e razoáveis (4 anos, cliff 1 ano, aceleração em venda).

**De processo:**
- **Dumb money**: cheque de quem não entende o jogo vira cobrança de lucro no mês 6 e bloqueio da rodada seguinte. Antes de aceitar, pergunte ao investidor: "posso falar com 2 fundadores que você já investiu?" — se ele se ofender, resposta dada.
- **Levantar cedo demais**: cada mês de tração orgânica aumenta seu valuation e seu poder de barganha. Com as métricas melhorando semana a semana, esperar 3 meses pode valer 5% de equity.
- **Valuation inflado no pré-seed**: parece vitória, vira armadilha — a próxima rodada precisa superá-lo ou você faz down round (e down round afugenta todo mundo). Valuation saudável > valuation máximo.
- **Fundraising como fim**: captar não é sucesso, é combustível. O sucesso continua sendo D30 e MRR. Fundador que passa 6 meses só captando volta para um produto parado.
- **Contar o dinheiro antes**: term sheet NÃO é dinheiro no banco. Due diligence derruba negócio. Só conta quando compensar.

---

## 8. Erros de pitch que investidor brasileiro vê todo dia

1. "Não temos concorrentes" → tem sim (Samsung Food, SuperCook, o caderninho e o iFood). Diga por que você ganha, não que estão ausentes.
2. TAM de cima para baixo ("mercado de alimentação é R$ 1 tri, se pegarmos 1%...") → sempre bottom-up: nº de lares que cozinham × conversão realista × ticket.
3. Projeção hockey stick sem mecanismo ("vamos ter 1M de usuários em 18 meses") → mostre o motor: canal, CAC, loop de retenção.
4. Falar de feature, não de dor → investidor não quer saber do RAG com pgvector; quer saber que a família economiza R$ 400/mês.
5. Esconder número ruim → se D30 está em 6%, diga "6%, acima da mediana de 4%, e estas são as 3 alavancas que estamos puxando". Honestidade com plano > maquiagem.
6. Não saber o próprio número de cabeça → CAC, churn, conversão, runway: na ponta da língua, sem abrir planilha.
7. Pedido vago ("buscamos investimento") → sempre: quanto, em troca de quê, para atingir qual marco, em quanto tempo.

---

## 8b. Plano de time pós-investimento (investidor SEMPRE pergunta)

A pergunta vem em duas formas: *"o que você faz com o dinheiro?"* e *"e se você for atropelado?"*.
Resposta pronta, honesta e calibrada para um founder técnico operando com IA:

**Tese:** IA comprime engenharia 2-3× — um founder técnico + IA cobre todo o desenvolvimento
até ~10k MAU (já demonstrado na prática: auditoria, correções, deploys e E2E deste produto
foram executados por 1 pessoa + IA). O gargalo do solo não é código: é suporte, conteúdo de
aquisição e bus factor. O plano de contratação ataca exatamente isso, por dor medida — não
por projeção.

| Fase (MAU) | Time | Contratação | Racional |
|---|---|---|---|
| 0 → 2k | 1 (founder + IA) | — | Validação: custo de folha zero, decisão instantânea |
| 2k → 10k | 2 | **Generalista growth/suporte/conteúdo** (1ª contratação NÃO é dev) | O que afoga o founder é suporte+aquisição; a engenharia a IA já cobre |
| 10k → 50k | 3 | **2º dev full-stack (+IA)** | Bus factor e plantão — resiliência, não velocidade; founder migra p/ produto/arquitetura |
| 50k → 150k | 5-6 | +mobile, +growth pleno, suporte dedicado | Founder = CTO/produto |
| 150k+ | 8-12 | squads, 1ª gestão | Fase de série A — plano refeito com o board |

**Regras que sustentam o plano no pitch:**
1. Contratação por **dor recorrente medida** (3 semanas seguidas da mesma tarefa roubando tempo de produto = a vaga), não por orçamento disponível — dinheiro de rodada não vira folha antecipada.
2. O 2º dev entra por **resiliência** (bus factor) — é a resposta direta ao "e se você for atropelado".
3. Use of funds típico da rodada pré-seed: ~50-60% time (as 2 primeiras contratações), ~25-35% aquisição, ~10-15% infra/ferramentas — infra e IA custam <5% da receita projetada (ver `ESTUDO_CUSTO_IA.md` e `CRONOGRAMA_INFRA.md`), o que sobra vai para gente e crescimento.

---

## 9. Checklist — pronto para a primeira reunião quando:

- [ ] Métricas D7/D30/conversão instrumentadas e num dashboard (Fase 5 do plano)
- [ ] 8+ semanas de dados de retenção reais
- [ ] Pelo menos UMA curva boa e honesta (retenção OU crescimento OU engajamento do core loop)
- [ ] Paywall ligado com primeiros pagantes (mesmo que 10 — prova disposição a pagar)
- [ ] Marca registrada (ou depositada) no INPI
- [ ] CNPJ organizado, cap table limpo, zero sócio verbal
- [ ] Deck de 10-12 slides + one-pager + demo em vídeo de 30s
- [ ] Resposta ensaiada para as 6 perguntas certas: "por que você?", "por que agora?", "e se a Samsung copiar?", "como cresce sem mídia paga?", "o que acontece com o dinheiro?", "e se você for atropelado?" (→ seção 8b)
- [ ] Lista de 30-50 investidores-alvo do estágio certo, com caminho de intro mapeado para pelo menos 10

---

## 10. Roteiro sugerido a partir de hoje

| Quando | O quê |
|---|---|
| Agora | Registrar marca no INPI (paralelo a tudo, não espera nada) |
| Semanas 1-3 | Fases 0-2 + 5 do `PLANO_CORRECOES.md` → app medível na Play Store |
| Semanas 4-12 | Validação orgânica (plano da `ANALISE_MERCADO.md`) + inscrição no InovAtiva + começar a frequentar comunidade local de fundadores (ainda SEM pitchar — construindo rede para as warm intros) |
| Semana 8+ | E-mail mensal de métricas para uma lista de "interessados futuros" (investidores que você conheceu, fundadores, mentores) |
| Dia ~90 | Decisão fria dos números (critérios de corte já escritos). Números bons → montar o funil de 50 conversas e rodar sprint de captação de 6-8 semanas. Números ruins → pivô B2B com os MESMOS números como prova de aprendizado (investidor respeita pivô bem documentado) |

**A regra de ouro que resume o guia:** capte quando tiver uma curva que sobe e uma história de por que ela continua subindo com dinheiro — nunca antes, porque aí quem precisa é você; de preferência quando der para esperar, porque aí quem corre atrás são eles.
