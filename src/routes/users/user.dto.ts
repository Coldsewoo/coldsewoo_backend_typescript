import { IsString, Validate, IsNumber } from "class-validator"
import { IsValidRoles, IsValidEmail } from "./user.validation.classes"

class CreateUserDto {
  @IsString()
  public username: string

  @IsString()
  public nickname: string

  @IsString()
  public password: string

  @Validate(IsValidEmail)
  public email: string

  @Validate(IsValidRoles)
  public role: string
}

export default CreateUserDto
