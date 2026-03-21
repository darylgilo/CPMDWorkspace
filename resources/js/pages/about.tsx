import logoImage from '@/Assets/Images/bpi-cpmd-logo.png';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function About() {
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
            <Head title="About">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-gray-900 font-sans" style={{ fontFamily: 'Lato, sans-serif' }}>
                {/* Header */}
                <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm dark:border-gray-700 dark:bg-black/80 dark:shadow-gray-900/50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-14 items-center justify-between sm:h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <img
                                    src={logoImage}
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
                                        className="rounded-lg bg-[#163832] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#163832]/90 hover:text-white hover:shadow-lg sm:px-6 sm:py-2.5 sm:text-sm md:w-auto dark:bg-[#235347] dark:hover:bg-[#235347]/90"
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
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-24">
                    <div className="space-y-12">
                        {/* Back Arrow */}
                        <div className="flex justify-start">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                aria-label="Go back home"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Back
                            </Link>
                        </div>

                        {/* Page Title */}
                        <div className="text-center">
                            <h1 className="text-4xl leading-tight font-bold text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
                                About CPMD Workspace
                            </h1>
                            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                Learn more about our comprehensive management platform and the team behind it
                            </p>
                        </div>

                        {/* App Overview Section */}
                        <section className="bg-white rounded-xl shadow-lg p-8 dark:bg-gray-800 dark:shadow-gray-900/50">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">App Overview</h2>
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    CPMD Workspace is a comprehensive digital management platform designed specifically for the Crop Pest Management Division. 
                                    This all-in-one solution streamlines operational efficiency by integrating team collaboration, resource management, 
                                    and communication tools into a unified platform. Built with modern web technologies, the system provides seamless workflow 
                                    coordination for agricultural pest management operations, enabling teams to work more effectively and efficiently.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                                    The platform combines essential modules including employee management, task tracking, inventory control, 
                                    budget management, and communication tools to create a complete ecosystem for agricultural operations management.
                                </p>
                            </div>
                        </section>

                        {/* Features Section */}
                        <section className="bg-white rounded-xl shadow-lg p-8 dark:bg-gray-800 dark:shadow-gray-900/50">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">Key Features</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-700">
                                    <div className="w-12 h-12 bg-[#163832] rounded-lg flex items-center justify-center mb-4 dark:bg-[#235347]">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Employee Management</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">Comprehensive user and employee management with role-based access control</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-700">
                                    <div className="w-12 h-12 bg-[#163832] rounded-lg flex items-center justify-center mb-4 dark:bg-[#235347]">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Task Management</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced task board with timeline tracking and collaborative features</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-700">
                                    <div className="w-12 h-12 bg-[#163832] rounded-lg flex items-center justify-center mb-4 dark:bg-[#235347]">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Helpdesk</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">Integrated system for managing support tickets and user inquiries</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-700">
                                    <div className="w-12 h-12 bg-[#163832] rounded-lg flex items-center justify-center mb-4 dark:bg-[#235347]">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m11.314 0A9.998 9.998 0 005.636 5.636m11.314 0A9.998 9.998 0 0118.364 18.364L17.657 16.657z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Whereabouts</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">Real-time location tracking and status updates for field personnel</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-700">
                                    <div className="w-12 h-12 bg-[#163832] rounded-lg flex items-center justify-center mb-4 dark:bg-[#235347]">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Communication Hub</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">Integrated noticeboard, announcements, MEMO, meetings, and deadlines</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 dark:bg-gray-700">
                                    <div className="w-12 h-12 bg-[#163832] rounded-lg flex items-center justify-center mb-4 dark:bg-[#235347]">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">Security & Compliance</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">Advanced security features with two-factor authentication and role-based permissions</p>
                                </div>
                            </div>
                        </section>


                        
                        {/* Version and Release Info */}
                        <section className="bg-gray-50 rounded-xl p-8 dark:bg-gray-800">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">Version & Release Information</h2>
                                <div className="inline-flex items-center space-x-6 bg-white rounded-lg px-6 py-4 shadow-md dark:bg-gray-700">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">v1.0.0</p>
                                    </div>
                                    <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Release Date</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">March 2026</p>
                                    </div>
                                    <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">Production Ready</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Copyright Section */}
                        <footer className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400">
                                © 2026 Crop Pest Management Division. All rights reserved.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                Developed and maintained by CPMD-ICT UNIT
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    );
}
