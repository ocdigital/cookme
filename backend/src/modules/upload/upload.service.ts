import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger('UploadService');
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get('R2_BUCKET_NAME') || 'cookme';
    this.publicUrl = config.get('R2_PUBLIC_URL') || '';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get('R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.get('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: config.get('R2_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async uploadImagem(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    pasta: string = 'receitas',
  ): Promise<string> {
    const ext = path.extname(originalName) || this.extDeMime(mimeType);
    const key = `${pasta}/${randomUUID()}${ext}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Cache de 1 ano para imagens
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    const url = `${this.publicUrl}/${key}`;
    this.logger.log(`Upload OK: ${url}`);
    return url;
  }

  async deletarImagem(url: string): Promise<void> {
    try {
      // Extrai a key da URL pública
      const key = url.replace(`${this.publicUrl}/`, '');
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (e) {
      this.logger.warn(`Falha ao deletar imagem: ${url}`);
    }
  }

  private extDeMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
      'image/heif': '.heif',
    };
    return map[mime] || '.jpg';
  }
}
