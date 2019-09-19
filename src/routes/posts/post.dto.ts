import { IsString, IsUrl } from 'class-validator'

export default class CreatePostDto {
  @IsString()
  public filter: string

  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true
  })
  public imageURL: string

  @IsString()
  public imagepId: string

  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true
  })
  public thumbnail: string
}
