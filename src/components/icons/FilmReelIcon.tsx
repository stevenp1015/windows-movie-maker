import React from 'react';

interface FilmReelIconProps {
    className?: string;
    size?: number;
}

/**
 * Custom Film Reel Icon (projector/camera style) with rainbow fill animation on hover.
 * For the production phase - let's make some movies.
 */
const FilmReelIcon: React.FC<FilmReelIconProps> = ({ className = '', size = 24 }) => {
    return (
        <div
            className={`filmreel-icon-wrapper ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Rainbow gradient layer - masked by the film reel shape */}
            <div className="filmreel-icon-fill" />

            {/* Stroke layer - always visible */}
            <svg
                className="filmreel-icon-stroke"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="none"
                stroke="currentColor"
                strokeWidth="32"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={size}
                height={size}
            >
                {/* Main body - the center reel housing */}
                <rect x="195" y="145" width="250" height="350" rx="50" />

                {/* Left reel */}
                <path d="M195 220H120a50 50 0 0 0-50 50v120a50 50 0 0 0 50 50h75" />

                {/* Right reel */}
                <path d="M445 220h75a50 50 0 0 1 50 50v120a50 50 0 0 1-50 50h-75" />

                {/* Center details - film sprockets / lens vibes */}
                <circle cx="320" cy="320" r="60" strokeWidth="24" />
                <circle cx="320" cy="320" r="20" strokeWidth="16" />
            </svg>
        </div>
    );
};

export default FilmReelIcon;
