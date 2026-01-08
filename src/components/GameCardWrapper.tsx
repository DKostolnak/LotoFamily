'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { GameState, LotoCard as LotoCardType } from '@/lib/types';
import LotoCard from './LotoCard';
import { playClickSound, playErrorSound } from './GameAudioPlayer';
import { useCardLogic } from '@/hooks/useCardLogic';
import { isCardComplete, canClaimFlat } from '@/lib/services/scoring';
import type { TranslationDictionary } from '@/lib/translations';

interface GameCardWrapperProps {
    card: LotoCardType;
    gameState: GameState;
    playerId: string;
    calledNumberValues: number[];
    onMarkCell: (id: string, r: number, c: number) => void;
    onClaimWin: (id: string) => void;
    onClaimFlat: (type: number) => void;
    t: TranslationDictionary;
}

const GameCardWrapper = memo(function GameCardWrapper({
    card,
    gameState,
    playerId,
    calledNumberValues,
    onMarkCell,
    onClaimWin,
    onClaimFlat,
    t,
}: GameCardWrapperProps) {
    // Player data
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const collectedFlats = currentPlayer?.collectedFlats || [];

    // Claim availability using pure scoring service
    const canClaimFlat1 = canClaimFlat(card, collectedFlats, 1);
    const canClaimFlat2 = canClaimFlat(card, collectedFlats, 2);

    // Card logic hook handles validation and marking
    const { handleCellClick } = useCardLogic({
        calledNumbers: calledNumberValues,
        onMarkCell,
    });

    const onCellClick = useCallback((row: number, col: number) => {
        const result = handleCellClick(card, row, col);
        if (result.valid) {
            playClickSound();
            // Visual feedback is handled by LotoCard (token overlay, floating points)
            return;
        }
        // Only play sound for mistakes - no shake animation, just visual feedback
        if (result.reason === 'not_called' || result.reason === 'missed') {
            playErrorSound();
        }
        // Do nothing for 'empty' or 'already_marked'
    }, [card, handleCellClick]);

    const complete = useMemo(() => isCardComplete(card), [card]);

    return (
        <div className="flex flex-col relative shrink-1 min-h-0">
            {/* Overlay Buttons for claiming */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-center -translate-y-1/2 pointer-events-none">
                <div className="pointer-events-auto flex gap-1">
                    {canClaimFlat1 && (
                        <button
                            className="btn btn-secondary btn-xs shadow-lg animate-bounce"
                            onClick={() => {
                                playClickSound();
                                onClaimFlat(1);
                            }}
                        >
                            🏠 {t.claimRow1}
                        </button>
                    )}
                    {canClaimFlat2 && (
                        <button
                            className="btn btn-secondary btn-xs shadow-lg animate-bounce"
                            onClick={() => {
                                playClickSound();
                                onClaimFlat(2);
                            }}
                        >
                            🏠🏠 {t.claimRow2}
                        </button>
                    )}
                </div>
            </div>

            {/* The Card */}
            <div className="flex-1 flex items-center justify-center min-h-0" style={{ width: '100%' }}>
                <div style={{ width: '100%' }}>
                    <LotoCard
                        card={card}
                        onCellClick={onCellClick}
                        calledNumbers={calledNumberValues}
                        compact={true}
                    />
                </div>
            </div>

            {/* Win Button Overlay */}
            {complete && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 rounded-lg">
                    <button
                        className="btn btn-primary btn-lg animate-pulse shadow-xl border-4 border-white"
                        onClick={() => {
                            playClickSound();
                            onClaimWin(card.id);
                        }}
                    >
                        🎉 {t.claimBingo}
                    </button>
                </div>
            )}
        </div>
    );
});

export default GameCardWrapper;