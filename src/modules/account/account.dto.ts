import { IsString, Length } from 'class-validator'

export class CreateAccountDto {
  @IsString({ message: 'Wallet Symbol is required.' })
  @Length(3, 5, { message: 'Symbol must be 3-5 characters' })
  public symbol: string
}
