import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

/**
 * Skeleton loading placeholder with shimmer animation
 * Used for loading states throughout the app
 */
export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!Animated || !Animated.loop || !Animated.sequence || !Animated.timing) {
            console.warn('Animated API not fully available in Skeleton');
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );

        if (animation && typeof animation.start === 'function') {
            animation.start();
        }

        return () => {
            if (animation && typeof animation.stop === 'function') {
                animation.stop();
            }
        };
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#5a4025',
                    opacity,
                },
                style,
            ]}
        />
    );
}

/**
 * Loading skeleton for main menu
 */
export function MainMenuSkeleton() {
    return (
        <View className="w-full p-4">
            {/* Profile skeleton */}
            <View className="flex-row items-center bg-[#2d1f10] p-4 rounded-2xl mb-8">
                <Skeleton width={64} height={64} borderRadius={16} />
                <View className="flex-1 ml-4">
                    <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={140} height={24} />
                </View>
                <Skeleton width={60} height={28} borderRadius={14} />
            </View>

            {/* Main button skeleton */}
            <Skeleton width="100%" height={80} borderRadius={20} style={{ marginBottom: 16 }} />

            {/* Secondary buttons */}
            <View className="flex-row gap-3 mb-8">
                <View style={{ flex: 1 }}>
                    <Skeleton width="100%" height={70} borderRadius={16} />
                </View>
                <View style={{ flex: 1 }}>
                    <Skeleton width="100%" height={70} borderRadius={16} />
                </View>
            </View>

            {/* Quick actions */}
            <View className="flex-row gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={{ flex: 1 }}>
                        <Skeleton width="100%" height={80} borderRadius={16} />
                    </View>
                ))}
            </View>
        </View>
    );
}

/**
 * Loading skeleton for game card
 */
export function GameCardSkeleton() {
    return (
        <View className="w-full bg-[#3d2814] rounded-xl p-2">
            <Skeleton width="100%" height={24} style={{ marginBottom: 8 }} />
            <View className="flex-row flex-wrap">
                {Array.from({ length: 27 }).map((_, i) => (
                    <View key={i} style={{ width: '11.11%', aspectRatio: 1, padding: 2 }}>
                        <View style={{ flex: 1 }}>
                            <Skeleton width="100%" height={32} borderRadius={4} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

/**
 * Skeleton for a shop item row
 */
export const ShopItemSkeleton = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, backgroundColor: '#2d1f10', borderRadius: 12, borderWidth: 2, borderColor: '#4a3015' }}>
        <Skeleton width={72} height={72} borderRadius={8} />
        <View style={{ flex: 1 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={84} height={32} borderRadius={8} />
    </View>
);

/**
 * Skeleton for a leaderboard row
 */
export const LeaderboardSkeleton = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 176, 117, 0.1)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={28} height={28} borderRadius={14} />
            <Skeleton width={40} height={40} borderRadius={12} />
            <View>
                <Skeleton width={100} height={14} />
                <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
            </View>
        </View>
        <Skeleton width={50} height={24} />
    </View>
);

/**
 * Skeleton for a quest card
 */
export const QuestSkeleton = () => (
    <View style={{ backgroundColor: '#2d1f10', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#5a4025' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="90%" height={12} style={{ marginTop: 6 }} />
            </View>
            <Skeleton width={60} height={24} borderRadius={8} />
        </View>
        <Skeleton width="100%" height={14} borderRadius={7} style={{ marginTop: 16 }} />
        <Skeleton width="100%" height={40} borderRadius={12} style={{ marginTop: 16 }} />
    </View>
);

/**
 * Loading list with multiple skeleton items
 */
export const SkeletonList = ({ count = 3, ItemSkeleton }: { count?: number; ItemSkeleton: React.FC }) => (
    <View style={{ gap: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
            <ItemSkeleton key={i} />
        ))}
    </View>
);
