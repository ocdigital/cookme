import { getProductIcon } from './productIcons';

describe('Product Icons Utility', () => {
  describe('getProductIcon', () => {
    it('should return apple icon for maçã', () => {
      expect(getProductIcon('maçã')).toBe('🍎');
    });

    it('should return beer icon for cerveja', () => {
      expect(getProductIcon('cerveja')).toBe('🍺');
    });

    it('should return cookie icon for biscoito', () => {
      expect(getProductIcon('biscoito')).toBe('🍪');
    });

    it('should return bread icon for pão', () => {
      expect(getProductIcon('pão')).toBe('🍞');
    });

    it('should return chicken icon for frango', () => {
      expect(getProductIcon('frango')).toBe('🍗');
    });

    it('should return rice icon for arroz', () => {
      expect(getProductIcon('arroz')).toBe('🍚');
    });

    it('should return milk icon for leite', () => {
      expect(getProductIcon('leite')).toBe('🥛');
    });

    it('should return egg icon for ovo', () => {
      expect(getProductIcon('ovo')).toBe('🥚');
    });

    it('should return carrot icon for cenoura', () => {
      expect(getProductIcon('cenoura')).toBe('🥕');
    });

    it('should return tomato icon for tomate', () => {
      expect(getProductIcon('tomate')).toBe('🍅');
    });

    it('should return cheese icon for queijo', () => {
      expect(getProductIcon('queijo')).toBe('🧀');
    });

    it('should return fish icon for peixe', () => {
      expect(getProductIcon('peixe')).toBe('🐟');
    });

    it('should return default package icon for unknown product', () => {
      expect(getProductIcon('produto desconhecido')).toBe('📦');
    });

    it('should be case insensitive', () => {
      expect(getProductIcon('MAÇÃ')).toBe('🍎');
      expect(getProductIcon('Frango')).toBe('🍗');
      expect(getProductIcon('CERVEJA')).toBe('🍺');
    });

    it('should match partial product names', () => {
      expect(getProductIcon('maçã vermelha')).toBe('🍎');
      expect(getProductIcon('cerveja clara')).toBe('🍺');
      expect(getProductIcon('pão francês')).toBe('🍞');
    });

    it('should handle null or empty product name', () => {
      expect(getProductIcon(null)).toBe('📦');
      expect(getProductIcon('')).toBe('📦');
      expect(getProductIcon(undefined)).toBe('📦');
    });

    it('should match common product types', () => {
      expect(getProductIcon('ALIMENTO')).toBe('📦');
      expect(getProductIcon('Feijão carioca')).toBe('🫘');
      expect(getProductIcon('Chocolate')).toBe('🍫');
    });
  });
});
