import { Injectable } from "@nestjs/common";


@Injectable()
export class HelperStringService {
  random(length: number): string { 
  
    const randomString = Math.random().toString(36).substring(2, 2 + length);

    return randomString;
  }
}