/**
 * Skeleton Component
 * 
 * Animated loading placeholder for async content.
 * Provides visual feedback during data loading.
 */

import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    animation?: 'pulse' | 'wave' | 'none';
    className?: string;
}

export function Skeleton({
    width = '100%',
    height = '1rem',
    variant = 'text',
    animation = 'pulse',
    className = '',
}: SkeletonProps) {
    const variantClasses = {
        text: 'rounded-[var(--radius-sm)]',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-[var(--radius-md)]',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'skeleton-wave',
        none: '',
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={`
                bg-[var(--color-card-border)] 
                ${variantClasses[variant]} 
                ${animationClasses[animation]}
                ${className}
            `}
            style={style}
            aria-hidden="true"
        />
    );
}

// Card skeleton preset
export function CardSkeleton() {
    return (
        <div className="card p-4 space-y-3">
            <Skeleton height={20} width="60%" />
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton height={16} width="80%" />
        </div>
    );
}

// Avatar skeleton preset
export function AvatarSkeleton({ size = 48 }: { size?: number }) {
    return <Skeleton variant="circular" width={size} height={size} />;
}

// Player list item skeleton
export function PlayerListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-2">
            <AvatarSkeleton size={40} />
            <div className="flex-1 space-y-2">
                <Skeleton height={14} width="60%" />
                <Skeleton height={10} width="40%" />
            </div>
        </div>
    );
}

export default Skeleton;
