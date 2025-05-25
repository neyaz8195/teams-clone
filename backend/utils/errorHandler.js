/**
 * Error handling utilities for consistent API error responses
 */

/**
 * Custom API Error class with status code
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error middleware for Express
 */
const errorMiddleware = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error values
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';

    // Don't expose stack traces in production
    const details = process.env.NODE_ENV === 'production'
        ? null
        : { stack: err.stack, ...(err.details || {}) };

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(details ? { details } : {})
        }
    });
};

/**
 * Common error response helper functions
 */
const errorResponses = {
    badRequest: (message, details) => new ApiError(400, message || 'Bad request', details),
    unauthorized: (message, details) => new ApiError(401, message || 'Unauthorized', details),
    forbidden: (message, details) => new ApiError(403, message || 'Forbidden', details),
    notFound: (message, details) => new ApiError(404, message || 'Resource not found', details),
    methodNotAllowed: (message, details) => new ApiError(405, message || 'Method not allowed', details),
    conflict: (message, details) => new ApiError(409, message || 'Conflict', details),
    serverError: (message, details) => new ApiError(500, message || 'Internal server error', details)
};

module.exports = {
    ApiError,
    asyncHandler,
    errorMiddleware,
    errorResponses
};
