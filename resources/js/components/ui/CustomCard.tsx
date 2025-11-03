import { ReactNode } from 'react';

interface CustomCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export function CustomCard({ 
  children, 
  className = '', 
  onClick,
  hoverEffect = true
}: CustomCardProps) {
  return (
    <div 
      className={`
        bg-white dark:bg-neutral-900 
        rounded-lg border border-gray-200 dark:border-neutral-800 
        p-4 flex gap-3 transition 
        ${hoverEffect ? 'hover:-translate-y-0.5 hover:shadow-md' : ''}
        shadow-sm
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CustomCardAvatarProps {
  src?: string;
  alt?: string;
  icon?: ReactNode;
  className?: string;
}

export function CustomCardAvatar({ src, alt = '', icon, className = '' }: CustomCardAvatarProps) {
  return (
    <div className={`h-14 w-14 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-gray-200 dark:border-neutral-700 ${className}`}>
      {src ? (
        <img src={src} className="h-full w-full object-cover" alt={alt} />
      ) : icon ? (
        icon
      ) : (
        <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

interface CustomCardContentProps {
  children: ReactNode;
  className?: string;
}

export function CustomCardContent({ children, className = '' }: CustomCardContentProps) {
  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      {children}
    </div>
  );
}
