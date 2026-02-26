import { ReactNode } from 'react';
import { FileText, Calendar, Clock } from 'lucide-react';
import { renderTextWithLinks } from '@/lib/text-utils';

interface FileType {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Category {
  id: string;
  name: string;
  icon: ReactNode;
}

interface CustomCardPinProps {
  id: string;
  title: string;
  description: string;
  category: Category;
  username: string;
  createdAt: string;
  date?: string | null;
  time?: string | null;
  files?: FileType[];
  files_download_url?: string | null;
  isPinned?: boolean;
  onPinClick?: (id: string) => void;
  onViewClick?: () => void;
  className?: string;
}

export function CustomCardPin({
  id,
  title,
  description,
  category,
  username,
  createdAt,
  date,
  time,
  files = [],
  files_download_url,
  isPinned = false,
  onPinClick,
  onViewClick,
  className = '',
}: CustomCardPinProps) {
  return (
    <div
      className={`group flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {category?.icon && <span className="text-sm" aria-hidden>{category.icon}</span>}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {category?.name || 'Uncategorized'}
          </span>
        </div>
        {onPinClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinClick(id);
            }}
            className={`p-1 rounded transition-colors ${
              isPinned 
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
            aria-label={isPinned ? 'Unpin notice' : 'Pin notice'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 17v5" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
        {title}
      </h3>
      <div className="mb-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
        {renderTextWithLinks(description)}
      </div>

      {/* Date and Time */}
      {(date || time) && (
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(date).toLocaleDateString()}
            </span>
          )}
          {time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {time}
            </span>
          )}
        </div>
      )}

      {/* Attachments */}
      {files && files.length > 0 && (
        <div className="mb-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <FileText className="h-3 w-3" />
          <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
          {files_download_url && (
            <a
              href={files_download_url}
              className="ml-auto font-medium hover:underline"
              download
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700 text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(createdAt).toLocaleDateString()} {new Date(createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
        {onViewClick && (
          <button
            onClick={onViewClick}
            className="px-2 py-1 bg-[#163832] text-white rounded hover:bg-[#163832]/90 transition-colors dark:bg-[#235347] dark:hover:bg-[#235347]/90"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}

export default CustomCardPin;
