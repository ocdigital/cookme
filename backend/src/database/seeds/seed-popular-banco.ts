/**
 * Popula banco com receitas do TudoGostoso para todos os modos alimentares.
 * Requer que o backend esteja rodando na porta 3000.
 *
 * Run:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-popular-banco.ts
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-popular-banco.ts normal fitness
 */
import axios from 'axios';

const API = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cookme.app';
const ADMIN_SENHA = process.env.ADMIN_SENHA || 'admin123';

const MODOS_VALIDOS = ['normal', 'fitness', 'vegetariano', 'vegano'] as const;
type Modo = typeof MODOS_VALIDOS[number];

async function login(): Promise<string> {
  const res = await axios.post(`${API}/api/auth/login`, { email: ADMIN_EMAIL, senha: ADMIN_SENHA });
  return res.data.access_token;
}

async function popularModo(token: string, modo: Modo): Promise<number> {
  const res = await axios.post(
    `${API}/api/admin/receitas/popular-banco/${modo}`,
    {},
    { headers: { Authorization: `Bearer ${token}` }, timeout: 600_000 },
  );
  return res.data.total || 0;
}

async function main() {
  const args = process.argv.slice(2).filter(a => MODOS_VALIDOS.includes(a as Modo)) as Modo[];
  const modos: Modo[] = args.length > 0 ? args : [...MODOS_VALIDOS];

  console.log(`\n🍽️  CookMe — Popular Banco de Receitas`);
  console.log(`API: ${API}`);
  console.log(`Modos: ${modos.join(', ')}\n`);

  let token: string;
  try {
    token = await login();
    console.log('✓ Login OK\n');
  } catch (err: any) {
    console.error(`✗ Login falhou: ${err.message}`);
    console.error('  → Verifique ADMIN_EMAIL e ADMIN_SENHA');
    process.exit(1);
  }

  const resultado: Record<string, number> = {};

  for (const modo of modos) {
    const icone = { normal: '🍽️', fitness: '🏋️', vegetariano: '🥗', vegano: '🌱' }[modo];
    console.log(`${icone} Populando receitas ${modo}... (pode demorar alguns minutos)`);
    const inicio = Date.now();
    try {
      const total = await popularModo(token, modo);
      const tempo = Math.round((Date.now() - inicio) / 1000);
      resultado[modo] = total;
      console.log(`  ✓ ${total} receitas salvas em ${tempo}s`);
    } catch (err: any) {
      resultado[modo] = 0;
      console.error(`  ✗ Falha: ${err.response?.data?.message || err.message}`);
    }
  }

  const total = Object.values(resultado).reduce((a, b) => a + b, 0);
  console.log('\n─────────────────────────────────');
  console.log(`✅ Total: ${total} receitas adicionadas`);
  for (const [modo, qtd] of Object.entries(resultado)) {
    const icone = { normal: '🍽️', fitness: '🏋️', vegetariano: '🥗', vegano: '🌱' }[modo] || '•';
    console.log(`  ${icone} ${modo}: ${qtd} receitas`);
  }
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
