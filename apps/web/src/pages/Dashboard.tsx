import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  Moon,
  Snowflake,
  Droplets,
  Wind,
  RefreshCw,
  Users,
  LogOut,
  Bot,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Sunrise,
  Sunset,
  Thermometer,
  FileSpreadsheet,
  FileText,
  Download,
  Clock,
  Loader2,
  Leaf,
  Heart,
  Activity,
  Zap,
  Brain,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import api from '../lib/api';
import { authService } from '../lib/auth';

interface WeatherLog {
  _id: string;
  city: string;
  ts: string;
  temperature: number;
  windspeed: number;
  humidity: number;
}

interface WeatherAnalysis {
  comfortScore: number;
  comfortLevel: string;
  comfortEmoji: string;
  dayClassification: string;
  dayEmoji: string;
  tempTrend: 'subindo' | 'estável' | 'caindo';
  humidityTrend: 'subindo' | 'estável' | 'caindo';
  trendEmoji: string;
  stats: {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    avgHumidity: number;
    avgWind: number;
    tempVariation: number;
  };
  feelsLike: number;
  uvIndex: string;
  alerts: Array<{
    type: 'danger' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    icon: string;
  }>;
  recommendations: string[];
}

interface SpecializedInsights {
  agriculture: string;
  health: string;
  sports: string;
  energy: string;
  solar: string;
}

interface SolarAnalysis {
  productionScore: number;
  productionLevel: string;
  estimatedEfficiency: number;
  peakHours: string;
  currentStatus: string;
  irradianceLevel: string;
  recommendations: string[];
  alerts: string[];
  dailyForecast: {
    morning: number;
    afternoon: number;
    total: number;
  };
}

interface InsightsResponse {
  insights: string;
  analysis: WeatherAnalysis | null;
  specializedInsights?: SpecializedInsights;
  generatedAt: string;
  source: 'openai' | 'local';
  model?: string;
}

// Função para obter ícone do clima
function getWeatherIcon(temp: number, humidity: number, hour: number) {
  const isNight = hour < 6 || hour >= 19;
  
  if (humidity > 80) {
    return <CloudRain className="w-10 h-10 text-blue-400" />;
  }
  if (humidity > 60 && temp < 25) {
    return isNight ? <Cloud className="w-10 h-10 text-gray-400" /> : <CloudSun className="w-10 h-10 text-yellow-400" />;
  }
  if (temp > 30) {
    return isNight ? <Moon className="w-10 h-10 text-yellow-200" /> : <Sun className="w-10 h-10 text-yellow-400" />;
  }
  if (temp > 20) {
    return isNight ? <Moon className="w-10 h-10 text-yellow-200" /> : <Sun className="w-10 h-10 text-yellow-400" />;
  }
  if (temp < 15) {
    return isNight ? <Snowflake className="w-10 h-10 text-blue-300" /> : <Cloud className="w-10 h-10 text-gray-400" />;
  }
  return isNight ? <Moon className="w-10 h-10 text-yellow-200" /> : <Sun className="w-10 h-10 text-yellow-400" />;
}

// Componente de ícone SVG do sol animado
function AnimatedSunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Raios */}
      <g style={{ transformOrigin: '50px 50px', animation: 'spin 20s linear infinite' }}>
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="10"
            x2="50"
            y2="20"
            stroke="#FCD34D"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </g>
      {/* Sol */}
      <circle cx="50" cy="50" r="22" fill="#FBBF24" />
      <circle cx="50" cy="50" r="18" fill="#FCD34D" />
    </svg>
  );
}

// Ícone de nuvem animada
function AnimatedCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <g style={{ animation: 'float 3s ease-in-out infinite' }}>
        <ellipse cx="50" cy="55" rx="30" ry="18" fill="#9CA3AF" />
        <circle cx="35" cy="50" r="16" fill="#9CA3AF" />
        <circle cx="55" cy="45" r="20" fill="#9CA3AF" />
        <circle cx="70" cy="52" r="14" fill="#9CA3AF" />
        {/* Destaques */}
        <ellipse cx="50" cy="52" rx="25" ry="12" fill="#D1D5DB" />
      </g>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </svg>
  );
}

