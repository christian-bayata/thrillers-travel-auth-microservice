import { Role } from 'src/common/interfaces/role.interface';

export class CreateUserDto {
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
  readonly password: string;
  role: Role.RWX_USER;
}
