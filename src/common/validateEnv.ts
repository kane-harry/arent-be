import { cleanEnv, port, str, num } from 'envalid'

function validateEnv() {
    cleanEnv(process.env, {
        APPLICATION_NAME: str(),
        MONGO_URL: str(),
        PORT: port(),
        DEFAULT_QUERY_PAGE_SIZE: num()
    })
}

export default validateEnv
