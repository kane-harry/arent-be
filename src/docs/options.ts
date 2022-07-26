import { config } from '@config'

export default {
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
    // components: {
    //     securitySchemes: {
    //         bearerAuth: {
    //             type: 'http',
    //             scheme: 'bearer',
    //             bearerFormat: 'JWT'
    //         }
    //     }
    // },
    // security: [
    //     {
    //         bearerAuth: []
    //     }
    // ],
    servers: [
        {
            url: `http://localhost:${config.port}/api/v1`,
            description: 'Local server'
        },
        {
            url: 'http://lightlink-federation-dev.ap-southeast-1.elasticbeanstalk.com/api/v1',
            description: 'Dev server'
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
    ]
}
