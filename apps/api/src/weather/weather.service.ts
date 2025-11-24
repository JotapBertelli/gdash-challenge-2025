import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import { CreateWeatherLogDto } from './dto/create-weather-log.dto';
import { WeatherLog } from './schemas/weather-log.schema';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(WeatherLog.name)
    private readonly weatherModel: Model<WeatherLog>,
  ) {}

  async create(payload: CreateWeatherLogDto): Promise<WeatherLog> {
    return this.weatherModel.create(payload);
  }

  async findAll(): Promise<any[]> {
    return this.weatherModel.find().sort({ ts: -1 }).limit(1000).lean();
  }

  async exportCSV(): Promise<string> {
    const logs = await this.findAll();
    const rows = [
      ['Data/Hora', 'Cidade', 'Temperatura (°C)', 'Velocidade do Vento (km/h)', 'Umidade (%)'],
    ];

    logs.forEach((log) => {
      rows.push([
        new Date(log.ts).toLocaleString('pt-BR'),
        log.city,
        log.temperature.toString(),
        log.windspeed.toString(),
        log.humidity.toString(),
      ]);
    });

    return stringify(rows);
  }

  async exportXLSX(): Promise<ExcelJS.Buffer> {
    const logs = await this.findAll();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dados Climáticos');

    worksheet.columns = [
      { header: 'Data/Hora', key: 'ts', width: 20 },
      { header: 'Cidade', key: 'city', width: 20 },
      { header: 'Temperatura (°C)', key: 'temperature', width: 18 },
      { header: 'Velocidade do Vento (km/h)', key: 'windspeed', width: 25 },
      { header: 'Umidade (%)', key: 'humidity', width: 15 },
    ];

    logs.forEach((log) => {
      worksheet.addRow({
        ts: new Date(log.ts).toLocaleString('pt-BR'),
        city: log.city,
        temperature: log.temperature,
        windspeed: log.windspeed,
        humidity: log.humidity,
      });
    });

    return (await workbook.xlsx.writeBuffer()) as ExcelJS.Buffer;
  }
}

