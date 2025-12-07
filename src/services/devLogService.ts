export interface DevLogEntry {
  timestamp: string;
  userPrompt: string;
  aiSummary: string;
}

export interface DevLog {
  version: number;
  entries: DevLogEntry[];
}

const DEV_LOG_STORAGE_KEY = 'devLog_v1';
const DEV_LOG_VERSION = 1;

export const getLogs = (): DevLog => {
  try {
    const data = localStorage.getItem(DEV_LOG_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.version === DEV_LOG_VERSION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to get dev logs from localStorage", error);
  }
  return { version: DEV_LOG_VERSION, entries: [] };
};

export const saveLogs = (logs: DevLog): void => {
  try {
    localStorage.setItem(DEV_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save dev logs to localStorage", error);
  }
};

export const addLogEntry = ({ userPrompt, aiSummary }: { userPrompt: string, aiSummary: string }): void => {
  const logs = getLogs();
  const newEntry: DevLogEntry = {
    timestamp: new Date().toISOString(),
    userPrompt,
    aiSummary,
  };
  logs.entries.push(newEntry);
  saveLogs(logs);
};

export const clearLogs = (): void => {
  try {
    localStorage.removeItem(DEV_LOG_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear dev logs from localStorage", error);
  }
};