
const PASSWORD_KEY = 'ai-career-consulting-admin-password';
const INITIAL_PASSWORD = '5102';

export const getPassword = (): string => {
    return localStorage.getItem(PASSWORD_KEY) || INITIAL_PASSWORD;
};

export const setPassword = (newPassword: string): void => {
    if (newPassword) {
        localStorage.setItem(PASSWORD_KEY, newPassword);
    }
};

export const verifyPassword = (input: string): boolean => {
    return input === getPassword();
};
