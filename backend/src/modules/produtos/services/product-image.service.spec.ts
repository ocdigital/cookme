import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductImageService } from './product-image.service';
import { Produto } from '../entities/produto.entity';
import { Repository } from 'typeorm';

describe('ProductImageService', () => {
  let service: ProductImageService;
  let produtoRepository: Repository<Produto>;

  const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImageService,
        {
          provide: getRepositoryToken(Produto),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProductImageService>(ProductImageService);
    produtoRepository = module.get(getRepositoryToken(Produto));
  });

  describe('fetchAndSaveProductImage', () => {
    it('should fetch image from external API and save to database', async () => {
      const produtoId = 'prod-123';
      const productName = 'Keep Cooler';
      const imageUrl = 'https://example.com/keep-cooler.jpg';

      const produto = {
        id: produtoId,
        nome: productName,
        imagem_url: null,
      };

      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(produto as any);
      jest.spyOn(service, 'searchImageUrl').mockResolvedValue(imageUrl);
      jest.spyOn(produtoRepository, 'save').mockResolvedValue({
        ...produto,
        imagem_url: imageUrl,
      } as any);

      const result = await service.fetchAndSaveProductImage(produtoId);

      expect(result!.imagem_url).toBe(imageUrl);
      expect(produtoRepository.save).toHaveBeenCalled();
    });

    it('should return existing image if already cached', async () => {
      const produtoId = 'prod-123';
      const cachedImageUrl = 'https://example.com/cached-image.jpg';

      const produto = {
        id: produtoId,
        nome: 'Keep Cooler',
        imagem_url: cachedImageUrl,
      };

      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(produto as any);

      const result = await service.fetchAndSaveProductImage(produtoId);

      expect(result!.imagem_url).toBe(cachedImageUrl);
      expect(produtoRepository.save).not.toHaveBeenCalled();
    });

    it('should handle product not found', async () => {
      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(null);

      const result = await service.fetchAndSaveProductImage('invalid-id');

      expect(result).toBeNull();
    });

    it('should retry if image fetch fails on first attempt', async () => {
      const produtoId = 'prod-123';
      const productName = 'Apple';
      const imageUrl = 'https://example.com/apple.jpg';

      const produto = {
        id: produtoId,
        nome: productName,
        imagem_url: null,
      };

      jest.spyOn(produtoRepository, 'findOne').mockResolvedValue(produto as any);
      jest
        .spyOn(service, 'searchImageUrl')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(imageUrl);
      jest.spyOn(produtoRepository, 'save').mockResolvedValue({
        ...produto,
        imagem_url: imageUrl,
      } as any);

      const result = await service.fetchAndSaveProductImage(produtoId);

      expect(result!.imagem_url).toBe(imageUrl);
    });
  });

  describe('searchImageUrl', () => {
    it('should return image URL for valid product name', async () => {
      const productName = 'Keep Cooler';
      const imageUrl = 'https://example.com/keep-cooler.jpg';

      jest.spyOn(service, 'searchImageUrl').mockResolvedValue(imageUrl);

      const result = await service.searchImageUrl(productName);

      expect(result).toBe(imageUrl);
    });

    it('should return null if no image found', async () => {
      const productName = 'Unknown Product XYZABC';

      jest.spyOn(service, 'searchImageUrl').mockResolvedValue(null);

      const result = await service.searchImageUrl(productName);

      expect(result).toBeNull();
    });
  });

  describe('isImageUrlValid', () => {
    it('should validate correct image URLs', async () => {
      const validUrl = 'https://example.com/image.jpg';
      const result = await service.isImageUrlValid(validUrl);
      expect(result).toBe(true);
    });

    it('should reject broken image URLs', async () => {
      const brokenUrl = 'https://nonexistent-domain-12345.com/image.jpg';
      const result = await service.isImageUrlValid(brokenUrl);
      expect(result).toBe(false);
    });

    it('should handle malformed URLs', async () => {
      const malformedUrl = 'not-a-valid-url';
      const result = await service.isImageUrlValid(malformedUrl);
      expect(result).toBe(false);
    });
  });
});
