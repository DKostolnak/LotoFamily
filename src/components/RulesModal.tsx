import React, { useState } from 'react';
import { WoodenCard } from './common';
import { playClickSound } from '@/lib/audio';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
    const [activeTab, setActiveTab] = useState<'rules' | 'rewards'>('rules');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <WoodenCard
                title="Game Guide"
                showBackArrow
                onBack={onClose}
                className="w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {(['rules', 'rewards'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { playClickSound(); setActiveTab(tab); }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: activeTab === tab ? '2px solid #ffd700' : '2px solid #5a4025',
                                background: activeTab === tab
                                    ? 'linear-gradient(180deg, #5a4025 0%, #3d2814 100%)'
                                    : 'rgba(0,0,0,0.2)',
                                color: activeTab === tab ? '#ffd700' : '#8b6b4a',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>{tab === 'rules' ? '📜' : '💰'}</span>
                            <span>{tab === 'rules' ? 'Rules' : 'Rewards'}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{
                    overflowY: 'auto',
                    paddingRight: '4px',
                    paddingBottom: '16px',
                    maxHeight: '55vh',
                    color: '#e2d0b5',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    fontSize: '0.95rem'
                }}>
                    {activeTab === 'rules' ? (
                        <div className="space-y-4">
                            <Section title="Objective">
                                Mark all numbers on your card (or a specific row) faster than other players when they are called out.
                            </Section>

                            <Section title="How to Play">
                                <ol style={{ paddingLeft: '20px', margin: 0, listStyle: 'decimal', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <li>Wait for the host to call a collection of numbers.</li>
                                    <li>If you have the number on your card, tap to mark it!</li>
                                    <li>Complete a <strong>Horizontal Row</strong> to win a "Flat" (if enabled).</li>
                                    <li>Mark <strong>ALL numbers</strong> to win the game (Loto)!</li>
                                </ol>
                            </Section>

                            <Section title="Controls">
                                <ul style={{ paddingLeft: '20px', margin: 0, listStyle: 'disc' }}>
                                    <li><strong>Red Chip</strong>: Tap once to mark.</li>
                                    <li><strong>Remove</strong>: Tap again to unmark if you made a mistake.</li>
                                </ul>
                            </Section>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Section title="Why earn coins?">
                                Loto Coins allow you to buy premium Avatars and special Skins from the Shop!
                            </Section>

                            <Section title="Earning Table">
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: '8px',
                                    marginTop: '8px',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(139, 107, 74, 0.3)'
                                }}>
                                    <div>🏆 <strong>Winner</strong></div>
                                    <div style={{ color: '#ffd700', fontWeight: 'bold' }}>+100</div>

                                    <div>🎁 <strong>Daily Bonus</strong></div>
                                    <div style={{ color: '#ffd700', fontWeight: 'bold' }}>+50</div>

                                    <div>🎖️ <strong>Flat (Row)</strong></div>
                                    <div style={{ color: '#ffd700', fontWeight: 'bold' }}>+30</div>

                                    <div>🤝 <strong>Participation</strong></div>
                                    <div style={{ color: '#ffd700', fontWeight: 'bold' }}>+10</div>
                                </div>
                            </Section>

                            <div style={{
                                fontSize: '0.8rem',
                                fontStyle: 'italic',
                                color: '#8b6b4a',
                                marginTop: '16px',
                                textAlign: 'center'
                            }}>
                                * Rewards are awarded automatically at the end of the game or upon login.
                            </div>
                        </div>
                    )}
                </div>
            </WoodenCard>
        </div>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <h3 style={{
                color: '#ffd700',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                marginBottom: '4px',
                borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
                paddingBottom: '2px',
                display: 'inline-block'
            }}>
                {title}
            </h3>
            <div style={{ marginTop: '4px' }}>
                {children}
            </div>
        </div>
    );
}
