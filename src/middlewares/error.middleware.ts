import { NextFunction, Request, Response } from 'express';
import BaseError from '../exceptions/BaseError';

function errorMiddleware(error: BaseError, req: Request, res: Response, next: NextFunction) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    return res.status(statusCode).json({
        message, statusCode,
    });
}

export default errorMiddleware;