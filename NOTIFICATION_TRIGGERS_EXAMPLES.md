# Exemplos de Triggers de Notificação

Use o serviço `NotificacaoTriggersService` para emitir notificações automáticas em eventos.

---

## 1. Receita Denunciada

### No `receitas.module.ts`
```typescript
import { NotificacaoModule } from '../notificacoes/notificacao.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receita, ...]),
    NotificacaoModule, // ← adicionar
  ],
  providers: [ReceitasService, ...],
})
export class ReceitasModule {}
```

### No `receitas.service.ts`
```typescript
import { NotificacaoTriggersService } from '../notificacoes/services/notificacao-triggers.service';

@Injectable()
export class ReceitasService {
  constructor(
    @InjectRepository(Receita)
    private receitaRepository: Repository<Receita>,
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {}

  /**
   * Reportar receita (denuncia)
   */
  async denunciarReceita(receitaId: string, motivo: string) {
    const receita = await this.receitaRepository.findOneBy({ id: receitaId });
    if (!receita) throw new NotFoundException('Receita não encontrada');

    // Incrementar contador de denuncias
    receita.denuncias = (receita.denuncias || 0) + 1;

    // Se muitas denuncias, marcar para revisão
    if (receita.denuncias >= 3) {
      receita.status_moderacao = 'em_revisao';
    }

    await this.receitaRepository.save(receita);

    // 🔔 Emitir notificação para admins
    await this.notificacaoTriggers.receitaDenunciada(
      receita.id,
      receita.nome,
      receita.denuncias,
    );

    return { success: true, denuncias: receita.denuncias };
  }
}
```

---

## 2. Novo Usuário Registrado

### No `usuarios.service.ts`
```typescript
import { NotificacaoTriggersService } from '../notificacoes/services/notificacao-triggers.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const usuario = await this.usuarioRepository.save(
      this.usuarioRepository.create(createUsuarioDto),
    );

    // 🔔 Emitir notificação para admins
    await this.notificacaoTriggers.novoUsuario(
      usuario.id,
      usuario.nome,
      usuario.email,
    );

    return usuario;
  }
}
```

---

## 3. Usuário Inativo (Job Agendado)

### Criar `usuarios-inatividade.job.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { NotificacaoTriggersService } from '../notificacoes/services/notificacao-triggers.service';

@Injectable()
export class UsuariosInatividadeJob {
  private logger = new Logger('UsuariosInatividadeJob');

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {}

  /**
   * Roda todo dia às 02:00 da manhã
   */
  @Cron('0 2 * * *')
  async verificarInativos() {
    this.logger.log('Verificando usuários inativos...');

    // Usuários que não acessam há 30+ dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const inativos = await this.usuarioRepository.find({
      where: {
        ultimo_acesso: LessThan(dataLimite),
      },
    });

    for (const usuario of inativos) {
      const diasInativo = Math.floor(
        (Date.now() - usuario.ultimo_acesso.getTime()) / (1000 * 60 * 60 * 24),
      );

      // 🔔 Emitir notificação
      await this.notificacaoTriggers.usuarioInativo(
        usuario.id,
        usuario.nome,
        diasInativo,
      );
    }

    this.logger.log(`${inativos.length} usuários inativos notificados`);
  }
}
```

### Adicionar ao `usuarios.module.ts`
```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { UsuariosInatividadeJob } from './jobs/usuarios-inatividade.job';
import { NotificacaoModule } from '../notificacoes/notificacao.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificacaoModule,
    TypeOrmModule.forFeature([Usuario, ...]),
  ],
  providers: [UsuariosService, UsuariosInatividadeJob],
})
export class UsuariosModule {}
```

---

## 4. Produto Incompleto

### No `produtos.service.ts`
```typescript
import { NotificacaoTriggersService } from '../notificacoes/services/notificacao-triggers.service';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {}

  async create(createProdutoDto: CreateProdutoDto) {
    const produto = await this.produtoRepository.save(
      this.produtoRepository.create(createProdutoDto),
    );

    // Verificar quais campos estão faltando
    const camposFaltando = this.verificarCamposObrigatorios(produto);

    if (camposFaltando.length > 0) {
      // 🔔 Emitir notificação
      await this.notificacaoTriggers.produtoIncompleto(
        produto.id,
        produto.nome,
        camposFaltando,
      );
    }

    return produto;
  }

  private verificarCamposObrigatorios(produto: Produto): string[] {
    const campos: string[] = [];

    if (!produto.imagem_url) campos.push('Imagem');
    if (!produto.informacoes_nutricionais) campos.push('Nutrição');
    if (!produto.descricao || produto.descricao.length < 50) campos.push('Descrição detalhada');
    if (!produto.codigo_barras) campos.push('Código de barras');
    if (!produto.categoria_id) campos.push('Categoria');

    return campos;
  }
}
```

---

## 5. Erro de Sistema

### Em qualquer service
```typescript
async algumProcessamento() {
  try {
    // ... processamento ...
  } catch (error) {
    this.logger.error('Erro crítico:', error);

    // 🔔 Notificar admins
    await this.notificacaoTriggers.erroSistema(
      'Falha em Processamento',
      `${error.message} às ${new Date().toLocaleString('pt-BR')}`,
    );

    throw error;
  }
}
```

---

## 6. Limite de Recursos

### Em memory/storage monitor
```typescript
async verificarEspacoEmDisco() {
  const espaceUsado = await this.getDiskUsage();
  const espacoTotal = await this.getDiskTotal();

  if ((espaceUsado / espacoTotal) * 100 > 80) {
    // 🔔 Alerta
    await this.notificacaoTriggers.limiteRecursos(
      'Espaço em Disco',
      espaceUsado,
      espacoTotal,
    );
  }
}
```

---

## 7. Notificação Customizada

### Uso genérico
```typescript
await this.notificacaoTriggers.custom(
  'moderacao', // tipo
  'alta',      // severidade
  '⚠️ Ação Manual Requerida',
  'Receita "Bolo de Chocolate" precisa de revisão manual',
  { receitaId: '123', motivo: 'Imagem inadequada' },
  {
    label: 'Revisar',
    rota: '/admin/receitas/123',
    id: '123',
  },
);
```

---

## Tipos de Notificação

| Tipo | Casos de Uso |
|------|-------------|
| `moderacao` | Receitas denunciadas, conteúdo inapropriado, revisões pendentes |
| `qualidade` | Produtos incompletos, dados faltando, validação falhou |
| `usuarios` | Novos usuários, usuários inativos, atividades suspeitas |
| `sistema` | Erros, limite de recursos, processamentos completados |

---

## Severidades

| Severidade | Ação | Cor |
|-----------|------|-----|
| `critica` | Requer ação imediata | 🔴 Vermelho |
| `alta` | Importante, revisar hoje | 🟠 Laranja |
| `media` | Revisar quando possível | 🟡 Amarelo |
| `baixa` | Informativo | 🔵 Azul |

---

## Checklist de Implementação

- [ ] Importar `NotificacaoModule` no seu módulo
- [ ] Injectar `NotificacaoTriggersService` no seu service
- [ ] Chamar `this.notificacaoTriggers.xxx()` no evento apropriado
- [ ] Testar no admin panel em tempo real
- [ ] Verificar logs de notificação no servidor
