import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import RequestException from '../exceptions/request.exception';
import { CommmonErrors } from '../exceptions/custom.error';
import IErrorModel from '../interfaces/error.model.interface';

function validationMiddleware<T>(type: any, skipMissingProperties = false): RequestHandler {
    return (req, res, next) => {
        validate(plainToInstance(type, req.body), { skipMissingProperties })
            .then((errors: ValidationError[]) => {
                if (errors.length > 0) {
                    let validationErrors: any[] = [];
                    errors.forEach(error => {
                        let property = error.property
                        let errorMsg = Object.values(error.constraints as object)[0]
                        validationErrors.push({ field: property, message: errorMsg })
                    })
                    //  message = constraints.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
                    let error = CommmonErrors.request_validation_error as IErrorModel
                    error.metaData = validationErrors
                    next(new RequestException(error));
                } else {
                    next();
                }
            });
    };
}

export default validationMiddleware;
