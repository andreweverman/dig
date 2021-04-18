import { IsString } from 'class-validator'

export class ExistingPlaylistDto {
    @IsString()
    public playlistID: string
}

export class NewPlaylistDto {
    @IsString()
    public newPlaylistName: string
}


