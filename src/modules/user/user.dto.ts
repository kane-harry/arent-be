import { IsOptional, IsString, Length, IsEmail, MinLength, Matches, IsEnum } from 'class-validator'
import IFilterModel from '@interfaces/filter.model.interface'
import { UserStatus } from '@modules/user/user.interface'
import { map } from 'lodash'
import { CodeType } from '@modules/verification_code/code.interface'

export class CreateUserDto {
    @IsString()
    @Length(2, 20)
    public firstName: string

    @IsString()
    @Length(2, 20)
    public lastName: string

    // TODO: check uniq nickname
    @IsOptional()
    @Length(2, 20)
    public chatName: string

    @IsString()
    @IsEmail()
    public email: string

    @MinLength(6)
    @IsString()
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'password too weak' })
    public password: string

    @IsString()
    @Length(4, 4)
    public pin: string

    @IsOptional()
    public phone: string

    @IsOptional()
    public country: string

    @IsOptional()
    public playerId: string
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 18)
    public firstName: string

    @IsOptional()
    @IsString()
    @Length(2, 18)
    public lastName: string

    // TODO: check uniq nickname
    @IsOptional()
    @IsString()
    @Length(2, 8)
    public chatName: string
}

export class AdminUpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 18)
    public firstName: string

    @IsOptional()
    @IsString()
    @Length(2, 18)
    public lastName: string

    @IsOptional()
    @IsString()
    @Length(2, 8)
    public chatName: string

    @IsOptional()
    public phone: string

    @IsString()
    @IsOptional()
    @IsEmail()
    public email: string
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
    public type: string

    @IsString()
    public loginEnabled: string

    @IsString()
    public withdrawEnabled: string

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
    @IsString()
    public role: string
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
