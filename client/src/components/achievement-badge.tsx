import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface AchievementBadgeProps {
  achievement: {
    id: number;
    name: string;
    description: string;
    icon: string;
  };
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 text-center">
        <div className="mb-3">
          <Trophy className="h-8 w-8 mx-auto text-primary" />
        </div>
        <h3 className="font-semibold mb-1">{achievement.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {achievement.description}
        </p>
        <Badge variant="secondary" className="mt-2">
          Unlocked
        </Badge>
      </CardContent>
    </Card>
  );
}
