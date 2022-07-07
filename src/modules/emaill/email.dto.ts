import { IsOptional, IsString } from 'class-validator'

export class ContextMailDto {
    @IsString()
    public address: string

    @IsOptional()
    @IsString()
    public code?: string | number
}
