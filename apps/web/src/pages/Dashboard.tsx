import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Dashboard() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await api.get('/weather/export.csv', {
        responseType: 'blob',
      });
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
      const { data } = await api.get('/weather/export.xlsx', {
        responseType: 'blob',
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard de Clima</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/users')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Usuários
            </button>
            <button
              onClick={authService.logout}
              className="px-4 py-2 bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500/20 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {logs[0] && (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <p className="text-slate-400 text-sm mb-2">Temperatura Atual</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {logs[0].temperature.toFixed(1)}°C
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <p className="text-slate-400 text-sm mb-2">Velocidade do Vento</p>
                <p className="text-3xl font-bold text-blue-400">
                  {logs[0].windspeed.toFixed(1)} km/h
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <p className="text-slate-400 text-sm mb-2">Umidade</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {logs[0].humidity.toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Registros Climáticos</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition text-sm"
              >
                Exportar CSV
              </button>
              <button
                onClick={handleExportXLSX}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition text-sm"
              >
                Exportar XLSX
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="pb-3 text-slate-400 font-medium">Data/Hora</th>
                  <th className="pb-3 text-slate-400 font-medium">Cidade</th>
                  <th className="pb-3 text-slate-400 font-medium">Temperatura</th>
                  <th className="pb-3 text-slate-400 font-medium">Vento</th>
                  <th className="pb-3 text-slate-400 font-medium">Umidade</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-800/50">
                      <td className="py-3 text-slate-300">
                        {new Date(log.ts).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 text-slate-300">{log.city}</td>
                      <td className="py-3 text-slate-300">{log.temperature.toFixed(1)}°C</td>
                      <td className="py-3 text-slate-300">{log.windspeed.toFixed(1)} km/h</td>
                      <td className="py-3 text-slate-300">{log.humidity.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



