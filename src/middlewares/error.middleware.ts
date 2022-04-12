import { NextFunction, Request, Response } from 'express'
import ApplicationException from '../exceptions/application.exception'

function errorMiddleware(error: ApplicationException, req: Request, res: Response, next: NextFunction) {
    const status = error.status || 500

    const inDevMode = req.app.get('env') === 'local' || req.app.get('env') === 'development'

    const errorDetail = inDevMode
        ? {
            status: error.status,
            code: error.code,
            message: error.message,
            metaData: error.metaData,
            context: error.errorContext,
            stack: error.stack
        }
        : { status: error.status, code: error.code, message: error.message, metaData: error.metaData }
    return res.status(status).json({
        ...errorDetail
    })
}

export default errorMiddleware
