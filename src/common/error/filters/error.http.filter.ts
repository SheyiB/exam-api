import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ErrorHttpFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorDetails: any = null;

    // Handle HttpException instances
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();

      // Handle when error response is an object
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const { message: errorMessage, ...details } = errorResponse as Record<
          string,
          any
        >;
        message = Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage || message;
        errorDetails = details;
      } else {
        message = typeof errorResponse === 'string' ? errorResponse : message;
      }

      status = exception.getStatus();
    } else {
      // Handle unexpected errors
      message = exception.message || message;
      errorDetails = exception.stack || null;
    }

    // Log the exception for debugging
    console.error({
      status,
      message,
      errorDetails,
    });

    // Return a formatted error response
    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
