import React from 'react';
import { View, Text } from 'react-native';
import { Gamepad2, Swords, UserPlus } from 'lucide-react-native';
import { AnimatedModal } from './AnimatedModal';
import { ModeCard } from './ModeCard';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';

interface ModePickerSheetProps {
    visible: boolean;
    onClose: () => void;
    onPractice: () => void;
    onCreate: () => void;
    onJoin: () => void;
    labels?: {
        title?: string;
        practice?: string;
        practiceSubtitle?: string;
        create?: string;
        createSubtitle?: string;
        join?: string;
        joinSubtitle?: string;
    };
}

/**
 * ModePickerSheet — slide-up bottom sheet that lets the player pick
 * between Practice, Create and Join. Reuses the existing ModeCard
 * component. Practice is the primary, friction-free option.
 */
export function ModePickerSheet({
    visible,
    onClose,
    onPractice,
    onCreate,
    onJoin,
    labels,
}: ModePickerSheetProps) {
    return (
        <AnimatedModal visible={visible} onClose={onClose} animation="slide">
            <View
                style={{
                    backgroundColor: '#1a1109',
                    borderRadius: RADII.xl,
                    borderWidth: 2,
                    borderColor: '#5a4025',
                    padding: SPACING.lg,
                    gap: SPACING.md,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 16,
                }}
            >
                <Text
                    style={[
                        TEXT_STYLES.h2,
                        {
                            color: '#ffd700',
                            textAlign: 'center',
                            marginBottom: SPACING.xs,
                        },
                    ]}
                    numberOfLines={1}
                >
                    {labels?.title ?? 'Choose a game'}
                </Text>

                <ModeCard
                    icon={<Gamepad2 size={32} color="#1a1109" strokeWidth={2.5} />}
                    title={labels?.practice ?? 'Practice'}
                    subtitle={labels?.practiceSubtitle ?? 'Vs Bots'}
                    variant="primary"
                    onPress={onPractice}
                />
                <ModeCard
                    icon={<Swords size={28} color="#f5e6c8" strokeWidth={2.5} />}
                    title={labels?.create ?? 'Create Game'}
                    subtitle={labels?.createSubtitle ?? 'Host Online'}
                    onPress={onCreate}
                />
                <ModeCard
                    icon={<UserPlus size={28} color="#f5e6c8" strokeWidth={2.5} />}
                    title={labels?.join ?? 'Join Game'}
                    subtitle={labels?.joinSubtitle ?? 'By Code'}
                    onPress={onJoin}
                />
            </View>
        </AnimatedModal>
    );
}

export default ModePickerSheet;
