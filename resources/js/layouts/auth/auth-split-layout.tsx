import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0 ">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-[#235347]" />
                <div className="relative z-20 flex items-center">
                    <img
                        src="/images/bagong-pilipinas-logo.png"
                        alt="Bagong Pilipinas Logo"
                        className="h-20 w-auto"
                    />
                    <img
                        src="/images/da-bpi-logo.png"
                        alt="Department of Agriculture - Bureau of Plant Industry"
                        className="h-20 w-auto"
                    />
                </div>

                <div className="relative z-20 flex flex-1 items-center justify-center">
                    <img
                        src="/images/auth-illustration.png"
                        alt="Dashboard illustration"
                        className="w-full max-w-full h-auto"
                    />
                </div>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-sm text-neutral-300">
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-3 lg:hidden"
                    >
                        <img
                            src="/images/bagong-pilipinas-logo.png"
                            alt="Bagong Pilipinas Logo"
                            className="h-10 w-auto sm:h-12"
                        />
                        <img
                            src="/images/da-bpi-logo.png"
                            alt="Department of Agriculture - Bureau of Plant Industry"
                            className="h-10 w-auto sm:h-12"
                        />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
