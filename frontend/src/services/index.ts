/**
 * Frontend Services Index
 * Centralized export of all API services
 */

// Core API configuration
export { default as api } from './api';

// Auth Service
export * from './api';

// User Services
export { default as usuariosService } from './usuariosService';
export type { Usuario, Preferencia, UpdateUsuarioDto, UpdatePreferenciaDto, UsuariosStats } from './usuariosService';

// Product Services
export { default as produtosService } from './produtosService';
export type { Produto, Marca, Categoria, CreateProdutoDto, ProdutoStats } from './produtosService';

// Recipe Services
export { default as recipesService } from './recipesService';
export type { Receita, ReceitaIngrediente, DificuldadeReceita, UnidadeMedida } from './recipesService';

// Purchases Services
export { default as comprasService } from './comprasService';
export type { Compra, CompraItem, CreateCompraDto, ComprasStats } from './comprasService';

// Inventory Services
export { default as inventarioService } from './inventarioService';
export type { InventarioItem, CreateInventarioDto, UpdateInventarioDto, InventarioStats } from './inventarioService';

// Notifications Services
export { default as notificacoesService } from './notificacoesService';
export type { Notificacao, NotificationType } from './notificacoesService';

// Admin Services
export { adminService } from './adminService';
