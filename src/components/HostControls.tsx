'use client';

import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import CallerBoard from './CallerBoard';

interface HostControlsProps {
    remainingCount: number;
    currentNumber: number | null;
    calledNumbers: number[];
    isPaused: boolean;
    language: 'en' | 'sk' | 'uk' | 'ru';
    onCallNumber?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onEndGame?: () => void;
}

/**
 * HostControls Component
 * Floating action buttons and control panel for the game host
 * Handles pause/resume, call next number, show board, end game
 */
export default function HostControls({
    remainingCount,
    currentNumber,
    calledNumbers,
    isPaused,
    language,
    onCallNumber,
    onPause,
    onResume,
    onEndGame,
}: HostControlsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const t = translations[language];

    const canCallNumber = remainingCount > 0 && !isPaused;

    return (
        <>
            {/* Collapsed Mode: Minimal FABs */}
            {!isExpanded && (
                <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
                    {/* Call Next FAB */}
                    <button
                        className="btn btn-primary shadow-lg"
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid var(--color-bg-paper)'
                        }}
                        onClick={onCallNumber}
                        disabled={!canCallNumber}
                        aria-label="Call next number"
                    >
                        🎲
                    </button>

                    {/* Expand Menu FAB */}
                    <button
                        className="btn btn-secondary shadow-lg"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setIsExpanded(true)}
                        aria-label="Show host controls"
                    >
                        ⚙️
                    </button>
                </div>
            )}

            {/* Expanded Mode: Full Bar */}
            {isExpanded && (
                <div className="fixed bottom-0 left-0 right-0 bg-black/90 p-3 pt-2 pb-safe z-50 border-t border-white/10 backdrop-blur-md animate-slide-up">
                    {/* Close Button */}
                    <button
                        className="absolute -top-10 right-4 bg-black/80 px-3 py-1 rounded-t-lg text-sm border-t border-x border-white/10"
                        onClick={() => setIsExpanded(false)}
                    >
                        🔽 Hide
                    </button>

                    <div className="max-w-md mx-auto flex items-center justify-between gap-2">
                        {/* Pause/Resume */}
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.8rem', fontSize: '1.2rem' }}
                            onClick={isPaused ? onResume : onPause}
                            aria-label={isPaused ? 'Resume game' : 'Pause game'}
                        >
                            {isPaused ? '▶️' : '⏸️'}
                        </button>

                        {/* Call Next (Big Button) */}
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.8rem', fontSize: '1.1rem', fontWeight: 800 }}
                            onClick={onCallNumber}
                            disabled={!canCallNumber}
                        >
                            🎲 {t.callNext}
                        </button>

                        {/* Show Board Button */}
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.8rem', fontSize: '1.2rem' }}
                            onClick={() => (document.getElementById('callerBoardModal') as HTMLDialogElement)?.showModal()}
                            aria-label="Show caller board"
                        >
                            📋
                        </button>

                        {/* End Game (Mini) */}
                        <button
                            className="btn btn-danger"
                            style={{ padding: '0.8rem', fontSize: '1.2rem' }}
                            onClick={() => {
                                if (confirm('End game?')) onEndGame?.();
                            }}
                            aria-label="End game"
                        >
                            🛑
                        </button>
                    </div>
                </div>
            )}

            {/* Caller Board Modal */}
            <dialog
                id="callerBoardModal"
                className="modal modal-bottom sm:modal-middle bg-transparent backdrop:bg-black/80"
            >
                <div className="modal-box bg-[var(--color-bg-paper)] text-[var(--color-text-primary)] border-2 border-[var(--color-gold)]">
                    <h3 className="font-bold text-lg mb-4 text-center">
                        📋 {t.currentNumber}
                    </h3>
                    <CallerBoard
                        calledNumbers={calledNumbers}
                        currentNumber={currentNumber}
                    />
                    <div className="modal-action justify-center mt-6">
                        <form method="dialog">
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* Bottom Padding to prevent overlap */}
            <div style={{ height: '80px' }} />
        </>
    );
}
