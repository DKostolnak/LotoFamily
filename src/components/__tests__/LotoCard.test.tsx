/**
 * LotoCard Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LotoCard } from '../LotoCard';
import type { LotoCard as LotoCardType } from '@/lib/types';

// Mock haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
    },
}));

// Mock responsive hook
jest.mock('@/hooks', () => ({
    useResponsive: () => ({
        scale: (v: number) => v,
        scaleFont: (v: number) => v,
    }),
}));

// Mock config
jest.mock('@/lib/config', () => ({
    getThemeColors: () => ({
        cardBg: '#ffffff',
        headerBg: '#f0f0f0',
        gridBg: '#e0e0e0',
        border: '#cccccc',
    }),
    getSkinColors: () => ({
        bg: '#ffd700',
        border: '#b8860b',
    }),
}));

const createMockCard = (overrides?: Partial<LotoCardType>): LotoCardType => ({
    id: 'test-card-1',
    playerId: 'test-player-1',
    grid: [
        [
            { value: 1, isMarked: false },
            { value: 11, isMarked: false },
            { value: null, isMarked: false },
            { value: 31, isMarked: false },
            { value: 41, isMarked: false },
            { value: null, isMarked: false },
            { value: 61, isMarked: false },
            { value: 71, isMarked: false },
            { value: 81, isMarked: false },
        ],
        [
            { value: 2, isMarked: false },
            { value: null, isMarked: false },
            { value: 22, isMarked: false },
            { value: 32, isMarked: false },
            { value: null, isMarked: false },
            { value: 52, isMarked: false },
            { value: 62, isMarked: false },
            { value: null, isMarked: false },
            { value: 82, isMarked: false },
        ],
        [
            { value: null, isMarked: false },
            { value: 13, isMarked: false },
            { value: 23, isMarked: false },
            { value: null, isMarked: false },
            { value: 43, isMarked: false },
            { value: 53, isMarked: false },
            { value: null, isMarked: false },
            { value: 73, isMarked: false },
            { value: 83, isMarked: false },
        ],
    ],
    ...overrides,
});

const mockTranslations = {
    progress: 'Progress',
};

describe('LotoCard', () => {
    it('renders card with correct ID', () => {
        const card = createMockCard();
        const { getByText } = render(
            <LotoCard card={card} t={mockTranslations} />
        );
        
        expect(getByText(/CARD #/)).toBeTruthy();
    });

    it('renders numbers with accessibility labels', () => {
        const card = createMockCard();
        const { getAllByLabelText } = render(
            <LotoCard card={card} t={mockTranslations} />
        );
        
        // Check some numbers exist via accessibility labels
        // Use getAllByLabelText since regex might match multiple
        expect(getAllByLabelText(/Number 1,/).length).toBeGreaterThan(0);
        expect(getAllByLabelText(/Number 11,/).length).toBeGreaterThan(0);
        expect(getAllByLabelText(/Number 81,/).length).toBeGreaterThan(0);
    });

    it('shows remaining count', () => {
        const card = createMockCard();
        const { getByText } = render(
            <LotoCard card={card} t={mockTranslations} />
        );
        
        // Should show number of unmarked cells
        expect(getByText(/LEFT/)).toBeTruthy();
    });

    it('calls onCellPress when a called number is pressed', () => {
        const card = createMockCard();
        const mockOnPress = jest.fn();
        const calledNumbers = [1, 11, 31]; // These numbers are "called"
        
        const { getByLabelText } = render(
            <LotoCard 
                card={card} 
                onCellPress={mockOnPress} 
                calledNumbers={calledNumbers}
                t={mockTranslations} 
            />
        );
        
        // Find a called cell by its accessibility label and press it
        const cell = getByLabelText(/Number 1, called/);
        fireEvent.press(cell);
        
        expect(mockOnPress).toHaveBeenCalledWith(0, 0);
    });

    it('shows COMPLETE when all numbers are marked', () => {
        const card = createMockCard();
        // Mark all non-null cells
        card.grid = card.grid.map(row =>
            row.map(cell => ({
                ...cell,
                isMarked: cell.value !== null,
            }))
        );
        
        // Provide all numbers as called
        const allNumbers = card.grid.flat().filter(c => c.value !== null).map(c => c.value!);
        
        const { getByText } = render(
            <LotoCard card={card} t={mockTranslations} calledNumbers={allNumbers} />
        );
        
        expect(getByText('COMPLETE')).toBeTruthy();
    });

    it('has proper accessibility labels on cells', () => {
        const card = createMockCard();
        const { getAllByRole } = render(
            <LotoCard card={card} t={mockTranslations} />
        );
        
        const buttons = getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });
});
