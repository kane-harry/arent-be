export default {
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            ValidationError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        description: 'The basic error object',
                        properties: {
                            variable_name: {
                                type: 'object',
                                description: 'The name of this key will be the property that failed validation',
                                properties: {
                                    message: {
                                        type: 'string',
                                        description: 'The validation error message.'
                                    }
                                }
                            }
                        }
                    },
                    error_detail: {
                        type: 'object',
                        description: 'Provides more detailed error information',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'The detailed error message',
                                code: {
                                    type: 'integer',
                                    description: 'The unique application error code associated with the error message'
                                }
                            }
                        }
                    }
                }
            },
            CreateCodeDto: {
                type: 'object',
                properties: {
                    code_type: {
                        type: 'string',
                        enum: ['EmailRegistration', 'PhoneRegistration', 'EmailUpdate', 'PhoneUpdate'],
                        description: 'Code type'
                    },
                    owner: {
                        type: 'string',
                        example: 'abc@test.com',
                        description: null
                    },
                    user_key: {
                        type: 'string',
                        additionalProperties: true
                    }
                }
            },
            VerifyCodeDto: {
                type: 'object',
                properties: {
                    code_type: {
                        type: 'string',
                        enum: ['EmailRegistration', 'PhoneRegistration', 'EmailUpdate', 'PhoneUpdate']
                    },
                    owner: {
                        type: 'string',
                        example: 'test-admin@test.com'
                    },
                    user_key: {
                        type: 'string',
                        additionalProperties: true
                    },
                    code: {
                        type: 'number',
                        example: 100562
                    }
                },
                required: ['code_type', 'owner', 'code']
            },
            examples: {
                'Verify Register Email Code': {
                    value: {
                        code_type: 'EmailRegistration',
                        owner: 'test-admin@test.com',
                        code: 120765
                    }
                },
                'Verify Update Email Code': {
                    value: {
                        code_type: 'EmailUpdate',
                        owner: 'test-admin@test.com',
                        code: 120765
                    }
                }
            }
        }
    }
}
