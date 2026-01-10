import React, { useState, useEffect } from 'react';
import { WoodenButton, WoodenCard } from './common';
import { economyService } from '@/lib/services/economy';
import { playClickSound } from '@/lib/audio';
import { SHOP_ITEMS, ShopItem } from '@/lib/shopData';
import { useGame } from '@/lib/GameContext';

interface ShopModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Mini theme preview component
function ThemePreview({ themeClass }: { themeClass: string }) {
    return (
        <div
            className="loto-card"
            data-theme={themeClass}
            style={{
                padding: '4px',
                borderRadius: '6px',
                width: '100%',
            }}
        >
            <div
                className="loto-card-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                }}
            >
                {/* 3x3 mini grid preview */}
                {[1, null, 2, null, 3, null, 4, null, 5].map((val, i) => (
                    <div
                        key={i}
                        className={`loto-cell ${val === null ? 'loto-cell--empty' : ''}`}
                        style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                        }}
                    >
                        {val}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
    const { coins, inventory, purchaseItem, activeTheme, setActiveTheme } = useGame();
    const [activeCategory, setActiveCategory] = useState<'all' | 'avatar' | 'theme'>('all');

    const handlePurchase = (item: ShopItem) => {
        playClickSound();
        purchaseItem(item.id, item.price);
    };

    const handleEquipTheme = (item: ShopItem) => {
        playClickSound();
        if (item.themeClass) {
            setActiveTheme(item.id);
        }
    };

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
                title="Loto Shop"
                showBackArrow
                onBack={onClose}
            >
                {/* Balance Display */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    width: '100%'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>💰</span>
                    <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#ffd700', fontWeight: 'bold' }}>{coins}</span>
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {(['all', 'avatar', 'theme'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { playClickSound(); setActiveCategory(cat); }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                border: activeCategory === cat ? '2px solid #ffd700' : '2px solid #5a4025',
                                background: activeCategory === cat
                                    ? 'linear-gradient(180deg, #5a4025 0%, #3d2814 100%)'
                                    : 'rgba(0,0,0,0.2)',
                                color: activeCategory === cat ? '#ffd700' : '#8b6b4a',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat === 'all' ? 'All' : cat === 'avatar' ? 'Avatars' : 'Themes'}
                        </button>
                    ))}
                </div>

                {/* Items Grid */}
                <div style={{
                    overflowY: 'auto',
                    paddingRight: '4px',
                    paddingBottom: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    maxHeight: '55vh',
                }}>
                    {SHOP_ITEMS
                        .filter(item => activeCategory === 'all' || item.category === activeCategory)
                        .map((item) => {
                            // Classic theme is always owned (it's free)
                            const isOwned = inventory.includes(item.id) || item.id === 'theme_classic';
                            const canAfford = coins >= item.price;
                            const isTheme = item.category === 'theme';
                            const isEquipped = isTheme && activeTheme === item.themeClass;

                            return (
                                <div key={item.id} style={{ position: 'relative' }}>
                                    <div style={{
                                        background: 'linear-gradient(180deg, #3d2814 0%, #2d1f10 100%)',
                                        border: isEquipped ? '2px solid #ffd700' : isOwned ? '2px solid #4ade80' : '2px solid #5a4025',
                                        borderRadius: '4px',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: isEquipped ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                        opacity: (!isOwned && !canAfford) ? 0.7 : 1,
                                        transition: 'transform 0.2s',
                                        color: '#e2d0b5'
                                    }}>
                                        {/* Icon or Theme Preview */}
                                        {isTheme && item.themeClass ? (
                                            <ThemePreview themeClass={item.themeClass} />
                                        ) : (
                                            <div style={{ fontSize: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: '8px' }}>
                                                {item.icon}
                                            </div>
                                        )}

                                        {/* Name */}
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1 }}>
                                            {item.name}
                                        </div>

                                        {/* Price / Status */}
                                        {isEquipped ? (
                                            <div style={{
                                                color: '#ffd700', fontSize: '0.75rem', fontWeight: 'bold',
                                                backgroundColor: 'rgba(113, 63, 18, 0.3)', padding: '4px 8px', borderRadius: '4px'
                                            }}>
                                                ✓ EQUIPPED
                                            </div>
                                        ) : isOwned ? (
                                            <div style={{
                                                color: '#4ade80', fontSize: '0.75rem', fontWeight: 'bold',
                                                backgroundColor: 'rgba(22, 101, 52, 0.3)', padding: '4px 8px', borderRadius: '4px'
                                            }}>
                                                OWNED
                                            </div>
                                        ) : (
                                            <div style={{
                                                fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 'bold',
                                                padding: '4px 8px', borderRadius: '4px',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                color: canAfford ? '#ffd700' : '#f87171',
                                                backgroundColor: canAfford ? 'rgba(113, 63, 18, 0.3)' : 'rgba(127, 29, 29, 0.3)'
                                            }}>
                                                💰 {item.price}
                                            </div>
                                        )}

                                        {/* Buy or Equip Button */}
                                        {!isOwned && (
                                            <button
                                                type="button"
                                                disabled={!canAfford}
                                                onClick={() => handlePurchase(item)}
                                                style={{
                                                    marginTop: '4px', width: '100%', padding: '6px', borderRadius: '4px',
                                                    fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed',
                                                    background: canAfford
                                                        ? 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)'
                                                        : '#374151',
                                                    color: canAfford ? 'white' : '#9ca3af',
                                                    boxShadow: canAfford ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                                                }}
                                                className={canAfford ? 'active:scale-95 transition-transform' : ''}
                                            >
                                                Buy
                                            </button>
                                        )}

                                        {/* Equip Button for owned themes */}
                                        {isOwned && isTheme && !isEquipped && (
                                            <button
                                                type="button"
                                                onClick={() => handleEquipTheme(item)}
                                                style={{
                                                    marginTop: '4px', width: '100%', padding: '6px', borderRadius: '4px',
                                                    fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    border: 'none', cursor: 'pointer',
                                                    background: 'linear-gradient(180deg, #ffd700 0%, #b8860b 100%)',
                                                    color: '#1a0a00',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                                }}
                                                className="active:scale-95 transition-transform"
                                            >
                                                Equip
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </WoodenCard>
        </div>
    );
}
