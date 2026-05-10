/**
 * TutorialOverlay
 *
 * Coach-marks / spotlight overlay used to guide first-time players through
 * their first Practice game. Renders a full-screen dimmer with a "spotlight"
 * cut-out around a target view (measured at runtime), and a wood-styled
 * speech bubble explaining the step.
 *
 * Spotlight implementation: instead of a true clip-path (not portable in
 * RN without extra deps), we render four dim rectangles around the target
 * rect (top / bottom / left / right). The target view appears un-dimmed.
 *
 * The overlay is `pointerEvents="box-none"` for the dim layer so the user
 * can still scroll/tap underneath if they wish — but the bubble itself
 * captures taps. A "Skip" link is always available so the tutorial can be
 * dismissed at any time (no force-tutorials).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    type LayoutRectangle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TEXT_STYLES, SPACING, RADII } from '@/lib/config';
import { WoodenButton } from './WoodenButton';

const COLOR_DIM = 'rgba(0, 0, 0, 0.75)';
const COLOR_BUBBLE_BG = '#2d1f10'; // wood-darker
const COLOR_BUBBLE_BORDER = '#ffd700'; // gold
const COLOR_TEXT_PRIMARY = '#f5e6c8';
const COLOR_TEXT_MUTED = '#d4b896';
const SPOTLIGHT_PADDING = 8;

export interface TutorialStep {
    title: string;
    body: string;
    /**
     * Ref to the target view to spotlight. If omitted (or the ref currently
     * has no current view), the bubble is centered and the dimmer covers
     * the whole screen.
     */
    targetRef?: React.RefObject<View | null>;
}

export interface TutorialOverlayProps {
    visible: boolean;
    steps: TutorialStep[];
    onComplete: () => void;
    onSkip: () => void;
    /** Translated UI labels — keeps the component i18n-agnostic. */
    labels: {
        next: string;
        done: string;
        skip: string;
        /** Template like "Krok {n}/{total}" */
        stepCount: string;
    };
}

