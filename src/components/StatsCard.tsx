import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  variant = "default",
  className 
}: StatsCardProps) => {
  const variantStyles = {
    default: "bg-gradient-card border-border",
    success: "bg-success-light border-success/20",
    warning: "bg-warning-light border-warning/20", 
    danger: "bg-destructive-light border-destructive/20",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  return (
    <div className={cn(
      "rounded-xl border p-6 shadow-custom-md animate-scale-in",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {trend && (
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-lg bg-background/50",
          iconStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;