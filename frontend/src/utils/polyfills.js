// Polyfill for global and process in the browser environment
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = window.process || {};
    window.process.env = window.process.env || {};
}

export default {};
