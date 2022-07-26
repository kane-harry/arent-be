export default {
    post: {
        tags: ['Verification Code'],
        summary: 'Verify code',
        description: '',
        operationId: 'verifyCode',
        security: [],
        requestBody: {
            required: true,
            $ref: '#/components/schemas/VerifyCodeDto'
        },
        responses: {
            200: {
                description: 'Succeed',
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
