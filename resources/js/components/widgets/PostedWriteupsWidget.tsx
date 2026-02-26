import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
    const [expandedWriteups, setExpandedWriteups] = useState<Set<number>>(
        new Set(),
    );
    const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchPostedWriteups();
    }, []);

    // Helper function to get profile picture URL
    const getProfilePictureUrl = (profilePicture?: string) => {
        if (!profilePicture) return null;
        if (
            profilePicture?.startsWith('http://') ||
            profilePicture?.startsWith('https://')
        )
            return profilePicture;
        if (profilePicture?.startsWith('/')) return profilePicture; // already absolute path
        if (profilePicture?.startsWith('storage/')) return `/${profilePicture}`; // already in storage folder
        return `/storage/${profilePicture}`;
    };

    const handleImageError = (writeupId: number) => {
        setBrokenImages((prev) => new Set(prev).add(writeupId));
    };

    const fetchPostedWriteups = async () => {
        try {
            const response = await fetch('/api/writeups?perPage=5');
            const data = await response.json();

            // Filter for posted writeups on client side (same as original dashboard)
            const postedWriteups = (data.data || []).filter(
                (writeup: any) => writeup.status === 'posted',
            );

            setPostedWriteups(postedWriteups);
        } catch (error) {
            console.error('Error fetching posted writeups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReadMore = (writeupId: number) => {
        setExpandedWriteups((prev) => {
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
        <Card className="h-full border-gray-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-green-400" />
                    Writeup Posted
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="[&::-ms-overflow-style]:none [&::-scrollbar-width]:none max-h-96 space-y-4 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="border-b border-gray-200 pb-3 dark:border-neutral-700"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700"></div>
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-700"></div>
                                            <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-neutral-700"></div>
                                        </div>
                                        <div className="mb-1 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-neutral-700"></div>
                                        <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-neutral-700"></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : postedWriteups.length > 0 ? (
                        // Display actual posted writeups
                        postedWriteups.map((writeup) => (
                            <div
                                key={writeup.id}
                                className="border-b border-gray-200 pb-3 dark:border-neutral-700"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                                        {getProfilePictureUrl(
                                            writeup.author?.profile_picture,
                                        ) && !brokenImages.has(writeup.id) ? (
                                            <img
                                                src={
                                                    getProfilePictureUrl(
                                                        writeup.author
                                                            ?.profile_picture,
                                                    )!
                                                }
                                                alt={`${writeup.author?.name}'s profile`}
                                                className="h-full w-full object-cover"
                                                onError={() =>
                                                    handleImageError(writeup.id)
                                                }
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                                                {writeup.author?.name &&
                                                typeof writeup.author.name ===
                                                    'string'
                                                    ? writeup.author.name
                                                          .charAt(0)
                                                          .toUpperCase()
                                                    : 'A'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {writeup.author?.name ||
                                                    'Anonymous'}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {writeup.updated_at
                                                    ? new Date(
                                                          writeup.updated_at,
                                                      ).toLocaleString()
                                                    : 'Recently'}
                                            </span>
                                        </div>
                                        <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {writeup.title}
                                        </h4>
                                        <p
                                            className={`text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400 ${
                                                expandedWriteups.has(writeup.id)
                                                    ? ''
                                                    : 'line-clamp-2'
                                            }`}
                                        >
                                            {writeup.content ||
                                                'No content available'}
                                        </p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleReadMore(writeup.id)
                                                }
                                                className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                {expandedWriteups.has(
                                                    writeup.id,
                                                )
                                                    ? 'Read Less'
                                                    : 'Read More'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                            <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm">No posted writeups yet</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PostedWriteupsWidget;
