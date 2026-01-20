/**
 * useResponsive Hook Tests
 */

import { renderHook } from '@testing-library/react-native';
import { useResponsive } from '../useResponsive';

// Mock useWindowDimensions
const mockDimensions = {
    width: 393,
    height: 852,
};

jest.mock('react-native', () => ({
    useWindowDimensions: () => mockDimensions,
}));

describe('useResponsive', () => {
    it('returns screen dimensions', () => {
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.screenWidth).toBe(393);
        expect(result.current.screenHeight).toBe(852);
    });

    it('correctly identifies screen size categories', () => {
        const { result } = renderHook(() => useResponsive());
        
        // With 393px width (iPhone 17 Pro baseline)
        expect(result.current.isSmallScreen).toBe(false);
        expect(result.current.isMediumScreen).toBe(true);
        expect(result.current.isTablet).toBe(false);
    });

    it('scales values proportionally', () => {
        const { result } = renderHook(() => useResponsive());
        
        // scale(100) on a 393px screen should return ~100
        const scaled = result.current.scale(100);
        expect(scaled).toBeCloseTo(100, 0);
    });

    it('scales fonts with minimum floor', () => {
        const { result } = renderHook(() => useResponsive());
        
        // Large font should scale
        const largeFont = result.current.scaleFont(20);
        expect(largeFont).toBeGreaterThan(0);
        
        // Small font should respect minimum
        const smallFont = result.current.scaleFont(8, 12);
        expect(smallFont).toBeGreaterThanOrEqual(12);
    });

    it('provides responsive helper function', () => {
        const { result } = renderHook(() => useResponsive());
        
        // On medium screen, should return medium value
        const value = result.current.responsive('small', 'medium', 'large');
        expect(value).toBe('medium');
    });
});

describe('useResponsive on small screen', () => {
    beforeEach(() => {
        mockDimensions.width = 320;
        mockDimensions.height = 568;
    });

    afterEach(() => {
        mockDimensions.width = 393;
        mockDimensions.height = 852;
    });

    it('identifies small screen', () => {
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isSmallScreen).toBe(true);
    });

    it('returns small value from responsive helper', () => {
        const { result } = renderHook(() => useResponsive());
        
        const value = result.current.responsive('small', 'medium', 'large');
        expect(value).toBe('small');
    });
});
