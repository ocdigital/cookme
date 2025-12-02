# Guia de Estilos - CookMe Admin Dashboard

## 🎨 Paleta de Cores

```javascript
colors: {
  primary: '#FF8C42',      // Laranja (Ação, destaque, hover)
  secondary: '#fd7e29',    // Laranja mais escuro (Gradientes)
  dark: '#2C1810',         // Marrom escuro (Textos principais)
  light: '#FFFBF0',        // Bege claro (Background alternativo)
  border: '#f0e5d8',       // Bege bordas
  text: '#666',            // Cinza médio (Textos secundários)
}

// Usados via Tailwind
- gray-50, gray-100, gray-200, gray-500, gray-600, gray-700, gray-800 (escalas de cinza)
- green-50, green-100, green-400, green-500, green-600, green-700 (status/sucesso)
- orange-50, orange-500 (icons)
```

## 📐 Layout Principal

### Wrapper Geral
```css
.layout-wrapper {
  @apply flex h-screen bg-gray-50;
}
```

### Estrutura
- **Sidebar**: w-64 (256px) | bg-white | shadow-sm
- **Header**: h-16 (64px) | bg-white | shadow-sm | sticky top-0
- **Main**: flex-1 | overflow-auto | bg-gray-50
- **Content**: max-w-7xl | mx-auto | px-4 py-8 sm:px-6 lg:px-8

## 🎯 Componentes

### Card Component
```css
.card {
  @apply bg-white rounded-xl border border-gray-100/80 transition-all duration-300;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.card:hover {
  @apply border-gray-200/50;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}
```

**Aplicações**: Seções com conteúdo comum (Recent Activity, Status)

### Stat Card (KPI Cards)
```css
.stat-card {
  @apply bg-white p-6 rounded-xl border border-gray-100 shadow-sm
         transition-all duration-300 hover:shadow-lg hover:-translate-y-1;
}

.icon-container {
  @apply bg-orange-50 text-orange-500 p-3 rounded-lg shadow-inner;
}
```

**Características**:
- Sombra suave por padrão (`shadow-sm`)
- Elevação ao hover com `hover:-translate-y-1`
- Ícone em container com background laranja suave
- Badge verde com ponto animado para mudanças

**Aplicações**: Cards de estatísticas (Usuários, Produtos, Receitas, Compras)
**Grid**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`

### Sidebar

```css
.sidebar {
  @apply fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 shadow-sm;
  @apply transition-all duration-300 z-40 flex flex-col overflow-hidden;
}

.sidebar-logo {
  @apply px-6 py-5 border-b border-gray-100 flex items-center gap-3;
}

.sidebar-link {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium;
  @apply text-gray-700 hover:bg-gray-100;
}

.sidebar-link.active {
  @apply bg-gradient-to-r from-primary to-primary/80 text-white shadow-md;
}
```

### Header

```css
.header {
  @apply bg-white border-b border-gray-100 shadow-sm;
  height: 64px;
}

.header-avatar {
  @apply w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full;
  @apply flex items-center justify-center text-white font-bold text-sm;
  @apply shadow-sm hover:shadow-md transition-shadow;
}

.header-button {
  @apply p-2 text-gray-600 hover:text-primary hover:bg-gray-100;
  @apply rounded-lg transition-colors duration-200;
}
```

## 🎨 Sistema de Sombras Customizado

```javascript
boxShadow: {
  'soft':        '0 2px 8px rgba(0, 0, 0, 0.06)',
  'medium':      '0 4px 16px rgba(0, 0, 0, 0.10)',
  'large':       '0 10px 32px rgba(0, 0, 0, 0.12)',
  'xl-custom':   '0 20px 40px rgba(0, 0, 0, 0.15)',
  'card':        '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  'card-hover':  '0 10px 25px rgba(0, 0, 0, 0.08)',
  'stat-card':   '0 15px 40px rgba(255, 140, 66, 0.12)',
}
```

**Uso**: Adicione profundidade sem ser agressivo. Use sombras sutis por padrão.

## 🎬 Animações e Transições

```css
.smooth-transition {
  @apply transition-all duration-300 ease-out;
}

/* Hover Effects */
.stat-card:hover {
  transform: translateY(-4px);  /* Elevação */
}

/* Gradient Backgrounds */
.gradient-primary {
  @apply bg-gradient-to-br from-[#FF8C42] to-[#fd7e29];
}

.gradient-primary-light {
  @apply bg-gradient-to-br from-[#FF8C42]/10 to-[#fd7e29]/5;
}

.gradient-hover-primary {
  @apply hover:from-[#FF8C42]/20 hover:to-[#fd7e29]/10;
}
```

## 📊 Padrões de Grid

### Dashboard Stats
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Cards aqui -->
</div>
```

### Seções Mistas
```html
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Card className="lg:col-span-2">Recent Activity</Card>
  <Card>Status</Card>
</div>
```

## 🎯 Tipografia

- **Títulos Grandes** (Dashboard Title): `text-4xl font-bold text-dark`
- **Títulos de Card**: `text-xl font-bold text-dark mb-6`
- **Valores Stat**: `text-5xl font-bold text-dark leading-none`
- **Labels**: `text-gray-500 text-sm font-medium`
- **Subtextos**: `text-xs text-gray-500`
- **Conteúdo**: `text-gray-600 text-sm leading-relaxed`

## 📱 Responsividade

- **Mobile First**: Padrão é mobile
- **Breakpoints**: sm:640px | md:768px | lg:1024px | xl:1280px
- **Padrão de Padding**: `px-4 py-8 sm:px-6 lg:px-8`
- **Grid Responsivo**:
  - Stat cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
  - Seções mistas: `grid-cols-1 lg:grid-cols-3`

## 🔄 Badges e Status Indicators

### Badge de Mudança (Green)
```html
<span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
  +12% este mês
</span>
```

### Status Online (com pulsing)
```html
<span className="relative flex h-3 w-3">
  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
</span>
```

## ✨ Principais Características de Design

1. **Sombras Sutis**: Profundidade sem agressividade
2. **Bordas Leves**: `border-gray-100/80` para não competir com conteúdo
3. **Gradientes Estratégicos**: Apenas em elementos de ação (avatares, menu ativo)
4. **Hover Effects Elevados**: Cards sobem `translateY(-4px)` ao hover
5. **Transições Suaves**: `duration-300 ease-out` para fluidez
6. **Espaçamento Consistente**: Gap-6 entre elementos principais
7. **Tipografia Hierárquica**: Textos maiores para números-chave (5xl para stats)

## 🚀 Como Usar Este Guia

1. **Cards**: Use `.stat-card` para KPIs e `.card` para seções
2. **Sidebar**: Mantenha estrutura fixa com `w-64` e `shadow-sm`
3. **Header**: Altura fixa em `h-16` para consistência
4. **Grid**: Use padrões responsivos predefinidos
5. **Cores**: Sempre use `primary` para ações, `gray-*` para neutros
6. **Sombras**: Use `shadow-sm` por padrão, aumente ao hover
7. **Animações**: Use `.smooth-transition` em elementos interativos

## 📌 Padrão de Nova Página

```tsx
import { Card, CardTitle, CardContent } from '../components/Card';

export const NewPage = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-dark mb-2">Page Title</h1>
        <p className="text-gray-500 text-base">Description</p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardTitle>Card Title</CardTitle>
          <CardContent>Content here</CardContent>
        </Card>
      </div>
    </div>
  );
};
```

---

**Versão**: 1.0 | **Data**: 2024 | **Framework**: React + TypeScript + Tailwind CSS v4
