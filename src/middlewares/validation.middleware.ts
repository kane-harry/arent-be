import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { RequestHandler } from 'express'
import RequestException from '@exceptions/request.exception'
import { CommonErrors } from '@exceptions/custom.error'
import IErrorModel from '@interfaces/error.model.interface'

function validationMiddleware(type: any, skipMissingProperties = false, position: 'body' | 'params' | 'query' = 'body'): RequestHandler {
    return (req, _, next) => {
        validate(plainToInstance(type, req[position]), { skipMissingProperties }).then((errors: ValidationError[]) => {
            if (errors.length > 0) {
                const validationErrors: any[] = []
                errors.forEach(_error => {
                    const property = _error.property
                    const errorMsg = Object.values(_error.constraints as object)[0]
                    validationErrors.push({ field: property, message: errorMsg })
                })
                //  message = constraints.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
                const error = CommonErrors.request_validation_error as IErrorModel
                error.metaData = validationErrors
                next(new RequestException(error))
            } else {
                next()
            }
        })
    }
}

export default validationMiddleware
