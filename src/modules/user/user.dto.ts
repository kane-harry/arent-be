import { IsOptional, IsString, Length, IsEmail, MinLength, Matches } from 'class-validator'
import IFilterModel from '@interfaces/filter.model.interface'

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

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @IsEmail()
    public email: string

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

    // TODO: check phone
    @IsOptional()
    public phone: string

    @IsOptional()
    public country: string

    @IsOptional()
    public playerId: string

    @IsOptional()
    public newEmailCode: string

    @IsOptional()
    public newPhoneCode: string
}

export class UpdateMFADto {
    @IsString()
    public MFAType: string

    @IsString()
    public token: string
}

export interface GetUserListDto extends IFilterModel {
    type: string
    status: string
    terms: string
    datefrom: string
    dateto: string
    sortby: string
    orderby: string
}
