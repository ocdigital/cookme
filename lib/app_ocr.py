from flask import Flask, render_template, request, jsonify
import requests
import re
import json
import base64
import os
import time
from urllib.parse import urljoin
import logging
import pytesseract
from PIL import Image
import io

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class SATServiceOCR:
    def __init__(self):
        self.base_url = "https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        })
    
    def resolver_captcha_com_ocr(self, image_data):
        """
        Resolve CAPTCHA usando Tesseract OCR
        Retorna o texto do CAPTCHA ou None se não conseguir
        """
        try:
            # Converter base64 para imagem
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Pré-processamento da imagem para melhorar OCR
            image = self._preprocess_image(image)
            
            # Configurar Tesseract
            custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            
            # Tentar OCR
            texto_captcha = pytesseract.image_to_string(image, config=custom_config)
            texto_captcha = texto_captcha.strip()
            
            # Limpar resultado
            texto_captcha = re.sub(r'[^A-Z0-9]', '', texto_captcha)
            
            if len(texto_captcha) >= 4:  # CAPTCHAs geralmente têm 4-6 caracteres
                logger.info(f"✅ CAPTCHA resolvido via OCR: {texto_captcha}")
                return texto_captcha
            else:
                logger.warning(f"❌ OCR retornou texto muito curto: '{texto_captcha}'")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erro no OCR: {str(e)}")
            return None
    
    def _preprocess_image(self, image):
        """Pré-processa a imagem para melhorar a precisão do OCR"""
        try:
            # Converter para escala de cinza
            if image.mode != 'L':
                image = image.convert('L')
            
            # Aumentar contraste
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2.0)  # Aumentar contraste
            
            # Aumentar nitidez
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(2.0)
            
            # Redimensionar para melhorar qualidade (opcional)
            # image = image.resize((image.width * 2, image.height * 2), Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            logger.error(f"❌ Erro no pré-processamento: {str(e)}")
            return image
    
    def get_captcha_image(self, modo_auto=False):
        """Obtém a imagem do CAPTCHA e tenta resolver automaticamente"""
        try:
            logger.info("🔍 Acessando página do SAT...")
            response = self.session.get(self.base_url, timeout=15)
            
            if response.status_code != 200:
                return {"error": f"Erro HTTP {response.status_code}"}
            
            html = response.text
            
            # Extrair dados do formulário
            viewstate_match = re.search(r'id="__VIEWSTATE".*?value="([^"]*)"', html)
            captcha_match = re.search(r'<img[^>]*id="[^"]*imgCaptcha[^"]*"[^>]*src="([^"]*)"', html)
            
            if not viewstate_match or not captcha_match:
                return {"error": "Formulário não carregado corretamente"}
            
            # Baixar imagem do CAPTCHA
            captcha_url = captcha_match.group(1)
            if captcha_url.startswith('/'):
                captcha_full_url = f"https://satsp.fazenda.sp.gov.br{captcha_url}"
            else:
                captcha_full_url = urljoin(self.base_url, captcha_url)
            
            logger.info(f"🖼️ Baixando CAPTCHA: {captcha_full_url}")
            captcha_response = self.session.get(captcha_full_url, timeout=15)
            
            if captcha_response.status_code != 200:
                return {"error": "Erro ao baixar CAPTCHA"}
            
            # Converter para base64
            image_base64 = base64.b64encode(captcha_response.content).decode('utf-8')
            
            resultado = {
                "success": True,
                "viewstate": viewstate_match.group(1),
                "captcha_image": f"data:image/jpeg;base64,{image_base64}",
                "session_cookies": dict(self.session.cookies),
                "captcha_auto": None
            }
            
            # Tentar resolver automaticamente se solicitado
            if modo_auto:
                texto_captcha = self.resolver_captcha_com_ocr(image_base64)
                if texto_captcha:
                    resultado["captcha_auto"] = texto_captcha
                    resultado["mensagem"] = f"CAPTCHA resolvido automaticamente: {texto_captcha}"
                else:
                    resultado["mensagem"] = "Não foi possível resolver o CAPTCHA automaticamente"
            
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Erro: {str(e)}")
            return {"error": f"Erro: {str(e)}"}
    
    def consultar_sat(self, chave_acesso, captcha_text, form_data, cookies):
        """Executa a consulta do SAT"""
        try:
            # Restaurar cookies
            self.session.cookies.update(cookies)
            
            logger.info(f"🎯 Consultando: {chave_acesso}")
            
            # Preparar dados
            submit_data = {
                '__VIEWSTATE': form_data['viewstate'],
                'ctl00$ContentPlaceHolder1$txtChaveAcesso': chave_acesso,
                'ctl00$ContentPlaceHolder1$txtCodigo': captcha_text,
                'ctl00$ContentPlaceHolder1$btnConsultar': 'Consultar'
            }
            
            logger.info("🚀 Enviando formulário...")
            response = self.session.post(
                self.base_url,
                data=submit_data,
                headers={'Referer': self.base_url},
                timeout=20
            )
            
            if response.status_code == 200:
                return self._processar_resposta(response.text, chave_acesso)
            else:
                return {"error": f"Erro HTTP {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Erro: {str(e)}"}
    
    def _processar_resposta(self, html, chave_acesso):
        """Processa a resposta"""
        # Verificar erros
        if "Código da Imagem inválido" in html:
            return {
                "status": "error",
                "message": "CAPTCHA incorreto",
                "chave_acesso": chave_acesso
            }
        
        # Verificar sucesso
        if any(marker in html for marker in ["Número do Cupom", "CF-e", "Cupom Fiscal"]):
            dados = self._extrair_dados(html)
            return {
                "status": "success",
                "chave_acesso": chave_acesso,
                "data": dados
            }
        
        return {
            "status": "unknown",
            "chave_acesso": chave_acesso,
            "message": "Não foi possível processar a resposta"
        }
    
    def _extrair_dados(self, html):
        """Extrai dados do cupom"""
        dados = {}
        
        # Extrair informações básicas
        patterns = {
            'numero_cupom': r'N[úu]mero do Cupom[^>]*>([^<]+)',
            'data_emissao': r'Data de Emiss[ãa]o[^>]*>([^<]+)',
            'valor_total': r'Valor Total[^>]*>R\$\s*([\d,\.]+)',
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                dados[key] = match.group(1).strip()
        
        # Extrair itens
        itens = self._extrair_itens(html)
        if itens:
            dados['itens'] = itens
        
        return dados
    
    def _extrair_itens(self, html):
        """Extrai itens do cupom"""
        itens = []
        
        tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL)
        
        for table in tables:
            if any(word in table.lower() for word in ['descrição', 'quantidade', 'valor']):
                rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table, re.DOTALL)
                
                for row in rows:
                    cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
                    
                    if len(cells) >= 3:
                        descricao = re.sub(r'<[^>]+>', '', cells[0]).strip()
                        if descricao and len(descricao) > 2:
                            item = {
                                'descricao': descricao,
                                'quantidade': re.sub(r'<[^>]+>', '', cells[1]).strip(),
                                'valor': re.sub(r'<[^>]+>', '', cells[2]).strip()
                            }
                            itens.append(item)
        
        return itens if itens else None

