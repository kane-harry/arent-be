import {
    cleanEnv, port, str,
} from 'envalid';

function validateEnv() {
    cleanEnv(process.env, {
        JWT_SECRET: str(),
        MONGO_URL: str(),
        PORT: port(),
    });
}

export default validateEnv;
