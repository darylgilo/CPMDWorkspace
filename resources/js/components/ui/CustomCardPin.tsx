import { ReactNode } from 'react';
import { FileText, Calendar, Clock } from 'lucide-react';

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
      className={`group flex flex-col rounded-xl border border-sidebar-border/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border dark:bg-neutral-900 ${className}`}
    >
      {/* Header with category and pin button */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {category?.icon && <span className="text-xl" aria-hidden>{category.icon}</span>}
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
            {category?.name || 'Uncategorized'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{new Date(createdAt).toLocaleString()}</span>
          {onPinClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(id);
              }}
              className="text-gray-400 hover:text-yellow-500 transition-colors"
              aria-label={isPinned ? 'Unpin notice' : 'Pin notice'}
              title={isPinned ? 'Unpin' : 'Pin to top'}
            >
              {isPinned ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 fill-yellow-500 text-yellow-500">
                  <path d="M12 17v5" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 17v5" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <h3 className="mb-1 line-clamp-1 text-base font-semibold">{title}</h3>
      <p className="mb-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-200">{description}</p>
      
      {/* Date and Time */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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

      {/* Attachments */}
      {files && files.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <FileText className="h-4 w-4" />
          <span>{files.length} attachment(s)</span>
          {files_download_url && (
            <a
              href={files_download_url}
              className="text-[#163832] hover:underline dark:text-[#235347]"
              download
              onClick={(e) => e.stopPropagation()}
            >
              Download All
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-neutral-800">
        <span>Posted by {username}</span>
        {onViewClick && (
          <div className="flex items-center gap-1">
            <button
              onClick={onViewClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#163832] hover:bg-[#163832]/90 text-white text-xs dark:bg-[#235347] dark:hover:bg-[#235347]/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M2 12s3-7.5 10-7.5 10 7.5 10 7.5-3 7.5-10 7.5S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomCardPin;
