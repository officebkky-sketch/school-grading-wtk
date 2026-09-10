// electron/main.cjs
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure autoUpdater logger
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

function setupAutoUpdater() {
  if (!app.isPackaged) {
    log.info('Running in development mode - skipping autoUpdater checks');
    return;
  }

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info.version);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'พร้อมติดตั้งเวอร์ชันใหม่',
      message: `ระบบวัดผล ปพ.5-6 ดิจิทัล โรงเรียนวัดท่าควาย เวอร์ชันใหม่ (v${info.version}) ดาวน์โหลดเสร็จเรียบร้อยแล้ว`,
      detail: 'ต้องการรีสตาร์ตเพื่อติดตั้งการอัปเดตทันทีเลยหรือไม่?',
      buttons: ['รีสตาร์ตและติดตั้งทันที', 'ติดตั้งภายหลังเมื่อปิดโปรแกรม'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // ตรวจสอบการอัปเดต 5 วินาทีหลังเปิดแอป และทุก 4 ชั่วโมง
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => log.error('Initial update check error:', err));
  }, 5000);

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => log.error('Interval update check error:', err));
  }, 4 * 60 * 60 * 1000);
}

// IPC handler ตรวจเช็คอัปเดตด้วยตนเอง
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) return { status: 'dev_mode' };
  try {
    const res = await autoUpdater.checkForUpdates();
    return { status: 'ok', updateInfo: res?.updateInfo };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'ระบบวัดผลและประเมินผล ปพ.5-6 ดิจิทัล - โรงเรียนวัดท่าควาย',
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  Menu.setApplicationMenu(null); // ซ่อนเมนูด้านบนเพื่อความเรียบร้อย

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
