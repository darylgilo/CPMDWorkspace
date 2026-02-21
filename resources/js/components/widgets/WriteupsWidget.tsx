import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, User, Eye } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Document {
  id: number;
  title: string;
  content: string;
  category: string;
  status: 'draft' | 'for review' | 'approved' | 'rejected' | 'posted';
  created_at: string;
  updated_at: string;
  likes_count: number;
  approvals_count: number;
  approved_at?: string;
  is_liked: boolean;
  is_approved: boolean;
  is_bookmarked: boolean;
  author: {
    id: number;
    name: string;
    email: string;
  };
  comments?: Array<{
    id: number;
    content: string;
    author: {
      id: number;
      name: string;
      email: string;
    };
    created_at: string;
  }>;
}

const WriteupsWidget: React.FC = () => {
  const [writeups, setWriteups] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWriteups, setExpandedWriteups] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchWriteups();
  }, []);

  const fetchWriteups = async () => {
    try {
      // Fetch only writeups with "for review" status
      const response = await fetch('/api/writeups?perPage=4');
      const data = await response.json();

      console.log('API Response:', data);
      console.log('Documents data:', data.data);

      // Filter for "for review" writeups only
      const forReviewWriteups = (data.data || []).filter((writeup: Document) => 
        writeup.status === 'for review'
      );

      console.log('Filtered for review writeups:', forReviewWriteups);

      setWriteups(forReviewWriteups);
    } catch (error) {
      console.error('Error fetching writeups:', error);
      // Fallback to empty array if API fails
      setWriteups([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'for review':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'draft':
        return 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-neutral-700';
      case 'posted':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-neutral-700';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleReview = (writeupId: number) => {
    router.get(`/editdocument/${writeupId}`);
  };

  const handleReadMore = (writeupId: number) => {
    setExpandedWriteups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(writeupId)) {
        newSet.delete(writeupId); // Collapse if already expanded
      } else {
        newSet.add(writeupId); // Expand if collapsed
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileText className="h-5 w-5 text-[#163832]" />
            Write-ups for Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#163832]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <FileText className="h-5 w-5 text-[#163832]" />
          Write-ups for Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-3 max-h-96 overflow-y-auto hide-scrollbar"
        >
          {writeups.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No write-ups found</p>
            </div>
          ) : (
            writeups.map((writeup: Document) => (
              <div key={writeup.id} className="border border-gray-200 dark:border-neutral-800 rounded-lg p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-sm flex-1 dark:text-gray-100">{writeup.title}</h4>
                  <div className="flex gap-1 ml-2">
                    <Badge className={`text-xs ${getStatusColor(writeup.status)}`}>
                      {writeup.status}
                    </Badge>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {writeup.author.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(writeup.updated_at).toLocaleDateString()}
                  </div>
                  <div>
                    {writeup.content.split(' ').length} words
                  </div>
                </div>

                {/* Content Preview */}
                <p className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap ${
                  expandedWriteups.has(writeup.id) ? '' : 'line-clamp-2'
                }`}>
                  {writeup.content}
                </p>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleReadMore(writeup.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                  >
                    {expandedWriteups.has(writeup.id) ? 'Read Less' : 'Read More'}
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview(writeup.id)}
                    className="flex items-center gap-1 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WriteupsWidget;