// Ícone de chuva animada
function AnimatedRainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Nuvem */}
      <g>
        <ellipse cx="50" cy="35" rx="25" ry="15" fill="#6B7280" />
        <circle cx="35" cy="32" r="13" fill="#6B7280" />
        <circle cx="55" cy="28" r="16" fill="#6B7280" />
        <circle cx="68" cy="33" r="11" fill="#6B7280" />
      </g>
      {/* Gotas de chuva animadas */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={30 + i * 10}
          y1="55"
          x2={28 + i * 10}
          y2="70"
          stroke="#60A5FA"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            animation: `rain 0.8s ease-in infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes rain {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

// Ícone de tempestade animada
function AnimatedStormIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Nuvem escura */}
      <g>
        <ellipse cx="50" cy="30" rx="28" ry="16" fill="#374151" />
        <circle cx="32" cy="27" r="14" fill="#374151" />
        <circle cx="55" cy="22" r="18" fill="#374151" />
        <circle cx="72" cy="28" r="12" fill="#374151" />
      </g>
      {/* Raio */}
      <polygon
        points="50,40 42,55 48,55 40,75 58,50 50,50 58,40"
        fill="#FBBF24"
        style={{ animation: 'flash 1.5s ease-in-out infinite' }}
      />
      {/* Gotas */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={25 + i * 25}
          y1="50"
          x2={23 + i * 25}
          y2="62"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            animation: `rain 0.6s ease-in infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
}

// Ícone de sol com nuvem (parcialmente nublado/agradável)
function AnimatedPartlyCloudyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Sol atrás */}
      <g style={{ transformOrigin: '70px 30px', animation: 'spin 25s linear infinite' }}>
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="70"
            y1="10"
            x2="70"
            y2="18"
            stroke="#FCD34D"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${i * 45} 70 30)`}
          />
        ))}
      </g>
      <circle cx="70" cy="30" r="15" fill="#FBBF24" />
      {/* Nuvem na frente */}
      <g style={{ animation: 'float 4s ease-in-out infinite' }}>
        <ellipse cx="45" cy="60" rx="28" ry="16" fill="#E5E7EB" />
        <circle cx="28" cy="55" r="14" fill="#E5E7EB" />
        <circle cx="50" cy="50" r="18" fill="#E5E7EB" />
        <circle cx="68" cy="57" r="12" fill="#E5E7EB" />
      </g>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </svg>
  );
}

// Ícone de frio/neve
function AnimatedColdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Floco de neve central */}
      <g style={{ transformOrigin: '50px 50px', animation: 'spin 10s linear infinite' }}>
        {[0, 60, 120].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="20" x2="50" y2="80" stroke="#93C5FD" strokeWidth="4" />
            <line x1="50" y1="25" x2="40" y2="35" stroke="#93C5FD" strokeWidth="3" />
            <line x1="50" y1="25" x2="60" y2="35" stroke="#93C5FD" strokeWidth="3" />
            <line x1="50" y1="75" x2="40" y2="65" stroke="#93C5FD" strokeWidth="3" />
            <line x1="50" y1="75" x2="60" y2="65" stroke="#93C5FD" strokeWidth="3" />
          </g>
        ))}
      </g>
      <circle cx="50" cy="50" r="8" fill="#DBEAFE" />
    </svg>
  );
}

// Ícone de vento
function AnimatedWindIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <g>
        <path
          d="M15 35 Q40 35 55 35 Q70 35 70 25 Q70 15 55 15"
          stroke="#9CA3AF"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          style={{ animation: 'wind1 2s ease-in-out infinite' }}
        />
        <path
          d="M10 50 Q45 50 65 50 Q85 50 85 60 Q85 70 65 70"
          stroke="#D1D5DB"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          style={{ animation: 'wind2 2.5s ease-in-out infinite' }}
        />
        <path
          d="M20 65 Q40 65 50 65 Q65 65 65 75 Q65 85 50 85"
          stroke="#E5E7EB"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          style={{ animation: 'wind3 1.8s ease-in-out infinite' }}
        />
      </g>
      <style>{`
        @keyframes wind1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes wind2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes wind3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </svg>
  );
}

