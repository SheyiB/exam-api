import { HttpStatus } from '@nestjs/common';
import { IMessageOptionsProperties } from 'src/common/message/interfaces/message.interface';

export interface IResponseCustomPropertyMetadata {
  statusCode?: number;
  message: string;
  httpsStatus?: HttpStatus;
  messageProperties?: IMessageOptionsProperties;
}

export interface IResponseMetaData {
  customProperty?: IResponseCustomPropertyMetadata;
  [key: string]: any;
}
export interface IResponse {
  _metadata?: IResponseMetaData;
  data?: Record<string, any>;
}
