import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import moment, { Moment } from 'moment';
import { Role } from 'src/common/interfaces/role.interface';

export type AdminDocument = Admin & Document;

@Schema()
export class Admin {
  @Prop({ type: String, required: false })
  firstName: string;

  @Prop({ type: String, required: false })
  lastName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: false })
  password: string;

  @Prop({ type: String, default: Role.RWX_USER })
  role: Role;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({
    default:
      'https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-black-png-image_3918427.jpg',
  })
  avatar: string;

  @Prop({ default: () => moment().utc().toDate(), type: Date })
  createdAt: Moment;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
