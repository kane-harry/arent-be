import 'dotenv/config';
import App from './app';
import validateEnv from './utils/validateEnv';
import UserController from './modules/user/user.controller';

validateEnv();
const app = new App(
   [
      // new PostController(),
      // new AuthenticationController(),
      new UserController(),
      // new ReportController(),
   ],
);

app.listen();