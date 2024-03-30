export class UpdateUserDto {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  userId: string;
  readonly avatar?: string;
}
