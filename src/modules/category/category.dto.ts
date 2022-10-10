import { IsNotEmpty, IsOptional } from 'class-validator'

export class CategoryDto {
    @IsNotEmpty()
    public name: string

    @IsOptional()
    public description: string
}
