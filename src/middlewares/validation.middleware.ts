import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import BaseError from '../exceptions/BaseError';

function validationMiddleware<T>(type: any, skipMissingProperties = false): RequestHandler {
    return (req, res, next) => {
        validate(plainToInstance(type, req.body), { skipMissingProperties })
            .then((errors: ValidationError[]) => {
                if (errors.length > 0) {
                    const constraints = errors.map((error: ValidationError) => error.constraints);

                    let message = ''

                    constraints.forEach(ele => {
                        for (const [key, value] of Object.entries(ele as object)) {
                            // console.log(`${key}: ${value}`);
                            message += `${value}|`
                        }
                    })
                    // for (const [key, value] of Object.entries(constraints)) {
                    //     console.log(`${key}: ${value}`);
                    // }
                    //  message = constraints.map((error: ValidationError) => Object.values(error)).join(', ');

                    next(new BaseError(400, message));
                } else {
                    next();
                }
            });
    };
}

export default validationMiddleware;
