// ===== UTILIDADES GENERALES =====

/**
 * Retry an async function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Timeout wrapper for promises
 */
function withTimeout(promise, ms = 5000, errorMsg = 'Timeout') {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
    return (text || '').toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { retryWithBackoff, withTimeout, normalizeText, sleep };
