import getCode from './get-code'
import verifyCode from './verify-code'
export default {
    paths: {
        '/verification/code/generate': {
            ...getCode
        },
        '/verification/code/verify': {
            ...verifyCode
        }
    }
}
