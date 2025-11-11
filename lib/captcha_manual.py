#!/usr/bin/env python3
"""
CONSULTA SAT-SP COM QR CODE - VERSÃO COMPLETA E AUTOMÁTICA
Lê QR Code, consulta e extrai dados automaticamente

Modos de execução:
- Manual: python captcha_manual.py
- API: python captcha_manual.py --mode api --session-id SESSION_ID --qrcode "QR_CODE_TEXT"
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import re
import json
from datetime import datetime
import requests
import argparse
import sys


# ========================================
# FUNÇÕES DE COMUNICAÇÃO COM BACKEND
# ========================================

def enviar_mensagem_json(tipo, **dados):
    """Envia mensagem JSON para stdout (para comunicação com backend)"""
    mensagem = {"type": tipo, **dados}
    print(json.dumps(mensagem), flush=True)


def aguardar_continuar():
    """Aguarda sinal para continuar e recebe HTML do cupom (quando está no modo API)"""
    print("Aguardando sinal para continuar...", file=sys.stderr)
    while True:
        try:
            linha = input()
            if linha.strip() == "continue":
                print("Sinal recebido, continuando...", file=sys.stderr)
                # Ler a próxima linha que contém o JSON com o HTML
                try:
                    html_data_linha = input()
                    html_data = json.loads(html_data_linha)
                    html_cupom = html_data.get('html', '')
                    if html_cupom:
                        print(f"HTML do cupom recebido ({len(html_cupom)} caracteres)", file=sys.stderr)
                    return html_cupom
                except Exception as e:
                    print(f"Erro ao ler HTML: {e}", file=sys.stderr)
                    return ''
        except EOFError:
            time.sleep(1)
            continue


class CookMeAPIClient:
    """Cliente para integração com a API do CookMe"""

    def __init__(self, base_url="http://localhost:3000/api", email=None, senha=None):
        self.base_url = base_url
        self.email = email
        self.senha = senha
        self.access_token = None
        self.headers = {"Content-Type": "application/json"}

    def autenticar(self):
        """Autentica na API e obtém o access token"""
        print("\n🔐 Autenticando na API CookMe...")

        try:
            url = f"{self.base_url}/auth/login"
            payload = {
                "email": self.email,
                "senha": self.senha
            }

            response = requests.post(url, json=payload, headers=self.headers)

            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.headers["Authorization"] = f"Bearer {self.access_token}"
                print("✅ Autenticação bem-sucedida!")
                return True
            else:
                print(f"❌ Falha na autenticação: {response.status_code}")
                print(f"   Resposta: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Erro ao autenticar: {e}")
            return False

    def buscar_produto_por_codigo(self, codigo_barras):
        """Busca um produto pelo código de barras"""
        try:
            url = f"{self.base_url}/produtos/barcode/{codigo_barras}"
            response = requests.get(url, headers=self.headers)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                # Produto não encontrado
                return None
            else:
                return None

        except requests.exceptions.JSONDecodeError:
            # Resposta não é JSON (provavelmente 404 ou erro)
            return None
        except Exception as e:
            print(f"   ⚠️ Erro ao buscar produto {codigo_barras}: {e}")
            return None

    def criar_produto(self, produto_data):
        """Cria um novo produto na API"""
        try:
            url = f"{self.base_url}/produtos"
            response = requests.post(url, json=produto_data, headers=self.headers)

            if response.status_code == 201:
                return response.json()
            else:
                print(f"   ⚠️ Erro ao criar produto: {response.status_code}")
                print(f"   Resposta: {response.text}")
                return None

        except Exception as e:
            print(f"   ❌ Erro ao criar produto: {e}")
            return None

    def criar_compra(self, compra_data):
        """Registra uma nova compra na API"""
        try:
            url = f"{self.base_url}/compras"
            response = requests.post(url, json=compra_data, headers=self.headers)

            if response.status_code == 201:
                return response.json()
            else:
                print(f"❌ Erro ao criar compra: {response.status_code}")
                print(f"   Resposta: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Erro ao criar compra: {e}")
            return None

    def salvar_cupom_fiscal(self, cupom_dados):
        """Processa e salva um cupom fiscal completo na API. Retorna dict com ID da compra ou False"""
        print("\n💾 Salvando cupom fiscal na API...")

        if not self.access_token:
            if not self.autenticar():
                return False

        # Mapear itens do cupom para produtos da API
        produtos_mapeados = []

        print("\n📦 Processando produtos...")
        for item in cupom_dados.get("itens", []):
            codigo = item.get("codigo", "")

            # Buscar se o produto já existe
            produto_existente = self.buscar_produto_por_codigo(codigo)

            if produto_existente:
                print(f"   ✅ Produto encontrado: {item['descricao']}")
                produto_id = produto_existente.get("id")
            else:
                # Criar novo produto
                print(f"   🆕 Criando produto: {item['descricao']}")

                produto_novo = {
                    "nome": item.get("descricao", "").title(),
                    "codigo_barras": codigo,
                    "unidade_padrao": item.get("unidade", "un").lower(),
                }

                produto_criado = self.criar_produto(produto_novo)

                if produto_criado:
                    produto_id = produto_criado.get("id")
                    print(f"   ✅ Produto criado com ID: {produto_id}")
                else:
                    print(f"   ❌ Falha ao criar produto: {item['descricao']}")
                    continue

            # Adicionar ao mapeamento
            produtos_mapeados.append({
                "produto_id": produto_id,
                "quantidade": item.get("quantidade", 1),
                "unidade": item.get("unidade", "un").lower(),
                "preco_unitario": item.get("valor_unitario", 0)
            })

        # Preparar dados da compra
        info_fiscal = cupom_dados.get("informacoes_fiscais", {})
        estabelecimento = cupom_dados.get("estabelecimento", {})
        totais = cupom_dados.get("totais", {})

        # Converter data do formato DD/MM/YYYY para YYYY-MM-DD
        data_compra = info_fiscal.get("data", "")
        if data_compra:
            partes = data_compra.split("/")
            if len(partes) == 3:
                data_compra = f"{partes[2]}-{partes[1]}-{partes[0]}"

        compra_data = {
            "data_compra": data_compra or datetime.now().strftime("%Y-%m-%d"),
            "local_compra": estabelecimento.get("nome", "Não informado"),
            "valor_total": totais.get("total", 0),
            "metodo_cadastro": "cupom_sat",
            "itens": produtos_mapeados
        }

        # Criar compra
        print("\n🛒 Registrando compra...")
        compra_criada = self.criar_compra(compra_data)

        if compra_criada:
            compra_id = compra_criada.get('id')
            print("\n✅ Compra registrada com sucesso!")
            print(f"   ID da Compra: {compra_id}")
            print(f"   Total de itens: {len(produtos_mapeados)}")
            print(f"   Valor total: R$ {compra_data['valor_total']:.2f}")
            # Retornar dict com ID para que possa ser usado no resultado
            return {"id": compra_id}
        else:
            print("\n❌ Falha ao registrar compra")
            return False


class LeitorQRCodeSAT:
    """Classe para ler QR Codes e extrair informações"""

    @staticmethod
    def extrair_chave_de_texto(texto_qrcode):
        """Extrai a chave de acesso do texto do QR Code"""
        print(f"📄 Processando texto do QR Code...")
        print(f"📝 Texto: {texto_qrcode[:100]}...")
        
        partes = texto_qrcode.split('|')
        
        if len(partes) < 1:
            print("❌ Formato inválido")
            return None
        
        chave = partes[0].strip()
        
        if len(chave) == 44 and chave.isdigit():
            print(f"✅ Chave extraída: {chave}")
            
            if len(partes) >= 3:
                data_hora = partes[1] if len(partes) > 1 else ''
                valor = partes[2] if len(partes) > 2 else ''
                
                if len(data_hora) == 14:
                    data_fmt = f"{data_hora[6:8]}/{data_hora[4:6]}/{data_hora[0:4]} {data_hora[8:10]}:{data_hora[10:12]}:{data_hora[12:14]}"
                    print(f"📅 Data/Hora: {data_fmt}")
                
                print(f"💰 Valor: R$ {valor}")
            
            return chave
        else:
            print(f"❌ Chave inválida: {chave}")
            return None


class ConsultaSATRobusta:
    """Classe para consultar o SAT com detecção inteligente"""

    def __init__(self, modo_api=False):
        self.url = "https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx"
        self.driver = None
        self.modo_api = modo_api  # Se True, usa comunicação JSON via stdout
    
    def iniciar_navegador(self):
        """Inicia o navegador Chrome"""
        if self.modo_api:
            print("🌐 Iniciando navegador (modo headless)...", file=sys.stderr)
        else:
            print("🌐 Iniciando navegador...")

        options = webdriver.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36')

        # NOTA: Headless desabilitado porque reCAPTCHA não funciona bem
        # Por enquanto o navegador abrirá visível no servidor
        options.add_argument('--start-maximized')

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)

        if self.modo_api:
            print("✅ Navegador iniciado (headless)", file=sys.stderr)
        else:
            print("✅ Navegador iniciado")
    
    def encontrar_campo_chave(self):
        """Tenta encontrar o campo de chave de acesso"""
        print("\n🔍 Procurando campo de chave de acesso...")
        
        possiveis_identificadores = [
            ("id", "conteudo_txtChaveAcesso"),
            ("name", "ctl00$conteudo$txtChaveAcesso"),
        ]
        
        for tipo, valor in possiveis_identificadores:
            try:
                if tipo == "id":
                    elemento = self.driver.find_element(By.ID, valor)
                elif tipo == "name":
                    elemento = self.driver.find_element(By.NAME, valor)
                
                print(f"✅ Campo encontrado por {tipo}: {valor}")
                return elemento
            except NoSuchElementException:
                continue
        
        print("❌ Campo não encontrado")
        return None
    
    def extrair_dados_cupom(self, html):
        """Extrai dados estruturados do cupom fiscal"""

        cupom = {
            "estabelecimento": {},
            "itens": [],
            "totais": {},
            "informacoes_fiscais": {},
            "data_extracao": datetime.now().isoformat()
        }

        print("\n🔍 Extraindo dados do cupom...")

        # Extrair texto do HTML usando BeautifulSoup
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            texto_completo = soup.get_text(separator='\n')

            # DEBUG: Salvar texto visível da página
            timestamp_debug = int(time.time())
            arquivo_debug = f"debug_texto_pagina_{timestamp_debug}.txt"
            with open(arquivo_debug, "w", encoding="utf-8") as f:
                f.write(texto_completo)
            print(f"   🐛 Texto salvo: {arquivo_debug}")
            print(f"   🐛 Tamanho do HTML: {len(html)} caracteres")
            print(f"   🐛 Tamanho do texto extraído: {len(texto_completo)} caracteres")
        except Exception as e:
            print(f"   ⚠️ Erro ao extrair texto do HTML: {e}")
            import traceback
            traceback.print_exc()
            return cupom

        # Método Principal: Análise do texto linha por linha
        # Padrão do cupom SAT-SP (cada campo em uma linha separada):
        # numero (ex: 1)
        # codigo (ex: 362585)
        # descricao (ex: PAPEL HIG FAMILIAR 16X30M FD)
        # quantidade (ex: 1,0000)
        # unidade (ex: UN)
        # X
        # valor_unitario (ex: 23,98)
        # desconto (ex: (3,88))
        # valor_total (ex: 23,98)

        print("\n   🔍 Analisando texto da página (formato multi-linha)...")
        try:
            linhas = [l.strip() for l in texto_completo.split('\n')]

            # Procurar pelo cabeçalho da tabela de itens
            # Procuramos por "TOTAL R$" (marcador do final dos itens) para delimitar a seção
            inicio_itens = -1
            fim_itens = -1

            # Encontrar início: procurar por "#" seguido de "COD"
            for i, linha in enumerate(linhas):
                if linha == '#':
                    # Procurar 'COD' nas próximas 10 linhas (pulando vazias)
                    for j in range(i+1, min(i+15, len(linhas))):
                        if linhas[j] == 'COD':
                            inicio_itens = j + 1  # Começar APÓS a linha COD
                            break
                    if inicio_itens != -1:
                        break

            # Encontrar fim: procurar por "TOTAL R$"
            for i, linha in enumerate(linhas):
                if 'TOTAL R$' in linha:
                    fim_itens = i
                    break

            if inicio_itens == -1:
                print("   ⚠️ Cabeçalho de itens não encontrado")
            else:
                print(f"   ✅ Cabeçalho encontrado, iniciando busca de itens a partir da linha {inicio_itens}")
                if fim_itens != -1:
                    print(f"   ℹ️  Seção de itens termina na linha {fim_itens}")

                # Processar linhas entre inicio_itens e fim_itens
                i = inicio_itens
                limite = fim_itens if fim_itens != -1 else len(linhas)

                while i < limite:
                    linha = linhas[i]

                    # Procurar por número do item (linha com apenas 1-3 dígitos)
                    if linha and re.match(r'^\d{1,3}$', linha):
                        numero_item = int(linha)

                        try:
                            # Código (próxima linha não vazia)
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1
                            if i >= limite:
                                break
                            codigo = linhas[i]

                            # Descrição
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1
                            if i >= limite:
                                break
                            descricao = linhas[i]

                            # Quantidade
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1
                            if i >= limite:
                                break
                            quantidade_str = linhas[i]

                            # Unidade
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1
                            if i >= limite:
                                break
                            unidade = linhas[i]

                            # Pular até encontrar "X"
                            i += 1
                            while i < limite and linhas[i] != 'X':
                                i += 1

                            if i >= limite or linhas[i] != 'X':
                                print(f"   ⚠️ Item {numero_item}: 'X' não encontrado, pulando")
                                i += 1
                                continue

                            # Pular "X" e espaços
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1

                            if i >= limite:
                                break

                            # Valor unitário
                            valor_unitario_str = linhas[i]

                            # Desconto (entre parênteses) - pular para próximo valor
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1
                            if i >= limite:
                                break
                            # desconto_str = linhas[i]  # Não usamos desconto por enquanto

                            # Valor total
                            i += 1
                            while i < limite and not linhas[i]:
                                i += 1
                            if i >= limite:
                                break
                            valor_total_str = linhas[i]

                            # Parsear valores (remover espaços extras e converter)
                            try:
                                quantidade = float(quantidade_str.replace(',', '.'))
                                valor_unitario = float(valor_unitario_str.replace(',', '.').replace(' ', ''))
                                valor_total = float(valor_total_str.replace(',', '.').replace(' ', ''))

                                item = {
                                    "numero": numero_item,
                                    "codigo": codigo,
                                    "descricao": descricao,
                                    "quantidade": quantidade,
                                    "unidade": unidade,
                                    "valor_unitario": valor_unitario,
                                    "valor_total": valor_total
                                }

                                # Verificar se já não foi adicionado
                                if not any(it['numero'] == item['numero'] for it in cupom["itens"]):
                                    cupom["itens"].append(item)
                                    print(f"   ✅ Item {item['numero']}: {item['descricao']} (x{item['quantidade']}) - R$ {item['valor_total']:.2f}")
                                else:
                                    print(f"   ℹ️  Item {numero_item} já foi adicionado")
                            except ValueError as ve:
                                print(f"   ⚠️ Item {numero_item}: Erro ao converter valores - {ve}")
                                print(f"      QTD: '{quantidade_str}', VLR UN: '{valor_unitario_str}', VLR TOT: '{valor_total_str}'")

                        except Exception as e:
                            print(f"   ⚠️ Erro ao extrair item {numero_item}: {e}")
                            import traceback
                            traceback.print_exc()

                    i += 1

            print(f"\n   📊 Total de itens extraídos: {len(cupom['itens'])}")

        except Exception as e:
            print(f"   ⚠️ Erro ao extrair itens: {e}")
            import traceback
            traceback.print_exc()
        
        # Extrair dados do estabelecimento e totais
        try:
            # Reutilizar o texto já extraído
            linhas = texto_completo.split('\n')

            # Nome do estabelecimento
            for i, linha in enumerate(linhas[:10]):
                linha_upper = linha.upper()
                if 'SUPERMERCADO' in linha_upper or 'LTDA' in linha or 'MERCADO' in linha_upper:
                    if not cupom["estabelecimento"].get("nome"):
                        cupom["estabelecimento"]["nome"] = linha.strip()
                        print(f"   🏪 Estabelecimento: {linha.strip()}")
                        break
            
            # CNPJ
            for linha in linhas:
                match = re.search(r'CNPJ[:\s]*([0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2})', linha)
                if match:
                    cupom["estabelecimento"]["cnpj"] = match.group(1)
                    print(f"   📋 CNPJ: {match.group(1)}")
                    break
            
            # Endereço
            for linha in linhas:
                if 'Endereço:' in linha:
                    cupom["estabelecimento"]["endereco"] = linha.replace('Endereço:', '').strip()
                    break
            
            # Bairro
            for linha in linhas:
                if 'Bairro:' in linha:
                    cupom["estabelecimento"]["bairro"] = linha.replace('Bairro:', '').strip()
                    break
            
            # Total
            for i, linha in enumerate(linhas):
                if linha.startswith('TOTAL R$'):
                    if i + 1 < len(linhas):
                        valor_str = linhas[i + 1].strip()
                        try:
                            cupom["totais"]["total"] = float(valor_str.replace(',', '.'))
                            print(f"   💰 Total: R$ {cupom['totais']['total']:.2f}")
                        except:
                            pass
                    break
            
            # Cartão de Débito
            for i, linha in enumerate(linhas):
                if 'Cartão de Débito' in linha:
                    if i + 1 < len(linhas):
                        valor_str = linhas[i + 1].strip()
                        try:
                            cupom["totais"]["cartao_debito"] = float(valor_str.replace(',', '.'))
                        except:
                            pass
                    break
            
            # Extrato
            for linha in linhas:
                match = re.search(r'Extrato Nº[:\s]*(\d+)', linha)
                if match:
                    cupom["informacoes_fiscais"]["numero_extrato"] = match.group(1)
                    break
            
            # SAT
            for linha in linhas:
                match = re.search(r'SAT Nº\s+([\d-]+)', linha)
                if match:
                    cupom["informacoes_fiscais"]["numero_sat"] = match.group(1)
                    break
            
            # Data e Hora
            for linha in linhas:
                match = re.search(r'(\d{2}/\d{2}/\d{4})\s*-\s*(\d{2}:\d{2}:\d{2})', linha)
                if match:
                    cupom["informacoes_fiscais"]["data"] = match.group(1)
                    cupom["informacoes_fiscais"]["hora"] = match.group(2)
                    break
            
            # Chave de acesso
            for linha in linhas:
                match = re.search(r'(\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4})', linha)
                if match:
                    cupom["informacoes_fiscais"]["chave_acesso"] = match.group(1).replace(' ', '')
                    break
                    
        except Exception as e:
            print(f"   ⚠️ Erro ao extrair dados adicionais: {e}")
        
        # Resumo
        print(f"\n   📊 Resumo da extração:")
        print(f"      • Itens: {len(cupom['itens'])}")
        print(f"      • Estabelecimento: {'✅' if cupom['estabelecimento'].get('nome') else '❌'}")
        print(f"      • Totais: {'✅' if cupom['totais'].get('total') else '❌'}")
        
        return cupom
    
    def consultar(self, chave_acesso, tempo_espera_captcha=120):
        """Consulta o SAT"""
        try:
            print(f"\n{'='*60}")
            print(f"🔍 CONSULTANDO SAT-SP")
            print(f"{'='*60}")
            print(f"📋 Chave: {chave_acesso}")
            
            # 1. Abrir página
            if self.modo_api:
                enviar_mensagem_json("status", status="abrindo_navegador", progress=30)
                print("📄 1. Abrindo página...", file=sys.stderr)
            else:
                print("\n📄 1. Abrindo página...")

            self.driver.get(self.url)

            if self.modo_api:
                print("⏳ Aguardando carregamento...", file=sys.stderr)
            else:
                print("⏳ Aguardando carregamento...")

            time.sleep(5)

            try:
                WebDriverWait(self.driver, 20).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                if self.modo_api:
                    print("✅ Página carregada", file=sys.stderr)
                else:
                    print("✅ Página carregada")
            except TimeoutException:
                if self.modo_api:
                    print("⚠️ Timeout, mas continuando...", file=sys.stderr)
                else:
                    print("⚠️ Timeout, mas continuando...")

            # 2. Preencher campo
            if self.modo_api:
                enviar_mensagem_json("status", status="preenchendo_chave", progress=40)
                print("📝 2. Localizando e preenchendo chave...", file=sys.stderr)
            else:
                print("\n📝 2. Localizando e preenchendo chave...")

            campo_chave = self.encontrar_campo_chave()

            if not campo_chave:
                if self.modo_api:
                    print("❌ Campo não encontrado", file=sys.stderr)
                    enviar_mensagem_json("erro", mensagem="Campo chave de acesso não encontrado")
                else:
                    print("❌ Campo não encontrado")
                return None

            if self.modo_api:
                print(f"ℹ️  Campo: {campo_chave.get_attribute('id')}", file=sys.stderr)
            else:
                print(f"ℹ️  Campo: {campo_chave.get_attribute('id')}")

            # Scroll até o campo
            self.driver.execute_script("arguments[0].scrollIntoView(true);", campo_chave)
            time.sleep(1)

            # Remover máscara
            try:
                self.driver.execute_script("""
                    var campo = document.getElementById('conteudo_txtChaveAcesso');
                    if (campo) {
                        campo.removeAttribute('input-mask');
                        campo.removeAttribute('maxlength');
                        campo.removeAttribute('data-mask');
                    }
                """)
                if self.modo_api:
                    print("✅ Máscara removida", file=sys.stderr)
                else:
                    print("✅ Máscara removida")
            except Exception as e:
                if self.modo_api:
                    print(f"⚠️ Erro ao remover máscara: {e}", file=sys.stderr)

            # Tentar múltiplos métodos de preenchimento
            preenchido = False

            # Método 1: JavaScript direto
            try:
                self.driver.execute_script(f"""
                    var campo = document.getElementById('conteudo_txtChaveAcesso');
                    campo.value = '';
                    campo.value = '{chave_acesso}';
                    campo.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    campo.dispatchEvent(new Event('change', {{ bubbles: true }}));
                """)
                time.sleep(0.5)
                valor = campo_chave.get_attribute("value")
                if valor and len(valor) == 44:
                    preenchido = True
                    if self.modo_api:
                        print(f"✅ Método 1 funcionou: {valor}", file=sys.stderr)
                    else:
                        print(f"✅ Chave preenchida (método 1): {valor}")
            except Exception as e:
                if self.modo_api:
                    print(f"⚠️ Método 1 falhou: {e}", file=sys.stderr)

            # Método 2: Selenium clear + send_keys
            if not preenchido:
                try:
                    campo_chave.clear()
                    time.sleep(0.3)
                    campo_chave.send_keys(chave_acesso)
                    time.sleep(0.5)
                    valor = campo_chave.get_attribute("value")
                    if valor and len(valor) == 44:
                        preenchido = True
                        if self.modo_api:
                            print(f"✅ Método 2 funcionou: {valor}", file=sys.stderr)
                        else:
                            print(f"✅ Chave preenchida (método 2): {valor}")
                except Exception as e:
                    if self.modo_api:
                        print(f"⚠️ Método 2 falhou: {e}", file=sys.stderr)

            # Método 3: ActionChains (simula digitação)
            if not preenchido:
                try:
                    actions = ActionChains(self.driver)
                    campo_chave.click()
                    time.sleep(0.3)
                    actions.key_down(Keys.CONTROL).send_keys('a').key_up(Keys.CONTROL).perform()
                    time.sleep(0.2)
                    actions.send_keys(chave_acesso).perform()
                    time.sleep(0.5)
                    valor = campo_chave.get_attribute("value")
                    if valor and len(valor) == 44:
                        preenchido = True
                        if self.modo_api:
                            print(f"✅ Método 3 funcionou: {valor}", file=sys.stderr)
                        else:
                            print(f"✅ Chave preenchida (método 3): {valor}")
                except Exception as e:
                    if self.modo_api:
                        print(f"⚠️ Método 3 falhou: {e}", file=sys.stderr)

            # Método 4: Click + JavaScript focus/select
            if not preenchido:
                try:
                    campo_chave.click()
                    time.sleep(0.2)
                    self.driver.execute_script(f"""
                        var campo = document.getElementById('conteudo_txtChaveAcesso');
                        campo.focus();
                        campo.select();
                        campo.value = '{chave_acesso}';
                        campo.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        campo.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        campo.blur();
                    """)
                    time.sleep(0.5)
                    valor = campo_chave.get_attribute("value")
                    if valor and len(valor) >= 40:  # Aceitar se tiver pelo menos 40 caracteres
                        preenchido = True
                        if self.modo_api:
                            print(f"✅ Método 4 funcionou: {valor}", file=sys.stderr)
                        else:
                            print(f"✅ Chave preenchida (método 4): {valor}")
                except Exception as e:
                    if self.modo_api:
                        print(f"⚠️ Método 4 falhou: {e}", file=sys.stderr)

            if not preenchido:
                if self.modo_api:
                    print("❌ Falha ao preencher chave de acesso", file=sys.stderr)
                    enviar_mensagem_json("erro", mensagem="Não foi possível preencher a chave de acesso")
                    sys.exit(1)
                else:
                    print("❌ Falha ao preencher chave de acesso")
                    return None

            # Verificação final
            valor_final = campo_chave.get_attribute("value")
            if self.modo_api:
                print(f"✅ Chave preenchida com sucesso: {valor_final}", file=sys.stderr)
            else:
                print(f"✅ Verificação final: {valor_final}")

            # Aguardar um pouco para a página processar
            time.sleep(2)
            
            # 3. Aguardar reCAPTCHA
            if self.modo_api:
                # Modo API: notificar backend e aguardar confirmação
                print("🧩 3. CAPTCHA detectado - notificando backend...", file=sys.stderr)
                enviar_mensagem_json("captcha_required", url=self.url, chave_acesso=chave_acesso)

                print("⏳ Aguardando usuário resolver CAPTCHA no mobile...", file=sys.stderr)
                html_cupom = aguardar_continuar()

                if not html_cupom:
                    print("❌ HTML do cupom não foi recebido", file=sys.stderr)
                    enviar_mensagem_json("erro", mensagem="HTML do cupom não foi recebido")
                    sys.exit(1)

                print("✅ Confirmação recebida do mobile!", file=sys.stderr)
                print("✅ Cupom HTML recebido, processando dados...", file=sys.stderr)

                # Processar HTML do cupom
                enviar_mensagem_json("status", status="processando_dados", progress=70)

                # Verificar se contém cupom fiscal
                if "TOTAL R$" in html_cupom or "CUPOM FISCAL" in html_cupom or "Extrato" in html_cupom:
                    print("✅ Cupom fiscal detectado no HTML!", file=sys.stderr)
                    print("🔄 Extraindo dados...", file=sys.stderr)

                    cupom_dados = self.extrair_dados_cupom(html_cupom)

                    if cupom_dados and len(cupom_dados.get('itens', [])) > 0:
                        # Salvar na API
                        print("🚀 Integrando com API CookMe...", file=sys.stderr)
                        enviar_mensagem_json("status", status="salvando_dados", progress=80)

                        api_client = CookMeAPIClient(
                            base_url="http://localhost:3000/api",
                            email="eduardo@ocdigital.com.br",
                            senha="3221#Edu"
                        )

                        resultado_api = api_client.salvar_cupom_fiscal(cupom_dados)

                        if resultado_api and resultado_api.get('id'):
                            # Enviar mensagem de sucesso com ID real da compra
                            enviar_mensagem_json(
                                "compra_criada",
                                compra_id=resultado_api.get('id'),
                                total_produtos=len(cupom_dados.get('itens', [])),
                                valor_total=cupom_dados.get('totais', {}).get('total', 0)
                            )
                            print("✅ Compra criada com sucesso!", file=sys.stderr)
                            return cupom_dados
                        else:
                            print("❌ Falha ao salvar na API", file=sys.stderr)
                            enviar_mensagem_json("erro", mensagem="Falha ao salvar cupom na API")
                            sys.exit(1)
                    else:
                        print("❌ Nenhum item foi extraído do cupom", file=sys.stderr)
                        enviar_mensagem_json("erro", mensagem="Nenhum item foi extraído do cupom")
                        sys.exit(1)
                else:
                    print("❌ HTML não contém cupom fiscal", file=sys.stderr)
                    enviar_mensagem_json("erro", mensagem="HTML não contém cupom fiscal")
                    sys.exit(1)

            else:
                # Modo manual: esperar usuário resolver localmente
                print(f"\n🧩 3. RESOLVA O reCAPTCHA!")
                print("="*60)
                print("👆 Clique no checkbox 'Não sou um robô'")
                print(f"⏰ Tempo limite: {tempo_espera_captcha} segundos")
                print("="*60)

                tempo_inicio = time.time()
                captcha_resolvido = False

                while time.time() - tempo_inicio < tempo_espera_captcha:
                    try:
                        recaptcha_response = self.driver.execute_script(
                            "return document.getElementById('g-recaptcha-response') ? document.getElementById('g-recaptcha-response').value : ''"
                        )

                        botao_temp = self.driver.find_element(By.ID, "conteudo_btnConsultar")
                        botao_habilitado = not botao_temp.get_attribute("disabled")

                        if recaptcha_response and len(recaptcha_response) > 50 and botao_habilitado:
                            print("\n✅ reCAPTCHA RESOLVIDO!")
                            print("✅ Botão habilitado!")
                            captcha_resolvido = True
                            break

                        tempo_restante = int(tempo_espera_captcha - (time.time() - tempo_inicio))
                        status = "🟢" if botao_habilitado else "🔴"
                        print(f"\r⏳ Aguardando... ({tempo_restante}s) | Botão: {status}", end='', flush=True)
                        time.sleep(1)

                    except Exception as e:
                        time.sleep(1)

                if not captcha_resolvido:
                    print("\n\n⚠️ Tempo esgotado!")
                    return None
            
            # 4. Clicar no botão
            print("\n\n📤 4. Enviando consulta...")
            time.sleep(3)  # Aguardar mais após reCAPTCHA
            
            try:
                print("🔍 Buscando botão...")
                
                # Aguardar até o botão estar presente e clicável
                botao = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "conteudo_btnConsultar"))
                )
                
                print("✅ Botão encontrado")
                
                # Aguardar estar clicável
                botao = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.ID, "conteudo_btnConsultar"))
                )
                
                print("✅ Botão clicável")
                
                # Scroll até o botão
                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", botao)
                time.sleep(1)
                
                # Tentar clicar
                try:
                    print("🔘 Clicando via Selenium...")
                    botao.click()
                    print("✅ Clicado!")
                except Exception as e1:
                    print(f"⚠️ Selenium falhou: {e1}")
                    try:
                        print("🔘 Tentando via JavaScript...")
                        self.driver.execute_script("arguments[0].click();", botao)
                        print("✅ Clicado via JS!")
                    except Exception as e2:
                        print(f"⚠️ JS falhou: {e2}")
                        # Última tentativa: submit
                        print("🔄 Tentando submit do form...")
                        self.driver.execute_script("""
                            var form = document.getElementById('form1');
                            if (form) form.submit();
                        """)
                        print("✅ Form submetido!")
                    
            except TimeoutException:
                print("❌ Timeout ao buscar botão")
                print("🔄 Tentando submeter formulário diretamente...")
                try:
                    self.driver.execute_script("document.getElementById('form1').submit();")
                    print("✅ Formulário submetido!")
                except Exception as e:
                    print(f"❌ Falha total: {e}")
                    return None
            except Exception as e:
                print(f"⚠️ Erro inesperado: {e}")
                return None
            
            # 5. Aguardar resposta
            if self.modo_api:
                enviar_mensagem_json("status", status="processando_dados", progress=70)
                print("📊 5. Aguardando resposta...", file=sys.stderr)
            else:
                print("\n📊 5. Aguardando resposta...")

            time.sleep(3)

            try:
                WebDriverWait(self.driver, 15).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                if self.modo_api:
                    print("✅ Página carregada", file=sys.stderr)
                else:
                    print("✅ Página carregada")
            except:
                if self.modo_api:
                    print("⚠️ Timeout, mas continuando...", file=sys.stderr)
                else:
                    print("⚠️ Timeout, mas continuando...")

            time.sleep(2)

            # 6. Capturar e extrair
            if self.modo_api:
                print("💾 6. Capturando e processando...", file=sys.stderr)
            else:
                print("\n💾 6. Capturando e processando...")
            
            html_resultado = self.driver.page_source
            timestamp = int(time.time())
            
            html_debug = f"debug_cupom_{timestamp}.html"
            with open(html_debug, "w", encoding="utf-8") as f:
                f.write(html_resultado)
            print(f"🐛 Debug HTML: {html_debug}")
            
            if "TOTAL R$" in html_resultado or "CUPOM FISCAL" in html_resultado or "Extrato" in html_resultado:
                if self.modo_api:
                    print("✅ Cupom fiscal detectado!", file=sys.stderr)
                    print("🔄 Extraindo dados...", file=sys.stderr)
                else:
                    print("✅ Cupom fiscal detectado!")
                    print("\n🔄 Extraindo dados...")

                cupom_dados = self.extrair_dados_cupom(html_resultado)
                
                json_file = f"cupom_dados_{timestamp}.json"
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(cupom_dados, f, ensure_ascii=False, indent=2)
                print(f"\n✅ JSON: {json_file}")
                
                screenshot_file = f"cupom_screenshot_{timestamp}.png"
                self.driver.save_screenshot(screenshot_file)
                print(f"✅ Screenshot: {screenshot_file}")
                
                print("\n" + "🎉"*30)
                print("🎉 EXTRAÇÃO CONCLUÍDA!")
                print("🎉"*30)
                
                print(f"\n📦 RESUMO:")
                if cupom_dados.get("estabelecimento", {}).get("nome"):
                    print(f"   🏪 {cupom_dados['estabelecimento']['nome']}")
                if cupom_dados.get("itens"):
                    print(f"   🛒 {len(cupom_dados['itens'])} itens")
                    for item in cupom_dados['itens'][:5]:
                        print(f"      • {item['descricao']}: R$ {item['valor_total']:.2f}")
                if cupom_dados.get("totais", {}).get("total"):
                    print(f"   💰 Total: R$ {cupom_dados['totais']['total']:.2f}")

                # Integração com API CookMe
                if self.modo_api:
                    print("🚀 Integrando com API CookMe...", file=sys.stderr)
                    enviar_mensagem_json("status", status="salvando_dados", progress=80)
                else:
                    print("\n" + "="*60)
                    print("🚀 INTEGRANDO COM API COOKME")
                    print("="*60)

                api_client = CookMeAPIClient(
                    base_url="http://localhost:3000/api",
                    email="eduardo@ocdigital.com.br",
                    senha="3221#Edu"
                )

                resultado_api = api_client.salvar_cupom_fiscal(cupom_dados)

                if resultado_api and resultado_api.get('id'):
                    if self.modo_api:
                        # Enviar mensagem de sucesso para o backend
                        enviar_mensagem_json(
                            "compra_criada",
                            compra_id=resultado_api.get('id'),
                            total_produtos=len(cupom_dados.get('itens', [])),
                            valor_total=cupom_dados.get('totais', {}).get('total', 0)
                        )
                        print("✅ Compra criada com sucesso!", file=sys.stderr)
                    else:
                        print("\n" + "🎉"*30)
                        print("🎉 CUPOM SALVO NA API COM SUCESSO!")
                        print("🎉"*30)
                else:
                    if self.modo_api:
                        enviar_mensagem_json("erro", mensagem="Falha ao salvar cupom na API")
                    else:
                        print("\n" + "⚠️"*30)
                        print("⚠️ CUPOM NÃO FOI SALVO NA API (mas JSON foi gerado)")
                        print("⚠️"*30)

                if not self.modo_api:
                    print("\n" + "="*60)
                    print("✅ VOCÊ JÁ PODE FECHAR O NAVEGADOR!")
                    print("="*60)
                    print("\n⏰ Fechando em 10 segundos...")

                    try:
                        for i in range(10, 0, -1):
                            print(f"\r   {i}s...  ", end='', flush=True)
                            time.sleep(1)
                        print("\n")
                    except KeyboardInterrupt:
                        print("\n\n⚠️ Fechando agora...")

                # Validar se extraiu dados corretamente
                if len(cupom_dados.get('itens', [])) > 0 and resultado_api:
                    return cupom_dados
                else:
                    if self.modo_api:
                        if len(cupom_dados.get('itens', [])) == 0:
                            enviar_mensagem_json("erro", mensagem="Nenhum item foi extraído do cupom")
                        print("❌ Falha na extração ou salvamento", file=sys.stderr)
                        sys.exit(1)
                    return None
            else:
                if self.modo_api:
                    print("⚠️ Resposta não contém cupom fiscal", file=sys.stderr)
                    enviar_mensagem_json("erro", mensagem="Página não contém cupom fiscal")
                    sys.exit(1)
                else:
                    print("⚠️ Resposta não contém cupom")
                return None

        except Exception as e:
            if self.modo_api:
                print(f"\n❌ Erro: {e}", file=sys.stderr)
                import traceback
                traceback.print_exc(file=sys.stderr)
                enviar_mensagem_json("erro", mensagem=f"Erro durante processamento: {str(e)}")
                sys.exit(1)
            else:
                print(f"\n❌ Erro: {e}")
                import traceback
                traceback.print_exc()
            return None

        finally:
            if self.driver:
                if self.modo_api:
                    print("🔚 Fechando navegador...", file=sys.stderr)
                else:
                    print("\n🔚 Navegador fechado")
                self.driver.quit()


def main():
    """Função principal"""

    # Parse argumentos de linha de comando
    parser = argparse.ArgumentParser(description='Consulta SAT-SP com QR Code')
    parser.add_argument('--mode', choices=['manual', 'api'], default='manual',
                       help='Modo de execução: manual (interativo) ou api (background)')
    parser.add_argument('--session-id', help='ID da sessão (modo API)')
    parser.add_argument('--qrcode', help='Texto do QR Code (modo API)')

    args = parser.parse_args()

    print("🎯 CONSULTA SAT-SP COM QR CODE")
    print("="*60)

    # Determinar o texto do QR Code
    if args.mode == 'api' and args.qrcode:
        texto_qrcode = args.qrcode
        enviar_mensagem_json("status", status="iniciando", progress=5)
    else:
        # Modo manual - usar exemplo
        texto_qrcode = "35251005088303000121590006146504781051248106|20251031103830|83.09||JewGEhBbHavStPy3r6DIDCK/Cx6i1efHrsYuYYU1UU1zGBlllazKVz+lofV/Vmh1ZX2zYw0ipCCofYyl18MZ+yOvv7/1ncKdF9IaZcKVn2HB6lb6Kkdefj6qooVtKk97ZePd9RiVDp7BG/pVTRyOoW5SyEe0Yc9KKmTRRmNujL/o02fGPuXa564SvxODNJ3UBqfexbvCaYk8jsNpbjZe7DVqlbFLVZxEeqexSdt9veIKnb1KZuMEQqfHWx7e/DqRR9/qRL26+jQGgAaQLBJUhprgaJwAk/AUqujcSPj2jaL9JMjKTauclt+FT8l0FcVUsiEOneNxADuPPP7gdcIGIQ=="

    chave = LeitorQRCodeSAT.extrair_chave_de_texto(texto_qrcode)

    if chave:
        print(f"\n{'='*60}")
        print("✅ SUCESSO!")
        print(f"📋 Chave: {chave}")
        print("="*60)

        if args.mode == 'api':
            # Modo API - executar automaticamente
            enviar_mensagem_json("status", status="consultando_sat", progress=20)
            consultor = ConsultaSATRobusta(modo_api=True)
            consultor.iniciar_navegador()
            consultor.consultar(chave)
        else:
            # Modo manual - perguntar ao usuário
            usar_agora = input("\n🔍 Deseja consultar agora? (s/n): ").strip().lower()

            if usar_agora == 's':
                consultor = ConsultaSATRobusta(modo_api=False)
                consultor.iniciar_navegador()
                consultor.consultar(chave)
            else:
                print("\n✅ Script finalizado")
    else:
        print("\n❌ Falha ao extrair chave")
        if args.mode == 'api':
            enviar_mensagem_json("erro", mensagem="Falha ao extrair chave do QR Code")
            sys.exit(2)


if __name__ == "__main__":
    main()