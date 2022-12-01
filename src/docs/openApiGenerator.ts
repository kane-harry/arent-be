import { config } from '@config'
import data from './apiV1.json'

/**
 * Step 1: Convert postman json to openapi swagger yaml file: https://metamug.com/util/postman-to-swagger/
 * Step 2: Convert yaml to json: https://onlineyamltools.com/convert-yaml-to-json
 * Step 3: Paste json content to apiV1.json
 */
export const openApiV1Documents = {
    ...data,
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
    ]
}
