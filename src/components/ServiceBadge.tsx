import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Droplet, Zap } from "lucide-react";

interface ServiceBadgeProps {
  service: "water" | "electricity";
  className?: string;
}

const serviceConfig = {
  water: {
    label: "Eau",
    icon: Droplet,
    className: "bg-primary text-primary-foreground hover:bg-primary",
  },
  electricity: {
    label: "Électricité",
    icon: Zap,
    className: "bg-secondary text-secondary-foreground hover:bg-secondary",
  },
};

export const ServiceBadge = ({ service, className }: ServiceBadgeProps) => {
  const config = serviceConfig[service];
  const Icon = config.icon;
  
  return (
    <Badge className={cn(config.className, "flex items-center gap-1", className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
