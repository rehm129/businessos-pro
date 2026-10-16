import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function getDatabasePath(): string {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'businessos-pro.sqlite');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'BusinessOS Pro',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // IPC: Database file location in per-user AppData
  ipcMain.handle('db:getPath', () => {
    return getDatabasePath();
  });

  // IPC: Save database backup to chosen file path
  ipcMain.handle('db:saveBackup', async () => {
    try {
      const srcPath = getDatabasePath();
      if (!fs.existsSync(srcPath)) {
        return { success: false, error: 'Database file has not yet been initialized on disk.' };
      }

      const defaultName = `businessos_backup_${new Date().toISOString().slice(0, 10)}.sqlite`;
      const result = await dialog.showSaveDialog({
        title: 'Export BusinessOS Pro Database Backup',
        defaultPath: defaultName,
        filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'User cancelled backup selection' };
      }

      fs.copyFileSync(srcPath, result.filePath);
      return { success: true, filePath: result.filePath };
    } catch (err: any) {
      return { success: false, error: err.message || 'Backup failed' };
    }
  });

  // IPC: Restore database from backup with pre-restore safety copy
  ipcMain.handle('db:restoreBackup', async (_event, filePathToRestore?: string) => {
    try {
      let targetFile = filePathToRestore;
      if (!targetFile) {
        const dialogResult = await dialog.showOpenDialog({
          title: 'Select BusinessOS Pro SQLite Backup File',
          filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
          properties: ['openFile'],
        });
        if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
          return { success: false, error: 'User cancelled restore' };
        }
        targetFile = dialogResult.filePaths[0];
      }

      // 1. Verify file exists
      if (!fs.existsSync(targetFile)) {
        return { success: false, error: 'Selected backup file does not exist.' };
      }

      // 2. Validate SQLite header
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(targetFile, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      if (!buffer.toString('utf-8').startsWith('SQLite format 3')) {
        return { success: false, error: 'Invalid SQLite file header. File is not a valid SQLite database.' };
      }

      // 3. Create safety backup of existing live database before overwriting
      const currentDb = getDatabasePath();
      if (fs.existsSync(currentDb)) {
        const safetyBackupPath = path.join(
          app.getPath('userData'),
          `safety_backup_pre_restore_${Date.now()}.sqlite`
        );
        fs.copyFileSync(currentDb, safetyBackupPath);
      }

      // 4. Overwrite live DB with verified backup
      fs.copyFileSync(targetFile, currentDb);

      // Reload main window to refresh data
      if (mainWindow) {
        mainWindow.reload();
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Restore failed' };
    }
  });

  // Window control IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
