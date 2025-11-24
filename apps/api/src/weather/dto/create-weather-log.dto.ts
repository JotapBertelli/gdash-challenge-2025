import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class CreateWeatherLogDto {
  @IsString()
  city: string;

  @Type(() => Date)
  @IsDate()
  ts: Date;

  @Type(() => Number)
  @IsNumber()
  temperature: number;

  @Type(() => Number)
  @IsNumber()
  humidity: number;

  @Type(() => Number)
  @IsNumber()
  windspeed: number;
}

