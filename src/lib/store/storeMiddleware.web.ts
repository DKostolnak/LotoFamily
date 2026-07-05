import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

type PersistStorage = {
    getItem: (name: string) => string | Promise<string | null> | null;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
};

type SetState<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
) => void;

type JsonStorage<S> = {
    getItem: (name: string) => { state: S; version?: number } | Promise<{ state: S; version?: number } | null> | null;
    setItem: (name: string, value: { state: S; version?: number }) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
};

type PersistOptions<T, S> = {
    name: string;
    storage: JsonStorage<S>;
    version?: number;
    partialize?: (state: T) => S;
};

export function createJSONStorage<S>(getStorage: () => PersistStorage): JsonStorage<S> {
    const storage = getStorage();
    return {
        async getItem(name) {
            const value = await storage.getItem(name);
            return value ? JSON.parse(value) : null;
        },
        setItem(name, value) {
            return storage.setItem(name, JSON.stringify(value));
        },
        removeItem(name) {
            return storage.removeItem(name);
        },
    };
}

export function persist<
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = [],
    S = Partial<T>,
>(
    initializer: StateCreator<T, Mps, Mcs>,
    options: PersistOptions<T, S>
): StateCreator<T, Mps, Mcs> {
    return (set, get, api) => {
        const partialize = options.partialize ?? ((state: T) => state as unknown as S);

        const persistState = () => {
            void options.storage.setItem(options.name, {
                state: partialize(get()),
                version: options.version,
            });
        };

        const baseSet = set as SetState<T>;
        const setAndPersist = ((partial: Parameters<SetState<T>>[0], replace?: Parameters<SetState<T>>[1]) => {
            baseSet(partial, replace);
            persistState();
        }) as typeof set;

        const originalSetState = api.setState;
        api.setState = ((partial: Parameters<SetState<T>>[0], replace?: Parameters<SetState<T>>[1]) => {
            (originalSetState as SetState<T>)(partial, replace);
            persistState();
        }) as typeof api.setState;

        const initialState = initializer(setAndPersist, get, api);

        void Promise.resolve(options.storage.getItem(options.name))
            .then((stored) => {
                if (!stored) return;
                if (stored.version !== undefined && stored.version !== options.version) return;
                set({ ...(get() as object), ...(stored.state as object) } as T);
            })
            .catch(() => {});

        return initialState;
    };
}
