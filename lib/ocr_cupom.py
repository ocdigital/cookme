#!/usr/bin/env python3
"""
OCR para Cupom Fiscal usando Google Vision API
Extrai itens, valor total e informações do cupom
"""

import base64
import json
import re
import sys
from datetime import datetime
import google.generativeai as genai
from PIL import Image
from io import BytesIO

# Configurar API Gemini
GEMINI_API_KEY = "AIzaSyDGTHfoiLBZR3BvwP_egGd6mNoR_W3kFmo"
genai.configure(api_key=GEMINI_API_KEY)


def decodificar_imagem_base64(image_base64):
    """Converte base64 para imagem PIL"""
    try:
        # Remover header data:image/jpeg;base64, se existir
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        return image
    except Exception as e:
        print(f"Erro ao decodificar imagem: {e}", file=sys.stderr)
        return None


def extrair_texto_cupom(image_base64):
    """Usa Google Gemini Vision para extrair texto do cupom"""
    try:
        image = decodificar_imagem_base64(image_base64)
        if not image:
            return None

        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = """Você é um assistente especializado em ler cupons fiscais e extratos de compras.

Analise esta imagem de cupom fiscal ou nota fiscal e extraia as seguintes informações em formato JSON:

{
    "estabelecimento": {
        "nome": "nome da loja",
        "cnpj": "cnpj se visível",
        "endereco": "endereço se visível"
    },
    "itens": [
        {
            "nome": "nome do produto",
            "quantidade": 1,
            "valor": "valor unitário",
            "valor_total": "quantidade * valor",
            "codigo_barras": "código de barras se visível"
        }
    ],
    "totais": {
        "subtotal": "valor",
        "desconto": "valor se houver",
        "total": "valor total"
    },
    "informacoes_fiscais": {
        "data_hora": "data e hora em ISO format",
        "numero_nfe": "número se visível",
        "chave_acesso": "chave se visível"
    }
}

IMPORTANTE:
- Extraia TODOS os itens que conseguir identificar
- Use "." como separador decimal para valores
- Se um campo não estiver visível, omita-o
- Retorne APENAS o JSON válido, sem texto adicional
- Os nomes dos produtos devem ser os mais precisos possível
- As quantidades devem ser números (ex: 1, 2.5, 3)
"""

        response = model.generate_content([prompt, image])

        if response.text:
            # Limpar resposta de markdown se necessário
            texto = response.text.strip()
            if texto.startswith("```json"):
                texto = texto[7:]
            if texto.startswith("```"):
                texto = texto[3:]
            if texto.endswith("```"):
                texto = texto[:-3]

            return json.loads(texto.strip())

        return None

    except json.JSONDecodeError as e:
        print(f"Erro ao parsear JSON: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Erro ao extrair texto com Gemini: {e}", file=sys.stderr)
        return None


def normalizar_dados_cupom(dados_extraidos):
    """Normaliza e valida os dados extraídos"""
    if not dados_extraidos:
        return None

    # Garantir estrutura mínima
    resultado = {
        "estabelecimento": dados_extraidos.get("estabelecimento", {}),
        "itens": [],
        "totais": dados_extraidos.get("totais", {}),
        "informacoes_fiscais": dados_extraidos.get("informacoes_fiscais", {}),
    }

    # Processar itens
    itens = dados_extraidos.get("itens", [])
    for item in itens:
        try:
            # Converter valores para float
            valor = float(str(item.get("valor", "0")).replace(",", "."))
            quantidade = float(str(item.get("quantidade", "1")).replace(",", "."))

            resultado["itens"].append({
                "nome": item.get("nome", "").strip(),
                "quantidade": quantidade,
                "valor": f"{valor:.2f}",
                "valor_total": f"{valor * quantidade:.2f}",
                "codigo_barras": item.get("codigo_barras", ""),
            })
        except (ValueError, KeyError):
            continue

    # Se não houver itens, retornar None
    if not resultado["itens"]:
        return None

    # Calcular total se não estiver presente
    if not resultado["totais"].get("total"):
        total = sum(float(item["valor_total"]) for item in resultado["itens"])
        resultado["totais"]["total"] = f"{total:.2f}"

    return resultado


def processar_cupom(image_base64):
    """Função principal para processar cupom"""
    print(f"🎯 Iniciando OCR do cupom...", file=sys.stderr)

    # Extrair texto com Gemini Vision
    dados = extrair_texto_cupom(image_base64)

    if not dados:
        print(json.dumps({
            "erro": "Não foi possível extrair dados do cupom",
            "sucesso": False
        }))
        return

    # Normalizar dados
    dados_normalizados = normalizar_dados_cupom(dados)

    if not dados_normalizados:
        print(json.dumps({
            "erro": "Nenhum item foi detectado no cupom",
            "sucesso": False
        }))
        return

    # Adicionar timestamp
    dados_normalizados["data_extracao"] = datetime.now().isoformat()

    # Retornar resultado
    print(json.dumps({
        "sucesso": True,
        **dados_normalizados
    }))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "erro": "Imagem em base64 é obrigatória",
            "sucesso": False
        }))
        sys.exit(1)

    image_base64 = sys.argv[1]
    processar_cupom(image_base64)
