import { config } from '@config'

import commons from './openapi/commons.json'
import verificationCodeApis from './openapi/apis/v1/verification.code.json'
import userApis from './openapi/apis/v1/user.json'

export const openApiDocuments = {
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
    tags: commons.tags,
    components: commons.components,
    servers: [
        {
            url: `${config.system.applicationApiRootURL}/api/v1`,
            description: ''
        }
    ],
    paths: {
        ...verificationCodeApis,
        ...userApis
    }
}
