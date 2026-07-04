import { detectarUfDoQr, extrairChaveDoQr, UFS_SUPORTADAS_QR } from './uf-chave.util';

const CHAVE_SP = '35251205088303000121650010000053281900574545';
const CHAVE_GO = '52251205088303000121650010000053281900574545';

describe('uf-chave.util', () => {
  it('extrai chave da URL do QR (parâmetro p=)', () => {
    const url = `https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=${CHAVE_SP}|2|1|1|HASH`;
    expect(extrairChaveDoQr(url)).toBe(CHAVE_SP);
  });

  it('extrai chave do formato pipe (SAT)', () => {
    expect(extrairChaveDoQr(`${CHAVE_SP}|20251209|150.00`)).toBe(CHAVE_SP);
  });

  it('rejeita chave que não tem 44 dígitos numéricos', () => {
    expect(extrairChaveDoQr('12345|20251209')).toBeNull();
    expect(extrairChaveDoQr('texto aleatório')).toBeNull();
  });

  it('detecta SP (35) e GO (52) pela posição 1-2 da chave', () => {
    expect(detectarUfDoQr(`${CHAVE_SP}|x`)).toBe('SP');
    expect(detectarUfDoQr(`${CHAVE_GO}|x`)).toBe('GO');
  });

  it('SP está na allowlist de UFs suportadas; GO não', () => {
    expect(UFS_SUPORTADAS_QR.has('SP')).toBe(true);
    expect(UFS_SUPORTADAS_QR.has('GO')).toBe(false);
  });
});
