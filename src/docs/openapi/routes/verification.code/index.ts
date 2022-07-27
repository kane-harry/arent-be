import generateCode from './code.generate.json'
import verifyCode from './code.verify.json'
export default {
    '/verification/code/generate': {
        post: generateCode
    },
    '/verification/code/verify': {
        post: verifyCode
    }
}
