import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type IdeaDocument = HydratedDocument<Idea>;

@Schema()
export class Idea extends Document<string> {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: User;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);

// Add indexes
IdeaSchema.index({ creator: 1, createdAt: -1 });
