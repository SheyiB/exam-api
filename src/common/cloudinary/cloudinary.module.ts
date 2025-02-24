import { Module } from "@nestjs/common";
import { CloudinaryStorageService } from "./services/cloudinary.storage.service";

@Module({
  providers: [CloudinaryStorageService],
  exports: [CloudinaryStorageService],
})
export class CloudinaryModule {}