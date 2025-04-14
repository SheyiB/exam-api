import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { IFile } from 'src/common/file/interfaces/file.interface';
import { Readable } from 'stream';
import { ENUM_REQUEST_STATUS_CODE_ERROR } from 'src/common/constants';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';

@Injectable()
export class CloudinaryStorageService {
  private cloudinary = cloudinary;
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private readonly maxRetries = 3;
  private readonly timeout = 60000; // 60 seconds timeout

  constructor(
    private readonly configService: ConfigService,
    private readonly helperStringService: HelperStringService
  ) {
    this.cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET')
    });
  }

  async uploadFile(userId: string, file: Express.Multer.File): Promise<string> {
    if (!file || (!file.path && !file.buffer)) {
      this.logger.error('Invalid file object provided for upload');
      throw new BadRequestException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: 'Invalid file object provided'
      });
    }

    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        const randomId = await this.createRandomFileName();
        const uploadOptions = {
          public_id: `${userId}_${randomId}/${file.originalname}`,
          folder: 'user_files',
          timeout: this.timeout,
          resource_type: 'auto' as 'auto' // Auto-detect resource type
        };

        this.logger.log(`Attempting upload for user ${userId}, attempt ${retryCount + 1}`);
        
        const uploadPromise = file.buffer
        ? this.streamUpload(file.buffer, uploadOptions)
        : this.cloudinary.uploader.upload(file.path, uploadOptions);

        const uploadResult = await uploadPromise;
        
        this.logger.log(`Upload successful for user ${userId}`);
       
        return uploadResult.secure_url;
      } catch (err: any) {
        retryCount++;
        
        this.logger.error(`Upload attempt ${retryCount} failed: ${JSON.stringify(err)}`);
        
        // If it's a timeout error and we haven't exhausted retries, try again
        if (
          (err.http_code === 499 || err.error?.http_code === 499 || 
           err.message?.includes('timeout') || err.error?.message?.includes('timeout')) && 
          retryCount < this.maxRetries
        ) {
          this.logger.log(`Retrying upload, attempt ${retryCount + 1} of ${this.maxRetries}`);
          await this.delay(1000 * retryCount); // Exponential backoff
          continue;
        }
        
        // If we've exhausted retries or it's a different error, throw
        throw new InternalServerErrorException({
          statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_UNKNOWN_ERROR,
          message: 'Error uploading file',
          error: err
        });
      }
    }
    
    // This shouldn't be reached, but just in case
    throw new InternalServerErrorException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_UNKNOWN_ERROR,
      message: 'Maximum upload retries exceeded'
    });
  }

  async createRandomFileName(): Promise<string> {
    const filename = this.helperStringService.random(15);
    return filename;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private streamUpload(buffer: Buffer, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = this.cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });

    Readable.from(buffer).pipe(stream);
  });
}

}