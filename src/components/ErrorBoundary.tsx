'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in child component tree and displays
 * a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI - themed to match game aesthetics
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-bg)] p-4">
                    <div className="wooden-panel text-center max-w-md">
                        <div className="text-6xl mb-4" role="img" aria-label="Error">😵</div>
                        <h2 className="text-xl font-bold mb-2 text-[var(--color-gold)]">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-sm opacity-80 mb-6">
                            {this.state.error?.message || 'An unexpected error occurred in the game'}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                className="btn btn-primary w-full"
                                onClick={this.handleReset}
                            >
                                🔄 Try Again
                            </button>
                            <button
                                className="btn btn-secondary w-full"
                                onClick={() => window.location.reload()}
                            >
                                🔃 Reload Game
                            </button>
                            <button
                                className="btn btn-wood w-full"
                                onClick={() => {
                                    // Clear game state and go to menu
                                    localStorage.removeItem('loto_lastRoom');
                                    this.handleReset();
                                }}
                            >
                                🏠 Back to Menu
                            </button>
                        </div>
                        <p className="text-xs opacity-50 mt-4">
                            If this keeps happening, try clearing your browser cache
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
