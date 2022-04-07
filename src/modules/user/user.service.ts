
import IUser from './user.interface';
import UserModel from './user.model';

// use static functions 
export default class UserService {

    static createUser = async (userParams: IUser) => {
        const _session = new UserModel({
            ...userParams,
            role: 0
        });
        const savedData = await _session.save();
        return savedData;
    }

    static getUserById = async (id: string) => {
        const user = await UserModel.findById(id);

        return user;

    }
}