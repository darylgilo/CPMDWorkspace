// Global sidebar state manager that persists across component remounts
class SidebarStateManager {
    private storageKey: string;
    private state: Record<string, boolean> = {};
    private listeners: Set<(state: Record<string, boolean>) => void> =
        new Set();

    constructor(storageKey: string) {
        this.storageKey = storageKey;
        this.loadFromStorage();
    }

    private loadFromStorage() {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.sessionStorage.getItem(this.storageKey);
            if (stored) {
                this.state = JSON.parse(stored);
            }
        } catch {
            // Ignore errors
        }
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;
        try {
            window.sessionStorage.setItem(
                this.storageKey,
                JSON.stringify(this.state),
            );
        } catch {
            // Ignore errors
        }
    }

    getState(): Record<string, boolean> {
        return { ...this.state };
    }

    setState(key: string, value: boolean) {
        this.state[key] = value;
        this.saveToStorage();
        this.notifyListeners();
    }

    subscribe(listener: (state: Record<string, boolean>) => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach((listener) => listener(this.getState()));
    }

    initialize(items: Array<{ title: string; isOpen: boolean }>) {
        let hasChanges = false;
        items.forEach((item) => {
            if (this.state[item.title] === undefined) {
                this.state[item.title] = item.isOpen;
                hasChanges = true;
            }
        });
        if (hasChanges) {
            this.saveToStorage();
            this.notifyListeners();
        }
    }
}

// Create singleton instances
export const navMainState = new SidebarStateManager('sidebar-nav-main-state');
export const navMain2State = new SidebarStateManager('sidebar-nav-main2-state');
