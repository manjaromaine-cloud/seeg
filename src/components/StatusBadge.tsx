import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "ongoing" | "scheduled" | "resolved" | "reported";
  className?: string;
}

const statusConfig = {
  ongoing: {
    label: "En cours",
    className: "bg-[hsl(var(--status-incident))] text-white hover:bg-[hsl(var(--status-incident))]",
  },
  scheduled: {
    label: "Programmé",
    className: "bg-[hsl(var(--status-scheduled))] text-white hover:bg-[hsl(var(--status-scheduled))]",
  },
  resolved: {
    label: "Résolu",
    className: "bg-[hsl(var(--status-normal))] text-white hover:bg-[hsl(var(--status-normal))]",
  },
  reported: {
    label: "Signalé",
    className: "bg-gray-500 text-white hover:bg-gray-500", // A neutral color for reported
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
