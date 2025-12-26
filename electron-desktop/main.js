const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: 'Deliver Point POS',
    webPreferences: {
      nodeIntegration: false,
    },
  });

  // Always load from localhost (requires expo web to be running)
  mainWindow.loadURL('http://localhost:19006');
  mainWindow.maximize();
});

app.on('window-all-closed', () => {
  app.quit();
});