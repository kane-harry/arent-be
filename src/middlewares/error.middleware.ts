import { NextFunction, Request, Response } from 'express'
import ApplicationException from '@exceptions/application.exception'
import ExceptionLogModel from '@modules/exception_logs/exception_log.model'
import crypto from 'crypto'
import { CustomRequest } from './request.middleware'

function errorMiddleware(error: ApplicationException, req: CustomRequest, res: Response, next: NextFunction) {
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

    // create log
    new ExceptionLogModel({
        key: crypto.randomBytes(16).toString('hex'),
        agent: req.agent,
        ipAddress: req?.ip_address,
        exception: {
            ...errorDetail,
            stack: String(errorDetail.stack)?.slice(0, 200)
        }
    }).save()

    return res.status(status).json({
        error: errorDetail
    })
}

export default errorMiddleware
