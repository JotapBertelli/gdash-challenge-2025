import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface WeatherData {
  city: string;
  ts: string | Date;
  temperature: number;
  humidity: number;
  windspeed: number;
  description?: string;
  feels_like?: number;
  pressure?: number;
}

// Análise especializada para diferentes setores
export interface SpecializedAnalysis {
  agriculture: {
    score: number;
    status: string;
    recommendations: string[];
    risks: string[];
  };
  health: {
    respiratoryRisk: string;
    hydrationAlert: boolean;
    uvProtection: string;
    recommendations: string[];
  };
  sports: {
    outdoorScore: number;
    bestActivities: string[];
    avoid: string[];
    bestTimeToday: string;
  };
  energy: {
    acRecommendation: string;
    solarPotential: string;
    energySavingTips: string[];
  };
  // NOVO: Análise específica para energia solar/fotovoltaica
  solar: {
    productionScore: number; // 0-100
    productionLevel: string; // Excelente, Bom, Moderado, Baixo, Nulo
    estimatedEfficiency: number; // % de eficiência estimada
    peakHours: string; // Melhores horários
    currentStatus: string; // Status atual de produção
    irradianceLevel: string; // Nível de irradiação
    recommendations: string[];
    alerts: string[];
    dailyForecast: {
      morning: number;
      afternoon: number;
      total: number;
    };
  };
}

export interface WeatherAnalysis {
  // Pontuação de conforto (0-100)
  comfortScore: number;
  comfortLevel: string;
  comfortEmoji: string;

  // Classificação do dia
  dayClassification: string;
  dayEmoji: string;

  // Tendências
  tempTrend: 'subindo' | 'estável' | 'caindo';
  humidityTrend: 'subindo' | 'estável' | 'caindo';
  trendEmoji: string;

  // Estatísticas
  stats: {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    avgHumidity: number;
    maxHumidity: number;
    minHumidity: number;
    avgWind: number;
    maxWind: number;
    tempVariation: number;
  };

  // Sensação térmica
  feelsLike: number;

  // Índice UV estimado (baseado em hora e condições)
  uvIndex: string;

  // Alertas
  alerts: Array<{
    type: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    icon: string;
  }>;

  // Recomendações
  recommendations: string[];

  // Resumo narrativo
  narrative: string;

  // Análises especializadas
  specialized?: SpecializedAnalysis;

  // Indica se é noite
  isNight?: boolean;
}

