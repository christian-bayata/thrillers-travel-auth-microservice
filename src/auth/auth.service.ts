import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, LoginDto } from './dto/create-user.dto';
import { ErrorResponse } from 'src/common/interfaces/error-response.interface';
import { RpcException } from '@nestjs/microservices';
import { AuthRepository } from './auth.repository';
import { hashSync, genSaltSync, compareSync } from 'bcrypt';
import { Role } from 'src/common/interfaces/role.interface';
import { EmailService } from 'src/email/email.service';
import { MailDispatcherDto } from 'src/email/dto/send-mail.dto';
import { accountActivationTemplate } from 'src/email/templates/account-acivation';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { forgotPasswordTemplate } from 'src/email/templates/forgot-password.template';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  private readonly ISE: string = 'Internal Server Error';

  /**
   * @Responsibility: auth service method to create a new user
   *
   * @param createUserDto
   * @returns {Promise<any>}
   */

  async createNewUser(createUserDto: CreateUserDto): Promise<any> {
    let { firstName, lastName, email, password } = createUserDto;
    try {
      const userExists = await this.authRepository.findUser({
        email: email,
      });
      if (userExists) {
        throw new RpcException(
          this.errR({
            message: 'User already exists',
            status: HttpStatus.CONFLICT,
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
          password: password,
          role: Role.RWX_USER,
        };
      }

      let theUser = await this.authRepository.createUser(userData());

      /* Send an email to the user for eventual verification */
      /* Please add yoour own smtp credentials */
      const activationLink = `${this.configService.get('FRONTEND_BASE_URL')}/activate-account/${theUser?._id}`;
      function emailDispatcherPayload(): MailDispatcherDto {
        return {
          to: `${theUser?.email}`,
          from: `Please add your valid SMTP server here`,
          subject: 'Account Activation',
          text: 'Account Activation',
          html: accountActivationTemplate(theUser?.firstName, activationLink),
        };
      }

      await this.emailService.emailDispatcher(emailDispatcherPayload());

      return theUser;
    } catch (error) {
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /**
   * @Responsibility: auth service method to create a new admin user
   *
   * @param createUserDto
   * @returns {Promise<any>}
   */

  async createNewAdminUser(createUserDto: CreateUserDto): Promise<any> {
    let { firstName, lastName, email, password } = createUserDto;
    try {
      const userExists = await this.authRepository.findUser({
        email: email,
      });
      if (userExists) {
        throw new RpcException(
          this.errR({
            message: 'User already exists',
            status: HttpStatus.CONFLICT,
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
          password: password,
          role: Role.ADMIN,
        };
      }

      return await this.authRepository.createUser(userData());
    } catch (error) {
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /**
   * @Responsibility: auth service method to login a user
   *
   * @param loginDto
   * @returns {Promise<any>}
   */

  async login(loginDto: LoginDto): Promise<any> {
    try {
      const { email, password } = loginDto;

      let theUser = await this.authRepository.findUser(
        { email },
        '_id email password role',
      );

      if (!theUser) {
        throw new RpcException(
          this.errR({
            message: 'User not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      }

      /* Check if password is valid */
      const validPassword = compareSync(password, theUser?.password);

      if (!validPassword) {
        throw new RpcException(
          this.errR({
            message: 'Invalid Password',
            status: HttpStatus.BAD_REQUEST,
          }),
        );
      }

      /* Generate jwt token for auth */
      function jwtPayloadForAuth() {
        return {
          user_id: theUser?._id,
          role: theUser?.role,
        };
      }

      return {
        authToken: this.jwtService.sign(jwtPayloadForAuth()),
      };
    } catch (error) {
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /**
   * @Responsibility: auth service method to activae user account
   *
   * @param id
   * @returns {Promise<any>}
   */

  async accountActivation(id: string): Promise<any> {
    try {
      const theUser = await this.authRepository.findUser({ _id: id });
      if (!theUser) {
        return {
          userExists: false,
        };
      } else {
        await this.authRepository.updateUser(
          { _id: theUser?._id },
          { isVerified: true },
        );

        return {
          userExists: true,
        };
      }
    } catch (error) {
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /**
   * @Responsibility: auth service method to send reset link to user
   *
   * @param email
   * @returns {Promise<any>}
   */

  async forgotPassword(email: string): Promise<any> {
    try {
      const theUser = await this.authRepository.findUser({ email });

      if (!theUser) {
        throw new RpcException(
          this.errR({
            message: 'User not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      }

      /* Generate uuid token */
      const token = randomUUID().split('-').join('');

      const findUserPwdToken = await this.authRepository.findResetPwdToken({
        email,
      });

      if (!findUserPwdToken) {
        await this.authRepository.createResetPwdToken({
          email,
          token,
          expiresIn: moment().utc().add(1, 'hour').toDate(),
        });
      } else {
        await this.authRepository.updateResetPwdToken(
          { email },
          { token, expiresIn: moment().utc().add(1, 'hour').toDate() },
        );
      }

      const resetPasswordLink = `${this.configService.get<string>(
        'FRONTEND_BASE_URL',
      )}/auth/reset-password/${token}`;

      function emailDispatcherPayload(): MailDispatcherDto {
        return {
          to: `${theUser?.email}`,
          from: `Please add your valid SMTP server here`,
          subject: 'Password Reset Token',
          text: 'Password Reset Token',
          html: forgotPasswordTemplate(theUser?.firstName, resetPasswordLink),
        };
      }
      /* Send email to user */
      await this.emailService.emailDispatcher(emailDispatcherPayload());

      return { token };
    } catch (error) {
      console.log(error);
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /**
   * @Responsibility: auth service method to reset user password
   *
   * @param resetPasswordDto
   * @returns {Promise<any>}
   */

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    try {
      let { token, password, confirmPassword } = resetPasswordDto;

      const getToken = await this.authRepository.findResetPwdToken({ token });
      if (!getToken) {
        throw new RpcException(
          this.errR({
            message: 'Invalid token',
            status: HttpStatus.BAD_REQUEST,
          }),
        );
      }

      const theUser = await this.authRepository.findUser({
        email: getToken?.email,
      });
      if (!theUser) {
        throw new RpcException(
          this.errR({
            message: 'User not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      }

      if (password !== confirmPassword) {
        throw new RpcException(
          this.errR({
            message: 'Passwords do not match',
            status: HttpStatus.BAD_REQUEST,
          }),
        );
      }

      /* Check if token has expired */
      if (moment.utc().toDate() > getToken?.expiresIn) {
        throw new RpcException(
          this.errR({
            message: 'Token has expired. Please request a new one',
            status: HttpStatus.BAD_REQUEST,
          }),
        );
      }

      /* Update password of user */
      password = hashSync(password, genSaltSync());
      await this.authRepository.updateUser(
        { email: getToken?.email },
        { password },
      );

      await this.authRepository.removeResetPwdToken(getToken?._id);

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

  /**
   * @Responsibility: auth service method to retrieve user profile
   *
   * @param userId
   * @returns {Promise<any>}
   */

  async userProfile(userId: string): Promise<any> {
    try {
      const theUser = await this.authRepository.findUser({ _id: userId });
      if (!theUser) {
        throw new RpcException(
          this.errR({
            message: 'User not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      }

      const { password, ...otherUserData } = theUser;

      return otherUserData;
    } catch (error) {
      throw new RpcException(
        this.errR({
          message: error?.message ? error.message : this.ISE,
          status: error?.error?.status,
        }),
      );
    }
  }

  /**
   * @Responsibility: auth service method to updating a user
   *
   * @param updateUserDto
   * @returns {Promise<any>}
   */

  async updateUser(updateUserDto: UpdateUserDto): Promise<any> {
    try {
      const theUser = await this.authRepository.findUser({
        _id: updateUserDto?.userId,
      });
      if (!theUser) {
        throw new RpcException(
          this.errR({
            message: 'User not found',
            status: HttpStatus.NOT_FOUND,
          }),
        );
      }

      const { userId, ...otherProps } = updateUserDto;

      await this.authRepository.updateUser({ _id: theUser?._id }, otherProps);
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
