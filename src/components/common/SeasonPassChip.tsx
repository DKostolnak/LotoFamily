/**
 * SeasonPassChip — compact 44pt pill that opens the Battle Pass modal.
 *
 * Mirrors the visual language of DailyBonusCard's compact form: dark wood
 * surface, gold accent, level badge, slim XP progress bar. A right-side
 * "Claim" affordance is shown only when at least one reward is currently
 * claimable (i.e. a level has been reached but the free track reward is
 * still unclaimed) — this is what drives daily re-engagement.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ticket, ChevronRight } from 'lucide-react-native';
import { useGameStore } from '@/lib/store';
import { generateSeasonLevels } from '@/lib/config/season.config';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

const SURFACE = '#1a1109';
const SURFACE_BORDER = '#3d2814';
const TEXT_GOLD = '#ffd700';
const TEXT_LIGHT = '#e8d4b8';
const TEXT_MUTED = '#5a4025';
const PROGRESS_BG = '#2d1f10';

export interface SeasonPassChipProps {
    onPress: () => void;
    /** Optional label override for the leading title (defaults to 'Season Pass'). */
    label?: string;
    /** Optional translated 'Claim' label. */
    claimLabel?: string;
    /** Optional translated 'Level' label. */
    levelLabel?: string;
}

export function SeasonPassChip({
    onPress,
    label = 'Season Pass',
    claimLabel = 'Claim',
    levelLabel = 'Level',
}: SeasonPassChipProps) {
    const seasonId = useGameStore((s) => s.seasonId);
    const seasonXp = useGameStore((s) => s.seasonXp);
    const seasonLevel = useGameStore((s) => s.seasonLevel);
    const claimedFree = useGameStore((s) => s.claimedFree);

    // Has at least one unclaimed free-track reward at or below the current level.
    const hasClaimable = React.useMemo(() => {
        for (let lvl = 1; lvl <= seasonLevel; lvl++) {
            if (!claimedFree.includes(lvl)) return true;
        }
        return false;
    }, [seasonLevel, claimedFree]);

    // Slim progress bar — XP into current level relative to next level cost.
    const progressPct = React.useMemo(() => {
        const levels = generateSeasonLevels(seasonId || 'preview');
        if (seasonLevel >= levels.length) return 1;
        const prevReq = seasonLevel > 1 ? levels[seasonLevel - 2].xpRequired : 0;
        const nextReq = levels[seasonLevel - 1].xpRequired;
        const span = nextReq - prevReq;
        if (span <= 0) return 0;
        return Math.max(0, Math.min(1, (seasonXp - prevReq) / span));
    }, [seasonId, seasonLevel, seasonXp]);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${levelLabel} ${seasonLevel}`}
            style={styles.container}
        >
            <View style={styles.iconBubble}>
                <Ticket size={18} color={TEXT_GOLD} strokeWidth={2.5} />
            </View>

            <View style={styles.middle}>
                <Text style={[TEXT_STYLES.bodySmall, { color: TEXT_LIGHT, fontWeight: '700' }]} numberOfLines={1}>
                    {label}
                </Text>
                <View style={styles.progressRow}>
                    <Text style={[TEXT_STYLES.caption, { color: TEXT_GOLD, fontWeight: '700' }]} numberOfLines={1}>
                        {`${levelLabel} ${seasonLevel}`}
                    </Text>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${Math.round(progressPct * 100)}%` },
                            ]}
                        />
                    </View>
                </View>
            </View>

            {hasClaimable ? (
                <View style={styles.claimBadge}>
                    <Text style={[TEXT_STYLES.caption, { color: '#1a1109', fontWeight: '800' }]}>
                        {claimLabel.toUpperCase()}
                    </Text>
                </View>
            ) : (
                <ChevronRight size={20} color={TEXT_MUTED} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: SURFACE_BORDER,
        borderRadius: RADII.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.md,
    },
    iconBubble: {
        width: 32,
        height: 32,
        borderRadius: RADII.md,
        backgroundColor: PROGRESS_BG,
        borderWidth: 1,
        borderColor: SURFACE_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    middle: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    progressTrack: {
        flex: 1,
        height: 6,
        backgroundColor: PROGRESS_BG,
        borderRadius: RADII.pill,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: TEXT_GOLD,
        borderRadius: RADII.pill,
    },
    claimBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        backgroundColor: TEXT_GOLD,
        borderRadius: RADII.pill,
    },
});

export default SeasonPassChip;
