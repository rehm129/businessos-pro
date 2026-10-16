export interface ElectronApi {
  isElectron: boolean;
  platform: string;
  appVersion: string;
  getDbPath: () => Promise<string>;
  saveDbBackup: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  restoreDbBackup: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  checkIntegrity: () => Promise<{ ok: boolean; rows: string[] }>;
  printReceipt: (htmlContent: string) => Promise<boolean>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}
