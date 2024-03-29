import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { ErrorResponse } from 'src/common/interfaces/error-response.interface';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  private readonly ISE: string = 'Internal Server Error';

  /**
   * @Responsibility: auth service emthod to create a new user
   *
   * @param createUserDto
   * @returns {Promise<any>}
   */

  async createNewUser(createUserDto: CreateUserDto): Promise<any> {
    try {
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
