import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropDataInput } from 'src/common/utils/util.interface';
import { User, UserDocument } from './schemas/user.schema';

// import {
//   PasswordReset,
//   PasswordResetDocument,
// } from 'src/schema/password-reset.schema';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User.name) private adminModel: Model<UserDocument>,
    // @InjectModel(PasswordReset.name)
    // private passwordResetModel: Model<PasswordResetDocument>,
  ) {}

  /**
   * @Responsibility: Repo for creating a user
   *
   * @param data
   * @returns {Promise<User>}
   */

  async createUser(data: any): Promise<UserDocument> {
    try {
      return await this.adminModel.create(data);
    } catch (error) {
      throw new Error(error?.messsage);
    }
  }

  /**
   * @Responsibility: Repo to retrieve user detail
   *
   * @param where
   * @returns {Promise<User>}
   */

  async findUser(
    where: PropDataInput,
    attributes?: string,
  ): Promise<UserDocument> {
    return await this.adminModel.findOne(where).lean().select(attributes);
  }
}
