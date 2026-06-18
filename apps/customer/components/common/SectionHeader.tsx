import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  title: string;
  description: string;
  className?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  showArrows?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, className = '', onLeftClick, onRightClick, showArrows = true }) => (
  <div className={`mb-4 text-left ${className}`}>
    <div className="flex items-center justify-between">
      <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      {showArrows && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onLeftClick}
            aria-label="Previous"
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onRightClick}
            aria-label="Next"
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
    <p className="mt-2 text-sm md:text-sm text-slate-600 dark:text-slate-400">
      {description}
    </p>
  </div>
);

export default SectionHeader;