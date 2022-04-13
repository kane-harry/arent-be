import { NextFunction, Request } from 'express'

function loggerMiddleware(req: Request, _: Response, next: NextFunction) {
    console.log(`${req.method} ${req.path}`)
    return next()
}

export default loggerMiddleware
