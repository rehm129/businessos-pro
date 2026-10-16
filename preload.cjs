// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  appVersion: "1.0.0",
  getDbPath: () => import_electron.ipcRenderer.invoke("db:getPath"),
  saveDbBackup: () => import_electron.ipcRenderer.invoke("db:saveBackup"),
  restoreDbBackup: (filePath) => import_electron.ipcRenderer.invoke("db:restoreBackup", filePath),
  checkIntegrity: () => import_electron.ipcRenderer.invoke("db:checkIntegrity"),
  printReceipt: (htmlContent) => import_electron.ipcRenderer.invoke("app:printReceipt", htmlContent),
  minimizeWindow: () => import_electron.ipcRenderer.send("window:minimize"),
  maximizeWindow: () => import_electron.ipcRenderer.send("window:maximize"),
  closeWindow: () => import_electron.ipcRenderer.send("window:close")
});
