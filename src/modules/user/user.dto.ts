import { IsEmail, IsNumber, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator'
import { MFAType, UserStatus } from '@config/constants'
import { map } from 'lodash'
import { IUser } from './user.interface'

export class CreateUserDto {
    @IsString()
    @Length(2, 20)
    public first_name: string

    @IsString()
    @Length(2, 20)
    public last_name: string

    // TODO: check uniq nickname
    @IsOptional()
    @Length(2, 20)
    public chat_name: string

    @IsString()
    @IsEmail()
    public email: string

    @MinLength(6)
    @IsString()
    @IsNotEmpty()
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'password too weak' })
    public password: string

    @IsString()
    @Length(4, 4)
    public pin: string

    @IsOptional()
    public phone?: string

    @IsOptional()
    public country?: string

    @IsOptional()
    public player_id?: string
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 20)
    public first_name: string

    @IsOptional()
    @IsString()
    @Length(2, 20)
    public last_name: string

    // TODO: check uniq nickname
    @IsOptional()
    @IsString()
    @Length(2, 20)
    public chat_name: string

    @IsString()
    @IsOptional()
    public bio?: string

    @IsString()
    @IsOptional()
    public twitter?: string

    @IsString()
    @IsOptional()
    public instagram?: string
}

export class AdminUpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 20)
    public first_name: string

    @IsOptional()
    @IsString()
    @Length(2, 20)
    public last_name: string

    @IsOptional()
    @IsString()
    @Length(2, 20)
    public chat_name: string

    @IsOptional()
    public phone: string

    @IsString()
    @IsOptional()
    @IsEmail()
    public email: string

    @IsOptional()
    public bio?: string

    @IsOptional()
    public twitter?: string

    @IsOptional()
    public instagram?: string
}

export class SetupTotpDto {
    @IsString()
    @Length(6, 6)
    public token1: string

    @IsString()
    @Length(6, 6)
    public token2: string
}

export class UpdateSecurityDto {
    @IsString()
    @IsEnum(MFAType, {
        message: `type must be one of ${map(MFAType, el => el).join(' ')}`
    })
    public type: string

    @IsString()
    public login_enabled: string

    @IsString()
    public withdraw_enabled: string

    @IsOptional()
    @IsString()
    public code: string
}

export class SetupCredentialsDto {
    @IsEmail()
    public email: string

    @IsString()
    public code: string

    @IsString()
    public pin: string

    @IsString()
    public password: string
}

export class UpdateUserStatusDto {
    @IsString()
    @IsEnum(UserStatus, {
        message: `userStatus must be one of ${map(UserStatus, el => el).join(' ')}`
    })
    public status: UserStatus
}

export class UpdateUserRoleDto {
    @IsNumber()
    public role: number
}

export class UpdatePhoneDto {
    @IsString()
    public code: string

    @IsString()
    public phone: string
}

export class UpdateEmailDto {
    @IsString()
    public code: string

    @IsString()
    public email: string
}

export class ForgotPasswordDto {
    // owner = email address | phone number
    @IsNotEmpty()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string
}

export class ResetPasswordDto {
    @IsString()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string

    @IsString()
    public code: string

    @IsString()
    public password: string

    @IsString()
    public pin: string
}

export class ForgotPinDto {
    // owner = email address | phone number
    @IsNotEmpty()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string
}

export class ResetPinDto {
    @IsString()
    public owner: string

    // type = email | phone
    @IsNotEmpty()
    public type: string

    @IsString()
    public code: string

    // current password
    @IsString()
    public password: string

    // new pin
    @IsString()
    public pin: string
}

export class AuthorizeDto {
    @IsNotEmpty()
    public type: string

    @IsNotEmpty()
    public owner: string

    @IsNotEmpty()
    public code: string

    @IsOptional()
    public player_id?: string
}

export class EmailVerifyDto {
    @IsString()
    public code: string
}

export class UpdateUserFeaturedDto {
    @IsNotEmpty()
    public featured: boolean
}

export class BulkUpdateUserFeaturedDto {
    @IsNotEmpty()
    public featured: boolean

    @IsNotEmpty()
    public keys: string
}
