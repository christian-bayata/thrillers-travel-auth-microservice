import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto/create-user.dto';
import { SubscriberPattern } from '../common/interfaces/subscriber-pattern.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: SubscriberPattern.CREATE_NEW_USER })
  async createNewUser(@Payload() createUserDto: CreateUserDto): Promise<any> {
    return await this.authService.createNewUser(createUserDto);
  }

  @MessagePattern({ cmd: SubscriberPattern.LOGIN })
  async login(@Payload() loginDto: LoginDto): Promise<any> {
    return await this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: SubscriberPattern.ACCOUNT_ACTIVATION })
  async accountActivation(@Payload() id: string): Promise<any> {
    return await this.authService.accountActivation(id);
  }

  @MessagePattern({ cmd: SubscriberPattern.FORGOT_PASSWORD })
  async forgotPassword(@Payload() email: string): Promise<any> {
    return await this.authService.forgotPassword(email);
  }
}
