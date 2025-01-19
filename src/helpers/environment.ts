export function isRunningOnBrowser() {
    return typeof window !== 'undefined';
}

export function isDevelopment(): boolean {
    if (isRunningOnBrowser()) {
        return window.location.hostname === 'localhost';
    } else {
        return process.env.NODE_ENV === 'development';
    }
}