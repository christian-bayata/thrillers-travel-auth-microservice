import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SubscriberPattern } from '../common/interfaces/subscriber-pattern.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: SubscriberPattern.CREATE_NEW_USER })
  async createUser(@Payload() createUserDto: CreateUserDto): Promise<any> {
    return await this.authService.createUser(createUserDto);
  }
}