// Ícone de calor extremo
function AnimatedHotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Sol intenso */}
      <g style={{ transformOrigin: '50px 45px', animation: 'spin 15s linear infinite' }}>
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="5"
            x2="50"
            y2="18"
            stroke="#F97316"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 50 45)`}
          />
        ))}
      </g>
      <circle cx="50" cy="45" r="22" fill="#EF4444" />
      <circle cx="50" cy="45" r="16" fill="#F97316" />
      {/* Ondas de calor */}
      <path
        d="M30 80 Q35 75 40 80 Q45 85 50 80 Q55 75 60 80 Q65 85 70 80"
        stroke="#FCA5A5"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        style={{ animation: 'heat 1.5s ease-in-out infinite' }}
      />
      <style>{`
        @keyframes heat {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

// Ícone de lua animada (noite limpa)
function AnimatedMoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Estrelas */}
      {[
        { x: 15, y: 20, size: 2, delay: 0 },
        { x: 25, y: 35, size: 1.5, delay: 0.3 },
        { x: 80, y: 25, size: 2, delay: 0.5 },
        { x: 75, y: 45, size: 1.5, delay: 0.2 },
        { x: 20, y: 70, size: 1.5, delay: 0.7 },
        { x: 85, y: 65, size: 2, delay: 0.4 },
      ].map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="#FEF3C7"
          style={{
            animation: `twinkle 2s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      {/* Lua crescente */}
      <g style={{ animation: 'float 4s ease-in-out infinite' }}>
        <circle cx="50" cy="50" r="25" fill="#FEF3C7" />
        <circle cx="60" cy="45" r="20" fill="#1F2937" />
      </g>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </svg>
  );
}

// Ícone de lua com nuvem (noite parcialmente nublada/agradável)
function AnimatedMoonCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Estrelas */}
      {[
        { x: 15, y: 15, size: 1.5, delay: 0 },
        { x: 85, y: 20, size: 1.5, delay: 0.3 },
        { x: 10, y: 40, size: 1, delay: 0.5 },
      ].map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="#FEF3C7"
          style={{
            animation: `twinkle 2s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      {/* Lua atrás */}
      <g>
        <circle cx="70" cy="30" r="18" fill="#FEF3C7" />
        <circle cx="78" cy="26" r="14" fill="#1F2937" />
      </g>
      {/* Nuvem na frente */}
      <g style={{ animation: 'float 4s ease-in-out infinite' }}>
        <ellipse cx="45" cy="65" rx="28" ry="16" fill="#E5E7EB" />
        <circle cx="28" cy="60" r="14" fill="#E5E7EB" />
        <circle cx="50" cy="55" r="18" fill="#E5E7EB" />
        <circle cx="68" cy="62" r="12" fill="#E5E7EB" />
      </g>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </svg>
  );
}

// Ícone de nuvem noturna (noite nublada)
function AnimatedNightCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Fundo escuro com estrelas fracas */}
      {[
        { x: 10, y: 15, size: 1, delay: 0 },
        { x: 90, y: 20, size: 1, delay: 0.5 },
      ].map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="#6B7280"
          style={{
            animation: `twinkle 3s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      {/* Nuvem escura */}
      <g style={{ animation: 'float 3s ease-in-out infinite' }}>
        <ellipse cx="50" cy="55" rx="30" ry="18" fill="#4B5563" />
        <circle cx="35" cy="50" r="16" fill="#4B5563" />
        <circle cx="55" cy="45" r="20" fill="#4B5563" />
        <circle cx="70" cy="52" r="14" fill="#4B5563" />
        {/* Destaques */}
        <ellipse cx="50" cy="52" rx="25" ry="12" fill="#6B7280" />
      </g>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.2; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </svg>
  );
}

// Função para verificar se é noite (entre 18h e 6h)
function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

// Função para selecionar o ícone baseado na classificação do dia e hora
function getAnimatedWeatherIcon(dayClassification: string, className?: string) {
  const isNight = isNightTime();
  
  switch (dayClassification) {
    case 'Chuvoso':
      return <AnimatedRainIcon className={className} />;
    case 'Tempestuoso':
      return <AnimatedStormIcon className={className} />;
    case 'Muito Quente':
      return isNight ? <AnimatedMoonIcon className={className} /> : <AnimatedHotIcon className={className} />;
    case 'Quente':
    case 'Ensolarado':
      return isNight ? <AnimatedMoonIcon className={className} /> : <AnimatedSunIcon className={className} />;
    case 'Frio':
    case 'Fresco':
      return <AnimatedColdIcon className={className} />;
    case 'Nublado':
      return isNight ? <AnimatedNightCloudIcon className={className} /> : <AnimatedCloudIcon className={className} />;
    case 'Ventoso':
      return <AnimatedWindIcon className={className} />;
    case 'Agradável':
    case 'Parcialmente Nublado':
      return isNight ? <AnimatedMoonCloudIcon className={className} /> : <AnimatedPartlyCloudyIcon className={className} />;
    default:
      return isNight ? <AnimatedMoonIcon className={className} /> : <AnimatedSunIcon className={className} />;
  }
}

// Função para obter ícone do alerta
function getAlertIcon(type: string) {
  switch (type) {
    case 'danger':
      return <AlertTriangle className="w-4 h-4" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4" />;
    case 'success':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

export default function Dashboard() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState<InsightsResponse | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFullInsights, setShowFullInsights] = useState(false);
  const [activeSpecialized, setActiveSpecialized] = useState<'agriculture' | 'health' | 'sports' | 'energy' | null>(null);
  const navigate = useNavigate();

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadLogs();
  }, [navigate]);

  const loadLogs = async () => {
    try {
      const { data } = await api.get<WeatherLog[]>('/weather/logs');
      setLogs(data);
      loadInsights();
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data } = await api.get<InsightsResponse>('/weather/insights');
      setInsightsData(data);
    } catch (err) {
      console.error('Erro ao carregar insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await api.get('/weather/export.csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'weather-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    }
  };

  const handleExportXLSX = async () => {
    try {
      const { data } = await api.get('/weather/export.xlsx', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'weather-logs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao exportar XLSX:', err);
    }
  };

  // Dados para o gráfico
  const chartData = useMemo(() => {
    return [...logs].reverse().slice(-12).map((log) => ({
      time: new Date(log.ts).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temp: log.temperature,
      humidity: log.humidity,
    }));
  }, [logs]);

  // Previsão por hora (últimos registros)
  const hourlyForecast = useMemo(() => {
    return logs.slice(0, 5).map((log) => {
      const date = new Date(log.ts);
      return {
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        temp: log.temperature,
        wind: log.windspeed,
        humidity: log.humidity,
        hour: date.getHours(),
      };
    });
  }, [logs]);

  // Dados atuais
  const current = logs[0];
  const analysis = insightsData?.analysis;

  // Formatar data atual
  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
          <p className="text-gray-600 font-medium">Carregando dados climáticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6 text-gray-800" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Dashboard de Análise Climática</h1>
              <p className="text-sm text-gray-500">GDASH Challenge 2025</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-gray-700 text-white rounded-full text-sm font-medium hover:bg-gray-600 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            {authService.isAdmin() && (
              <button
                onClick={() => navigate('/users')}
                className="px-4 py-2 bg-gray-700 text-white rounded-full text-sm font-medium hover:bg-gray-600 transition flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Usuários
              </button>
            )}
            <button
              onClick={authService.logout}
              className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* City & Time Card */}
          <div className="bg-gray-700 rounded-3xl p-8 text-white flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-6">{current?.city || 'Penápolis'}</h1>
            <div className="text-7xl font-light tracking-tight mb-2">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-gray-400 text-lg">{formatDate(currentTime)}</p>
          </div>

          {/* Main Weather Card */}
          <div className="lg:col-span-2 bg-gray-700 rounded-3xl p-8 text-white">
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Temperature */}
              <div className="flex flex-col justify-center">
                <div className="text-6xl font-light text-yellow-400 mb-1">
                  {current?.temperature.toFixed(0) || '--'}°C
                </div>
                <p className="text-gray-400">
                  Sensação: <span className="text-yellow-400">{analysis?.feelsLike?.toFixed(0) || current?.temperature.toFixed(0) || '--'}°C</span>
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-orange-400" />
                    <span>Nascer do sol</span>
                    <span className="text-white">06:00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-orange-500" />
                    <span>Pôr do sol</span>
                    <span className="text-white">18:30</span>
                  </div>
                </div>
              </div>

              {/* Weather Icon - Dinâmico baseado na classificação */}
              <div className="flex flex-col items-center justify-center">
                {getAnimatedWeatherIcon(analysis?.dayClassification || 'Ensolarado', 'w-32 h-32')}
                <p className="text-xl font-medium mt-2">{analysis?.dayClassification || 'Ensolarado'}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Humidity */}
                <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
                  <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{current?.humidity.toFixed(0) || '--'}%</div>
                  <div className="text-xs text-gray-400">Umidade</div>
                </div>
                {/* Wind */}
                <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
                  <Wind className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{current?.windspeed.toFixed(0) || '--'}<span className="text-sm">km/h</span></div>
                  <div className="text-xs text-gray-400">Vento</div>
                </div>
                {/* Comfort */}
                <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
                  <Thermometer className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{analysis?.comfortScore || '--'}</div>
                  <div className="text-xs text-gray-400">Conforto</div>
                </div>
                {/* UV */}
                <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
                  <Sun className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <div className="text-xl font-bold">{analysis?.uvIndex?.split(' ')[0] || 'Médio'}</div>
                  <div className="text-xs text-gray-400">UV</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Insights & Forecast */}
          <div className="bg-gray-700 rounded-3xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-yellow-400" />
              <span>Análise IA</span>
              {loadingInsights && <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />}
            </h2>
            <div className="space-y-3 text-sm">
              {analysis?.alerts?.slice(0, 3).map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl ${
                    alert.type === 'danger' ? 'bg-red-500/20 text-red-300' :
                    alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                    alert.type === 'success' ? 'bg-green-500/20 text-green-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {getAlertIcon(alert.type)}
                    <span>{alert.title}</span>
                  </div>
                  <p className="text-xs opacity-80 mt-1">{alert.message}</p>
                </div>
              ))}
              {(!analysis?.alerts || analysis.alerts.length === 0) && (
                <div className="p-3 rounded-xl bg-green-500/20 text-green-300">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Clima Agradável</span>
                  </div>
                  <p className="text-xs opacity-80 mt-1">Condições favoráveis para atividades ao ar livre.</p>
                </div>
              )}
              
              {/* Recommendations */}
              {analysis?.recommendations && analysis.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-gray-400 text-xs mb-2">Recomendações:</p>
                  {analysis.recommendations.slice(0, 2).map((rec, i) => (
                    <p key={i} className="text-xs text-gray-300">{rec}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hourly Forecast */}
          <div className="lg:col-span-2 bg-gray-700 rounded-3xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Registros Recentes
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {hourlyForecast.map((item, i) => (
                <div key={i} className="bg-gray-800 rounded-2xl p-4 text-center">
                  <p className="text-lg font-bold text-yellow-400">{item.time}</p>
                  <div className="my-3 flex justify-center">
                    {getWeatherIcon(item.temp, item.humidity, item.hour)}
                  </div>
                  <p className="text-2xl font-bold">{item.temp.toFixed(0)}°C</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-400">
                    <Wind className="w-3 h-3" />
                    <span>{item.wind.toFixed(0)}km/h</span>
                  </div>
                </div>
              ))}
              {hourlyForecast.length === 0 && (
                <div className="col-span-5 text-center py-8 text-gray-400">
                  Aguardando dados...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solar Energy Card - Destaque GDASH */}
        <div className="bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-500 rounded-3xl p-6 text-white mb-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[...Array(10)].map((_, i) => (
                <circle key={i} cx={10 + i * 10} cy="50" r="30" fill="white" />
              ))}
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Sun className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Energia Solar Fotovoltaica</h2>
                  <p className="text-white/80 text-sm">Análise de potencial de geração em tempo real</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Score de Produção */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-4xl font-bold mb-1">
                  {analysis?.specialized?.solar?.productionScore ?? '--'}
                  <span className="text-lg">%</span>
                </div>
                <p className="text-sm text-white/80">Potencial Atual</p>
              </div>

              {/* Status */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-lg font-bold mb-1">
                  {analysis?.specialized?.solar?.productionLevel ?? 'Calculando...'}
                </div>
                <p className="text-sm text-white/80">Nível de Produção</p>
              </div>

              {/* Irradiância */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-lg font-bold mb-1">
                  {analysis?.specialized?.solar?.irradianceLevel ?? '--'}
                </div>
                <p className="text-sm text-white/80">Irradiação Solar</p>
              </div>

              {/* Pico do Dia */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-lg font-bold mb-1">
                  {analysis?.specialized?.solar?.peakHours ?? 'Calculando...'}
                </div>
                <p className="text-sm text-white/80">Pico de Produção</p>
              </div>

              {/* Eficiência */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-4xl font-bold mb-1">
                  {analysis?.specialized?.solar?.estimatedEfficiency ?? '--'}
                  <span className="text-lg">%</span>
                </div>
                <p className="text-sm text-white/80">Eficiência Estimada</p>
              </div>
            </div>

            {/* Status e Recomendações */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                📊 {analysis?.specialized?.solar?.currentStatus ?? 'Analisando...'}
              </span>
              {analysis?.specialized?.solar?.alerts?.map((alert, i) => (
                <span key={i} className="px-3 py-1 bg-red-500/30 rounded-full text-sm">
                  {alert}
                </span>
              ))}
              {analysis?.specialized?.solar?.recommendations?.slice(0, 2).map((rec, i) => (
                <span key={i} className="px-3 py-1 bg-green-500/30 rounded-full text-sm">
                  {rec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Temperature Chart */}
          <div className="bg-gray-700 rounded-3xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              Temperatura ao Longo do Tempo
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" vertical={false} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} unit="°C" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#FBBF24"
                  strokeWidth={3}
                  dot={{ fill: '#FBBF24', strokeWidth: 0 }}
                  name="Temperatura"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Export & Stats */}
          <div className="bg-gray-700 rounded-3xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-yellow-400" />
              Estatísticas & Exportação
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{analysis?.stats?.maxTemp?.toFixed(1) || '--'}°</p>
                <p className="text-xs text-gray-400">Máxima</p>
              </div>
              <div className="bg-gray-800 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{analysis?.stats?.avgTemp?.toFixed(1) || '--'}°</p>
                <p className="text-xs text-gray-400">Média</p>
              </div>
              <div className="bg-gray-800 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{analysis?.stats?.minTemp?.toFixed(1) || '--'}°</p>
                <p className="text-xs text-gray-400">Mínima</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar CSV
              </button>
              <button
                onClick={handleExportXLSX}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* AI Insights Section - Full Width */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-3xl p-6 text-white mb-6 border border-gray-600">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Análise Inteligente
                  {insightsData?.source === 'openai' && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      OpenAI
                    </span>
                  )}
                </h2>
                <p className="text-gray-400 text-sm">
                  {insightsData?.generatedAt 
                    ? `Atualizado em ${new Date(insightsData.generatedAt).toLocaleString('pt-BR')}`
                    : 'Carregando análise...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadInsights}
                disabled={loadingInsights}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 rounded-xl font-medium transition flex items-center gap-2"
              >
                {loadingInsights ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loadingInsights ? 'Gerando...' : 'Nova Análise'}
              </button>
              <button
                onClick={() => setShowFullInsights(!showFullInsights)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl font-medium transition flex items-center gap-2"
              >
                {showFullInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showFullInsights ? 'Resumir' : 'Expandir'}
              </button>
            </div>
          </div>

          {/* Main Insights Content */}
          <div className={`prose prose-invert max-w-none ${showFullInsights ? '' : 'max-h-64 overflow-hidden relative'}`}>
            {loadingInsights ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-400">Analisando dados climáticos com IA...</p>
                  <p className="text-gray-500 text-sm mt-1">Isso pode levar alguns segundos</p>
                </div>
              </div>
            ) : insightsData?.insights ? (
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                {insightsData.insights.split('\n').map((line, i) => {
                  // Formatar títulos com ##
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={i} className="text-xl font-bold text-yellow-400 mt-6 mb-3 flex items-center gap-2">
                        {line.replace('## ', '')}
                      </h3>
                    );
                  }
                  // Formatar linhas com **texto**
                  if (line.includes('**')) {
                    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
                    return (
                      <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
                    );
                  }
                  // Linhas normais
                  if (line.trim()) {
                    return <p key={i} className="mb-2">{line}</p>;
                  }
                  return <br key={i} />;
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Clique em "Nova Análise" para gerar insights com IA</p>
              </div>
            )}
            {!showFullInsights && insightsData?.insights && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Specialized Insights Tabs */}
          {insightsData?.specializedInsights && (
            <div className="mt-6 pt-6 border-t border-gray-600">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Análises Especializadas
              </h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <button
                  onClick={() => setActiveSpecialized(activeSpecialized === 'agriculture' ? null : 'agriculture')}
                  className={`p-4 rounded-xl transition flex flex-col items-center gap-2 ${
                    activeSpecialized === 'agriculture' 
                      ? 'bg-green-500/20 border-2 border-green-500' 
                      : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Leaf className="w-6 h-6 text-green-400" />
                  <span className="text-sm font-medium">Agricultura</span>
                </button>
                <button
                  onClick={() => setActiveSpecialized(activeSpecialized === 'health' ? null : 'health')}
                  className={`p-4 rounded-xl transition flex flex-col items-center gap-2 ${
                    activeSpecialized === 'health' 
                      ? 'bg-red-500/20 border-2 border-red-500' 
                      : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Heart className="w-6 h-6 text-red-400" />
                  <span className="text-sm font-medium">Saúde</span>
                </button>
                <button
                  onClick={() => setActiveSpecialized(activeSpecialized === 'sports' ? null : 'sports')}
                  className={`p-4 rounded-xl transition flex flex-col items-center gap-2 ${
                    activeSpecialized === 'sports' 
                      ? 'bg-blue-500/20 border-2 border-blue-500' 
                      : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Activity className="w-6 h-6 text-blue-400" />
                  <span className="text-sm font-medium">Esportes</span>
                </button>
                <button
                  onClick={() => setActiveSpecialized(activeSpecialized === 'energy' ? null : 'energy')}
                  className={`p-4 rounded-xl transition flex flex-col items-center gap-2 ${
                    activeSpecialized === 'energy' 
                      ? 'bg-yellow-500/20 border-2 border-yellow-500' 
                      : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-sm font-medium">Energia</span>
                </button>
              </div>

              {/* Active Specialized Content */}
              {activeSpecialized && insightsData.specializedInsights[activeSpecialized] && (
                <div className={`p-5 rounded-xl ${
                  activeSpecialized === 'agriculture' ? 'bg-green-500/10 border border-green-500/30' :
                  activeSpecialized === 'health' ? 'bg-red-500/10 border border-red-500/30' :
                  activeSpecialized === 'sports' ? 'bg-blue-500/10 border border-blue-500/30' :
                  'bg-yellow-500/10 border border-yellow-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {activeSpecialized === 'agriculture' && <Leaf className="w-5 h-5 text-green-400" />}
                    {activeSpecialized === 'health' && <Heart className="w-5 h-5 text-red-400" />}
                    {activeSpecialized === 'sports' && <Activity className="w-5 h-5 text-blue-400" />}
                    {activeSpecialized === 'energy' && <Zap className="w-5 h-5 text-yellow-400" />}
                    <h4 className="font-semibold">
                      {activeSpecialized === 'agriculture' && 'Impacto na Agricultura'}
                      {activeSpecialized === 'health' && 'Recomendações de Saúde'}
                      {activeSpecialized === 'sports' && 'Atividades Esportivas'}
                      {activeSpecialized === 'energy' && 'Gestão de Energia'}
                    </h4>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {insightsData.specializedInsights[activeSpecialized]}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-gray-700 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              Histórico Completo
            </h2>
            <span className="text-sm text-gray-400">{logs.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Data/Hora</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Cidade</th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">Temp</th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">Umidade</th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">Vento</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).map((log) => (
                  <tr key={log._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4">{new Date(log.ts).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4">{log.city}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-yellow-400 font-medium">{log.temperature.toFixed(1)}°C</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-blue-400 font-medium">{log.humidity.toFixed(0)}%</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-gray-300">{log.windspeed.toFixed(1)} km/h</span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Dashboard de Análise Climática • GDASH Challenge 2025 • Penápolis, SP</p>
        </footer>
      </main>
    </div>
  );
}
