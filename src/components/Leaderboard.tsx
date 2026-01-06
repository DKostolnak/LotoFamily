import React from 'react';
import { Player } from '@/lib/types';

interface LeaderboardProps {
    players: Player[];
    currentUserId?: string;
}

export default function Leaderboard({ players, currentUserId }: LeaderboardProps) {
    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
        <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10 w-full max-w-sm">
            <h3 className="text-white font-bold text-center mb-4 uppercase tracking-wider text-sm opacity-80">
                🏆 Leaderboard
            </h3>
            <div className="flex flex-col gap-2">
                {sortedPlayers.map((player, index) => {
                    const isMe = player.id === currentUserId;
                    const rank = index + 1;

                    let rankIcon = <span className="text-white/50 w-6 text-center font-mono">{rank}</span>;
                    if (rank === 1) rankIcon = <span className="text-2xl">🥇</span>;
                    if (rank === 2) rankIcon = <span className="text-2xl">🥈</span>;
                    if (rank === 3) rankIcon = <span className="text-2xl">🥉</span>;

                    return (
                        <div
                            key={player.id}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isMe
                                    ? 'bg-gradient-to-r from-[var(--color-gold)]/20 to-[var(--color-gold)]/5 border border-[var(--color-gold)]/50'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-center w-8 shrink-0">
                                {rankIcon}
                            </div>

                            <div className="relative shrink-0">
                                <div className="avatar avatar-sm border border-white/20">
                                    {player.avatarUrl || player.name.charAt(0)}
                                </div>
                                {isMe && (
                                    <div className="absolute -bottom-1 -right-1 bg-[var(--color-gold)] text-[var(--color-wood-dark)] text-[8px] font-bold px-1 rounded-full">
                                        YOU
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={`truncate font-medium ${isMe ? 'text-[var(--color-gold)]' : 'text-white'}`}>
                                    {player.name}
                                </div>
                            </div>

                            <div className="font-mono font-bold text-lg text-white/90">
                                {player.score || 0}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
