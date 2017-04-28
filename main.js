/*global require,process,__dirname*/
'use strict';

// const spawn = require('child_process').spawn;
const electron = require('electron');
// const pkgUp = require('pkg-up');
// const currentPath = require('current-path');
// const displayNotification = require('display-notification');
// const getGulpTasks = require('get-gulp-tasks');
// const _ = require('lodash');
const path = require('path');
// const fixPath = require('fix-path');
const { BrowserWindow } = electron;

const app = electron.app;
const dialog = electron.dialog;
const Tray = electron.Tray;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const TRAY_UPDATE_INTERVAL = 1000;

let tray;
let prevPath;


if (process.platform === 'darwin') {
  app.dock.hide();
}

// fix the $PATH on macOS
// fixPath();


function createTrayMenu() {
  const menu = new Menu();

  menu.append(new MenuItem({type: "separator"}));
  menu.append(
    new MenuItem({
      label: "Open server log",
      click: openLogWindow
    })
  );
  menu.append(
    new MenuItem({
      label: process.platform === "darwin" ? `Quit ${app.getName()}` : "Quit",
      click: app.quit
    })
  );

  tray.setContextMenu(menu);

  return menu;
}

function updateTray() {
  // currentPath().then(dir => {
  //   setTimeout(updateTray, TRAY_UPDATE_INTERVAL);
  // });
}

app.on("ready", () => {
  const name = "menubar/lively-icon";
  tray = new Tray(path.join(__dirname, `${name}.png`));
  createTrayMenu();
  updateTray();
});

app.on('window-all-closed', () => {
  console.log("all windows closed");
});

process.on('uncaughtException', console.error);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

app.on("ready", () => {
  setTimeout(() => {
    openLogWindow();
    var startServer = require("lively.server");
    startServer("localhost", 9012, path.resolve(path.join(__dirname, "..")));
  }, 300);
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-




// import { resource } from "lively.resources";
// // import LivelyServer from "lively.server";
// import { path } from "path";
var logWindow;
var originalConsoleMethods = originalConsoleMethods || {};

var fs = require("fs");
let logStream = fs.createWriteStream(__dirname + '/log.txt');

function openLogWindow() {

  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.show();
    return logWindow;
  }

  logWindow = new BrowserWindow({width: 800, height: 600});
  logWindow.show();
  
  // let server = LivelyServer.servers.values().next().value
  // win.loadURL(`http://${server.hostname}:${server.port}/lively.app/logger.html`)
  // logWindow.loadURL(url);
  logWindow.loadURL("file://" + __dirname + "/logger.html");

  
  let stdoutHandler = data => logWindow.webContents.send("message", {type: "stdout", content: String(data)});
  let stderrHandler = data => logWindow.webContents.send("message", {type: "stderr", content: String(data)});
  process.stdout.on("data", stdoutHandler)
  process.stderr.on("data", stderrHandler)
  
  
  let consoleWraps = ["log", "warn", "error"];
  originalConsoleMethods = originalConsoleMethods || {};
  consoleWraps.forEach(selector => {
    if (!originalConsoleMethods[selector])
      originalConsoleMethods[selector] = console[selector];
    console[selector] = function(/*args*/) {
      let content = lively.lang.string.format(...arguments);
      logStream.write(content + "\n");
      logWindow.webContents.send("message", {type: selector, content});
      return originalConsoleMethods[selector](...arguments);
    }
  });
}
