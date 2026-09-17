const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const { initDatabase, closeDatabase } = require('./database/db');
const { registerAllIPC } = require('./ipc/index');
const logger = require('./utils/logger');

let mainWindow = null;
let isDev = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'ERP Desktop System',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: true,
    backgroundColor: '#f8fafc',
  });

  mainWindow.focus();

  const distPath = path.join(__dirname, '../dist/index.html');
  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  isDev = !app.isPackaged;
  logger.info('Starting ERP Desktop Application');

  try {
    // 1. Initialize SQLite Database
    initDatabase();
    logger.info('Database initialized successfully');

    // 2. Register all IPC modules
    registerAllIPC(ipcMain);
    logger.info('IPC handlers registered successfully');

    // 3. Create GUI Window
    createWindow();
  } catch (err) {
    logger.error('Fatal initialization error:', { error: err.message, stack: err.stack });
    console.error('Fatal initialization error:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
