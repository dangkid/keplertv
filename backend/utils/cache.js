// ===== SISTEMA DE CACHÉ SIMPLE =====

class SimpleCache {
    constructor(defaultTTL = 3600000) { // 1 hora por defecto
        this.store = new Map();
        this.defaultTTL = defaultTTL;
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.data;
    }

    set(key, data, ttl) {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.store.set(key, { data, expiry });
    }

    has(key) {
        const item = this.store.get(key);
        if (!item) return false;
        if (Date.now() > item.expiry) {
            this.store.delete(key);
            return false;
        }
        return true;
    }

    delete(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    // Limpiar entradas expiradas
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (now > item.expiry) {
                this.store.delete(key);
            }
        }
    }

    get size() {
        this.cleanup();
        return this.store.size;
    }
}

// Instancia global
const cache = new SimpleCache();

module.exports = { SimpleCache, cache };