# Instância do serviço
sat_service = SATServiceOCR()

@app.route('/')
def index():
    return render_template('index_ocr.html')

@app.route('/get-captcha')
def get_captcha():
    """Obtém CAPTCHA com opção de resolução automática"""
    modo_auto = request.args.get('auto', 'false').lower() == 'true'
    result = sat_service.get_captcha_image(modo_auto=modo_auto)
    return jsonify(result)

@app.route('/consultar', methods=['POST'])
def consultar():
    """Executa consulta"""
    data = request.json
    chave_acesso = data.get('chave_acesso', '').strip()
    captcha_text = data.get('captcha_text', '').strip()
    form_data = data.get('form_data', {})
    cookies = data.get('cookies', {})
    
    if not chave_acesso or not captcha_text:
        return jsonify({"error": "Dados incompletos"})
    
    result = sat_service.consultar_sat(chave_acesso, captcha_text, form_data, cookies)
    return jsonify(result)

@app.route('/parse-qrcode', methods=['POST'])
def parse_qrcode():
    """Parse do QR Code"""
    data = request.json
    qrcode_data = data.get('qrcode', '').strip()
    
    partes = qrcode_data.split('|')
    if len(partes) >= 1:
        return jsonify({
            "chave_acesso": partes[0],
            "data_hora": partes[1] if len(partes) > 1 else "",
            "valor_total": partes[2] if len(partes) > 2 else ""
        })
    
    return jsonify({"error": "QR Code inválido"})

if __name__ == '__main__':
    os.makedirs('templates', exist_ok=True)
    print("🚀 Servidor SAT com OCR iniciado!")
    print("📧 Acesse: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)