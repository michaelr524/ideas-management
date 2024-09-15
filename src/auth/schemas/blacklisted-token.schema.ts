import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class BlacklistedToken extends Document<Types.ObjectId> {
  @Prop({ required: true, unique: true, type: String })
  token: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export type BlacklistedTokenDocument = BlacklistedToken &
  Document<Types.ObjectId>;

export const BlacklistedTokenSchema =
  SchemaFactory.createForClass(BlacklistedToken);

// https://www.mongodb.com/docs/manual/tutorial/expire-data/#expire-documents-at-a-specific-clock-time

BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
