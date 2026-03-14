import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import {
    Bot,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    RefreshCw,
    Send,
    Share2,
    User as UserIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Chatbot',
        href: '/chatbot',
    },
];

// Define the user type
type User = {
    id?: string | number;
    name?: string;
};

// Define the page props
interface PageProps {
    auth?: {
        user?: User;
        [key: string]: unknown;
    };
    flash?: {
        success?: string;
        error?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export default function AIchatbot() {
    const page = usePage<PageProps>();
    const authUser = page.props.auth?.user;
    const previousUserId = useRef<string | null>(null);
    type ChatMessage = {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        variants?: string[];
        variantIndex?: number;
    };
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        // Initialize with a welcome message that includes the user's name if available
        const welcomeMessage = `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your Research AI assistant. Ask me anything or type a message below.`;

        return [
            {
                id: 'm1',
                role: 'assistant',
                content: welcomeMessage,
                variants: [welcomeMessage],
                variantIndex: 0,
            },
        ];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const listRef = useRef<HTMLDivElement | null>(null);

    const canSend = useMemo(
        () => input.trim().length > 0 && !isTyping,
        [input, isTyping],
    );

    const downloadText = (filename: string, text: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const getAssistantText = (m: ChatMessage) => {
        if (m.variants && typeof m.variantIndex === 'number') {
            return m.variants[m.variantIndex] ?? m.content;
        }
        return m.content;
    };

    // Function to format AI text with proper spacing and markdown
    const formatAIText = (text: string) => {
        return text
            // Handle ### headers (convert to bold)
            .replace(/^###\s+(.+)$/gm, '<strong>$1</strong>')
            // Handle ## headers (convert to bold)
            .replace(/^##\s+(.+)$/gm, '<strong>$1</strong>')
            // Handle # headers (convert to bold)
            .replace(/^#\s+(.+)$/gm, '<strong>$1</strong>')
            // Replace **bold** with <strong>bold</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Replace *italic* with <em>italic</em>
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Replace ***bold italic*** with <strong><em>bold italic</em></strong>
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            // Handle line breaks - convert double newlines to paragraphs
            .split('\n\n')
            .map((paragraph) => {
                // Handle single line breaks within paragraphs
                const formattedParagraph = paragraph
                    .replace(/\n/g, '<br />');
                
                // Handle bullet points (lines starting with * or -)
                if (formattedParagraph.trim().startsWith('* ') || formattedParagraph.trim().startsWith('- ')) {
                    return `<div class="mb-2 ml-4"><span class="text-gray-600 dark:text-gray-400">•</span> ${formattedParagraph.replace(/^[\*\-]\s/, '')}</div>`;
                }
                
                // Handle numbered lists (lines starting with 1., 2., etc.)
                if (/^\d+\.\s/.test(formattedParagraph.trim())) {
                    const match = formattedParagraph.match(/^\d+\./);
                    const number = match ? match[0] : '';
                    return `<div class="mb-2 ml-4"><span class="text-gray-600 dark:text-gray-400">${number}</span> ${formattedParagraph.replace(/^\d+\.\s/, '')}</div>`;
                }
                
                // Regular paragraph
                return `<div class="mb-2">${formattedParagraph || '&nbsp;'}</div>`;
            })
            .join('');
    };

    const handleDownloadMessage = (m: ChatMessage) => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const filename = `ai-${m.role}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${m.id.slice(0, 8)}.txt`;
        downloadText(filename, getAssistantText(m));
    };

    const handleCopy = async (m: ChatMessage) => {
        try {
            await navigator.clipboard.writeText(getAssistantText(m));
        } catch (error) {
            console.error('Failed to copy text:', error);
            // Optionally show a user-friendly error message
        }
    };

    const handleShare = async (m: ChatMessage) => {
        const text = getAssistantText(m);

        // Use type assertion for web share API
        const nav = navigator as Navigator & {
            share?: (data: { title?: string; text?: string }) => Promise<void>;
        };

        // Prefer Web Share API when available, otherwise fallback to copy
        if (nav.share) {
            try {
                await nav.share({ text, title: 'AI Assistant' });
                return;
            } catch (error) {
                console.error('Error sharing:', error);
                // Continue to fallback if sharing fails
            }
        }

        // Fallback to copy to clipboard
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Optionally show a user-friendly error message
        }
    };

    const handleVariantNav = (mId: string, dir: 'prev' | 'next') => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg.id !== mId) return msg;
                const count = msg.variants?.length ?? 0;
                if (count <= 1) return msg;
                const idx = msg.variantIndex ?? 0;
                const nextIdx =
                    dir === 'prev'
                        ? Math.max(0, idx - 1)
                        : Math.min(count - 1, idx + 1);
                return { ...msg, variantIndex: nextIdx };
            }),
        );
    };

    // Clear chat history when user changes
    useEffect(() => {
        const currentUserId = authUser?.id?.toString();

        // If user ID has changed (including from null to a user or vice versa)
        if (currentUserId !== previousUserId.current) {
            // Reset chat to initial state
            setMessages([
                {
                    id: 'm1',
                    role: 'assistant',
                    content: `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your Research AI assistant. Ask me anything, type a message below.`,
                    variants: [
                        `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your Research AI assistant. Ask me anything, type a message below.`,
                    ],
                    variantIndex: 0,
                },
            ]);

            // Update the previous user ID
            previousUserId.current = currentUserId || null;
        }
    }, [authUser?.id, authUser?.name]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, isTyping]);

    const getCsrfToken = () => {
        // First try to get from meta tag
        const metaTag = document.querySelector(
            'meta[name="csrf-token"]',
        ) as HTMLMetaElement | null;
        if (metaTag?.content) return metaTag.content;

        // Fallback to Laravel's default token name in cookies
        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        return token ? decodeURIComponent(token) : '';
    };

    const sendMessage = () => {
        const content = input.trim();
        if (!content || isTyping) return;
        const userMsg = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        setIsTyping(true);
        // Call backend to get real Gemini reply
        (async () => {
            try {
                const csrfToken = getCsrfToken();
                if (!csrfToken) {
                    console.error('CSRF token not found');
                    throw new Error('CSRF token not found');
                }

                const res = await fetch('/chatbot/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-XSRF-TOKEN': csrfToken,
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ message: content }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    const msg = err?.error || `Request failed (${res.status})`;
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: `Error: ${msg}`,
                        },
                    ]);
                    return;
                }

                const data = (await res.json()) as { reply?: string };
                const reply = data.reply?.trim() || '(No response)';
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: reply,
                        variants: [reply],
                        variantIndex: 0,
                    },
                ]);
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred';
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: 'assistant' as const,
                        content: `Error: ${errorMessage}`,
                    },
                ]);
            } finally {
                setIsTyping(false);
            }
        })();
    };

    const redoAssistant = (assistantId: string) => {
        if (isTyping) return;
        // find the preceding user message for this assistant
        const idx = messages.findIndex((m) => m.id === assistantId);
        if (idx <= 0) return; // nothing to redo if no previous message
        // scan backwards for the nearest user message
        let prompt = '';
        for (let i = idx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                prompt = messages[i].content;
                break;
            }
        }
        if (!prompt) return;

        setIsTyping(true);
        (async () => {
            try {
                const res = await fetch('/chatbot/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'X-XSRF-TOKEN': getCsrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ message: prompt }),
                });
                if (!res.ok) {
                    setIsTyping(false);
                    return;
                }
                const data = (await res.json()) as { reply?: string };
                const reply = data.reply?.trim() || '(No response)';
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id !== assistantId) return m;
                        const variants = [
                            ...(m.variants ?? [m.content]),
                            reply,
                        ];
                        return {
                            ...m,
                            content: reply,
                            variants,
                            variantIndex: variants.length - 1,
                        };
                    }),
                );
            } catch (error) {
                console.error('Error in redoAssistant:', error);
                // Optionally show a user-friendly error message
            } finally {
                setIsTyping(false);
            }
        })();
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
        e,
    ) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Chatbot" />
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden bg-white dark:bg-neutral-900">
                {/* Fixed Header */}
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-[#163832] dark:from-green-600 dark:to-[#235347] shadow-sm">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">Research AI Assistant</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Gemini-2.5-flash</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setMessages([
                                        {
                                            id: crypto.randomUUID(),
                                            role: 'assistant',
                                            content: `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your Research AI assistant. How can I help you today?`,
                                            variants: [`Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your Research AI assistant. How can I help you today?`],
                                            variantIndex: 0,
                                        },
                                    ]);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                                title="New chat"
                            >
                                <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Messages Container */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto hide-scrollbar"
                >
                    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
                        {messages.map((m: ChatMessage, index: number) => (
                            <div
                                key={m.id}
                                className={`mb-6 ${m.role === 'user' ? 'sm:ml-auto' : ''}`}
                            >
                                <div className={`flex gap-3 ${m.role === 'user' ? 'justify-end sm:flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 ${m.role === 'user' ? 'sm:order-2' : ''}`}>
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                            m.role === 'user'
                                                ? 'bg-[#163832] dark:bg-[#235347]'
                                                : 'bg-gradient-to-br from-green-400 to-[#163832] dark:from-green-600 dark:to-[#235347] shadow-sm'
                                        }`}>
                                            {m.role === 'user' ? (
                                                <UserIcon className="h-4 w-4 text-white" />
                                            ) : (
                                                <Bot className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Content */}
                                    <div className={`flex-1 ${m.role === 'user' ? 'sm:order-1 sm:max-w-lg' : 'sm:max-w-2xl'}`}>
                                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                            m.role === 'user'
                                                ? 'bg-[#163832] text-white sm:rounded-2xl sm:rounded-tl-none'
                                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 sm:rounded-2xl sm:rounded-tr-none'
                                        }`}>
                                            {m.role === 'assistant' ? (
                                                <div dangerouslySetInnerHTML={{ __html: formatAIText(getAssistantText(m)) }} />
                                            ) : (
                                                <div>{m.content}</div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        {m.role === 'assistant' && (
                                            <div className="mt-2 flex items-center gap-1">
                                                <button
                                                    onClick={() => handleCopy(m)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                    title="Copy"
                                                >
                                                    <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleShare(m)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                    title="Share"
                                                >
                                                    <Share2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => redoAssistant(m.id)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                    title="Regenerate"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadMessage(m)}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                    title="Download"
                                                >
                                                    <Download className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                {m.variants && m.variants.length > 1 && (
                                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-neutral-800">
                                                        <button
                                                            onClick={() => handleVariantNav(m.id, 'prev')}
                                                            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-neutral-700"
                                                            title="Previous variation"
                                                        >
                                                            <ChevronLeft className="h-3 w-3.5 text-gray-600 dark:text-gray-400" />
                                                        </button>
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {(m.variantIndex ?? 0) + 1}/{m.variants.length}
                                                        </span>
                                                        <button
                                                            onClick={() => handleVariantNav(m.id, 'next')}
                                                            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-neutral-700"
                                                            title="Next variation"
                                                        >
                                                            <ChevronRight className="h-3 w-3.5 text-gray-600 dark:text-gray-400" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="mb-6">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-[#163832] dark:from-green-600 dark:to-[#235347] shadow-sm">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 sm:max-w-2xl">
                                        <div className="rounded-2xl bg-gray-100 dark:bg-neutral-800 px-4 py-3 sm:rounded-tr-none">
                                            <div className="flex items-center gap-1">
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:0ms]"></span>
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:150ms]"></span>
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500 [animation-delay:300ms]"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Input Area */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                    placeholder="Type your message..."
                                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-500 outline-none focus:border-[#163832] focus:ring-2 focus:ring-[#163832]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder-gray-400 dark:text-white dark:focus:border-[#235347] dark:focus:ring-[#235347]/20"
                                    style={{
                                        height: '40px',
                                        minHeight: '40px',
                                        maxHeight: '120px',
                                        resize: 'none',
                                    }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        if (target.scrollHeight <= 40) {
                                            target.style.height = '40px';
                                        } else {
                                            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!canSend}
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all flex-shrink-0 ${
                                    canSend
                                        ? 'bg-gradient-to-br from-green-400 to-[#163832] text-white hover:from-green-500 hover:to-[#163832]/90 shadow-sm dark:from-green-600 dark:to-[#235347] dark:hover:from-green-700 dark:hover:to-[#235347]/90'
                                        : 'bg-gray-200 text-gray-400 dark:bg-neutral-700 dark:text-gray-500'
                                }`}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                            AI can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
