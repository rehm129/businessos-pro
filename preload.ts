import { contextBridge, ipcRenderer } from 'electron';

// Restricted preload bridge conforming strictly to contextIsolation
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  appVersion: '1.0.0',
  getDbPath: () => ipcRenderer.invoke('db:getPath'),
  saveDbBackup: () => ipcRenderer.invoke('db:saveBackup'),
  restoreDbBackup: (filePath: string) => ipcRenderer.invoke('db:restoreBackup', filePath),
  checkIntegrity: () => ipcRenderer.invoke('db:checkIntegrity'),
  printReceipt: (htmlContent: string) => ipcRenderer.invoke('app:printReceipt', htmlContent),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
});
