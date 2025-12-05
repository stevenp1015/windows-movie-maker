import React from 'react';

interface CharacterIconProps {
    className?: string;
    size?: number;
}

/**
 * Custom Character Icon (person with raised arms) with rainbow fill animation on hover.
 * For the decomposition/visual bible phase.
 */
const CharacterIcon: React.FC<CharacterIconProps> = ({ className = '', size = 24 }) => {
    return (
        <div
            className={`character-icon-wrapper ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Rainbow gradient layer - masked by the character shape */}
            <div className="character-icon-fill" />

            {/* Stroke layer - always visible */}
            <svg
                className="character-icon-stroke"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="none"
                stroke="currentColor"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={size}
                height={size}
            >
                {/* Head */}
                <circle cx="320" cy="152" r="80" />

                {/* Body */}
                <path d="M289.5 368L350.5 368C360.2 368 368 375.8 368 385.5C368 389.7 366.5 393.7 363.8 396.9L336.4 428.9L367.4 544L368 544L402.6 405.5C404.8 396.8 413.7 391.5 422.1 394.7C484 418.3 528 478.3 528 548.5C528 563.6 515.7 575.9 500.6 575.9L139.4 576C124.3 576 112 563.7 112 548.6C112 478.4 156 418.4 217.9 394.8C226.3 391.6 235.2 396.9 237.4 405.6L272 544.1L272.6 544.1L303.6 429L276.2 397C273.5 393.8 272 389.8 272 385.6C272 375.9 279.8 368.1 289.5 368.1" />
            </svg>
        </div>
    );
};

export default CharacterIcon;
