import { describe, it, expect, vi, beforeEach } from 'vitest';
import { catalogService } from '../catalog-service';
import { apiClient } from '../api-client';

// Mock the apiClient
vi.mock('../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('catalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product Lifecycle', () => {
    it('should call verify endpoint', async () => {
      const productId = 'prod-123';
      await catalogService.verifyProduct(productId);
      expect(apiClient.post).toHaveBeenCalledWith(`/catalog/products/${productId}/verify`, {});
    });

    it('should call publish endpoint', async () => {
      const productId = 'prod-123';
      await catalogService.publishProduct(productId);
      expect(apiClient.post).toHaveBeenCalledWith(`/catalog/products/${productId}/publish`, {});
    });

    it('should call reject endpoint with reason', async () => {
      const productId = 'prod-123';
      const reason = 'Invalid certifications';
      await catalogService.rejectProduct(productId, reason);
      expect(apiClient.post).toHaveBeenCalledWith(`/catalog/products/${productId}/reject`, { reason });
    });

    it('should call archive endpoint', async () => {
      const productId = 'prod-123';
      await catalogService.archiveProduct(productId);
      expect(apiClient.post).toHaveBeenCalledWith(`/catalog/products/${productId}/archive`, {});
    });
  });

  describe('AI Assistance', () => {
    it('should call ai-assist endpoint with requested fields', async () => {
      const productId = 'prod-123';
      const request = { fields_to_generate: ['description', 'tags'] };
      await catalogService.getAiSuggestions(productId, request);
      expect(apiClient.post).toHaveBeenCalledWith(`/catalog/products/${productId}/ai-assist`, request);
    });
  });

  describe('Image Management', () => {
    it('should call upload image endpoint with FormData', async () => {
      const productId = 'prod-123';
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const options = { is_primary: true, alt_text: 'Test Image' };
      
      await catalogService.uploadImage(productId, file, options);
      
      expect(apiClient.post).toHaveBeenCalledWith(
        `/catalog/products/${productId}/images`,
        expect.any(FormData)
      );
    });

    it('should call remove image endpoint', async () => {
      const productId = 'prod-123';
      const imageId = 'img-456';
      await catalogService.removeImage(productId, imageId);
      expect(apiClient.delete).toHaveBeenCalledWith(`/catalog/products/${productId}/images/${imageId}`);
    });
  });
});
