import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Gauge, Thermometer, Eye, Wind, User, Calendar } from "lucide-react";

interface DiveCardProps {
  dive: {
    id: number;
    location: string;
    date: string;
    duration: string;
    depth: string;
    maxDepth: string;
    temperature: string;
    visibility: string;
    current: string;
    instructor?: string;
    student?: string;
    notes?: string;
    equipment: string[];
    conditions: "excellent" | "good" | "fair" | "poor";
  };
  viewMode?: "instructor" | "student";
  onViewDetails?: (id: number) => void;
}

export function DiveCard({ dive, viewMode = "instructor", onViewDetails }: DiveCardProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "good": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "fair": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "poor": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Card className="shadow-surface hover:shadow-depth transition-all duration-300 hover:scale-[1.02] group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
              <MapPin className="h-4 w-4 text-accent" />
              {dive.location}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {dive.date}
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`capitalize ${getConditionColor(dive.conditions)}`}
          >
            {dive.conditions}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Participant Info */}
        {viewMode === "instructor" && dive.student && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-accent" />
            <span className="text-muted-foreground">Estudiante:</span>
            <span className="font-medium">{dive.student}</span>
          </div>
        )}
        
        {viewMode === "student" && dive.instructor && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Instructor:</span>
            <span className="font-medium">{dive.instructor}</span>
          </div>
        )}

        {/* Dive Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Profundidad:</span>
              <span className="font-medium">{dive.depth}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3 text-accent" />
              <span className="text-muted-foreground">Duración:</span>
              <span className="font-medium">{dive.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Thermometer className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">Temperatura:</span>
              <span className="font-medium">{dive.temperature}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-3 w-3 text-destructive" />
              <span className="text-muted-foreground">Máx:</span>
              <span className="font-medium">{dive.maxDepth}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Visibilidad:</span>
              <span className="font-medium">{dive.visibility}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-3 w-3 text-cyan-500" />
              <span className="text-muted-foreground">Corriente:</span>
              <span className="font-medium">{dive.current}</span>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Equipamiento:</h4>
          <div className="flex flex-wrap gap-1">
            {dive.equipment.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes Preview */}
        {dive.notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Notas:</h4>
            <p className="text-sm text-foreground line-clamp-2 bg-muted/30 p-2 rounded-md">
              {dive.notes}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full mt-4 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => onViewDetails?.(dive.id)}
        >
          Ver Detalles Completos
        </Button>
      </CardContent>
    </Card>
  );
}