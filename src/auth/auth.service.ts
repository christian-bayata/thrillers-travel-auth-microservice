import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { ErrorResponse } from 'src/common/interfaces/error-response.interface';
import { RpcException } from '@nestjs/microservices';
import { AuthRepository } from './auth.repository';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';
import { Role } from 'src/common/interfaces/role.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  private readonly ISE: string = 'Internal Server Error';

  /**
   * @Responsibility: auth service emthod to create a new user
   *
   * @param createUserDto
   * @returns {Promise<any>}
   */

  async createNewUser(createUserDto: CreateUserDto): Promise<any> {
    try {
      let { firstName, lastName, email, password } = createUserDto;
      const userExists = await this.authRepository.findUser({
        email,
      });
      if (userExists) {
        throw new RpcException(
          this.errR({
            message: 'User already exists',
            status: HttpStatus.BAD_REQUEST,
          }),
        );
      }

      /* Hash password before storing it */
      password = password ? hashSync(password, genSaltSync()) : null;

      function userData() {
        return {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password,
          role: Role.RWX_USER, // By default, every user has read, write, execute privileges
        };
      }

      const theUser = await this.authRepository.createUser(userData());

      /* Send an email to the user for eventual verification */
    } catch (error) {
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /*****************************************************************************************************************************
   *
   ****************************************PRIVATE FUNCTIONS/METHODS **********************************
   *
   ******************************************************************************************************************************
   */

  private errR(errorInput: { message: string; status: number }): ErrorResponse {
    return {
      message: errorInput.message,
      status: errorInput.status,
    };
  }
}
