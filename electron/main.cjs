const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
  });

  win.loadURL("https://med-track-final.vercel.app/");
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates after app starts
  autoUpdater.checkForUpdatesAndNotify();
});

// Update available
autoUpdater.on("update-available", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Update Available",
    message: "A new version of MedTrack is being downloaded.",
  });
});

// Update downloaded
autoUpdater.on("update-downloaded", () => {
  dialog
    .showMessageBox({
      type: "info",
      title: "Update Ready",
      message:
        "A new version has been downloaded. Restart MedTrack now to install it?",
      buttons: ["Restart Now", "Later"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

// Update errors
autoUpdater.on("error", (err) => {
  console.error("Auto Update Error:", err);
});

// macOS support
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Windows/Linux close behavior
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});