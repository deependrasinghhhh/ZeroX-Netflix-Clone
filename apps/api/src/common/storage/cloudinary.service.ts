import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (
      cloudName &&
      cloudName !== 'placeholder' &&
      apiKey &&
      apiKey !== 'placeholder' &&
      apiSecret &&
      apiSecret !== 'placeholder'
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary Service initialized successfully.');
    } else {
      this.logger.warn(
        'Cloudinary configuration keys are missing. Falling back to mocked local profile avatar generator.',
      );
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ secure_url: string }> {
    if (!this.isConfigured) {
      // Mock upload fallback
      const randomSeed = Math.random().toString(36).substring(7);
      const mockUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
      this.logger.log(
        `[MOCKED CLOUDINARY UPLOAD] File name: ${file.originalname}. Returning mock URL: ${mockUrl}`,
      );
      return { secure_url: mockUrl };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'zerox_avatars' },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary file upload failed', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary returned empty response'));
          }
          resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });
  }
}
