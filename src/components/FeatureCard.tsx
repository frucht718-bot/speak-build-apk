import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:scale-105 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-cyber-cyan/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500" />
      
      {/* Border gradient */}
      <div className="absolute inset-0 rounded-3xl border border-border/50 group-hover:border-primary/50 transition-colors duration-500" />
      
      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-primary shadow-glow group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      
      {/* Corner accent */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
};
