export default {
    post: {
        summary: 'Get a new verification code',
        tags: ['Get Verification Code'],
        description: 'Request to get a verification code for update email/phone via your email address',
        requestBody: {
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/CreateCodeDto'
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        example: {
                            success: true
                        }
                    }
                }
            },
            422: {
                description: 'The request failed due to a validation error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ValidationError'
                        }
                    }
                }
            },
            500: {
                description: 'Server error'
            }
        }
    }
}
