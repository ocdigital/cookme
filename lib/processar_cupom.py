#!/usr/bin/env python3
"""
PROCESSAR HTML DE CUPOM FISCAL JÁ SALVO
Extrai dados de arquivos HTML salvos anteriormente
"""

import re
import json
from datetime import datetime
import os
import sys


def extrair_dados_cupom(html):
    """Extrai todos os dados do cupom fiscal do HTML"""
    
    cupom = {
        "estabelecimento": {},
        "itens": [],
        "totais": {},
        "informacoes_fiscais": {},
        "data_extracao": datetime.now().isoformat()
    }
    
    print("\n" + "="*60)
    print("📄 EXTRAINDO DADOS DO CUPOM FISCAL")
    print("="*60)
    
    # ===== ESTABELECIMENTO =====
    print("\n🏪 ESTABELECIMENTO:")
    
    # Nome
    match = re.search(r'<b>(.*?(?:SUPERMERCADO|MERCADO|LOJA|LTDA|S/A).*?)</b>', html, re.IGNORECASE)
    if match:
        cupom["estabelecimento"]["nome"] = match.group(1).strip()
        print(f"   Nome: {cupom['estabelecimento']['nome']}")
    
    # Endereço
    match = re.search(r'Endereço:\s*([^\n<]+)', html)
    if match:
        cupom["estabelecimento"]["endereco"] = match.group(1).strip()
        print(f"   Endereço: {cupom['estabelecimento']['endereco']}")
    
    # Bairro
    match = re.search(r'Bairro:\s*([^\n<]+)', html)
    if match:
        cupom["estabelecimento"]["bairro"] = match.group(1).strip()
        print(f"   Bairro: {cupom['estabelecimento']['bairro']}")
    
    # CNPJ
    match = re.search(r'CNPJ:\s*([0-9./-]+)', html)
    if match:
        cupom["estabelecimento"]["cnpj"] = match.group(1).strip()
        print(f"   CNPJ: {cupom['estabelecimento']['cnpj']}")
    
    # IE
    match = re.search(r'I\.E\.:\s*([0-9.]+)', html)
    if match:
        cupom["estabelecimento"]["ie"] = match.group(1).strip()
        print(f"   IE: {cupom['estabelecimento']['ie']}")
    
    # ===== ITENS =====
    print("\n🛒 ITENS:")
    
    # Padrão para itens na tabela
    padrao_item = r'<td[^>]*>\s*(\d+)\s*</td>\s*<td[^>]*>\s*(\d+)\s*</td>\s*<td[^>]*>\s*([^<]+)</td>\s*<td[^>]*>\s*([\d,]+)\s*</td>\s*<td[^>]*>\s*(\w+)\s*</td>\s*<td[^>]*>\s*X\s*</td>\s*<td[^>]*>\s*([\d,]+)\s*</td>\s*<td[^>]*>\s*\([^)]*\)\s*</td>\s*<td[^>]*>\s*([\d,]+)\s*</td>'
    
    itens = re.findall(padrao_item, html)
    
    for item_data in itens:
        item = {
            "numero": int(item_data[0]),
            "codigo": item_data[1],
            "descricao": item_data[2].strip(),
            "quantidade": float(item_data[3].replace(',', '.')),
            "unidade": item_data[4],
            "valor_unitario": float(item_data[5].replace(',', '.')),
            "valor_total": float(item_data[6].replace(',', '.'))
        }
        cupom["itens"].append(item)
        print(f"   {item['numero']}. {item['descricao']:<35} {item['quantidade']:>6.3f} {item['unidade']:<3} R$ {item['valor_total']:>7.2f}")
    
    # ===== TOTAIS =====
    print("\n💰 TOTAIS:")
    
    # Descontos
    match = re.search(r'Total de descontos/.*?item\s*([\d,]+)', html)
    if match:
        cupom["totais"]["descontos"] = float(match.group(1).replace(',', '.'))
        print(f"   Descontos:       R$ {cupom['totais']['descontos']:>8.2f}")
    
    # Total
    match = re.search(r'TOTAL R\$\s*([\d,]+)', html)
    if match:
        cupom["totais"]["total"] = float(match.group(1).replace(',', '.'))
        print(f"   TOTAL:           R$ {cupom['totais']['total']:>8.2f}")
    
    # Cartão de Débito
    match = re.search(r'Cartão de Débito\s*([\d,]+)', html)
    if match:
        cupom["totais"]["cartao_debito"] = float(match.group(1).replace(',', '.'))
        print(f"   Cartão Débito:   R$ {cupom['totais']['cartao_debito']:>8.2f}")
    
    # Troco
    match = re.search(r'Troco R\$[:\s]*([\d,]+)', html)
    if match:
        cupom["totais"]["troco"] = float(match.group(1).replace(',', '.'))
        print(f"   Troco:           R$ {cupom['totais']['troco']:>8.2f}")
    
    # Tributos aproximados
    match = re.search(r'Valor aproximado dos tributos.*?([\d,]+)', html, re.IGNORECASE)
    if match:
        cupom["totais"]["tributos_aproximados"] = float(match.group(1).replace(',', '.'))
        print(f"   Tributos Aprox.: R$ {cupom['totais']['tributos_aproximados']:>8.2f}")
    
    # ===== INFORMAÇÕES FISCAIS =====
    print("\n📋 INFORMAÇÕES FISCAIS:")
    
    # CPF/CNPJ do Consumidor
    match = re.search(r'Razão Social/Nome:\s*([^\n<]+)', html)
    if match:
        cupom["informacoes_fiscais"]["consumidor_nome"] = match.group(1).strip()
        print(f"   Consumidor: {cupom['informacoes_fiscais']['consumidor_nome']}")
    
    # Número do Extrato
    match = re.search(r'Extrato N°\s*:\s*(\d+)', html)
    if match:
        cupom["informacoes_fiscais"]["numero_extrato"] = match.group(1)
        print(f"   Extrato Nº: {cupom['informacoes_fiscais']['numero_extrato']}")
    
    # Tipo de documento
    match = re.search(r'(CUPOM FISCAL ELETRÔNICO.*?SAT)', html, re.IGNORECASE)
    if match:
        cupom["informacoes_fiscais"]["tipo_documento"] = match.group(1).strip()
        print(f"   Tipo: {cupom['informacoes_fiscais']['tipo_documento']}")
    
    # SAT
    match = re.search(r'SAT N°\s*:\s*([\d-]+)', html)
    if match:
        cupom["informacoes_fiscais"]["numero_sat"] = match.group(1)
        print(f"   SAT Nº: {cupom['informacoes_fiscais']['numero_sat']}")
    
    # Data e Hora
    match = re.search(r'(\d{2}/\d{2}/\d{4})\s*-\s*(\d{2}:\d{2}:\d{2})', html)
    if match:
        cupom["informacoes_fiscais"]["data"] = match.group(1)
        cupom["informacoes_fiscais"]["hora"] = match.group(2)
        print(f"   Data/Hora: {cupom['informacoes_fiscais']['data']} {cupom['informacoes_fiscais']['hora']}")
    
    # Chave de acesso
    match = re.search(r'(\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4})', html)
    if match:
        cupom["informacoes_fiscais"]["chave_acesso"] = match.group(1).replace(' ', '')
        chave_fmt = cupom["informacoes_fiscais"]["chave_acesso"]
        print(f"   Chave: {chave_fmt[:4]} {chave_fmt[4:8]} {chave_fmt[8:12]} ... {chave_fmt[-4:]}")
    
    return cupom


