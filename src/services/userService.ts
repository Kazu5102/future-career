import { UserInfo } from '../types';
import { ADJECTIVES, ANIMALS } from '../data/nicknames';

const USERS_STORAGE_KEY = 'careerConsultingUsers_v1';

export const generateNickname = (existingNicknames: string[]): string => {
  let nickname;
  let attempts = 0;
  do {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    nickname = `${adj}${animal}`;
    attempts++;
  } while (existingNicknames.includes(nickname) && attempts < 50); // Avoid infinite loops
  return nickname;
};

export const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const getUsers = (): UserInfo[] => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get users from localStorage", error);
    return [];
  }
};

export const saveUsers = (users: UserInfo[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};

export const getUserById = (userId: string): UserInfo | undefined => {
  return getUsers().find(u => u.id === userId);
}

export const addNewUser = (): UserInfo => {
    const users = getUsers();
    const existingNicknames = users.map(u => u.nickname);
    
    const newUser: UserInfo = {
        id: `user_${Date.now()}`,
        nickname: generateNickname(existingNicknames),
        pin: generatePin(),
    };
    
    saveUsers([...users, newUser]);
    return newUser;
}