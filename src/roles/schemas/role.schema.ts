import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema()
export class Role extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Add indexes
RoleSchema.index({ name: 1 }, { unique: true });