interface TargetMeasure {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Returns four rectangles surrounding `target` that, together, cover the
 * entire screen except the target rect itself.
 */
function buildDimRects(
    target: TargetMeasure,
    screenW: number,
    screenH: number
): LayoutRectangle[] {
    const padded = {
        x: Math.max(0, target.x - SPOTLIGHT_PADDING),
        y: Math.max(0, target.y - SPOTLIGHT_PADDING),
        width: Math.min(screenW, target.width + SPOTLIGHT_PADDING * 2),
        height: Math.min(screenH, target.height + SPOTLIGHT_PADDING * 2),
    };

    return [
        // top
        { x: 0, y: 0, width: screenW, height: padded.y },
        // bottom
        {
            x: 0,
            y: padded.y + padded.height,
            width: screenW,
            height: Math.max(0, screenH - (padded.y + padded.height)),
        },
        // left
        {
            x: 0,
            y: padded.y,
            width: padded.x,
            height: padded.height,
        },
        // right
        {
            x: padded.x + padded.width,
            y: padded.y,
            width: Math.max(0, screenW - (padded.x + padded.width)),
            height: padded.height,
        },
    ];
}

export function TutorialOverlay({
    visible,
    steps,
    onComplete,
    onSkip,
    labels,
}: TutorialOverlayProps) {
    const { width: screenW, height: screenH } = useWindowDimensions();
    const [currentStep, setCurrentStep] = useState(0);
    const [target, setTarget] = useState<TargetMeasure | null>(null);

    // Reset when reopened
    useEffect(() => {
        if (visible) setCurrentStep(0);
    }, [visible]);

    // Measure the current target when step / visibility / dimensions change.
    useEffect(() => {
        if (!visible) return;
        const step = steps[currentStep];
        const node = step?.targetRef?.current;
        if (!node) {
            setTarget(null);
            return;
        }
        // measureInWindow gives screen-space coords (pageX/pageY equivalents).
        const handle = setTimeout(() => {
            try {
                node.measureInWindow((x, y, width, height) => {
                    if (
                        typeof x === 'number' &&
                        typeof y === 'number' &&
                        width > 0 &&
                        height > 0
                    ) {
                        setTarget({ x, y, width, height });
                    } else {
                        setTarget(null);
                    }
                });
            } catch {
                setTarget(null);
            }
        }, 50);
        return () => clearTimeout(handle);
    }, [visible, currentStep, steps, screenW, screenH]);

    const handleNext = useCallback(() => {
        if (currentStep >= steps.length - 1) {
            onComplete();
        } else {
            setCurrentStep((s) => s + 1);
        }
    }, [currentStep, steps.length, onComplete]);

    if (!visible || steps.length === 0) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const stepCountText = labels.stepCount
        .replace('{n}', String(currentStep + 1))
        .replace('{total}', String(steps.length));

    // Decide bubble vertical placement: above target if target is in the
    // bottom half of the screen, else below it.
    let bubbleTop: number | undefined;
    let bubbleBottom: number | undefined;
    const BUBBLE_GAP = SPACING.lg;
    const ESTIMATED_BUBBLE_H = 220;

    if (target) {
        const targetCenterY = target.y + target.height / 2;
        if (targetCenterY > screenH / 2) {
            // place above
            const desiredBottom = screenH - target.y + BUBBLE_GAP;
            bubbleBottom = Math.min(
                desiredBottom,
                screenH - SPACING.xl - ESTIMATED_BUBBLE_H
            );
            if (bubbleBottom < SPACING.xl) bubbleBottom = SPACING.xl;
        } else {
            // place below
            const desiredTop = target.y + target.height + BUBBLE_GAP;
            bubbleTop = Math.min(
                desiredTop,
                screenH - SPACING.xl - ESTIMATED_BUBBLE_H
            );
            if (bubbleTop < SPACING.xl) bubbleTop = SPACING.xl;
        }
    } else {
        // Centered bubble when no target.
        bubbleTop = Math.max(SPACING.xl, screenH / 2 - ESTIMATED_BUBBLE_H / 2);
    }

    const dimRects = target ? buildDimRects(target, screenW, screenH) : null;

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={StyleSheet.absoluteFill}
            // Block touches everywhere — only our buttons advance.
            pointerEvents="auto"
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
        >
            {/* Dim layer (full or 4-rect spotlight) */}
            {dimRects ? (
                dimRects.map((r, i) => (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            left: r.x,
                            top: r.y,
                            width: r.width,
                            height: r.height,
                            backgroundColor: COLOR_DIM,
                        }}
                    />
                ))
            ) : (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: COLOR_DIM },
                    ]}
                />
            )}

            {/* Spotlight ring around target (subtle gold border) */}
            {target ? (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: Math.max(0, target.x - SPOTLIGHT_PADDING),
                        top: Math.max(0, target.y - SPOTLIGHT_PADDING),
                        width: target.width + SPOTLIGHT_PADDING * 2,
                        height: target.height + SPOTLIGHT_PADDING * 2,
                        borderRadius: RADII.md,
                        borderWidth: 2,
                        borderColor: COLOR_BUBBLE_BORDER,
                    }}
                />
            ) : null}

            {/* Speech bubble */}
            <View
                style={{
                    position: 'absolute',
                    left: SPACING.lg,
                    right: SPACING.lg,
                    top: bubbleTop,
                    bottom: bubbleBottom,
                    backgroundColor: COLOR_BUBBLE_BG,
                    borderRadius: RADII.lg,
                    borderWidth: 2,
                    borderColor: COLOR_BUBBLE_BORDER,
                    padding: SPACING.lg,
                    gap: SPACING.sm,
                }}
                accessibilityRole="alert"
            >
                <Text
                    style={[
                        TEXT_STYLES.captionUpper,
                        { color: COLOR_TEXT_MUTED },
                    ]}
                >
                    {stepCountText}
                </Text>
                <Text style={[TEXT_STYLES.h3, { color: COLOR_TEXT_PRIMARY }]}>
                    {step.title}
                </Text>
                <Text
                    style={[
                        TEXT_STYLES.body,
                        { color: COLOR_TEXT_PRIMARY, marginBottom: SPACING.sm },
                    ]}
                >
                    {step.body}
                </Text>

                <WoodenButton
                    onPress={handleNext}
                    variant="gold"
                    size="lg"
                    fullWidth
                    accessibilityLabel={isLastStep ? labels.done : labels.next}
                >
                    {isLastStep ? labels.done : labels.next}
                </WoodenButton>

                <Pressable
                    onPress={onSkip}
                    accessibilityRole="button"
                    accessibilityLabel={labels.skip}
                    style={{
                        alignSelf: 'center',
                        paddingVertical: SPACING.sm,
                        paddingHorizontal: SPACING.md,
                    }}
                >
                    <Text
                        style={[
                            TEXT_STYLES.caption,
                            {
                                color: COLOR_TEXT_MUTED,
                                textDecorationLine: 'underline',
                            },
                        ]}
                    >
                        {labels.skip}
                    </Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

export default TutorialOverlay;
