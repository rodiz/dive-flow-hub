import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Eye, 
  Waves, 
  Thermometer,
  RefreshCw,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  waveHeight: number;
  waterTemperature: number;
  uvIndex: number;
  humidity: number;
  pressure: number;
  diving_conditions: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
  recommendations: string[];
}

interface WeatherWidgetProps {
  location?: string;
  diveDate?: string;
}

export default function WeatherWidget({ location = "Cartagena, Colombia", diveDate }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchWeatherData();
    // Actualizar cada 30 minutos
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // Simulamos datos del clima - en producción usarías una API real como OpenWeatherMap
      const mockWeatherData: WeatherData = {
        location: location,
        temperature: 28 + Math.random() * 4, // 28-32°C
        condition: ['sunny', 'partly_cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        windSpeed: 10 + Math.random() * 15, // 10-25 km/h
        windDirection: 'NE',
        visibility: 8 + Math.random() * 7, // 8-15 km
        waveHeight: 0.5 + Math.random() * 1.5, // 0.5-2m
        waterTemperature: 26 + Math.random() * 3, // 26-29°C
        uvIndex: 8 + Math.random() * 3, // 8-11
        humidity: 70 + Math.random() * 20, // 70-90%
        pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
        diving_conditions: 'good',
        recommendations: []
      };

      // Calcular condiciones de buceo basadas en los datos
      const conditions = calculateDivingConditions(mockWeatherData);
      mockWeatherData.diving_conditions = conditions.level;
      mockWeatherData.recommendations = conditions.recommendations;

      setWeatherData(mockWeatherData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del clima",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDivingConditions = (data: WeatherData) => {
    const recommendations: string[] = [];
    let score = 100;

    // Evaluar viento
    if (data.windSpeed > 25) {
      score -= 30;
      recommendations.push("Viento fuerte - considera postponer la inmersión");
    } else if (data.windSpeed > 15) {
      score -= 15;
      recommendations.push("Viento moderado - precaución en superficie");
    }

    // Evaluar olas
    if (data.waveHeight > 2) {
      score -= 25;
      recommendations.push("Olas altas - entrada y salida difícil");
    } else if (data.waveHeight > 1.5) {
      score -= 10;
      recommendations.push("Mar algo agitado - usar precaución");
    }

    // Evaluar visibilidad
    if (data.visibility < 5) {
      score -= 20;
      recommendations.push("Visibilidad reducida - mantenerse cerca del grupo");
    } else if (data.visibility > 12) {
      recommendations.push("Excelente visibilidad para fotografía");
    }

    // Evaluar temperatura del agua
    if (data.waterTemperature < 20) {
      recommendations.push("Agua fría - usar traje húmedo grueso");
    } else if (data.waterTemperature > 26) {
      recommendations.push("Temperatura del agua ideal");
    }

    // Recomendaciones generales
    if (data.uvIndex > 8) {
      recommendations.push("UV alto - usar protector solar");
    }

    if (score >= 80) return { level: 'excellent' as const, recommendations };
    if (score >= 65) return { level: 'good' as const, recommendations };
    if (score >= 50) return { level: 'fair' as const, recommendations };
    if (score >= 30) return { level: 'poor' as const, recommendations };
    return { level: 'dangerous' as const, recommendations };
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'partly_cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-600" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-orange-100 text-orange-800',
      dangerous: 'bg-red-100 text-red-800'
    };

    const labels = {
      excellent: 'Excelente',
      good: 'Bueno',
      fair: 'Regular',
      poor: 'Malo',
      dangerous: 'Peligroso'
    };

    return (
      <Badge className={variants[condition as keyof typeof variants]}>
        {labels[condition as keyof typeof labels]}
      </Badge>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">Cargando datos del clima...</span>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <span className="ml-2">No se pudieron cargar los datos del clima</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Condiciones de Buceo
            </CardTitle>
            <CardDescription>{weatherData.location}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchWeatherData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado general */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weatherData.condition)}
            <div>
              <div className="text-2xl font-bold">
                {Math.round(weatherData.temperature)}°C
              </div>
              <div className="text-sm text-muted-foreground">
                Sensación térmica
              </div>
            </div>
          </div>
          {getConditionBadge(weatherData.diving_conditions)}
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium">Olas</div>
              <div className="text-xs text-muted-foreground">
                {weatherData.waveHeight.toFixed(1)}m
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium">Viento</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(weatherData.windSpeed)} km/h {weatherData.windDirection}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-500" />
            <div>
              <div className="text-sm font-medium">Visibilidad</div>
              <div className="text-xs text-muted-foreground">
                {weatherData.visibility.toFixed(1)} km
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-cyan-500" />
            <div>
              <div className="text-sm font-medium">Agua</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(weatherData.waterTemperature)}°C
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        {weatherData.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recomendaciones:</div>
            <div className="space-y-1">
              {weatherData.recommendations.map((recommendation, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  • {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Última actualización */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Última actualización: {formatTime(lastUpdated)}
        </div>
      </CardContent>
    </Card>
  );
}