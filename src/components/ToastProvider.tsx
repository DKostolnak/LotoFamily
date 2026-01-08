'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'celebration';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    icon?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, icon?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeouts = useRef<Map<number, number>>(new Map());
    const nextId = useRef(0);

    const dismissToast = useCallback((id: number) => {
        const timeout = timeouts.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeouts.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', icon?: string) => {
        const id = nextId.current++;
        setToasts(prev => [...prev, { id, message, type, icon }]);

        const timeout = window.setTimeout(() => {
            dismissToast(id);
        }, 4000);

        timeouts.current.set(id, timeout);
    }, [dismissToast]);

    useEffect(() => {
        const timeoutMap = timeouts.current;
        return () => {
            timeoutMap.forEach(timeout => clearTimeout(timeout));
            timeoutMap.clear();
        };
    }, []);

    const getToastStyles = (type: ToastType): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            animation: 'slideInRight 0.3s ease-out',
            fontWeight: 500,
            fontSize: '14px',
        };

        switch (type) {
            case 'success':
                return { ...baseStyles, background: '#43a047', color: 'white' };
            case 'error':
                return { ...baseStyles, background: '#e53935', color: 'white' };
            case 'warning':
                return { ...baseStyles, background: '#ff9800', color: 'white' };
            case 'celebration':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                    color: '#5d4037',
                    fontWeight: 700,
                };
            default:
                return { ...baseStyles, background: '#795548', color: 'white' };
        }
    };

    const defaultIcons: Record<ToastType, string> = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        celebration: '🎉',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div
                style={{
                    position: 'fixed',
                    top: '16px',
                    right: '16px',
                    zIndex: 1200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    width: 'min(320px, 90vw)',
                }}
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map(toast => (
                    <div key={toast.id} style={getToastStyles(toast.type)} role="status">
                        <span aria-hidden="true">{toast.icon || defaultIcons[toast.type]}</span>
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button
                            type="button"
                            onClick={() => dismissToast(toast.id)}
                            className="btn btn-xs"
                            style={{
                                background: 'transparent',
                                color: 'inherit',
                                boxShadow: 'none',
                                border: '1px solid currentColor',
                                padding: '4px 8px',
                                minHeight: 'auto',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* Animation styles */}
            <style jsx global>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
