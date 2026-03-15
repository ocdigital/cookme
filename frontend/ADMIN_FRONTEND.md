# CookMe Admin Frontend - Documentação

## Visão Geral

O frontend admin do CookMe foi completamente reformulado para oferecer uma experiência administrativa completa e intuitiva. A aplicação utiliza dados **mockados** para permitir visualização e testes sem dependência do backend no momento.

## 🎯 Funcionalidades Principais

### 1. **Dashboard** (`/dashboard`)
- **Estatísticas em Tempo Real**: Usuários totais, receitas, produtos e compras
- **Usuários Ativos**: Contagem de usuários ativos e taxa de retenção
- **Atividade Recente**: Feed de atividades com timestamps
- **Status do Sistema**: Monitoramento de saúde (Frontend, API, Mobile)
- **Métricas Principais**: Taxa de retenção, tempo médio de uso, novos usuários

### 2. **Gerenciamento de Usuários** (`/users`)
- Lista completa de usuários com paginação
- Busca e filtros (status: ativo/inativo)
- Criar novo usuário
- Editar usuários existentes
- Deletar usuários com confirmação
- Informações: nome, email, função, status, data de criação

### 3. **Catálogo de Receitas** (`/recipes`)
- Visualizar todas as receitas globais
- Filtrar por dificuldade (Fácil, Média, Difícil)
- Busca por nome
- Criar/editar/deletar receitas
- Ver detalhes completos de cada receita
- Sugestões personalizadas (tab separada)
- Gerar receita com IA
- Gerar plano de semana (21 receitas - 3 por dia)

### 4. **Catálogo de Produtos** (`/products`)
- Lista de produtos com detalhes nutricionais
- Código de barras, categoria, preço médio
- Busca e filtros
- Editar/deletar produtos
- Visualizar quantidade em inventários

### 5. **Compras** (`/purchases`)
- Histórico de compras dos usuários
- Detalhes de cada transação
- Rastreamento de itens

### 6. **Analytics** (`/analytics`) ⭐ NOVO
- Dashboard completo de analytics com:
  - Filtros de período (7d, 30d, 90d)
  - Gráficos de uso diário
  - Top receitas e produtos
  - Métricas-chave (retenção, tempo médio, novos usuários)
  - Feed de atividades detalhado
  - Exportar relatórios
  - Renderização de progressos e tendências

## 📊 Dados Mockados

Todos os dados são carregados do arquivo `src/mocks/mockData.ts`:

### Estruturas de Dados

#### Users
```typescript
{
  id: string;
  nome: string;
  email: string;
  funcao: string;
  status: 'ativo' | 'inativo';
  dataCriacao: string;
  role: string;
  email_verificado: boolean;
  alertas_habilitados: boolean;
  avatar_url: string;
  ultimo_acesso: Date | null;
}
```

#### Recipes
```typescript
{
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  tempo_preparo: number;
  dificuldade: string;
  ingredientes: number;
  imagem_url: string;
  criado_por: string;
  data_criacao: string;
  usuario_criacao: string;
  views: number;
}
```

#### Products
```typescript
{
  id: string;
  nome: string;
  categoria: string;
  preco_medio: number;
  imagem_url: string;
  codigo_barras: string;
  calorias: number;
  proteina: number;
  gordura: number;
  carboidratos: number;
  data_criacao: string;
  usuario_criacao: string;
  quantidade_inventarios: number;
}
```

## 🎨 Componentes Principais

### Layout
- **Sidebar**: Navegação principal com menu colapsável
- **Header**: Barra superior com informações do usuário
- **Card**: Componente reutilizável para seções
- **Modal**: Diálogos animados para formulários e confirmações
- **Table**: Tabelas com paginação e ações

### Componentes Especializados
- `StatsBar`: Barra de estatísticas
- `SearchInput`: Campo de busca
- `FilterSelect`: Dropdown de filtros
- `ActionButton`: Botões de ação (edit, delete, view)
- `TablePagination`: Controle de páginas
- `ErrorAlert`: Alertas de erro
- `ConfirmDialog`: Diálogo de confirmação
- `AnimatedModal`: Modal com animações

