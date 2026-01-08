'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [isBoardOpen, setIsBoardOpen] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const boardRef = useRef<HTMLDialogElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const t = translations[language];

    const canCallNumber = remainingCount > 0 && !isPaused;

    useEffect(() => {
        const dialog = boardRef.current;
        if (!dialog) return;
        if (isBoardOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isBoardOpen && dialog.open) {
            dialog.close();
        }
    }, [isBoardOpen]);

    useEffect(() => {
        if (showEndConfirm) {
            confirmRef.current?.focus();
        }
    }, [showEndConfirm]);

    const handleTogglePause = () => {
        if (isPaused) onResume?.();
        else onPause?.();
    };

    const endGameDialog = showEndConfirm
        ? createPortal(
              <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="end-game-title"
                  className="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
                  style={{ zIndex: 2000 }}
              >
                  <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
                      <h3 id="end-game-title" style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-sm)' }}>
                          🛑 {t.endGame}
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                          {t.endGameConfirm ?? 'Are you sure you want to finish this round for everyone?'}
                      </p>
                      <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                          <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => setShowEndConfirm(false)}
                          >
                              {t.back}
                          </button>
                          <button
                              className="btn btn-danger"
                              type="button"
                              onClick={() => {
                                  setShowEndConfirm(false);
                                  onEndGame?.();
                              }}
                              ref={confirmRef}
                          >
                              {t.endGame}
                          </button>
                      </div>
                  </div>
              </div>,
              document.body,
          )
        : null;

    return (
        <>
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-strong)] text-[var(--color-text-light)] shadow-lg"
                role="toolbar"
                aria-label="Host controls"
            >
                <div className="mx-auto flex w-full max-w-2xl items-center gap-md px-4 py-3">
                    <div className="flex flex-col" style={{ minWidth: '110px' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.75 }}>{t.currentNumber}</span>
                        <strong style={{ fontSize: 'var(--font-size-lg)' }}>
                            {currentNumber ?? '—'}
                        </strong>
                        <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.75 }}>
                            {remainingCount} {t.remaining}
                        </span>
                    </div>

                    <div className="flex flex-1 items-center gap-md justify-end flex-wrap">
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={handleTogglePause}
                            aria-pressed={isPaused}
                        >
                            {isPaused ? '▶️ ' + t.resume : '⏸️ ' + t.pause}
                        </button>

                        <button
                            className="btn btn-primary"
                            type="button"
                            onClick={onCallNumber}
                            disabled={!canCallNumber}
                        >
                            🎲 {t.callNext}
                        </button>

                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => setIsBoardOpen(true)}
                        >
                            📋 {t.showBoard ?? 'Board'}
                        </button>

                        <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => setShowEndConfirm(true)}
                        >
                            🛑 {t.endGame}
                        </button>
                    </div>
                </div>
            </nav>

            <dialog
                ref={boardRef}
                className="modal modal-bottom sm:modal-middle bg-transparent backdrop:bg-black/80"
                onClose={() => setIsBoardOpen(false)}
            >
                <div className="modal-box bg-[var(--color-bg-paper)] text-[var(--color-text-primary)] border-2 border-[var(--color-gold)]">
                    <header className="mb-4 text-center">
                        <h3 className="font-bold" style={{ fontSize: 'var(--font-size-lg)' }}>
                            📋 {t.currentNumber}
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            {currentNumber ? `${t.currentNumber}: ${currentNumber}` : t.callNext}
                        </p>
                    </header>
                    <CallerBoard calledNumbers={calledNumbers} currentNumber={currentNumber} />
                    <div className="modal-action justify-center mt-6">
                        <button className="btn btn-primary" type="button" onClick={() => setIsBoardOpen(false)}>
                            {t.back}
                        </button>
                    </div>
                </div>
            </dialog>

            {endGameDialog}

            <div style={{ height: '96px' }} aria-hidden="true" />
        </>
    );
}
