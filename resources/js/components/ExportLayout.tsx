import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ExportLayoutProps {
  /**
   * Optional: Additional classes for the button
   */
  className?: string;
  /**
   * Optional: Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
  /**
   * Optional: Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Optional: Show only icon without text
   */
  iconOnly?: boolean;
  /**
   * Children to render as export options
   */
  children: ReactNode;
  /**
   * Optional: Callback when export is triggered
   */
  onExportStart?: () => void;
}

/**
 * A reusable export layout component that provides a dropdown menu for export options
 */
const ExportLayout = ({
  className = '',
  variant = 'outline',
  size = 'default',
  iconOnly = false,
  children,
  onExportStart,
}: ExportLayoutProps) => {
  const handleExportStart = () => {
    if (onExportStart) {
      onExportStart();
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            className="flex items-center gap-2"
            onClick={handleExportStart}
          >
            <Download className="h-4 w-4" />
            {!iconOnly && 'Export'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ExportLayout;
