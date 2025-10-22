import React, { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Bot, Send, User as UserIcon, Download, RefreshCw, Copy, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Assistant',
        href: '/chatbot',
    },
];

// Define the user type
type User = {
    id?: string | number;
    name?: string;
};

// Define the page props
type PageProps = {
    auth?: {
        user?: User;
    };
    [key: string]: any; // Allow additional properties
};

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
        const welcomeMessage = `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your AI assistant. Ask me anything or type a message below.`;
        
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

    const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

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

    const handleDownloadMessage = (m: ChatMessage) => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const filename = `ai-${m.role}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${m.id.slice(0, 8)}.txt`;
        downloadText(filename, getAssistantText(m));
    };

    const handleCopy = async (m: ChatMessage) => {
        try {
            await navigator.clipboard.writeText(getAssistantText(m));
        } catch {}
    };

    const handleShare = async (m: ChatMessage) => {
        const text = getAssistantText(m);
        // Prefer Web Share API when available, otherwise fallback to copy
        if ((navigator as any).share) {
            try {
                await (navigator as any).share({ text, title: 'AI Assistant' });
                return;
            } catch {}
        }
        try {
            await navigator.clipboard.writeText(text);
        } catch {}
    };

    const handleVariantNav = (mId: string, dir: 'prev' | 'next') => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg.id !== mId) return msg;
                const count = msg.variants?.length ?? 0;
                if (count <= 1) return msg;
                const idx = msg.variantIndex ?? 0;
                const nextIdx = dir === 'prev' ? Math.max(0, idx - 1) : Math.min(count - 1, idx + 1);
                return { ...msg, variantIndex: nextIdx };
            })
        );
    };

    // Clear chat history when user changes
    useEffect(() => {
        const currentUserId = authUser?.id?.toString();
        
        // If user ID has changed (including from null to a user or vice versa)
        if (currentUserId !== previousUserId.current) {
            // Reset chat to initial state
            setMessages([{
                id: 'm1',
                role: 'assistant',
                content: `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your AI assistant. Ask me anything or type a message below.`,
                variants: [
                    `Hi${authUser?.name ? ' ' + authUser.name : ''}! I'm your AI assistant. Ask me anything or type a message below.`,
                ],
                variantIndex: 0,
            }]);
            
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
        const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (metaTag?.content) return metaTag.content;
        
        // Fallback to Laravel's default token name in cookies
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
            
        return token ? decodeURIComponent(token) : '';
    };

    const sendMessage = () => {
        const content = input.trim();
        if (!content || isTyping) return;
        const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content };
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
                        'Accept': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ message: content }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    const msg = err?.error || `Request failed (${res.status})`;
                    setMessages((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${msg}` },
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
            } catch (e: any) {
                setMessages((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), role: 'assistant', content: `Network error: ${e?.message || e}` },
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
                        'Accept': 'application/json',
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
                        const variants = [...(m.variants ?? [m.content]), reply];
                        return { ...m, content: reply, variants, variantIndex: variants.length - 1 };
                    })
                );
            } catch {
            } finally {
                setIsTyping(false);
            }
        })();
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Chatbot" />
            <div className="flex h-[calc(100vh-12rem)] flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-sidebar-border/70 p-3 dark:border-sidebar-border md:h-[calc(100vh-10rem)]">
                <div className="flex items-center gap-2 rounded-md bg-muted/40 p-2 text-sm">
                    <Bot className="h-4 w-4" />
                    <span>Gemini-2.5-flash</span>
                </div>

                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {messages.map((m: ChatMessage) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] items-start gap-2`}>
                                {m.role === 'assistant' && (
                                    <div className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}
                                <div
                                    className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                                        m.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-muted'
                                    }`}
                                >
                                    {m.role === 'assistant' ? getAssistantText(m) : m.content}
                                </div>
                                {m.role === 'user' && (
                                    <div className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            {m.role === 'assistant' && (
                                <div className="ml-9 flex items-center gap-1 py-1 text-xs text-foreground/80">
                                    <button
                                        onClick={() => handleDownloadMessage(m)}
                                        className="inline-flex h-6 items-center justify-center rounded px-2 hover:bg-muted"
                                        title="Download"
                                        aria-label="Download"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => redoAssistant(m.id)}
                                        className="inline-flex h-6 items-center justify-center rounded px-2 hover:bg-muted"
                                        title="Redo"
                                        aria-label="Redo"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleShare(m)}
                                        className="inline-flex h-6 items-center justify-center rounded px-2 hover:bg-muted"
                                        title="Share"
                                        aria-label="Share"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(m)}
                                        className="inline-flex h-6 items-center justify-center rounded px-2 hover:bg-muted"
                                        title="Copy"
                                        aria-label="Copy"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    {m.variants && m.variants.length > 1 && (
                                        <div className="ml-2 inline-flex items-center gap-1">
                                            <button
                                                onClick={() => handleVariantNav(m.id, 'prev')}
                                                className="inline-flex h-6 items-center justify-center rounded px-1 hover:bg-muted"
                                                title="Previous variation"
                                                aria-label="Previous variation"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="tabular-nums">{(m.variantIndex ?? 0) + 1} / {m.variants.length}</span>
                                            <button
                                                onClick={() => handleVariantNav(m.id, 'next')}
                                                className="inline-flex h-6 items-center justify-center rounded px-1 hover:bg-muted"
                                                title="Next variation"
                                                aria-label="Next variation"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex max-w-[80%] items-start gap-2">
                                <div className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="rounded-2xl bg-muted px-3 py-2 text-sm">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="h-1 w-1 animate-bounce rounded-full bg-foreground [animation-delay:0ms]"></span>
                                        <span className="h-1 w-1 animate-bounce rounded-full bg-foreground [animation-delay:150ms]"></span>
                                        <span className="h-1 w-1 animate-bounce rounded-full bg-foreground [animation-delay:300ms]"></span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-sidebar-border/70 pt-2 dark:border-sidebar-border">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            placeholder="Type a message..."
                            className="min-h-[44px] w-full resize-y rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!canSend}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

