import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Shield, Target, Lightbulb, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysis {
  totalDives: number;
  averageDepth: number;
  averageBottomTime: number;
  progressionRate: number;
  skillsMastery: { [key: string]: number };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  safetyScore: number;
}

interface AIProgressAnalysisProps {
  studentId: string;
  courseId: string;
}

export const AIProgressAnalysis = ({ studentId, courseId }: AIProgressAnalysisProps) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-progress-analysis', {
        body: { 
          courseId,
          studentId 
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "Análisis completado",
        description: "El análisis de progreso con IA ha sido generado exitosamente",
      });
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el análisis. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Análisis de Progreso con IA
        </CardTitle>
        <CardDescription>
          Análisis personalizado de tu progreso en el curso con recomendaciones inteligentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!analysis ? (
          <div className="text-center py-8">
            <Button 
              onClick={generateAnalysis} 
              disabled={isLoading}
              className="w-full max-w-md"
            >
              {isLoading ? "Generando análisis..." : "Generar Análisis con IA"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="skills">Habilidades</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{analysis.totalDives}</div>
                    <div className="text-sm text-muted-foreground">Inmersiones</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{analysis.averageDepth}m</div>
                    <div className="text-sm text-muted-foreground">Profundidad Promedio</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{analysis.averageBottomTime}min</div>
                    <div className="text-sm text-muted-foreground">Tiempo Fondo Promedio</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.safetyScore)}`}>
                      {analysis.safetyScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Puntuación Seguridad</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tasa de Progresión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso General</span>
                      <span>{analysis.progressionRate}%</span>
                    </div>
                    <Progress value={analysis.progressionRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Dominio de Habilidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.skillsMastery).map(([skill, level]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{skill}</span>
                        <Badge variant={getScoreBadgeVariant(level)}>
                          {level}%
                        </Badge>
                      </div>
                      <Progress value={level} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Star className="h-4 w-4" />
                      Fortalezas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <TrendingUp className="h-4 w-4" />
                      Áreas de Mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Evaluación de Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={analysis.safetyScore} className="h-3" />
                    </div>
                    <Badge 
                      variant={getScoreBadgeVariant(analysis.safetyScore)}
                      className="text-lg px-3 py-1"
                    >
                      {analysis.safetyScore}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {analysis.safetyScore >= 90 && "Excelente adherencia a protocolos de seguridad"}
                    {analysis.safetyScore >= 70 && analysis.safetyScore < 90 && "Buen cumplimiento de protocolos de seguridad"}
                    {analysis.safetyScore < 70 && "Se requiere mayor atención a los protocolos de seguridad"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Recomendaciones Personalizadas
                  </CardTitle>
                  <CardDescription>
                    Sugerencias específicas basadas en tu progreso y desempeño
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm flex-1">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button 
                  onClick={generateAnalysis} 
                  disabled={isLoading}
                  variant="outline"
                >
                  Actualizar Análisis
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};