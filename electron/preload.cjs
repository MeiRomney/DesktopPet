const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  clickThrough: (on) => ipcRenderer.send("click-through", on),
  react: (event) => ipcRenderer.invoke("react", event), // AI chat reply
  look: () => ipcRenderer.invoke("look"), // AI screen glance
  remember: (text) => ipcRenderer.send("remember", text), // log a scripted event, no AI
  hide: () => ipcRenderer.send("hide"),
  workArea: () => ipcRenderer.invoke("work-area"), // screen minus the taskbar
  trackWindows: (on) => ipcRenderer.send("track-windows", on), // follow the foreground window (Edges mode)
  onOpenControl: (cb) => {
    // tray menu / Ctrl+Alt+O
    const h = () => cb();
    ipcRenderer.on("open-control", h);
    return () => ipcRenderer.removeListener("open-control", h);
  },
  onActiveWindow: (cb) => {
    const h = (_e, w) => cb(w);
    ipcRenderer.on("active-window", h);
    return () => ipcRenderer.removeListener("active-window", h);
  },
});
