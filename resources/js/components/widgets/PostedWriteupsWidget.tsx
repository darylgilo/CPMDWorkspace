import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface PostedWriteup {
  id: number;
  title: string;
  content: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
  };
}

const PostedWriteupsWidget: React.FC = () => {
  const [postedWriteups, setPostedWriteups] = useState<PostedWriteup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWriteups, setExpandedWriteups] = useState<Set<number>>(new Set());
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPostedWriteups();
  }, []);

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    if (profilePicture?.startsWith('http://') || profilePicture?.startsWith('https://'))
      return profilePicture;
    if (profilePicture?.startsWith('/')) return profilePicture; // already absolute path
    if (profilePicture?.startsWith('storage/')) return `/${profilePicture}`; // already in storage folder
    return `/storage/${profilePicture}`;
  };

  const handleImageError = (writeupId: number) => {
    setBrokenImages(prev => new Set(prev).add(writeupId));
  };

  const fetchPostedWriteups = async () => {
    try {
      const response = await fetch('/api/writeups?perPage=5');
      const data = await response.json();
      
      // Filter for posted writeups on client side (same as original dashboard)
      const postedWriteups = (data.data || []).filter((writeup: any) => 
        writeup.status === 'posted'
      );
      
      setPostedWriteups(postedWriteups);
    } catch (error) {
      console.error('Error fetching posted writeups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadMore = (writeupId: number) => {
    setExpandedWriteups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(writeupId)) {
        newSet.delete(writeupId);
      } else {
        newSet.add(writeupId);
      }
      return newSet;
    });
  };

  return (
    <Card className="bg-white border-gray-200 shadow-md dark:bg-neutral-900 dark:border-neutral-800 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Writeup Posted
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [&::-ms-overflow-style]:none [&::-scrollbar-width]:none">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-neutral-700 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))
          ) : postedWriteups.length > 0 ? (
            // Display actual posted writeups
            postedWriteups.map((writeup) => (
              <div key={writeup.id} className="border-b border-gray-200 dark:border-neutral-700 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {getProfilePictureUrl(writeup.author?.profile_picture) && !brokenImages.has(writeup.id) ? (
                      <img
                        src={getProfilePictureUrl(writeup.author?.profile_picture)!}
                        alt={`${writeup.author?.name}'s profile`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(writeup.id)}
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {writeup.author?.name && typeof writeup.author.name === 'string' ? writeup.author.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {writeup.author?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {writeup.updated_at ? new Date(writeup.updated_at).toLocaleString() : 'Recently'}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {writeup.title}
                    </h4>
                    <p className={`text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap ${
                      expandedWriteups.has(writeup.id) ? '' : 'line-clamp-2'
                    }`}>
                      {writeup.content || 'No content available'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => handleReadMore(writeup.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                      >
                        {expandedWriteups.has(writeup.id) ? 'Read Less' : 'Read More'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No posted writeups yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostedWriteupsWidget;
