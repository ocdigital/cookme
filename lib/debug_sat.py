#!/usr/bin/env python3
"""
DEBUG DETALHADO - SAT-SP
Vamos descobrir o que está realmente na página
"""

import requests
import re
import os
from urllib.parse import urljoin

def debug_detalhado():
    print("🔍 DEBUG DETALHADO - SAT-SP")
    print("=" * 60)
    
    url = "https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    
    try:
        print("📄 Fazendo requisição...")
        response = session.get(url, timeout=15)
        print(f"✅ Status: {response.status_code}")
        print(f"📏 Tamanho: {len(response.text)} caracteres")
        
        html = response.text
        
        # Salvar HTML completo
        with open("debug_completo.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("💾 HTML salvo: debug_completo.html")
        
        # Analisar elementos importantes
        print("\n🔍 ANALISANDO ELEMENTOS:")
        print("-" * 40)
        
        # Procurar por imagens
        imagens = re.findall(r'<img[^>]*>', html)
        print(f"📸 Total de imagens encontradas: {len(imagens)}")
        
        for i, img in enumerate(imagens[:10]):  # Mostrar apenas as primeiras 10
            print(f"  {i+1}. {img}")
        
        # Procurar por CAPTCHA específico
        print("\n🎯 PROCURANDO CAPTCHA:")
        print("-" * 30)
        
        termos_captcha = ['captcha', 'Captcha', 'CAPTCHA', 'imgCaptcha', 'ImageVerifier']
        for termo in termos_captcha:
            if termo in html:
                print(f"✅ Termo '{termo}' ENCONTRADO")
                # Encontrar contexto
                index = html.find(termo)
                contexto = html[max(0, index-50):index+100]
                print(f"   Contexto: ...{contexto}...")
            else:
                print(f"❌ Termo '{termo}' NÃO encontrado")
        
        # Procurar por formulários
        print("\n📝 ANALISANDO FORMULÁRIOS:")
        print("-" * 30)
        
        forms = re.findall(r'<form[^>]*>.*?</form>', html, re.DOTALL)
        print(f"📋 Total de formulários: {len(forms)}")
        
        for i, form in enumerate(forms):
            print(f"\n📄 Formulário {i+1}:")
            # Verificar campos importantes
            campos = {
                'VIEWSTATE': '__VIEWSTATE',
                'Chave Acesso': 'txtChaveAcesso', 
                'CAPTCHA': 'txtCodigo',
                'Botão': 'btnConsultar'
            }
            
            for nome, campo in campos.items():
                if campo in form:
                    print(f"  ✅ {nome}: ENCONTRADO")
                else:
                    print(f"  ❌ {nome}: NÃO encontrado")
        
        # Procurar por scripts que possam gerar CAPTCHA
        print("\n📜 ANALISANDO SCRIPTS:")
        print("-" * 25)
        
        scripts = re.findall(r'<script[^>]*>.*?</script>', html, re.DOTALL)
        print(f"📜 Total de scripts: {len(scripts)}")
        
        for i, script in enumerate(scripts[:5]):  # Primeiros 5 scripts
            if 'captcha' in script.lower() or 'img' in script.lower():
                print(f"  🔍 Script {i+1} pode conter CAPTCHA")
                print(f"     Tamanho: {len(script)} caracteres")
        
        # Procurar URLs de imagens
        print("\n🌐 URLS DE IMAGENS:")
        print("-" * 25)
        
        img_urls = re.findall(r'src="([^"]*\.(jpg|jpeg|png|gif|ashx)[^"]*)"', html, re.IGNORECASE)
        print(f"🖼️ Total de URLs de imagem: {len(img_urls)}")
        
        for url, ext in img_urls[:10]:  # Primeiras 10 URLs
            print(f"  📎 {url}")
            
            # Tentar baixar uma imagem de exemplo
            if 'ashx' in url.lower() and len(img_urls) > 0:
                print("  🧪 Esta pode ser uma imagem dinâmica (possível CAPTCHA)")
                try:
                    if url.startswith('/'):
                        full_url = f"https://satsp.fazenda.sp.gov.br{url}"
                    else:
                        full_url = urljoin(url, url)
                    
                    img_response = session.get(full_url, timeout=10)
                    if img_response.status_code == 200:
                        with open("exemplo_imagem.jpg", "wb") as f:
                            f.write(img_response.content)
                        print(f"  💾 Imagem exemplo salva: exemplo_imagem.jpg")
                        break
                except Exception as e:
                    print(f"  ❌ Erro ao baixar: {e}")
        
        print("\n🎯 RESUMO DO DEBUG:")
        print("-" * 25)
        print("📊 Para análise, verifique:")
        print("   - debug_completo.html (HTML completo)")
        print("   - exemplo_imagem.jpg (se encontrou imagem suspeita)")
        print("\n💡 Dica: O CAPTCHA pode ser gerado dinamicamente por JavaScript")
        
    except Exception as e:
        print(f"❌ Erro no debug: {e}")

if __name__ == "__main__":
    debug_detalhado()