'use client';

/**
 * ConfirmModal Component
 * 
 * A reusable confirmation modal with wooden-themed styling.
 * Renders via React Portal to ensure proper stacking above all content.
 * 
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Leave game?"
 *   onConfirm={handleLeave}
 *   onCancel={() => setShowConfirm(false)}
 *   variant="danger"
 * />
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { playClickSound } from '@/lib/audio';

// ============================================================================
// TYPES
// ============================================================================

export type ConfirmModalVariant = 'danger' | 'warning' | 'info';

export interface ConfirmModalProps {
    /** Whether the modal is currently visible */
    isOpen: boolean;
    /** Modal title/question text */
    title: string;
    /** Callback when user confirms the action */
    onConfirm: () => void;
    /** Callback when user cancels/dismisses the modal */
    onCancel: () => void;
    /** Text for confirm button (default: "Yes") */
    confirmText?: string;
    /** Text for cancel button (default: "No") */
    cancelText?: string;
    /** Visual variant affecting confirm button color */
    variant?: ConfirmModalVariant;
    /** Optional subtitle/description text */
    subtitle?: string;
    /** Whether to play click sounds on button press */
    enableSound?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODAL_Z_INDEX = 9999;

const VARIANT_STYLES: Record<ConfirmModalVariant, {
    background: string;
    border: string;
    shadow: string;
}> = {
    danger: {
        background: 'linear-gradient(145deg, #e85d5d 0%, #c23a3a 100%)',
        border: '3px solid #8b2020',
        shadow: '0 4px 0 #6b1515',
    },
    warning: {
        background: 'linear-gradient(145deg, #f5a623 0%, #d4890a 100%)',
        border: '3px solid #8b6914',
        shadow: '0 4px 0 #6b5010',
    },
    info: {
        background: 'linear-gradient(145deg, #4a90d9 0%, #2e6bb4 100%)',
        border: '3px solid #1e4b7a',
        shadow: '0 4px 0 #15365a',
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfirmModal({
    isOpen,
    title,
    onConfirm,
    onCancel,
    confirmText = 'Yes',
    cancelText = 'No',
    variant = 'danger',
    subtitle,
    enableSound = true,
}: ConfirmModalProps): React.ReactElement | null {
    const modalRef = useRef<HTMLDivElement>(null);
    const variantStyle = VARIANT_STYLES[variant];

    // Handle confirm with optional sound
    const handleConfirm = useCallback(() => {
        if (enableSound) {
            playClickSound();
        }
        onConfirm();
    }, [enableSound, onConfirm]);

    // Handle cancel with optional sound
    const handleCancel = useCallback(() => {
        if (enableSound) {
            playClickSound();
        }
        onCancel();
    }, [enableSound, onCancel]);

    // Handle keyboard events (Escape to close)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleCancel]);

    // Focus trap - focus the modal when it opens
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    // Don't render if not open or not in browser
    if (!isOpen || typeof document === 'undefined') {
        return null;
    }

    const modalContent = (
        <div
            className="animate-fadeIn"
            style={{
                zIndex: MODAL_Z_INDEX,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                padding: '16px',
            }}
            onClick={handleCancel}
            role="presentation"
        >
            {/* Modal Card - Wooden Theme */}
            <div
                ref={modalRef}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundImage: 'url(/assets/wood-seamless.png)',
                    backgroundSize: '256px 256px',
                    backgroundRepeat: 'repeat',
                    borderRadius: '20px',
                    border: '4px solid #2d1f10',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                    padding: '24px',
                    width: '100%',
                    maxWidth: '320px',
                    outline: 'none',
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby={subtitle ? 'confirm-modal-desc' : undefined}
            >
                {/* Title */}
                <h3
                    id="confirm-modal-title"
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: subtitle ? '8px' : '20px',
                        color: '#f5e6c8',
                        textShadow: '1px 1px 0 #3d2814, -1px -1px 0 #3d2814, 1px -1px 0 #3d2814, -1px 1px 0 #3d2814, 0 2px 4px rgba(0,0,0,0.6)',
                    }}
                >
                    {title}
                </h3>

                {/* Optional Subtitle */}
                {subtitle && (
                    <p
                        id="confirm-modal-desc"
                        style={{
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            marginBottom: '20px',
                            color: '#d4c4a8',
                            opacity: 0.8,
                        }}
                    >
                        {subtitle}
                    </p>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {/* Cancel Button */}
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="active:scale-95 transition-transform"
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                            borderRadius: '12px',
                            border: '3px solid #5a4025',
                            boxShadow: '0 4px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#3d2814',
                            cursor: 'pointer',
                        }}
                    >
                        {cancelText}
                    </button>

                    {/* Confirm Button */}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="active:scale-95 transition-transform"
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            background: variantStyle.background,
                            borderRadius: '12px',
                            border: variantStyle.border,
                            boxShadow: `${variantStyle.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#fff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default ConfirmModal;
