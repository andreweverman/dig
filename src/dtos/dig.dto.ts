import { IsString, IsNumber, IsBoolean, IsNotEmpty, IsNumberString,IsIn } from 'class-validator'
import { PlaylistDto } from './playlist.dto'
export class DigConfig extends PlaylistDto {
    @IsNumberString()
    public daysToKeep: number

    @IsNumberString()
    public minSongs: number

    @IsIn(['on','off'])
    public albumSort: string
}
