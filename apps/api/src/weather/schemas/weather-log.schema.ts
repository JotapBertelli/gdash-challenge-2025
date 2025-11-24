import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'weather_logs', timestamps: true })
export class WeatherLog extends Document {
  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  ts: Date;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  windspeed: number;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);