## 🚀 Como Usar

### Iniciar o Servidor de Desenvolvimento
```bash
cd frontend
npm install
npm run dev
```

O servidor estará disponível em `http://localhost:5173` (ou 5174 se a porta estiver ocupada)

### Build para Produção
```bash
npm run build
```

### Verificar Tipos TypeScript
```bash
npm run type-check
```

## 🔄 Integração com Backend (Próximo Passo)

Para integrar com o backend real, siga estes passos:

### 1. Atualizar Serviços

Todos os serviços estão em `src/services/`:
- `adminService.ts` - Gerenciamento geral (usuários, produtos)
- `userService.ts` - Operações de usuários
- `recipesService.ts` - Gerenciamento de receitas
- `produtosService.ts` - Gerenciamento de produtos
- `inventarioService.ts` - Inventários

### 2. Endpoints Esperados

O backend deve fornecer os seguintes endpoints:

#### Usuários
- `GET /api/usuarios` - Listar usuários (com paginação)
- `POST /api/usuarios` - Criar usuário
- `PATCH /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Deletar usuário
- `GET /api/usuarios/stats` - Estatísticas

#### Receitas
- `GET /api/receitas` - Listar receitas
- `GET /api/receitas/:id` - Detalhes da receita
- `POST /api/receitas` - Criar receita
- `PATCH /api/receitas/:id` - Atualizar receita
- `DELETE /api/receitas/:id` - Deletar receita
- `GET /api/receitas/sugestoes` - Receitas sugeridas

#### Produtos
- `GET /api/produtos` - Listar produtos
- `GET /api/produtos/:id` - Detalhes do produto
- `POST /api/produtos` - Criar produto
- `PATCH /api/produtos/:id` - Atualizar produto
- `DELETE /api/produtos/:id` - Deletar produto

### 3. Remover Mock Data

Para desativar os dados mockados e usar dados reais:

1. Altere `useMockData` para `false` nos componentes onde for necessário
2. Remova ou comente as importações de `mockData.ts`
3. Implemente a chamada real aos serviços

Exemplo no DashboardPage:
```typescript
const [useMockData] = useState(false); // Mudar de true para false
```

## 📦 Dependências Principais

- **React 18** - Framework UI
- **React Router v7** - Roteamento
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **Sonner** - Toasts
- **Vite** - Build tool

## 🎯 Próximos Passos

1. **Integração Backend**: Conectar com API NestJS real
2. **Autenticação**: Implementar login e JWT
3. **Relatórios**: Gerar PDFs de relatórios
4. **Notificações**: Sistema de alertas em tempo real
5. **Suporte**: Implementar chat/tickets de suporte
6. **Moderação**: Sistema para moderar conteúdo gerado por usuários

## 🔒 Segurança

- Validação de entrada em formulários
- Proteção contra CSRF
- Rate limiting (quando integrado com backend)
- Autenticação baseada em JWT
- Roles e permissões (admin, manager, viewer)

## 📝 Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── pages/          # Páginas principais
│   ├── services/       # Serviços de API
│   ├── contexts/       # React Context (Auth, Theme)
│   ├── hooks/          # Custom hooks
│   ├── mocks/          # Dados mockados
│   ├── types/          # Tipos TypeScript
│   ├── theme/          # Variáveis de tema
│   ├── App.tsx         # Roteamento
│   └── main.tsx        # Entrada
├── public/             # Arquivos estáticos
└── dist/              # Build output
```

## 🤝 Contribuindo

1. Manter a consistência de estilo com Tailwind
2. Usar componentes reutilizáveis
3. Adicionar tipos TypeScript para novas features
4. Testar em light/dark mode
5. Garantir responsividade mobile

## 📞 Suporte

Para dúvidas ou problemas com o frontend admin, verifique:
- Arquivo `MEMORY.md` para decisões anteriores
- Componentes em `src/components/` para exemplos
- Serviços em `src/services/` para integração com API
