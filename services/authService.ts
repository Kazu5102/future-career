
const STORAGE_KEY = 'adminPassword_v1';
const DEFAULT_PASSWORD = '5102';

export const getStoredPassword = (): string => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PASSWORD;
};

export const checkPassword = (password: string): boolean => {
    return password === getStoredPassword();
};

export const setPassword = (newPassword: string, currentPassword: string): { success: boolean; message: string } => {
    if (!checkPassword(currentPassword)) {
        return { success: false, message: '現在のパスワードが正しくありません。' };
    }
    if (newPassword.length < 4) {
        return { success: false, message: '新しいパスワードは4文字以上で設定してください。' };
    }
    localStorage.setItem(STORAGE_KEY, newPassword);
    return { success: true, message: 'パスワードが正常に変更されました。' };
};
