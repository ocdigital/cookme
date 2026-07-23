# One-Pager de Vendas + Lista de Alvos — API de Canonização de Cupom

> 2026-07-07. Parte 1 = texto pronto para enviar (e-mail/LinkedIn/PDF). Parte 2 = os 15 alvos
> qualificados e quais 5 abordar primeiro. Nome do produto é provisório ("NotaParse") — troque
> à vontade, o domínio ainda não foi registrado.

---

## PARTE 1 — O One-Pager (texto pronto para enviar)

---

# NotaParse — a API que transforma cupom fiscal brasileiro em dados de produto limpos

**O problema que você já conhece:** todo cupom fiscal brasileiro descreve produtos de um jeito
diferente. `CR LEITE ITALAC 200GR`, `ESC COLGATE CLASSIC C/3`, `BISC BWAW CAES TRAD 500G` —
abreviado, truncado, sem padrão entre redes. Quem precisa de dados por item (cashback por
produto, categorização de gasto, diário alimentar, catálogo) gasta meses construindo e mantendo
um parser interno que nunca fica pronto.

**O que a API faz:** recebe a nota (foto, QR NFC-e/SAT ou texto) e devolve cada item
estruturado e canonizado:

```json
POST /v1/cupom  →
{
  "descricao_original": "CR LEITE ITALAC 200GR",
  "produto_canonico": "creme de leite",
  "marca": "Italac",
  "categoria": "laticínios",
  "eh_alimento": true,
  "ean": "7891234567890",
  "preco": 4.99,
  "confianca": 0.97
}
```

**Por que não fazer com um LLM direto?** Você resolve 80% em uma semana — e passa um ano nos
20% que doem (`PET 2L` é garrafa, não petshop; `QUEIJO PRATO` não é prato descartável;
`SAB PO` não é sabonete). Nossa engine resolve a maioria dos itens por dicionário, EAN e base
de conhecimento acumulada — **determinístico, ~0ms e sem custo de token** — e só usa IA na
cauda longa, com score de confiança honesto em cada item.

**Diferenciais:**

- 🇧🇷 **Nativo do Brasil**: NFC-e, SAT, abreviações de PDV, marcas e categorias brasileiras — o que Veryfi/Taggun/Mindee não fazem
- 📊 **Acurácia medida, não prometida**: benchmark público com casos reais, rodando em CI
- 🎯 **Confidence score por item**: a API diz quando não tem certeza — você decide o que revisar
- 🔁 **Melhora sozinha**: correções entram na base compartilhada; um erro corrigido nunca se repete
- 💰 **Preço BR**: fração do custo dos players gringos (que começam em US$ 500/mês)

**Em produção hoje** no CookMe (app de despensa/receitas que criamos) — a API nasceu do nosso
próprio problema e processa cupons reais todos os dias.

**Oferta design partner (3 primeiras empresas):** acesso gratuito por 3 meses + integração
assistida por nós, em troca de feedback e volume real. Depois, planos a partir de R$ 99/mês.

**Fale com a gente:** Eduardo Ferreira · <eduardoferreira85@gmail.com>

---

## PARTE 2 — Lista qualificada: 15 alvos

Legenda de temperatura: 🔥 dor viva (já processam cupom hoje) · 🟠 feature desejada · 🔵 mapear
(pode ser cliente, parceiro ou concorrente).

### 🔥 Cashback por nota fiscal (processam cupom TODO DIA — dor viva)

