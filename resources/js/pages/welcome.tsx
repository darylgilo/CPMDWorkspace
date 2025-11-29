import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check if dark mode is enabled
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
    }, []);

    const toggleDarkMode = () => {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                {/* Header */}
                <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-14 items-center justify-between sm:h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <img
                                    src="/images/bpi-cpmd-logo.png"
                                    alt="CPMD"
                                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                                />
                                <span className="text-sm font-bold text-gray-900 sm:text-base lg:text-xl dark:text-white">
                                    <span className="sm:hidden">CPMD</span>
                                    <span className="hidden sm:inline">
                                        CROP PEST MANAGEMENT DIVISION
                                    </span>
                                </span>
                            </div>

                            {/* Navigation */}
                            <nav className="flex items-center gap-1.5 sm:gap-2">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={toggleDarkMode}
                                    className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                    aria-label="Toggle dark mode"
                                >
                                    {isDark ? (
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                            />
                                        </svg>
                                    )}
                                </button>

                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg sm:px-6 sm:py-2.5 sm:text-sm"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:px-6 sm:py-2.5 sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={register()}
                                            className="rounded-lg bg-[#163832] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#163832]/90 hover:text-white hover:shadow-lg sm:px-6 sm:py-2.5 sm:text-sm md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                        >
                                            Sign up
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-24">
                    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                        {/* Left Content */}
                        <div className="space-y-6 lg:space-y-8">
                            <div className="space-y-3 lg:space-y-4">
                                <h1 className="text-3xl leading-tight font-bold text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl dark:text-white">
                                    CPMD Workspace
                                </h1>
                                <p className="text-base leading-relaxed text-gray-600 sm:text-lg dark:text-gray-300">
                                    a streamlined, all-in-one web platform
                                    designed to help teams plan, manage, and
                                    deliver projects with clarity and
                                    efficiency. Built for modern workflows,
                                    brings together communication, project
                                    tracking, document organization, and
                                    decision-making tools into a single
                                    intuitive environment.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                    className="rounded-lg bg-[#163832] px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#163832]/90 hover:text-white hover:shadow-xl sm:px-8 sm:py-3.5 sm:text-base md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
                                >
                                    Sign up
                                </Link>
                                <a
                                    href="https://www.facebook.com/croppestmanagementdivision"
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:px-8 sm:py-3.5 sm:text-base dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                        />
                                    </svg>
                                    Visit our Website
                                </a>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative flex items-center justify-center">
                            <img
                                src={
                                    isDark
                                        ? '/images/hero-image2.png'
                                        : '/images/hero-image.png'
                                }
                                alt="Team collaboration illustration"
                                className="h-auto w-full scale-125 lg:scale-150"
                            />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