def processar_arquivo(caminho_html):
    """Processa um arquivo HTML"""
    
    print(f"\n{'='*60}")
    print(f"📂 Processando: {caminho_html}")
    print(f"{'='*60}")
    
    try:
        with open(caminho_html, 'r', encoding='utf-8') as f:
            html = f.read()
        
        # Extrair dados
        cupom = extrair_dados_cupom(html)
        
        # Gerar nome do arquivo JSON
        base_name = os.path.splitext(caminho_html)[0]
        json_file = f"{base_name}_dados.json"
        
        # Salvar JSON
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(cupom, f, ensure_ascii=False, indent=2)
        
        print(f"\n{'='*60}")
        print(f"✅ PROCESSAMENTO CONCLUÍDO")
        print(f"💾 JSON salvo em: {json_file}")
        print(f"{'='*60}")
        
        # Estatísticas
        print(f"\n📊 ESTATÍSTICAS:")
        print(f"   • Itens processados: {len(cupom['itens'])}")
        if cupom['totais'].get('total'):
            print(f"   • Valor total: R$ {cupom['totais']['total']:.2f}")
        if cupom['estabelecimento'].get('nome'):
            print(f"   • Estabelecimento: {cupom['estabelecimento']['nome']}")
        
        return cupom
        
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {caminho_html}")
        return None
    except Exception as e:
        print(f"❌ Erro ao processar: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Função principal"""
    
    print("🎯 PROCESSADOR DE CUPONS FISCAIS SAT-SP")
    print("="*60)
    
    # Verificar argumentos
    if len(sys.argv) > 1:
        # Processar arquivo passado como argumento
        caminho = sys.argv[1]
        processar_arquivo(caminho)
    else:
        # Modo interativo
        print("\n📁 Arquivos HTML disponíveis:")
        arquivos_html = [f for f in os.listdir('.') if f.endswith('.html') and 'sat_resultado' in f]
        
        if not arquivos_html:
            print("   ❌ Nenhum arquivo HTML encontrado")
            print("\n💡 Dica:")
            print("   • Execute primeiro o script de consulta (captcha_manual.py)")
            print("   • Ou use: python processar_cupom.py arquivo.html")
            return
        
        # Listar arquivos
        for i, arquivo in enumerate(arquivos_html, 1):
            tamanho = os.path.getsize(arquivo)
            print(f"   {i}. {arquivo} ({tamanho:,} bytes)")
        
        # Selecionar arquivo
        try:
            escolha = input("\n🔢 Escolha o número do arquivo (ou 0 para todos): ").strip()
            
            if escolha == '0':
                # Processar todos
                print("\n🔄 Processando todos os arquivos...")
                for arquivo in arquivos_html:
                    processar_arquivo(arquivo)
                    print("\n")
            else:
                # Processar um
                idx = int(escolha) - 1
                if 0 <= idx < len(arquivos_html):
                    processar_arquivo(arquivos_html[idx])
                else:
                    print("❌ Número inválido")
        except ValueError:
            print("❌ Entrada inválida")
        except KeyboardInterrupt:
            print("\n\n⚠️ Cancelado pelo usuário")


if __name__ == "__main__":
    main()