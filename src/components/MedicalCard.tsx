import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Activity, Thermometer, Eye, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface MedicalRecord {
  id: string;
  studentName: string;
  date: string;
  examiner: string;
  status: "approved" | "pending" | "expired" | "restricted";
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  temperature: number;
  vision: string;
  hearing: string;
  restrictions: string[];
  validUntil: string;
  notes: string;
  clearanceLevel: "recreational" | "advanced" | "technical" | "restricted";
}

interface MedicalCardProps {
  record: MedicalRecord;
  onUpdateRecord?: (id: string) => void;
  onViewHistory?: (studentName: string) => void;
  viewMode?: "instructor" | "student";
}

export function MedicalCard({ record, onUpdateRecord, onViewHistory, viewMode = "instructor" }: MedicalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "expired": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "restricted": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "expired": return <AlertTriangle className="h-4 w-4" />;
      case "restricted": return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getClearanceLevelColor = (level: string) => {
    switch (level) {
      case "recreational": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "advanced": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "technical": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "restricted": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getHealthScore = () => {
    let score = 100;
    
    // Blood pressure assessment
    if (record.bloodPressure.systolic > 140 || record.bloodPressure.diastolic > 90) {
      score -= 20;
    } else if (record.bloodPressure.systolic > 130 || record.bloodPressure.diastolic > 85) {
      score -= 10;
    }
    
    // Heart rate assessment
    if (record.heartRate > 100 || record.heartRate < 50) {
      score -= 15;
    }
    
    // Temperature assessment
    if (record.temperature > 37.5 || record.temperature < 36) {
      score -= 10;
    }
    
    // Restrictions
    score -= record.restrictions.length * 5;
    
    return Math.max(score, 0);
  };

  const healthScore = getHealthScore();

  return (
    <Card className="shadow-surface hover:shadow-depth transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-red-500" />
              {record.studentName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Examen: {record.date} | Examiner: {record.examiner}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(record.status)} flex items-center gap-1`}
            >
              {getStatusIcon(record.status)}
              {record.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Puntuación de Salud</span>
            <span className="text-sm font-bold text-primary">{healthScore}/100</span>
          </div>
          <Progress 
            value={healthScore} 
            className="h-2"
          />
        </div>

        {/* Vital Signs Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-3 w-3 text-red-500" />
              <span className="text-muted-foreground">Presión:</span>
              <span className="font-medium">
                {record.bloodPressure.systolic}/{record.bloodPressure.diastolic} mmHg
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-3 w-3 text-pink-500" />
              <span className="text-muted-foreground">Frecuencia:</span>
              <span className="font-medium">{record.heartRate} bpm</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Thermometer className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">Temperatura:</span>
              <span className="font-medium">{record.temperature}°C</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Visión:</span>
              <span className="font-medium">{record.vision}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-3 w-3 text-purple-500" />
              <span className="text-muted-foreground">Audición:</span>
              <span className="font-medium">{record.hearing}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Válido hasta:</span>
              <span className="font-medium">{record.validUntil}</span>
            </div>
          </div>
        </div>

        {/* Clearance Level */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Nivel de Habilitación:</h4>
          <Badge 
            variant="outline" 
            className={`${getClearanceLevelColor(record.clearanceLevel)} capitalize`}
          >
            {record.clearanceLevel}
          </Badge>
        </div>

        {/* Restrictions */}
        {record.restrictions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Restricciones:</h4>
            <div className="flex flex-wrap gap-1">
              {record.restrictions.map((restriction, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {restriction}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {record.notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Observaciones:</h4>
            <p className="text-sm text-foreground bg-muted/30 p-3 rounded-md">
              {record.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {viewMode === "instructor" && (
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onViewHistory?.(record.studentName)}
            >
              Ver Historial
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onUpdateRecord?.(record.id)}
            >
              Actualizar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}