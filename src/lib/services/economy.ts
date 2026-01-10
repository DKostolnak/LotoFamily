import { StorageService } from './storage';

/**
 * Interface for the Player's Wallet
 */
interface Wallet {
    coins: number;
    inventory: string[];
    lastDailyBonus: number; // Timestamp
    activeTheme: string; // Currently equipped card theme
    activeSkin: string; // Currently equipped marker skin
}

const DEFAULT_WALLET: Wallet = {
    coins: 0,
    inventory: [],
    lastDailyBonus: 0,
    activeTheme: 'theme_classic', // Default theme (updated ID to match shopData)
    activeSkin: 'skin_classic', // Default skin
};

const DAILY_BONUS_AMOUNT = 50;
const WALLET_KEY = 'loto_wallet';

/**
 * EconomyService
 * 
 * Manages the local economy for the player.
 * - Tracks coin balance (Accumulation Model)
 * - Manages inventory (Unlocked items)
 * - Handles persistence via localStorage (through StorageService)
 */
class EconomyService {
    private static instance: EconomyService;
    private wallet: Wallet;

    private constructor() {
        this.wallet = this.loadWallet();
    }

    public static getInstance(): EconomyService {
        if (!EconomyService.instance) {
            EconomyService.instance = new EconomyService();
        }
        return EconomyService.instance;
    }

    /**
     * Load wallet from storage or initialize default
     */
    private loadWallet(): Wallet {
        if (typeof window === 'undefined') return { ...DEFAULT_WALLET };

        try {
            const stored = localStorage.getItem(WALLET_KEY);
            return stored ? JSON.parse(stored) : { ...DEFAULT_WALLET };
        } catch (e) {
            console.error('Failed to load wallet', e);
            return { ...DEFAULT_WALLET };
        }
    }

    /**
     * Save current wallet state
     */
    private saveWallet(): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(WALLET_KEY, JSON.stringify(this.wallet));
    }

    /**
     * Get current coin balance
     */
    public getBalance(): number {
        return this.wallet.coins;
    }

    /**
     * Add coins to the wallet
     * @param amount Amount to add
     * @returns New balance
     */
    public addCoins(amount: number): number {
        this.wallet.coins += Math.max(0, amount);
        this.saveWallet();
        return this.wallet.coins;
    }

    /**
     * Spend coins (if sufficient balance)
     * @param amount Cost
     * @returns true if successful, false if insufficient funds
     */
    public spendCoins(amount: number): boolean {
        if (this.wallet.coins >= amount) {
            this.wallet.coins -= amount;
            this.saveWallet();
            return true;
        }
        return false;
    }

    /**
     * Check for daily bonus availability
     * @returns Amount awarded (0 if already claimed today)
     */
    public checkDailyBonus(): number {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        // Check if 24h passed since last bonus
        if (now - this.wallet.lastDailyBonus > oneDayMs) {
            this.wallet.lastDailyBonus = now; // Update timestamp
            this.addCoins(DAILY_BONUS_AMOUNT);
            this.saveWallet();
            return DAILY_BONUS_AMOUNT;
        }

        return 0;
    }

    /**
     * Check if an item is unlocked
     */
    public hasItem(itemId: string): boolean {
        return this.wallet.inventory.includes(itemId);
    }

    /**
     * Unlock an item (adds to inventory)
     */
    public unlockItem(itemId: string): void {
        if (!this.hasItem(itemId)) {
            this.wallet.inventory.push(itemId);
            this.saveWallet();
        }
    }

    /**
     * Get all unlocked item IDs
     */
    public getInventory(): string[] {
        return [...this.wallet.inventory];
    }

    /**
     * Purchase an item
     * @param itemId Item to buy
     * @param cost Cost of the item
     * @returns true if successful, false if insufficient funds or already owned
     */
    public purchaseItem(itemId: string, cost: number): boolean {
        if (this.hasItem(itemId)) return false; // Already owned

        if (this.spendCoins(cost)) {
            this.unlockItem(itemId);
            return true;
        }

        return false;
    }

    /**
     * Sync local wallet with server data
     * This ensures localStorage is up to date with the server's source of truth
     */
    public syncWallet(coins: number, inventory: string[]): void {
        this.wallet.coins = coins;
        // Merge inventory to avoid losing local unlocks if any (though server should be source of truth)
        // For now, let's trust server completely for consistency
        this.wallet.inventory = [...inventory];
        this.saveWallet();
    }

    /**
     * Get the currently active card theme
     * Get currently active theme
     */
    public getActiveTheme(): string {
        return this.wallet.activeTheme || 'theme_classic';
    }

    /**
     * Set active theme
     * @returns true if successful (user owns it or it's free)
     */
    public setActiveTheme(themeId: string): boolean {
        // Free themes or owned themes
        if (themeId === 'theme_classic' || this.wallet.inventory.includes(themeId)) {
            this.wallet.activeTheme = themeId;
            this.saveWallet();
            return true;
        }
        return false;
    }

    /**
     * Get currently active marker skin
     */
    public getActiveSkin(): string {
        return this.wallet.activeSkin || 'skin_classic';
    }

    /**
     * Set active marker skin
     * @returns true if successful (user owns it or it's free)
     */
    public setActiveSkin(skinId: string): boolean {
        // Free skins or owned skins
        if (skinId === 'skin_classic' || this.wallet.inventory.includes(skinId)) {
            this.wallet.activeSkin = skinId;
            this.saveWallet();
            return true;
        }
        return false;
    }
}

// Export singleton instance
export const economyService = EconomyService.getInstance();
