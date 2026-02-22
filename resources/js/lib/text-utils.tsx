import React from 'react';

/**
 * Renders text with clickable URLs and properly handles line breaks.
 * @param text The text to render
 * @param className Optional className for the container div
 * @returns React elements with clickable links
 */
export const renderTextWithLinks = (text: string | null | undefined) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Split by newlines first to preserve formatting
    return text.split('\n').map((line, lineIdx) => (
        <React.Fragment key={lineIdx}>
            {line.split(urlRegex).map((part, partIdx) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={`${lineIdx}-${partIdx}`}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-600 hover:underline dark:text-blue-400"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
            {lineIdx < text.split('\n').length - 1 && <br />}
        </React.Fragment>
    ));
};