@Injectable()
export class AIService {
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'sk-xxxx' && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
      console.log('🤖 OpenAI inicializada com sucesso!');
    } else {
      console.log('⚠️ OpenAI não configurada - usando análise local avançada');
    }
  }

  async generateInsights(weatherData: WeatherData[]): Promise<{
    insights: string;
    analysis: WeatherAnalysis | null;
    specializedInsights?: {
      agriculture: string;
      health: string;
      sports: string;
      energy: string;
    };
    generatedAt: string;
    source: 'openai' | 'local';
    model?: string;
  }> {
    const analysis = this.analyzeWeatherData(weatherData);

    if (this.openai && weatherData.length > 0) {
      try {
        console.log('🚀 Gerando insights com OpenAI...');
        const [mainInsights, specializedInsights] = await Promise.all([
          this.generateOpenAIInsights(weatherData, analysis),
          this.generateSpecializedOpenAIInsights(weatherData, analysis),
        ]);

        return {
          insights: mainInsights,
          analysis,
          specializedInsights,
          generatedAt: new Date().toISOString(),
          source: 'openai',
          model: 'gpt-4o-mini',
        };
      } catch (error: any) {
        console.error('❌ Erro ao gerar insights com OpenAI:', error?.message || error);
        // Fallback para análise local
      }
    }

    return {
      insights: this.generateLocalInsights(weatherData, analysis),
      analysis,
      generatedAt: new Date().toISOString(),
      source: 'local',
    };
  }

  private analyzeWeatherData(data: WeatherData[]): WeatherAnalysis | null {
    if (data.length === 0) return null;

    const latest = data[0];
    const temps = data.map((d) => d.temperature);
    const humidities = data.map((d) => d.humidity);
    const winds = data.map((d) => d.windspeed);

    // Estatísticas básicas
    const stats = {
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      maxHumidity: Math.max(...humidities),
      minHumidity: Math.min(...humidities),
      avgWind: winds.reduce((a, b) => a + b, 0) / winds.length,
      maxWind: Math.max(...winds),
      tempVariation: Math.max(...temps) - Math.min(...temps),
    };

    // Calcular sensação térmica
    const feelsLike = latest.feels_like || this.calculateFeelsLike(latest.temperature, latest.humidity, latest.windspeed);

    // Calcular pontuação de conforto (0-100)
    const { comfortScore, comfortLevel, comfortEmoji } = this.calculateComfortScore(
      latest.temperature,
      latest.humidity,
      latest.windspeed,
    );

    // Detectar tendências
    const tempTrend = this.detectTrend(temps);
    const humidityTrend = this.detectTrend(humidities);
    const trendEmoji = tempTrend === 'subindo' ? '📈' : tempTrend === 'caindo' ? '📉' : '➡️';

    // Verificar se é noite
    const isNight = this.isNightTime(latest.ts);

    // Classificar o dia
    const { dayClassification, dayEmoji } = this.classifyDay(
      latest.temperature,
      latest.humidity,
      latest.windspeed,
      latest.description,
      isNight,
    );

    // Estimar índice UV
    const uvIndex = this.estimateUVIndex(latest.ts, latest.humidity);

    // Gerar alertas
    const alerts = this.generateAlerts(latest, stats);

    // Gerar recomendações
    const recommendations = this.generateRecommendations(latest, stats, comfortScore);

    // Gerar narrativa
    const narrative = this.generateNarrative(latest, stats, tempTrend, data.length);

    // Gerar análises especializadas
    const specialized = this.generateSpecializedAnalysis(latest, stats, comfortScore);

    return {
      comfortScore,
      comfortLevel,
      comfortEmoji,
      dayClassification,
      dayEmoji,
      tempTrend,
      humidityTrend,
      trendEmoji,
      stats,
      feelsLike,
      uvIndex,
      alerts,
      recommendations,
      narrative,
      specialized,
      isNight,
    };
  }

  private isNightTime(timestamp: string | Date): boolean {
    const now = new Date(timestamp);
    const brasiliaOffset = -3 * 60;
    const localTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
    const hour = localTime.getHours();
    return hour < 6 || hour >= 18;
  }

  private generateSpecializedAnalysis(
    latest: WeatherData,
    stats: WeatherAnalysis['stats'],
    comfortScore: number,
  ): SpecializedAnalysis {
    // Análise Agrícola
    const agricultureScore = this.calculateAgricultureScore(latest, stats);
    const agricultureStatus = agricultureScore >= 70 ? 'Excelente' : agricultureScore >= 50 ? 'Bom' : agricultureScore >= 30 ? 'Regular' : 'Desfavorável';
    
    const agricultureRecommendations: string[] = [];
    const agricultureRisks: string[] = [];
    
    if (latest.humidity < 40) {
      agricultureRisks.push('Risco de estresse hídrico nas plantas');
      agricultureRecommendations.push('Aumentar frequência de irrigação');
    }
    if (latest.temperature > 35) {
      agricultureRisks.push('Temperatura excessiva pode causar queimaduras foliares');
      agricultureRecommendations.push('Irrigar nas horas mais frescas');
    }
    if (latest.humidity > 85) {
      agricultureRisks.push('Alta umidade favorece doenças fúngicas');
      agricultureRecommendations.push('Monitorar sinais de fungos nas lavouras');
    }
    if (latest.windspeed > 40) {
      agricultureRisks.push('Ventos fortes podem danificar culturas');
    }
    if (agricultureRisks.length === 0) {
      agricultureRecommendations.push('Condições ideais para manejo agrícola');
    }

    // Análise de Saúde
    const respiratoryRisk = latest.humidity < 30 ? 'Alto' : latest.humidity < 50 ? 'Moderado' : 'Baixo';
    const hydrationAlert = latest.temperature > 28 || latest.humidity < 40;
    const uvProtection = this.estimateUVIndex(latest.ts, latest.humidity).includes('Alto') ? 'Essencial' : 'Recomendado';
    
    const healthRecommendations: string[] = [];
    if (hydrationAlert) healthRecommendations.push('Beba água a cada 30 minutos');
    if (respiratoryRisk === 'Alto') {
      healthRecommendations.push('Use soro fisiológico nas narinas');
      healthRecommendations.push('Mantenha ambientes umidificados');
    }
    if (latest.temperature > 32) {
      healthRecommendations.push('Evite exposição solar entre 10h e 16h');
    }

    // Análise de Esportes
    const outdoorScore = comfortScore;
    const bestActivities: string[] = [];
    const avoidActivities: string[] = [];
    
    if (latest.temperature > 30) {
      avoidActivities.push('Corrida ao ar livre');
      avoidActivities.push('Esportes de alta intensidade');
      bestActivities.push('Natação');
      bestActivities.push('Exercícios em academia climatizada');
    } else if (latest.temperature >= 20 && latest.temperature <= 28) {
      bestActivities.push('Corrida');
      bestActivities.push('Ciclismo');
      bestActivities.push('Futebol');
      bestActivities.push('Caminhada');
    } else if (latest.temperature < 15) {
      bestActivities.push('Corrida leve');
      avoidActivities.push('Esportes aquáticos ao ar livre');
    }
    
    if (latest.humidity > 85) {
      avoidActivities.push('Atividades intensas ao ar livre');
    }

    const isNight = this.isNightTime(latest.ts);
    const bestTimeToday = isNight ? 'Amanhã entre 6h-9h ou 17h-19h' :
      latest.temperature > 28 ? 'Entre 6h-8h ou após 18h' : 'Agora é um bom momento!';

    // Análise de Energia
    const acRecommendation = latest.temperature > 28 ? 'Recomendado' : latest.temperature > 25 ? 'Opcional' : 'Desnecessário';
    const solarPotential = latest.humidity < 60 && !isNight ? 'Alto' : latest.humidity < 80 && !isNight ? 'Moderado' : 'Baixo';
    
    const energySavingTips: string[] = [];
    if (latest.temperature > 30) {
      energySavingTips.push('Configure o ar-condicionado em 23°C');
      energySavingTips.push('Feche cortinas para bloquear o sol');
    }
    if (!isNight && latest.humidity < 70) {
      energySavingTips.push('Aproveite a luz natural');
    }
    if (latest.temperature < 25) {
      energySavingTips.push('Abra janelas para ventilação natural');
    }

    // NOVO: Análise detalhada para energia solar/fotovoltaica
    const solarAnalysis = this.calculateSolarAnalysis(latest, stats, isNight);

    return {
      agriculture: {
        score: agricultureScore,
        status: agricultureStatus,
        recommendations: agricultureRecommendations,
        risks: agricultureRisks,
      },
      health: {
        respiratoryRisk,
        hydrationAlert,
        uvProtection,
        recommendations: healthRecommendations,
      },
      sports: {
        outdoorScore,
        bestActivities,
        avoid: avoidActivities,
        bestTimeToday,
      },
      energy: {
        acRecommendation,
        solarPotential,
        energySavingTips,
      },
      solar: solarAnalysis,
    };
  }

  /**
   * Calcula análise detalhada para produção de energia solar fotovoltaica
   * Relevante para a GDASH que trabalha com energia solar compartilhada
   */
  private calculateSolarAnalysis(
    latest: WeatherData,
    stats: WeatherAnalysis['stats'],
    isNight: boolean,
  ): SpecializedAnalysis['solar'] {
    const now = new Date(latest.ts);
    const brasiliaOffset = -3 * 60;
    const localTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
    const hour = localTime.getHours();

    // Calcular score de produção solar (0-100)
    let productionScore = 0;
    let estimatedEfficiency = 0;
    let irradianceLevel = 'Nulo';
    let currentStatus = 'Sem produção';
    const recommendations: string[] = [];
    const alerts: string[] = [];

    if (isNight) {
      // Noite - sem produção solar
      productionScore = 0;
      estimatedEfficiency = 0;
      irradianceLevel = 'Nulo';
      currentStatus = 'Período noturno - painéis em standby';
      recommendations.push('Momento ideal para manutenção preventiva dos painéis');
      recommendations.push('Verifique conexões e inversores durante o período sem produção');
    } else {
      // Dia - calcular baseado em condições
      
      // Base: hora do dia (pico solar entre 10h-14h)
      if (hour >= 10 && hour <= 14) {
        productionScore = 100;
        irradianceLevel = 'Máximo';
      } else if (hour >= 8 && hour <= 16) {
        productionScore = 80;
        irradianceLevel = 'Alto';
      } else if (hour >= 6 && hour <= 18) {
        productionScore = 50;
        irradianceLevel = 'Moderado';
      } else {
        productionScore = 20;
        irradianceLevel = 'Baixo';
      }

      // Ajuste por umidade (nuvens)
      if (latest.humidity > 90) {
        productionScore *= 0.3; // Muito nublado/chuva
        irradianceLevel = 'Muito Baixo';
        alerts.push('⚠️ Alta nebulosidade reduzindo significativamente a produção');
      } else if (latest.humidity > 80) {
        productionScore *= 0.5;
        irradianceLevel = 'Baixo';
        alerts.push('☁️ Céu encoberto impactando a geração');
      } else if (latest.humidity > 70) {
        productionScore *= 0.7;
        if (irradianceLevel === 'Máximo') irradianceLevel = 'Alto';
      } else if (latest.humidity > 60) {
        productionScore *= 0.85;
      }
      // Umidade baixa = céu limpo = ótimo para solar

      // Ajuste por temperatura (painéis perdem eficiência com calor extremo)
      if (latest.temperature > 40) {
        productionScore *= 0.85;
        alerts.push('🌡️ Temperatura muito alta reduzindo eficiência dos painéis em ~15%');
        recommendations.push('Considere sistema de ventilação para os painéis');
      } else if (latest.temperature > 35) {
        productionScore *= 0.92;
        recommendations.push('Temperatura elevada - eficiência ligeiramente reduzida');
      } else if (latest.temperature >= 20 && latest.temperature <= 30) {
        productionScore *= 1.05; // Temperatura ideal
      }

      // Ajuste por vento (ajuda a resfriar painéis)
      if (latest.windspeed >= 10 && latest.windspeed <= 30 && latest.temperature > 30) {
        productionScore *= 1.03; // Vento moderado ajuda a resfriar
        recommendations.push('Brisa ajudando a manter temperatura ideal dos painéis');
      } else if (latest.windspeed > 50) {
        alerts.push('💨 Ventos fortes - verifique fixação dos painéis');
      }

      // Calcular eficiência estimada
      estimatedEfficiency = Math.min(100, Math.max(0, productionScore));
      productionScore = Math.round(productionScore);

      // Determinar status atual
      if (productionScore >= 80) {
        currentStatus = 'Produção máxima ⚡';
      } else if (productionScore >= 60) {
        currentStatus = 'Boa produção ☀️';
      } else if (productionScore >= 40) {
        currentStatus = 'Produção moderada ⛅';
      } else if (productionScore >= 20) {
        currentStatus = 'Produção baixa ☁️';
      } else {
        currentStatus = 'Produção mínima 🌥️';
      }

      // Recomendações baseadas nas condições
      if (latest.humidity < 50 && hour >= 9 && hour <= 15) {
        recommendations.push('🌟 Condições ideais para máxima geração solar');
      }
      if (productionScore >= 70) {
        recommendations.push('📊 Excelente momento para consumo de energia intensivo');
      }
    }

    // Determinar nível de produção
    let productionLevel: string;
    if (productionScore >= 80) productionLevel = 'Excelente';
    else if (productionScore >= 60) productionLevel = 'Bom';
    else if (productionScore >= 40) productionLevel = 'Moderado';
    else if (productionScore >= 20) productionLevel = 'Baixo';
    else productionLevel = 'Mínimo';

    // Calcular melhores horários
    const peakHours = isNight 
      ? 'Amanhã entre 10h-14h' 
      : hour < 10 
        ? `Hoje entre 10h-14h (em ${10 - hour}h)` 
        : hour <= 14 
          ? 'Agora! Pico de produção' 
          : 'Amanhã entre 10h-14h';

    // Previsão diária simplificada (baseada nas condições atuais)
    const baseProduction = latest.humidity < 70 ? 85 : latest.humidity < 85 ? 60 : 35;
    const dailyForecast = {
      morning: Math.round(baseProduction * 0.7),
      afternoon: Math.round(baseProduction * 1.0),
      total: Math.round(baseProduction * 0.85),
    };

    // Adicionar recomendações padrão se não houver
    if (recommendations.length === 0) {
      recommendations.push('Monitore a produção em tempo real pelo inversor');
    }

    return {
      productionScore: Math.round(productionScore),
      productionLevel,
      estimatedEfficiency: Math.round(estimatedEfficiency),
      peakHours,
      currentStatus,
      irradianceLevel,
      recommendations,
      alerts,
      dailyForecast,
    };
  }

  private calculateAgricultureScore(latest: WeatherData, stats: WeatherAnalysis['stats']): number {
    let score = 100;
    
    // Temperatura ideal: 20-30°C
    if (latest.temperature < 15) score -= (15 - latest.temperature) * 5;
    else if (latest.temperature > 35) score -= (latest.temperature - 35) * 5;
    else if (latest.temperature < 20 || latest.temperature > 30) score -= 10;
    
    // Umidade ideal: 50-75%
    if (latest.humidity < 40) score -= (40 - latest.humidity) * 1;
    else if (latest.humidity > 85) score -= (latest.humidity - 85) * 1.5;
    
    // Vento moderado é bom, forte é ruim
    if (latest.windspeed > 50) score -= (latest.windspeed - 50) * 1;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateFeelsLike(temp: number, humidity: number, wind: number): number {
    // Heat Index para temperaturas altas
    if (temp >= 27 && humidity >= 40) {
      const hi =
        -8.78469475556 +
        1.61139411 * temp +
        2.33854883889 * humidity -
        0.14611605 * temp * humidity -
        0.012308094 * temp * temp -
        0.0164248277778 * humidity * humidity +
        0.002211732 * temp * temp * humidity +
        0.00072546 * temp * humidity * humidity -
        0.000003582 * temp * temp * humidity * humidity;
      return Math.round(hi * 10) / 10;
    }

    // Wind Chill para temperaturas baixas
    if (temp <= 10 && wind > 4.8) {
      const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16) + 0.3965 * temp * Math.pow(wind, 0.16);
      return Math.round(wc * 10) / 10;
    }

    return temp;
  }

  private calculateComfortScore(
    temp: number,
    humidity: number,
    wind: number,
  ): { comfortScore: number; comfortLevel: string; comfortEmoji: string } {
    let score = 100;

    // Penalidade por temperatura (ideal: 20-25°C)
    if (temp < 15) score -= (15 - temp) * 4;
    else if (temp < 20) score -= (20 - temp) * 2;
    else if (temp > 28) score -= (temp - 28) * 3;
    else if (temp > 25) score -= (temp - 25) * 1.5;

    // Penalidade por umidade (ideal: 40-60%)
    if (humidity < 30) score -= (30 - humidity) * 0.5;
    else if (humidity > 70) score -= (humidity - 70) * 0.8;
    else if (humidity > 80) score -= (humidity - 80) * 1.2;

    // Penalidade por vento forte
    if (wind > 30) score -= (wind - 30) * 0.5;
    else if (wind > 50) score -= (wind - 50) * 1;

    // Bônus por brisa leve em dia quente
    if (temp > 25 && wind >= 5 && wind <= 20) score += 5;

    score = Math.max(0, Math.min(100, score));

    let comfortLevel: string;
    let comfortEmoji: string;

    if (score >= 85) {
      comfortLevel = 'Excelente';
      comfortEmoji = '😊';
    } else if (score >= 70) {
      comfortLevel = 'Bom';
      comfortEmoji = '🙂';
    } else if (score >= 55) {
      comfortLevel = 'Moderado';
      comfortEmoji = '😐';
    } else if (score >= 40) {
      comfortLevel = 'Desconfortável';
      comfortEmoji = '😕';
    } else {
      comfortLevel = 'Ruim';
      comfortEmoji = '😫';
    }

    return { comfortScore: Math.round(score), comfortLevel, comfortEmoji };
  }

  private detectTrend(values: number[]): 'subindo' | 'estável' | 'caindo' {
    if (values.length < 3) return 'estável';

    const recent = values.slice(0, Math.min(5, values.length)).reverse();
    const n = recent.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = recent.reduce((a, b) => a + b, 0);
    const sumXY = recent.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = recent.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.5) return 'subindo';
    if (slope < -0.5) return 'caindo';
    return 'estável';
  }

  private classifyDay(
    temp: number,
    humidity: number,
    wind: number,
    description?: string,
    isNight?: boolean,
  ): { dayClassification: string; dayEmoji: string } {
    // Se temos descrição da API, usar ela como base
    if (description) {
      const desc = description.toLowerCase();
      if (desc.includes('thunder') || desc.includes('storm') || desc.includes('trovão') || desc.includes('tempestade')) {
        return { dayClassification: 'Tempestuoso', dayEmoji: '⛈️' };
      }
      if (desc.includes('rain') || desc.includes('chuva') || desc.includes('drizzle') || desc.includes('chuvisco')) {
        return { dayClassification: 'Chuvoso', dayEmoji: '🌧️' };
      }
      if (desc.includes('snow') || desc.includes('neve')) {
        return { dayClassification: 'Nevando', dayEmoji: '🌨️' };
      }
      if (desc.includes('mist') || desc.includes('fog') || desc.includes('névoa') || desc.includes('neblina')) {
        return { dayClassification: 'Nevoeiro', dayEmoji: '🌫️' };
      }
      if (desc.includes('cloud') || desc.includes('nublado') || desc.includes('nuvens')) {
        if (desc.includes('few') || desc.includes('scattered') || desc.includes('parcial')) {
          return { dayClassification: isNight ? 'Noite com Nuvens' : 'Parcialmente Nublado', dayEmoji: isNight ? '☁️' : '⛅' };
        }
        return { dayClassification: 'Nublado', dayEmoji: '☁️' };
      }
      if (desc.includes('clear') || desc.includes('limpo') || desc.includes('céu limpo')) {
        if (isNight) {
          return { dayClassification: 'Noite Clara', dayEmoji: '🌙' };
        }
        return { dayClassification: 'Ensolarado', dayEmoji: '☀️' };
      }
    }

    // Fallback para classificação baseada em dados numéricos
    if (humidity > 85 && temp < 25) {
      return { dayClassification: 'Chuvoso', dayEmoji: '🌧️' };
    }
    if (humidity > 80 && wind > 40) {
      return { dayClassification: 'Tempestuoso', dayEmoji: '⛈️' };
    }
    if (temp > 35) {
      return { dayClassification: 'Muito Quente', dayEmoji: '🔥' };
    }
    if (temp > 28) {
      return { dayClassification: isNight ? 'Noite Quente' : 'Quente', dayEmoji: isNight ? '🌙' : '☀️' };
    }
    if (temp < 12) {
      return { dayClassification: 'Frio', dayEmoji: '❄️' };
    }
    if (temp < 18) {
      return { dayClassification: 'Fresco', dayEmoji: '🌬️' };
    }
    if (humidity > 70) {
      return { dayClassification: 'Nublado', dayEmoji: '☁️' };
    }
    if (wind > 35) {
      return { dayClassification: 'Ventoso', dayEmoji: '💨' };
    }
    if (temp >= 20 && temp <= 28 && humidity >= 40 && humidity <= 70) {
      return { dayClassification: isNight ? 'Noite Agradável' : 'Agradável', dayEmoji: isNight ? '🌙' : '🌤️' };
    }
    if (humidity > 50) {
      return { dayClassification: isNight ? 'Noite com Nuvens' : 'Parcialmente Nublado', dayEmoji: isNight ? '☁️' : '⛅' };
    }

    return { dayClassification: isNight ? 'Noite Clara' : 'Ensolarado', dayEmoji: isNight ? '🌙' : '☀️' };
  }

  private estimateUVIndex(timestamp: string | Date, humidity: number): string {
    const now = new Date(timestamp);
    const brasiliaOffset = -3 * 60;
    const localTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
    const hour = localTime.getHours();

    if (hour < 6 || hour > 18) return 'Nulo (0)';
    if (hour < 9 || hour > 16) return 'Baixo (1-2)';
    if (humidity > 80) return 'Moderado (3-5)';
    if (hour >= 10 && hour <= 14) {
      if (humidity < 50) return 'Extremo (11+)';
      if (humidity < 70) return 'Muito Alto (8-10)';
      return 'Alto (6-7)';
    }
    return 'Alto (6-7)';
  }

  private generateAlerts(
    latest: WeatherData,
    stats: WeatherAnalysis['stats'],
  ): WeatherAnalysis['alerts'] {
    const alerts: WeatherAnalysis['alerts'] = [];

    if (latest.temperature > 38) {
      alerts.push({
        type: 'danger',
        title: 'Calor Extremo',
        message: `Temperatura de ${latest.temperature.toFixed(1)}°C! Risco à saúde. Evite exposição ao sol e mantenha-se hidratado.`,
        icon: '🔥',
      });
    } else if (latest.temperature > 32) {
      alerts.push({
        type: 'warning',
        title: 'Muito Quente',
        message: `Temperatura de ${latest.temperature.toFixed(1)}°C. Beba bastante água e evite atividades intensas ao ar livre.`,
        icon: '☀️',
      });
    } else if (latest.temperature < 5) {
      alerts.push({
        type: 'danger',
        title: 'Frio Intenso',
        message: `Temperatura de ${latest.temperature.toFixed(1)}°C! Vista roupas adequadas e proteja-se.`,
        icon: '🥶',
      });
    } else if (latest.temperature < 12) {
      alerts.push({
        type: 'info',
        title: 'Temperatura Baixa',
        message: `Temperatura de ${latest.temperature.toFixed(1)}°C. Recomenda-se agasalho.`,
        icon: '❄️',
      });
    }

    if (latest.humidity > 90) {
      alerts.push({
        type: 'warning',
        title: 'Umidade Muito Alta',
        message: `Umidade em ${latest.humidity.toFixed(0)}%. Alta probabilidade de chuva.`,
        icon: '🌧️',
      });
    } else if (latest.humidity < 25) {
      alerts.push({
        type: 'warning',
        title: 'Ar Muito Seco',
        message: `Umidade em apenas ${latest.humidity.toFixed(0)}%. Hidrate-se bem!`,
        icon: '🏜️',
      });
    }

    if (latest.windspeed > 60) {
      alerts.push({
        type: 'danger',
        title: 'Vendaval',
        message: `Ventos de ${latest.windspeed.toFixed(1)} km/h! Evite áreas abertas.`,
        icon: '🌪️',
      });
    } else if (latest.windspeed > 40) {
      alerts.push({
        type: 'warning',
        title: 'Ventos Fortes',
        message: `Ventos de ${latest.windspeed.toFixed(1)} km/h. Cuidado ao dirigir.`,
        icon: '💨',
      });
    }

    if (stats.tempVariation > 12) {
      alerts.push({
        type: 'info',
        title: 'Grande Variação Térmica',
        message: `Variação de ${stats.tempVariation.toFixed(1)}°C. Leve agasalho.`,
        icon: '🌡️',
      });
    }

    if (alerts.length === 0 && latest.temperature >= 20 && latest.temperature <= 28 && latest.humidity >= 40 && latest.humidity <= 70) {
      alerts.push({
        type: 'success',
        title: 'Clima Perfeito',
        message: 'Condições ideais para atividades ao ar livre!',
        icon: '✨',
      });
    }

    return alerts;
  }

  private generateRecommendations(
    latest: WeatherData,
    stats: WeatherAnalysis['stats'],
    comfortScore: number,
  ): string[] {
    const recommendations: string[] = [];

    if (latest.temperature > 30) {
      recommendations.push('👕 Vista roupas leves e claras');
      recommendations.push('🧴 Use protetor solar FPS 50+');
      recommendations.push('💧 Beba água a cada 30 minutos');
    } else if (latest.temperature < 18) {
      recommendations.push('🧥 Vista agasalho ou casaco');
    }

    if (latest.humidity < 40) {
      recommendations.push('💧 Hidrate-se constantemente');
      recommendations.push('👃 Use soro fisiológico');
    }

    if (comfortScore >= 70 && latest.windspeed < 30) {
      recommendations.push('🏃 Ótimo para exercícios ao ar livre');
    } else if (latest.temperature > 32) {
      recommendations.push('🏠 Prefira ambientes climatizados');
    }

    if (latest.humidity > 85) {
      recommendations.push('☂️ Leve guarda-chuva');
    }

    if (latest.windspeed > 35) {
      recommendations.push('🚗 Dirija com cuidado');
    }

    return recommendations.slice(0, 5);
  }

  private generateNarrative(
    latest: WeatherData,
    stats: WeatherAnalysis['stats'],
    tempTrend: string,
    totalRecords: number,
  ): string {
    const city = latest.city;
    const now = new Date(latest.ts);
    const brasiliaOffset = -3 * 60;
    const localTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
    const hour = localTime.getHours();

    let narrative = `📍 **${city}** - `;

    if (hour < 12) narrative += 'Bom dia! ';
    else if (hour < 18) narrative += 'Boa tarde! ';
    else narrative += 'Boa noite! ';

    narrative += `Agora temos **${latest.temperature.toFixed(1)}°C** `;

    if (latest.temperature > 30) narrative += 'com calor intenso ';
    else if (latest.temperature > 25) narrative += 'com clima quente ';
    else if (latest.temperature < 15) narrative += 'com clima frio ';
    else narrative += 'com temperatura agradável ';

    narrative += `e umidade de **${latest.humidity.toFixed(0)}%**. `;

    if (latest.windspeed > 30) {
      narrative += `Ventos fortes de **${latest.windspeed.toFixed(1)} km/h**. `;
    } else if (latest.windspeed > 15) {
      narrative += `Brisa de **${latest.windspeed.toFixed(1)} km/h**. `;
    }

    narrative += '\n\n';
    if (tempTrend === 'subindo') {
      narrative += '📈 **Tendência:** Temperatura em **elevação**.';
    } else if (tempTrend === 'caindo') {
      narrative += '📉 **Tendência:** Temperatura em **queda**.';
    } else {
      narrative += '➡️ **Tendência:** Temperatura **estável**.';
    }

    if (totalRecords > 1) {
      narrative += `\n\n📊 **Histórico** (${totalRecords} registros): `;
      narrative += `${stats.minTemp.toFixed(1)}°C - ${stats.maxTemp.toFixed(1)}°C `;
      narrative += `(média: ${stats.avgTemp.toFixed(1)}°C)`;
    }

    return narrative;
  }

  private async generateOpenAIInsights(
    weatherData: WeatherData[],
    analysis: WeatherAnalysis | null,
  ): Promise<string> {
    if (!analysis) return 'Dados insuficientes para análise.';

    const latest = weatherData[0];
    const now = new Date(latest.ts);
    const brasiliaOffset = -3 * 60;
    const localTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
    const hour = localTime.getHours();
    const dayOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][localTime.getDay()];
    const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][localTime.getMonth()];
    
    const cityContext = this.getCityContext(latest.city);
    const seasonContext = this.getSeasonContext(localTime.getMonth());
    
    const prompt = `
Você é o "Mestre do Clima" - um meteorologista renomado, contador de histórias e especialista em bem-estar. Crie uma análise climática RICA, ENVOLVENTE e MEMORÁVEL.

═══════════════════════════════════════════════════════
📍 LOCALIZAÇÃO: ${latest.city}
${cityContext}
═══════════════════════════════════════════════════════

📅 MOMENTO ATUAL
• ${dayOfWeek}, ${localTime.getDate()} de ${month} de ${localTime.getFullYear()}
• Horário: ${hour.toString().padStart(2, '0')}:${localTime.getMinutes().toString().padStart(2, '0')} (Brasília)
• Período: ${hour < 6 ? '🌙 Madrugada' : hour < 12 ? '🌅 Manhã' : hour < 18 ? '☀️ Tarde' : '🌆 Noite'}
• Estação: ${seasonContext}

═══════════════════════════════════════════════════════
🌡️ DADOS METEOROLÓGICOS EM TEMPO REAL
═══════════════════════════════════════════════════════

TEMPERATURA
• Atual: ${latest.temperature.toFixed(1)}°C
• Sensação: ${analysis.feelsLike.toFixed(1)}°C ${analysis.feelsLike > latest.temperature ? '(↑ pela umidade)' : analysis.feelsLike < latest.temperature ? '(↓ pelo vento)' : ''}
• Classificação: ${analysis.dayClassification} ${analysis.dayEmoji}

UMIDADE E VENTO
• Umidade: ${latest.humidity.toFixed(0)}%
• Vento: ${latest.windspeed.toFixed(1)} km/h
${latest.description ? `• Condição: ${latest.description}` : ''}
${latest.pressure ? `• Pressão: ${latest.pressure} hPa` : ''}

ÍNDICES
• Conforto: ${analysis.comfortScore}/100 (${analysis.comfortLevel} ${analysis.comfortEmoji})
• UV Estimado: ${analysis.uvIndex}
• Tendência: ${analysis.tempTrend} ${analysis.trendEmoji}

═══════════════════════════════════════════════════════
📊 HISTÓRICO (${weatherData.length} medições)
═══════════════════════════════════════════════════════
• Mínima: ${analysis.stats.minTemp.toFixed(1)}°C
• Média: ${analysis.stats.avgTemp.toFixed(1)}°C
• Máxima: ${analysis.stats.maxTemp.toFixed(1)}°C
• Amplitude: ${analysis.stats.tempVariation.toFixed(1)}°C
• Umidade média: ${analysis.stats.avgHumidity.toFixed(0)}%

═══════════════════════════════════════════════════════
✨ CRIE UMA ANÁLISE ÉPICA COM AS SEGUINTES SEÇÕES:
═══════════════════════════════════════════════════════

## 🌤️ VISÃO GERAL
Uma abertura IMPACTANTE e POÉTICA sobre o clima atual. Conecte com a identidade da cidade. Use metáforas criativas. Faça o leitor "sentir" o clima através das palavras.

## 🏙️ ${latest.city.toUpperCase()} HOJE
Contextualize o clima para a realidade local. Como isso afeta o dia a dia dos moradores? Relacione com atividades típicas da região. Mencione características únicas da cidade.

## 📈 ANÁLISE TÉCNICA
Explique os dados de forma acessível. O que cada número significa na prática? Compare com médias históricas/esperadas. Detalhe a sensação térmica e por que ela difere da temperatura real.

## 🔮 PRÓXIMAS HORAS
O que esperar baseado nas tendências? Como o clima deve evoluir? Alertas importantes ou mudanças previstas.

## 💡 DICAS DO DIA
• Vestuário ideal (seja específico!)
• Atividades recomendadas x evitar
• Cuidados com saúde
• Dica especial para o período (${hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite'})

## 🎯 MOMENTO PERFEITO
Qual o melhor horário hoje para: exercícios, passeios, trabalho ao ar livre?

## 🌟 CURIOSIDADE
Um fato interessante sobre o clima, a cidade, ou fenômeno meteorológico relevante.

## ✨ MENSAGEM FINAL
Encerramento inspirador e memorável. Conecte emocionalmente com o leitor.

═══════════════════════════════════════════════════════
IMPORTANTE:
• Use emojis estrategicamente (nem demais, nem de menos)
• Linguagem envolvente e acessível
• Seja CRIATIVO e ÚNICO - evite clichês!
• Personalize para ${latest.city}
• Máximo 600 palavras
═══════════════════════════════════════════════════════
    `.trim();

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é o "Mestre do Clima" - um meteorologista brasileiro famoso, carismático e apaixonado por ajudar as pessoas. Suas análises são:

