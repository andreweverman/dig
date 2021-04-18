import { IsString, IsNumber, IsBoolean } from 'class-validator'

export class DigConfig {
    @IsNumber()
    public daysToKeep: number

    @IsNumber()
    public minSongs: number

    @IsBoolean()
    public albumSort: boolean
}
