import { map } from 'lodash'
import { IsString, IsEnum, IsOptional } from 'class-validator'
import { UserAuthCodeType } from '@config/constants'

const userAuthCodeSupported = [
    UserAuthCodeType.Email, //
    UserAuthCodeType.Phone
]

export class CreateUserAuthCodeDto {
    @IsString()
    @IsEnum(userAuthCodeSupported, {
        message: `codeType must be one of ${map(userAuthCodeSupported, el => el).join(' ')}`
    })
    public type: UserAuthCodeType

    @IsString()
    public owner: string
}

export class VerifyUserAuthCodeDto extends CreateUserAuthCodeDto {
    @IsString()
    public code: string
}
