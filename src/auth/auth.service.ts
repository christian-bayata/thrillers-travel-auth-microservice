import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { ErrorResponse } from 'src/common/interfaces/error-response.interface';
import { RpcException } from '@nestjs/microservices';
import { AuthRepository } from './auth.repository';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';
import { Role } from 'src/common/interfaces/role.interface';
import { EmailService } from 'src/email/email.service';
import { MailDispatcherDto } from 'src/email/dto/send-mail.dto';
import { accountActivationTemplate } from 'src/email/templates/account-acivation';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
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
      const userExists = await this.authRepository.findUser({
        email: createUserDto?.email,
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
      createUserDto.password = createUserDto?.password
        ? hashSync(createUserDto?.password, genSaltSync())
        : null;

      function userData() {
        return {
          firstName: createUserDto?.firstName,
          lastName: createUserDto?.lastName,
          email: createUserDto?.email,
          password: createUserDto?.password,
          role: Role.RWX_USER, // By default, every user has read, write, execute privileges
        };
      }

      let theUser = await this.authRepository.createUser(userData());

      /* Send an email to the user for eventual verification */
      const activationLink = `${this.configService.get('FRONTEND_BASE_URL')}/activate-account/${theUser?._id}`;
      function emailDispatcherPayload(): MailDispatcherDto {
        return {
          to: `${theUser?.email}`,
          from: `Thrillers <smtp2@hrdek.com>`,
          subject: 'Account Activation',
          text: 'Account Activation',
          html: accountActivationTemplate(theUser?.firstName, activationLink),
        };
      }

      await this.emailService.emailDispatcher(emailDispatcherPayload());

      return {};
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
