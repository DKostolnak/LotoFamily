import { StorageService } from './storage';

/**
 * Interface for the Player's Wallet
 */
interface Wallet {
    coins: number;
    inventory: string[];
    lastDailyBonus: number; // Timestamp
}

const DEFAULT_WALLET: Wallet = {
    coins: 0,
    inventory: [],
    lastDailyBonus: 0,
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
}

// Export singleton instance
export const economyService = EconomyService.getInstance();
