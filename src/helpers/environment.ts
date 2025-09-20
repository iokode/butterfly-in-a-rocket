export function isRunningOnBrowser() {
    return typeof window !== 'undefined';
}

export function isDevelopment(): boolean {
    if (isRunningOnBrowser()) {
        return window.location.port === '4321';
    } else {
        return process.env.NODE_ENV === 'development';
    }
}