| # | Alvo | Por que precisam | Pitch de 1 linha | Como abordar |
| --- | --- | --- | --- | --- |
| 1 | **[Dinerama](https://dinerama.com.br/)** | Cashback por PRODUTO em qualquer supermercado via QR da nota — matching produto↔oferta é o core deles; erro = pagar cashback errado | "Quanto do time de vocês mantém o parser de cupom? Nós vendemos essa camada pronta e melhorando sozinha" | LinkedIn: CTO/head de eng. Empresa nova, acessível |
| 2 | **Dinheiro na Nota** (Sofist) | Mesmo modelo: nota → cashback por item | idem | LinkedIn/e-mail Sofist (empresa de tech por trás) |
| 3 | **Gelt Brasil** | Cashback por produto via nota; operação enxuta | idem | LinkedIn founders |

*Nota honesta: esses 3 já têm ALGUM parser interno (o negócio depende disso). O pitch não é
"vocês não sabem fazer" — é "isso não é o diferencial de vocês; terceirizem a manutenção do
que é commodity e foquem na oferta". Se disserem "nosso parser é ótimo", perguntar a acurácia
medida — ninguém mede. Podem também virar CONCORRENTES se decidirem vender o parser deles;
risco aceitável pela informação que a conversa traz.*

### 🟠 Finanças pessoais (feature muito pedida: quebrar "Mercado R$ 487" em itens)

| # | Alvo | Por que precisam | Pitch | Abordagem |
| --- | --- | --- | --- | --- |
| 4 | **[Mobills](https://www.mobills.com.br/)** | Maior app de finanças BR; categorização hoje para no total da fatura | "Seus usuários pedem para saber PARA ONDE foi o gasto do mercado. Nós entregamos isso por API" | Grande — ciclo mais lento; LinkedIn head de produto |
| 5 | **[Organizze](https://www.organizze.com.br/)** | Idem; equipe menor, decisão mais rápida | idem | E-mail/LinkedIn founders |
| 6 | **[Monely](https://monely.app/)** | App novo, AI-first — perfil early adopter | "Feature de scanner de nota completa em 1 sprint" | Founders acessíveis; melhor 1ª conversa do segmento |
| 7 | **Artha** | App BR em crescimento no nicho controle financeiro | idem | LinkedIn |

### 🟠 Nutrição (compra → diário alimentar automático)

| # | Alvo | Por que precisam | Pitch | Abordagem |
| --- | --- | --- | --- | --- |
| 8 | **Dietbox** | Software líder p/ nutricionistas BR — paciente registra o que come na mão | "O paciente fotografa a compra do mês e o nutri vê a despensa real dele" | LinkedIn; têm time de produto ativo |
| 9 | **Webdiet** | Concorrente direto do Dietbox | idem | idem |
| 10 | **Tecnonutri** | App de dieta B2C grande | "Scanner de mercado que preenche o diário" | LinkedIn |

### 🔵 CRM/fidelidade de varejo alimentar (MAPEAR: cliente, parceiro ou concorrente)

| # | Alvo | O que descobrir na conversa | Abordagem |
| --- | --- | --- | --- |
| 11 | **[Mercafacil](https://www.mercafacil.com/)** (32% dos supermercados de SP) | Como normalizam catálogo ENTRE redes? Fazem à mão? Comprariam a camada? | LinkedIn eng/produto — conversa exploratória, não pitch |
| 12 | **[IZIO&Co](https://www.izio.com.br/)** | Cashback da indústria por produto = matching item-level; onde dói? | idem |
| 13 | **Propz** | Menor dos três; mais acessível para conversa franca | idem |

### 🔵 E-commerce/infra de supermercado (catálogo sujo é rotina)

| # | Alvo | Por que precisam | Abordagem |
| --- | --- | --- | --- |
| 14 | **VipCommerce** | Digitalizam supermercados; importar catálogo do PDV do cliente = descrições sujas em massa | LinkedIn eng |
| 15 | **Instabuy / Mercadapp** | Mesmo problema, empresas menores e acessíveis | E-mail direto |

---

## As 5 primeiras conversas (ordem recomendada)

| Ordem | Alvo | Por quê primeiro |
| --- | --- | --- |
| 1ª | **Monely** (#6) | Menor fricção, founder acessível, AI-first — ensaio geral do pitch com risco zero |
| 2ª | **Dinerama** (#1) | O alvo mais quente do mapa: dor diária, produto depende de parsing |
| 3ª | **Dietbox** (#8) | Valida o segmento nutrição com o líder |
| 4ª | **Dinheiro na Nota** (#2) | Segunda leitura do segmento cashback (confirma ou refuta a 2ª conversa) |
| 5ª | **Mercafacil** (#11) | Não é pitch — é inteligência: mapear se o segmento CRM é cliente ou concorrente |

**Meta (do Go/No-Go da análise):** ≥2 "quero testar" nas 5 conversas → MVP da API em 3-5 dias.
5 nãos → engine segue como diferencial interno do CookMe, e as conversas viram aprendizado grátis.

### Roteiro de 20 minutos por conversa

1. (5min) Como vocês tratam item de cupom hoje? Quanto custou construir? Quem mantém?
2. (5min) Demo: mando 3 linhas sujas de cupom, devolvo o JSON na hora (usar o playground/curl)
3. (5min) Se isso existisse pronto com X% de acurácia medida e confidence por item, usariam? Pagariam quanto?
4. (5min) Objeções + pedir indicação ("quem mais sofre com isso?")

**Regra de ouro: nas conversas 1-4 você está VENDENDO; na 5 você está APRENDENDO. Não misture.**
