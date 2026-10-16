var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"), 1);
var fs = __toESM(require("fs"), 1);
var mainWindow = null;
function getDatabasePath() {
  const userDataDir = import_electron.app.getPath("userData");
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, "businessos-pro.sqlite");
}
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "BusinessOS Pro",
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  const isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.ipcMain.handle("db:getPath", () => {
    return getDatabasePath();
  });
  import_electron.ipcMain.handle("db:saveBackup", async () => {
    try {
      const srcPath = getDatabasePath();
      if (!fs.existsSync(srcPath)) {
        return { success: false, error: "Database file has not yet been initialized on disk." };
      }
      const defaultName = `businessos_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.sqlite`;
      const result = await import_electron.dialog.showSaveDialog({
        title: "Export BusinessOS Pro Database Backup",
        defaultPath: defaultName,
        filters: [{ name: "SQLite Database", extensions: ["sqlite", "db"] }]
      });
      if (result.canceled || !result.filePath) {
        return { success: false, error: "User cancelled backup selection" };
      }
      fs.copyFileSync(srcPath, result.filePath);
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message || "Backup failed" };
    }
  });
  import_electron.ipcMain.handle("db:restoreBackup", async (_event, filePathToRestore) => {
    try {
      let targetFile = filePathToRestore;
      if (!targetFile) {
        const dialogResult = await import_electron.dialog.showOpenDialog({
          title: "Select BusinessOS Pro SQLite Backup File",
          filters: [{ name: "SQLite Database", extensions: ["sqlite", "db"] }],
          properties: ["openFile"]
        });
        if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
          return { success: false, error: "User cancelled restore" };
        }
        targetFile = dialogResult.filePaths[0];
      }
      if (!fs.existsSync(targetFile)) {
        return { success: false, error: "Selected backup file does not exist." };
      }
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(targetFile, "r");
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      if (!buffer.toString("utf-8").startsWith("SQLite format 3")) {
        return { success: false, error: "Invalid SQLite file header. File is not a valid SQLite database." };
      }
      const currentDb = getDatabasePath();
      if (fs.existsSync(currentDb)) {
        const safetyBackupPath = path.join(
          import_electron.app.getPath("userData"),
          `safety_backup_pre_restore_${Date.now()}.sqlite`
        );
        fs.copyFileSync(currentDb, safetyBackupPath);
      }
      fs.copyFileSync(targetFile, currentDb);
      if (mainWindow) {
        mainWindow.reload();
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Restore failed" };
    }
  });
  import_electron.ipcMain.on("window:minimize", () => mainWindow?.minimize());
  import_electron.ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  import_electron.ipcMain.on("window:close", () => mainWindow?.close());
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
