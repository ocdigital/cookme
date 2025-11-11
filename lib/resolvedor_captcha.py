#!/usr/bin/env python3
"""
RESOLVEDOR DE CAPTCHAS - SAT-SP
Fase 1: Focar apenas em baixar e resolver CAPTCHAs
"""

import requests
import re
import base64
import os
import time
from urllib.parse import urljoin
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import io

class ResolvedorCaptchaSAT:
    def __init__(self):
        self.base_url = "https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        })
    
    def baixar_pagina(self):
        """Baixa a página do SAT e extrai informações"""
        print("📄 Baixando página do SAT...")
        try:
            response = self.session.get(self.base_url, timeout=15)
            
            if response.status_code != 200:
                print(f"❌ Erro HTTP: {response.status_code}")
                return None
            
            print(f"✅ Página baixada ({len(response.text)} caracteres)")
            return response.text
            
        except Exception as e:
            print(f"❌ Erro ao baixar página: {e}")
            return None
    
    def encontrar_captcha(self, html):
        """Encontra a URL do CAPTCHA no HTML"""
        print("🔍 Procurando CAPTCHA...")
        
        # Múltiplos padrões para encontrar o CAPTCHA
        padroes = [
            r'<img[^>]*id="[^"]*imgCaptcha[^"]*"[^>]*src="([^"]*)"',
            r'<img[^>]*src="([^"]*)"[^>]*id="[^"]*imgCaptcha[^"]*"',
            r'<img[^>]*src="([^"]*Captcha[^"]*)"',
            r'<img[^>]*src="(/[^"]*\.ashx[^"]*)"',
        ]
        
        for padrao in padroes:
            match = re.search(padrao, html)
            if match:
                captcha_url = match.group(1)
                print(f"✅ CAPTCHA encontrado: {captcha_url}")
                return captcha_url
        
        print("❌ CAPTCHA não encontrado")
        return None
    
    def baixar_imagem_captcha(self, captcha_url):
        """Baixa a imagem do CAPTCHA"""
        try:
            # Construir URL completa
            if captcha_url.startswith('http'):
                url_final = captcha_url
            elif captcha_url.startswith('/'):
                url_final = f"https://satsp.fazenda.sp.gov.br{captcha_url}"
            else:
                url_final = urljoin(self.base_url, captcha_url)
            
            print(f"🖼️ Baixando imagem: {url_final}")
            
            response = self.session.get(url_final, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Imagem baixada ({len(response.content)} bytes)")
                return response.content
            else:
                print(f"❌ Erro HTTP: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Erro ao baixar imagem: {e}")
            return None
    
    def preprocessar_imagem(self, imagem_bytes):
        """Pré-processa a imagem para melhorar o OCR"""
        try:
            # Abrir imagem
            imagem = Image.open(io.BytesIO(imagem_bytes))
            
            print(f"📊 Imagem original: {imagem.size} {imagem.mode}")
            
            # 1. Converter para escala de cinza
            if imagem.mode != 'L':
                imagem = imagem.convert('L')
            
            # 2. Aumentar contraste
            realce_contraste = ImageEnhance.Contrast(imagem)
            imagem = realce_contraste.enhance(3.0)  # Aumenta bastante o contraste
            
            # 3. Aumentar nitidez
            realce_nitidez = ImageEnhance.Sharpness(imagem)
            imagem = realce_nitidez.enhance(2.0)
            
            # 4. Aplicar filtro para reduzir ruído
            imagem = imagem.filter(ImageFilter.MedianFilter(size=3))
            
            # 5. Binarização (converter para preto e branco)
            # imagem = imagem.point(lambda x: 0 if x < 128 else 255, '1')
            
            print("✅ Imagem pré-processada")
            return imagem
            
        except Exception as e:
            print(f"❌ Erro no pré-processamento: {e}")
            # Retorna imagem original em caso de erro
            return Image.open(io.BytesIO(imagem_bytes))
    
    def resolver_com_ocr(self, imagem):
        """Tenta resolver o CAPTCHA usando OCR"""
        try:
            print("🤖 Tentando resolver com OCR...")
            
            # Configurações do Tesseract
            configs = [
                '--psm 8 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                '--psm 7 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                '--psm 13 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            ]
            
            melhor_texto = ""
            melhor_confianca = 0
            
            for config in configs:
                try:
                    # Tentar OCR com configuração atual
                    dados = pytesseract.image_to_data(imagem, config=config, output_type=pytesseract.Output.DICT)
                    
                    # Extrair texto com boa confiança
                    texto_atual = ""
                    confianca_total = 0
                    contagem = 0
                    
                    for i in range(len(dados['text'])):
                        if int(dados['conf'][i]) > 30:  # Confiança mínima
                            texto = dados['text'][i].strip()
                            if texto:
                                texto_atual += texto
                                confianca_total += int(dados['conf'][i])
                                contagem += 1
                    
                    if contagem > 0:
                        confianca_media = confianca_total / contagem
                        if confianca_media > melhor_confianca:
                            melhor_texto = texto_atual
                            melhor_confianca = confianca_media
                            
                except Exception as e:
                    continue
            
            # Limpar resultado
            if melhor_texto:
                texto_limpo = re.sub(r'[^A-Z0-9]', '', melhor_texto.upper())
                if 4 <= len(texto_limpo) <= 8:  # CAPTCHAs geralmente têm 4-8 caracteres
                    print(f"✅ OCR: '{texto_limpo}' (confiança: {melhor_confianca:.1f}%)")
                    return texto_limpo
                else:
                    print(f"⚠️  OCR retornou texto inválido: '{texto_limpo}'")
                    return None
            else:
                print("❌ OCR não conseguiu ler o CAPTCHA")
                return None
                
        except Exception as e:
            print(f"❌ Erro no OCR: {e}")
            return None
    
    def salvar_imagens(self, imagem_original, imagem_processada, texto_tentativa):
        """Salva as imagens para análise"""
        timestamp = int(time.time())
        
        # Salvar imagem original
        if imagem_original:
            with open(f"captcha_original_{timestamp}.jpg", "wb") as f:
                f.write(imagem_original)
            print(f"💾 Original salvo: captcha_original_{timestamp}.jpg")
        
        # Salvar imagem processada
        if imagem_processada:
            imagem_processada.save(f"captcha_processado_{timestamp}.jpg")
            print(f"💾 Processada salva: captcha_processado_{timestamp}.jpg")
        
        # Salvar info
        with open(f"captcha_info_{timestamp}.txt", "w") as f:
            f.write(f"Texto tentativa: {texto_tentativa}\n")
            f.write(f"Timestamp: {timestamp}\n")
    
    def executar_teste(self, tentativas=3):
        """Executa teste completo de resolução de CAPTCHA"""
        print("🚀 INICIANDO TESTE DE CAPTCHA")
        print("=" * 60)
        
        for tentativa in range(tentativas):
            print(f"\n🔄 TENTATIVA {tentativa + 1}/{tentativas}")
            print("-" * 40)
            
            # 1. Baixar página
            html = self.baixar_pagina()
            if not html:
                continue
            
            # 2. Encontrar CAPTCHA
            captcha_url = self.encontrar_captcha(html)
            if not captcha_url:
                continue
            
            # 3. Baixar imagem
            imagem_bytes = self.baixar_imagem_captcha(captcha_url)
            if not imagem_bytes:
                continue
            
            # 4. Pré-processar
            imagem_processada = self.preprocessar_imagem(imagem_bytes)
            
            # 5. Tentar resolver
            texto_captcha = self.resolver_com_ocr(imagem_processada)
            
            # 6. Salvar resultados
            self.salvar_imagens(imagem_bytes, imagem_processada, texto_captcha)
            
            if texto_captcha:
                print(f"🎉 SUCESSO! CAPTCHA resolvido: {texto_captcha}")
                return texto_captcha
            else:
                print("❌ Falha nesta tentativa, aguardando...")
                time.sleep(2)  # Aguardar antes da próxima tentativa
        
        print(f"\n💥 Todas as {tentativas} tentativas falharam")
        return None

def verificar_dependencias():
    """Verifica se todas as dependências estão instaladas"""
    print("🔧 VERIFICANDO DEPENDÊNCIAS")
    print("-" * 30)
    
    dependencias = [
        ('requests', 'requests'),
        ('PIL (Pillow)', 'PIL'),
        ('pytesseract', 'pytesseract'),
    ]
    
    todas_ok = True
    
    for nome, modulo in dependencias:
        try:
            __import__(modulo)
            print(f"✅ {nome}")
        except ImportError:
            print(f"❌ {nome}")
            todas_ok = False
    
    # Verificar Tesseract no sistema
    try:
        pytesseract.get_tesseract_version()
        print("✅ Tesseract OCR (sistema)")
    except:
        print("❌ Tesseract OCR (sistema)")
        todas_ok = False
    
    return todas_ok

def main():
    """Função principal"""
    print("🎯 RESOLVEDOR DE CAPTCHAS - SAT-SP")
    print("=" * 60)
    
    # Verificar dependências
    if not verificar_dependencias():
        print("\n❌ Instale as dependências faltantes:")
        print("   pip install requests pytesseract pillow")
        print("   # E instale Tesseract no sistema:")
        print("   # Ubuntu: sudo apt install tesseract-ocr")
        return
    
    print("\n" + "=" * 60)
    print("🚀 INICIANDO TESTES...")
    print("=" * 60)
    
    # Criar resolvedor
    resolvedor = ResolvedorCaptchaSAT()
    
    # Executar teste
    resultado = resolvedor.executar_teste(tentativas=3)
    
    print("\n" + "=" * 60)
    if resultado:
        print(f"🎉 CAPTCHA RESOLVIDO COM SUCESSO: {resultado}")
        print("💡 Agora podemos integrar com a consulta do SAT!")
    else:
        print("💥 Não foi possível resolver o CAPTCHA")
        print("🔍 Verifique os arquivos salvos para análise:")
        print("   - captcha_original_*.jpg (imagem original)")
        print("   - captcha_processado_*.jpg (imagem processada)")
        print("   - captcha_info_*.txt (informações)")

if __name__ == "__main__":
    main()