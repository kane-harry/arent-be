import { config } from '@config'

/** DTO interfaces */
import verificationCodeDtos from './openapi/dtos/verification.code'
import userDtos from './openapi/dtos/user'

/** ROUTES */
import verificationCodeRoutes from './openapi/routes/verification.code'
import userRoutes from './openapi/routes/user'

/** RESPONSES */
import responses from './openapi/responses'

export const openApiV1Documents = {
    openapi: '3.0.3',
    info: {
        title: `${config.system.applicationName}`,
        version: `${process.env.npm_package_version || '1.0'}`,
        description: `API documentation for ${config.system.applicationName}`,
        contact: {
            email: 'tech@pellar.com'
        },
        license: {
            name: 'Pellar-Lightlink',
            url: 'https://pellar.io/'
        }
    },
    servers: [
        {
            url: `${config.system.applicationApiRootURL}/api/v1`,
            description: ''
        }
    ],
    tags: [
        {
            name: 'Verification Code',
            description: ''
        },
        {
            name: 'User',
            description: ''
        },
        {
            name: 'Auth',
            description: ''
        }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {},
        requestBodies: {
            ...verificationCodeDtos,
            ...userDtos
        },
        responses: {
            ...responses
        }
    },
    paths: {
        ...verificationCodeRoutes,
        ...userRoutes
    }
}
