import { IsOptional, IsString, Length } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @Length(2, 8)
  public firstName: string

  @IsString()
  @Length(2, 8)
  public lastName: string

  @IsString()
  @Length(2, 8)
  public nickName: string

  @IsString()
  public email: string

  @IsString()
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
