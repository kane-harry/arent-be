import { IsOptional, IsString, IsEmail, IsInt, ValidateNested } from 'class-validator';

class CreateUserDto {
    @IsString({ message: 'Firstname is required.' })
    public firstName: string;

    @IsString({ message: 'Lastname is required.' })
    public lastName: string;

    @IsEmail({ message: 'Email address is invalid.' })
    public email: string;

    @IsString()
    public password: string;

    @IsOptional()
    public role: number;
}

export default CreateUserDto;