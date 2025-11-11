# Guia de Contribuição - CookMe

Obrigado por considerar contribuir para o CookMe! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commits e Pull Requests](#commits-e-pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Melhorias](#sugerir-melhorias)

## 🤝 Código de Conduta

Este projeto e todos os participantes são regidos por um código de conduta. Ao participar, espera-se que você mantenha este código. Por favor, reporte comportamentos inaceitáveis.

### Nossas Promessas

- Usar linguagem acolhedora e inclusiva
- Respeitar pontos de vista e experiências diferentes
- Aceitar críticas construtivas graciosamente
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

## 🚀 Como Contribuir

### Primeiro Passo

1. **Fork o repositório**
2. **Clone seu fork**
   ```bash
   git clone https://github.com/SEU_USERNAME/cookme.git
   cd cookme
   ```

3. **Adicione o repositório original como upstream**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/cookme.git
   ```

### Tipos de Contribuições

Aceitamos os seguintes tipos de contribuições:

#### 🐛 Correção de Bugs
- Corrija bugs existentes
- Adicione testes que comprovem a correção

#### ✨ Novas Funcionalidades
- Implemente novas features
- Adicione documentação
- Adicione testes

#### 📝 Documentação
- Melhore a documentação existente
- Adicione exemplos
- Corrija typos

#### 🎨 Melhorias de UI/UX
- Melhore a interface
- Adicione acessibilidade
- Otimize performance

#### ✅ Testes
- Adicione testes faltantes
- Melhore cobertura de testes

## 🔄 Processo de Desenvolvimento

### 1. Criar uma Branch

Sempre crie uma branch para suas mudanças:

```bash
# Feature nova
git checkout -b feature/nome-da-feature

# Correção de bug
git checkout -b fix/nome-do-bug

# Documentação
git checkout -b docs/descricao

# Refatoração
git checkout -b refactor/descricao
```

### 2. Fazer Mudanças

#### Backend (NestJS)

```bash
cd backend

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run start:dev

# Rodar testes
npm test

# Rodar testes com coverage
npm run test:cov

# Lint
npm run lint

# Format
npm run format
```

#### Scraper (Python)

```bash
cd lib

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Rodar script
python captcha_manual.py

# Rodar testes (se existirem)
pytest
```

### 3. Testar

**IMPORTANTE:** Sempre teste suas mudanças antes de criar um PR!

#### Checklist de Testes

- [ ] Código compila sem erros
- [ ] Testes unitários passam
- [ ] Testes de integração passam
- [ ] Testado manualmente
- [ ] Sem regressões
- [ ] Performance não degradou

### 4. Commit

Siga as convenções de commit (ver [Commits](#commits-e-pull-requests))

```bash
git add .
git commit -m "feat: adiciona suporte para cupons NFC-e"
```

### 5. Push

```bash
git push origin feature/nome-da-feature
```

### 6. Criar Pull Request

1. Vá até o repositório no GitHub
2. Clique em "New Pull Request"
3. Selecione sua branch
4. Preencha o template do PR
5. Aguarde review

## 📝 Padrões de Código

### Backend (TypeScript/NestJS)

#### Estilo
- Use TypeScript strict mode
- Use async/await ao invés de Promises
- Use arrow functions
- Prefer const sobre let
- Nunca use var

#### Nomenclatura
```typescript
// Classes: PascalCase
class UserService {}

// Interfaces: PascalCase com I
interface IUser {}

// Funções/Métodos: camelCase
function getUserById() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Variáveis: camelCase
const userName = 'João';
```

#### Estrutura de Arquivos
```
module/
├── dto/
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── entities/
│   └── module.entity.ts
├── module.controller.ts
├── module.service.ts
├── module.module.ts
└── module.controller.spec.ts
```

#### Exemplo de Service
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  async create(createProdutoDto: CreateProdutoDto) {
    return this.prisma.produto.create({
      data: createProdutoDto,
    });
  }

  async findOne(id: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    return produto;
  }
}
```

### Scraper (Python)

#### Estilo
- Siga PEP 8
- Use type hints
- Use docstrings
- 4 espaços para indentação

#### Nomenclatura
```python
# Classes: PascalCase
class CookMeAPIClient:
    pass

# Funções/Métodos: snake_case
def buscar_produto_por_codigo():
    pass

# Constantes: UPPER_SNAKE_CASE
MAX_RETRIES = 3

# Variáveis: snake_case
user_name = "João"
```

#### Exemplo de Classe
```python
from typing import Optional, Dict, Any

class CookMeAPIClient:
    """Cliente para integração com a API CookMe."""

    def __init__(self, base_url: str, email: str, senha: str) -> None:
        """
        Inicializa o cliente da API.

        Args:
            base_url: URL base da API
            email: Email do usuário
            senha: Senha do usuário
        """
        self.base_url = base_url
        self.email = email
        self.senha = senha
        self.access_token: Optional[str] = None

    def autenticar(self) -> bool:
        """
        Autentica na API e obtém token de acesso.

        Returns:
            True se autenticação bem-sucedida, False caso contrário
        """
        # Implementação...
        pass
```

## 💬 Commits e Pull Requests

### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

#### Exemplos
```bash
feat(produtos): adiciona busca por categoria

Implementa endpoint GET /produtos?categoria=:id
para filtrar produtos por categoria

Closes #123

---

fix(scraper): corrige parsing de valores decimais

Valores com vírgula não estavam sendo convertidos corretamente

---

docs(readme): atualiza instruções de instalação

---

refactor(api): extrai lógica MOI para service separado
```

### Template de Pull Request

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Self-review realizado
- [ ] Comentários adicionados em código complexo
- [ ] Documentação atualizada
- [ ] Sem warnings gerados
- [ ] Testes adicionados/atualizados
- [ ] Todos os testes passam
- [ ] Mudanças dependentes foram mergeadas

## Screenshots (se aplicável)

## Issues Relacionadas
Closes #123
Related to #456
```

## 🐛 Reportar Bugs

### Antes de Reportar
1. Verifique se o bug já foi reportado
2. Verifique se está na versão mais recente
3. Colete informações sobre o bug

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara e concisa do bug.

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [e.g. Ubuntu 22.04]
 - Versão: [e.g. 1.2.0]
 - Node: [e.g. 18.0.0]
 - Python: [e.g. 3.12.0]

**Contexto Adicional**
Qualquer outra informação relevante.
```

## 💡 Sugerir Melhorias

### Template de Feature Request

```markdown
**A feature resolve um problema? Descreva.**
Descrição clara do problema.

**Descreva a solução desejada**
Descrição clara da solução.

**Descreva alternativas consideradas**
Outras soluções que você considerou.

**Contexto Adicional**
Screenshots, mockups, etc.
```

## 🔍 Code Review

### O que Procuramos

- Código limpo e legível
- Testes adequados
- Documentação atualizada
- Segue os padrões do projeto
- Sem código duplicado
- Performance adequada
- Segurança

### Processo de Review

1. Pelo menos 1 aprovação necessária
2. CI/CD deve passar
3. Conflitos devem ser resolvidos
4. Mudanças solicitadas devem ser implementadas

## 🎓 Recursos para Aprendizado

### Backend
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Scraper
- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [Python Style Guide](https://pep8.org/)
- [Requests Documentation](https://requests.readthedocs.io/)

## ❓ Dúvidas

- Crie uma issue com a label `question`
- Entre em contato: eduardo@ocdigital.com.br

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

**Obrigado por contribuir! 🎉**
