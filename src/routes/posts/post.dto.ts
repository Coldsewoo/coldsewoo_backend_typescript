import { IsString } from 'class-validator'

export default class CreatePostDto {
  @IsString()
  public username: string

  @IsString()
  public userNickname: string

  @IsString()
  public userAvatar: string
}
