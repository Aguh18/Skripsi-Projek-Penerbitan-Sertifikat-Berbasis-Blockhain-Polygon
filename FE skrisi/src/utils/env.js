export function getEnv(key, fallback = '') {
    const value = process.env[`REACT_APP_${key}`] ?? fallback;

    if (!value && !fallback) {
        console.warn(`Environment variable REACT_APP_${key} is not defined and no fallback provided.`);
    }

    return value;
}
