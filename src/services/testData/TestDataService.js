/**
 * Base class for test data generation services
 * Provides common utilities for creating randomized test data
 */
export class TestDataService {
    /**
     * Generate a random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * Get a random element from an array
     */
    randomElement(array) {
        return array[this.randomInt(0, array.length - 1)];
    }
    /**
     * Get multiple random elements from an array (without duplicates)
     */
    randomElements(array, count) {
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, array.length));
    }
    /**
     * Generate a random boolean with optional probability
     * @param probability - Probability of true (0-1), defaults to 0.5
     */
    randomBoolean(probability = 0.5) {
        return Math.random() < probability;
    }
    /**
     * Generate a random date in the future
     * @param minDays - Minimum days from now
     * @param maxDays - Maximum days from now
     */
    randomFutureDate(minDays = 1, maxDays = 90) {
        const today = new Date();
        const daysToAdd = this.randomInt(minDays, maxDays);
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + daysToAdd);
        return futureDate;
    }
    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /**
     * Generate a random UUID-like string
     */
    generateId() {
        return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
