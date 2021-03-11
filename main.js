const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { protocol } = require("electron");
const path = require("path");
const ytMusic = require("node-youtube-music").default;
const cors = require("cors");
const express = require("express");
const server = express();
const port = 7999;
let autoJoinRoom;

require("update-electron-app")();

if (require("electron-squirrel-startup")) return app.quit();

server.use(cors());
server.use(express.json());

server.post("/auth", (req, res) => {
  win.webContents.send("auth", req.body);
  res.send("success");
});

server.get("/exists", async (_, res) => {
  res.send(true);
});

server.get("/youtubeSearch", async (req, res) => {
  const lang = req.query.lang?.toString() ?? "en";
  const searchResults = await ytMusic.search(req.query.search.toString(), {
    lang,
  });
  res.send(searchResults);
});

server.get("/youtubeSuggestion", async (req, res) => {
  const lang = req.query.lang?.toString() ?? "en";
  const suggestions = await ytMusic.getSuggestions(req.query.id.toString(), {
    lang,
  });
  res.send(suggestions);
});

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("https://jamhouse.app/me");
}

app.whenReady().then(() => {
  server.listen(port, () => console.log("Server listening"));
  createWindow();
  if (autoJoinRoom) {
    win.webContents.send("join-room", data.replace("jamhouse://", ""));
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.setAsDefaultProtocolClient("jamhouse");

ipcMain.on("open-link", (_, args) => {
  shell.openExternal(args);
});

app.on("open-url", function (event, data) {
  event.preventDefault();
  autoJoinRoom = data.replace("jamhouse://", "");
  try {
    win.webContents.send("join-room", data.replace("jamhouse://", ""));
  } catch (e) {}
});
