/**
 * Redis Cache Utility
 * 
 * Provides helper functions to interact with Redis for caching
 * frequently accessed data and improving application performance.
 */

const Redis = require('redis');

// Redis client instance
let redisClient;

// Initialize Redis client
async function initRedisClient() {
    redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error', err);
    });

    await redisClient.connect();
    console.log('Redis client connected');

    return redisClient;
}

// Get Redis client (create if not exists)
async function getClient() {
    if (!redisClient) {
        return await initRedisClient();
    }
    return redisClient;
}

/**
 * Set a value in cache
 * @param {string} key - The cache key
 * @param {string|object} value - The value to cache
 * @param {number} expireSeconds - Time to live in seconds (optional)
 */
async function setValue(key, value, expireSeconds) {
    try {
        const client = await getClient();
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;

        if (expireSeconds) {
            await client.set(key, stringValue, { EX: expireSeconds });
        } else {
            await client.set(key, stringValue);
        }
    } catch (error) {
        console.error('Redis setValue error:', error);
    }
}

/**
 * Get a value from cache
 * @param {string} key - The cache key
 * @param {boolean} parseJSON - Whether to parse result as JSON
 * @returns {string|object|null} The cached value or null if not found
 */
async function getValue(key, parseJSON = false) {
    try {
        const client = await getClient();
        const value = await client.get(key);

        if (!value) return null;

        return parseJSON ? JSON.parse(value) : value;
    } catch (error) {
        console.error('Redis getValue error:', error);
        return null;
    }
}

/**
 * Delete a value from cache
 * @param {string} key - The cache key to delete
 */
async function deleteValue(key) {
    try {
        const client = await getClient();
        await client.del(key);
    } catch (error) {
        console.error('Redis deleteValue error:', error);
    }
}

/**
 * Cache the result of an expensive function call
 * @param {string} key - The cache key
 * @param {function} fetchFunction - The function to call if cache miss
 * @param {number} expireSeconds - TTL in seconds
 * @returns {any} The cached or freshly fetched data
 */
async function cacheResult(key, fetchFunction, expireSeconds = 3600) {
    try {
        // Try to get from cache first
        const cachedValue = await getValue(key, true);
        if (cachedValue) return cachedValue;

        // Cache miss, fetch fresh data
        const freshData = await fetchFunction();

        // Store in cache for next time
        await setValue(key, freshData, expireSeconds);

        return freshData;
    } catch (error) {
        console.error('Redis cacheResult error:', error);
        // If cache fails, just call the function directly
        return await fetchFunction();
    }
}

/**
 * Cache user's online status
 * @param {Object} redisClient - Redis client instance
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 */
async function cacheUserStatus(userId, isOnline) {
    try {
        const client = await getClient();
        const key = `user:status:${userId}`;
        await setValue(key, isOnline ? 'online' : 'offline');

        // Also maintain a set of online users
        const onlineUsersKey = 'users:online';
        if (isOnline) {
            await client.sAdd(onlineUsersKey, userId);
        } else {
            await client.sRem(onlineUsersKey, userId);
        }
    } catch (error) {
        console.error('Error caching user status:', error);
    }
}

/**
 * Get user's online status
 * @param {Object} redisClient - Redis client instance
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - User's online status
 */
async function getUserStatus(userId) {
    try {
        const status = await getValue(`user:status:${userId}`);
        return status === 'online';
    } catch (error) {
        console.error('Error getting user status:', error);
        return false;
    }
}

/**
 * Get all online users
 * @returns {Promise<string[]>} - Array of online user IDs
 */
async function getOnlineUsers() {
    try {
        const client = await getClient();
        return await client.sMembers('users:online');
    } catch (error) {
        console.error('Error getting online users:', error);
        return [];
    }
}

module.exports = {
    getClient,
    setValue,
    getValue,
    deleteValue,
    cacheResult,
    cacheUserStatus,
    getUserStatus,
    getOnlineUsers
};