🎯 CARACTERÍSTICAS DO SEU ESTILO:
• RICAS em detalhes contextuais e culturais
• CRIATIVAS com metáforas e narrativas envolventes
• PRÁTICAS com dicas realmente úteis
• PERSONALIZADAS para cada cidade e momento
• EDUCATIVAS mas nunca chatas
• EMOCIONAIS - você se importa com o bem-estar do leitor

🌎 CONHECIMENTO ESPECIAL:
• Profundo conhecimento do interior de São Paulo
• Entende a cultura e economia agrícola da região
• Conhece as particularidades climáticas do noroeste paulista
• Sabe como o clima afeta a vida rural e urbana

💬 TOM DE VOZ:
• Amigável mas profissional
• Entusiasmado mas não exagerado
• Como um amigo especialista
• Sempre positivo, mesmo em condições adversas

NUNCA seja genérico. Cada análise deve parecer feita exclusivamente para aquele momento e lugar.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 1500,
    });

    return response.choices[0]?.message?.content || this.generateLocalInsights(weatherData, analysis);
  }

  private async generateSpecializedOpenAIInsights(
    weatherData: WeatherData[],
    analysis: WeatherAnalysis | null,
  ): Promise<{
    agriculture: string;
    health: string;
    sports: string;
    energy: string;
    solar: string;
  }> {
    if (!analysis || !this.openai) {
      return {
        agriculture: '',
        health: '',
        sports: '',
        energy: '',
        solar: '',
      };
    }

    const latest = weatherData[0];

    const prompt = `
Com base nos dados climáticos de ${latest.city}:
- Temperatura: ${latest.temperature.toFixed(1)}°C (Sensação: ${analysis.feelsLike.toFixed(1)}°C)
- Umidade: ${latest.humidity.toFixed(0)}%
- Vento: ${latest.windspeed.toFixed(1)} km/h

Gere análises CURTAS e PRÁTICAS (máximo 100 palavras cada) para 5 setores:

1. 🌾 AGRICULTURA: Impacto nas lavouras, irrigação, colheita. Foque na cana-de-açúcar (cultura principal de Penápolis) e outras culturas da região.

2. 🏥 SAÚDE: Riscos respiratórios, hidratação, cuidados especiais. Considere idosos, crianças e pessoas com condições crônicas.

3. ⚽ ESPORTES: Melhores atividades, horários ideais, precauções para atletas amadores e profissionais.

4. ⚡ ENERGIA: Uso de ar-condicionado, economia de energia doméstica.

5. ☀️ SOLAR (MUITO IMPORTANTE - A GDASH trabalha com energia fotovoltaica!): Análise detalhada do potencial de geração solar. Inclua:
   - Estimativa de produção baseada nas condições atuais
   - Impacto da nebulosidade/umidade na geração
   - Recomendações para proprietários de usinas fotovoltaicas
   - Dicas de manutenção considerando o clima
   - Previsão de pico de produção para o dia

Responda em formato JSON:
{
  "agriculture": "texto",
  "health": "texto",
  "sports": "texto",
  "energy": "texto",
  "solar": "texto"
}
    `.trim();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor especializado que fornece análises práticas e diretas. Responda APENAS com JSON válido, sem markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || '{}';
      // Remove possíveis marcadores de código markdown
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Erro ao gerar insights especializados:', error);
      return {
        agriculture: '',
        health: '',
        sports: '',
        energy: '',
        solar: '',
      };
    }
  }

  private getCityContext(city: string): string {
    const contexts: Record<string, string> = {
      'Penápolis': `
🏛️ PERFIL DA CIDADE:
• Região: Noroeste Paulista, interior de São Paulo
• Apelido: "Terra da Cana de Açúcar"
• População: ~62.000 habitantes
• Altitude: 416 metros
• Economia: Cana-de-açúcar, etanol, pecuária, agricultura
• Clima: Tropical com verões quentes/úmidos e invernos secos
• Bioma: Transição Mata Atlântica-Cerrado
• Curiosidades:
  - Importante polo sucroalcooleiro da região
  - Sede de usinas de açúcar e etanol
  - Cidade acolhedora com forte tradição rural
  - Economia fortemente ligada ao agronegócio
  - Região com vastos canaviais`,
      
      'São Paulo': `
🏙️ PERFIL DA CIDADE:
• Maior cidade do Brasil e América do Sul
• População: ~12 milhões (região metropolitana: 22 milhões)
• Altitude: 760 metros
• Clima: Subtropical úmido com variações intensas
• Características: "Cidade da garoa", microclimas diversos`,
      
      'Campinas': `
🎓 PERFIL DA CIDADE:
• Região: Interior de São Paulo (RMC)
• População: ~1.2 milhão
• Altitude: 680 metros
• Economia: Tecnologia, universidades, indústria
• Clima: Subtropical com amplitude térmica`,
      
      'Ribeirão Preto': `
☕ PERFIL DA CIDADE:
• Região: Nordeste Paulista
• Apelido: "Capital do Agronegócio"
• População: ~720.000
• Economia: Agronegócio, saúde, serviços
• Clima: Tropical, verões muito quentes`,
    };

    return contexts[city] || `
📍 PERFIL DA CIDADE:
• ${city} - Cidade brasileira
• Clima típico da região
• Dados sendo coletados para análises mais detalhadas`;
  }

  private getSeasonContext(month: number): string {
    // Brasil - Hemisfério Sul
    if (month >= 11 || month <= 1) return '☀️ Verão (época mais quente e chuvosa)';
    if (month >= 2 && month <= 4) return '🍂 Outono (temperaturas amenas, menos chuva)';
    if (month >= 5 && month <= 7) return '❄️ Inverno (seco, noites frias)';
    return '🌸 Primavera (aquecendo, chuvas retornando)';
  }

  private generateLocalInsights(
    weatherData: WeatherData[],
    analysis: WeatherAnalysis | null,
  ): string {
    if (!analysis || weatherData.length === 0) {
      return '🌤️ Aguardando dados climáticos para gerar análise...\n\nOs insights serão gerados automaticamente assim que houver registros suficientes.';
    }

    const latest = weatherData[0];
    let insights = '';

    // Cabeçalho
    insights += `${analysis.dayEmoji} **Clima ${analysis.dayClassification}** em ${latest.city}\n\n`;

    // Narrativa principal
    insights += analysis.narrative;

    // Pontuação de conforto
    insights += `\n\n---\n\n🎯 **Índice de Conforto:** ${analysis.comfortScore}/100 ${analysis.comfortEmoji}\n`;
    insights += `*${analysis.comfortLevel}* - `;

    if (analysis.comfortScore >= 70) {
      insights += 'Excelentes condições para atividades ao ar livre!';
    } else if (analysis.comfortScore >= 50) {
      insights += 'Condições aceitáveis, mas tome precauções.';
    } else {
      insights += 'Considere atividades em ambientes fechados.';
    }

    // Sensação térmica se diferente
    if (Math.abs(analysis.feelsLike - latest.temperature) > 2) {
      insights += `\n\n🌡️ **Sensação Térmica:** ${analysis.feelsLike.toFixed(1)}°C`;
      if (analysis.feelsLike > latest.temperature) {
        insights += ' *(mais quente devido à umidade)*';
      } else {
        insights += ' *(mais frio devido ao vento)*';
      }
    }

    // Índice UV
    insights += `\n\n☀️ **Índice UV:** ${analysis.uvIndex}`;

    // Recomendações
    if (analysis.recommendations.length > 0) {
      insights += '\n\n---\n\n📋 **Recomendações:**\n';
      analysis.recommendations.forEach((rec) => {
        insights += `• ${rec}\n`;
      });
    }

    // Análise especializada resumida
    if (analysis.specialized) {
      insights += '\n\n---\n\n🎯 **Análises Especializadas:**\n';
      insights += `• 🌾 Agricultura: ${analysis.specialized.agriculture.status}\n`;
      insights += `• 🏥 Saúde: Risco respiratório ${analysis.specialized.health.respiratoryRisk.toLowerCase()}\n`;
      insights += `• ⚽ Esportes: ${analysis.specialized.sports.bestTimeToday}\n`;
      insights += `• ⚡ Ar-condicionado: ${analysis.specialized.energy.acRecommendation}\n`;
    }

    insights += '\n\n---\n*Análise gerada localmente. Configure a OpenAI para insights avançados com IA.*';

    return insights;
  }
}
