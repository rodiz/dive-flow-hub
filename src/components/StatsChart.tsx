import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsChartProps {
  title: string;
  description?: string;
  data: {
    label: string;
    value: number;
    trend?: number;
    trendDirection?: "up" | "down" | "neutral";
  }[];
  type?: "bar" | "line" | "area";
}

export function StatsChart({ title, description, data, type = "bar" }: StatsChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  
  const getTrendIcon = (direction?: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up": return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "down": return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (direction?: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up": return "text-green-500";
      case "down": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="shadow-surface">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{item.value}</span>
                  {item.trend !== undefined && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(item.trendDirection)}
                      <span className={`text-xs ${getTrendColor(item.trendDirection)}`}>
                        {item.trend > 0 ? '+' : ''}{item.trend}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {type === "bar" && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-ocean transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {type === "area" && (
          <div className="mt-6 h-32 relative overflow-hidden rounded-lg bg-gradient-to-t from-primary/10 to-transparent">
            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
              {data.map((item, index) => (
                <div 
                  key={index}
                  className="w-8 bg-gradient-ocean rounded-t opacity-70 hover:opacity-100 transition-opacity"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}