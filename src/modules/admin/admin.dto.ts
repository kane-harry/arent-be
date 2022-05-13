import { IsString, IsEnum } from 'class-validator'
import { UserStatus } from '@modules/user/user.interface'
import { map } from 'lodash'

export class LockUserDto {
    @IsString({ message: 'User key is required.' })
    public userKey: string

    @IsString()
    @IsEnum(UserStatus, {
        message: `userStatus must be one of ${map(UserStatus, el => el).join(' ')}`
    })
    public userStatus: UserStatus
}
