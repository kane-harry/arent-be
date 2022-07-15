import { IsOptional, IsString } from 'class-validator'

export class EmailContextDto {
    @IsString()
    public address: string

    @IsOptional()
    @IsString()
    public code?: string | number
}
