/**
 * Popula imagens das receitas sem imagem usando Freepik (Puppeteer).
 * Reutiliza um único browser para todas as buscas — muito mais rápido que abrir/fechar por receita.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-imagens.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { dataSourceOptions } from '../config/database.config';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504674900967-60f4a61f5a6e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
];

async function buscarImagemFreepik(page: Page, titulo: string): Promise<string | undefined> {
  try {
    const url = `https://br.freepik.com/search?query=${encodeURIComponent(titulo + ' comida')}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise((r) => setTimeout(r, 800));

    const imageUrls = await page.evaluate(() => {
      const imgs: string[] = [];
      document.querySelectorAll('img').forEach((img) => {
        const src = img.src || (img as any).dataset.src || (img as any).getAttribute('data-src') || '';
        // Freepik agora serve via img.magnific.com ou similar — filtra imagens de conteúdo
        if (
          src &&
          src.startsWith('http') &&
          !src.includes('logo') &&
          !src.includes('avatar') &&
          !src.includes('icon') &&
          !src.includes('user-') &&
          (src.includes('magnific') || src.includes('freepik') || src.includes('/foto') || src.includes('/photo'))
        ) {
          imgs.push(src);
        }
      });
      return imgs;
    });

    if (imageUrls.length > 0) return imageUrls[0];
    return undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  const dataSource = new DataSource({ ...dataSourceOptions, synchronize: false });
  await dataSource.initialize();

  const receitas = await dataSource.query(
    `SELECT id, nome FROM receitas WHERE imagem_url IS NULL OR imagem_url = '' ORDER BY nome`,
  );

  if (receitas.length === 0) {
    console.log('Todas as receitas já têm imagem!');
    await dataSource.destroy();
    return;
  }

  console.log(`\n🖼️  Buscando imagens para ${receitas.length} receitas...\n`);

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  let ok = 0;
  let placeholder = 0;

  for (let i = 0; i < receitas.length; i++) {
    const r = receitas[i];
    process.stdout.write(`  [${i + 1}/${receitas.length}] ${r.nome.substring(0, 45).padEnd(45)} → `);

    const imagem = await buscarImagemFreepik(page, r.nome);

    let url: string;
    if (imagem) {
      url = imagem;
      ok++;
      console.log(`✅ ${url.substring(0, 60)}`);
    } else {
      url = PLACEHOLDERS[i % PLACEHOLDERS.length];
      placeholder++;
      console.log(`📦 placeholder`);
    }

    await dataSource.query(`UPDATE receitas SET imagem_url = $1 WHERE id = $2`, [url, r.id]);
  }

  await browser.close();
  await dataSource.destroy();

  console.log(`\n✨ Concluído!`);
  console.log(`   Imagens reais: ${ok}`);
  console.log(`   Placeholders:  ${placeholder}\n`);
}

main().catch((err) => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
