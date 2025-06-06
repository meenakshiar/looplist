// Utility to reset session by clearing cookies
export const resetAuthSession = () => {
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Redirect to login
    window.location.href = '/auth/login?reset=1';
}; 