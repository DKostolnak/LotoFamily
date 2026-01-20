/**
 * Game Screen Wrapper
 * 
 * Routes to either Offline (Practice) or Online (Multiplayer) game components
 * based on the navigation parameters.
 */

import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OfflineGame } from '@/components/game/OfflineGame';
import { OnlineGame } from '@/components/game/OnlineGame';
import { P2PGame } from '@/components/game/P2PGame';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';

export default function GameScreen() {
    const router = useRouter();
    const { mode, room, public: isPublic, crazy } = useLocalSearchParams<{
        mode: string;
        room?: string;
        public?: string;
        crazy?: string
    }>();

    const handleErrorReset = () => {
        router.replace('/');
    };

    // Practice mode (Offline)
    if (mode === 'practice') {
        return (
            <GameErrorBoundary onReset={handleErrorReset}>
                <OfflineGame />
            </GameErrorBoundary>
        );
    }

    // P2P mode (Local WiFi)
    if (mode === 'p2p') {
        return (
            <GameErrorBoundary onReset={handleErrorReset}>
                <P2PGame />
            </GameErrorBoundary>
        );
    }

    // Multiplayer modes (Online)
    return (
        <GameErrorBoundary onReset={handleErrorReset}>
            <OnlineGame
                mode={(mode as 'create' | 'join') || 'create'}
                initialRoomCode={room}
                isPublic={isPublic === '1'}
                crazyMode={crazy === '1'}
            />
        </GameErrorBoundary>
    );
}
