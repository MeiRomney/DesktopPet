const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  clickThrough: (on) => ipcRenderer.send("click-through", on),
  react: (event) => ipcRenderer.invoke("react", event), // AI chat reply
  look: () => ipcRenderer.invoke("look"), // AI screen glance
  remember: (text) => ipcRenderer.send("remember", text), // log a scripted event, no AI
  hide: () => ipcRenderer.send("hide"),
});
