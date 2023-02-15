import { IsString, IsNotEmpty } from 'class-validator'

export class PlaylistDto {
    @IsString()
    @IsNotEmpty()
    public playlistRadio: string

    @IsString()
    public playlistID: string

    @IsString()
    public newPlaylistName: string
}
