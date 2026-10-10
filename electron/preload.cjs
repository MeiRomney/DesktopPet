const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  clickThrough: (on) => ipcRenderer.send("click-through", on),
  react: (event) => ipcRenderer.invoke("react", event), // AI chat reply
  look: () => ipcRenderer.invoke("look"), // AI screen glance
  remember: (text) => ipcRenderer.send("remember", text), // log a scripted event, no AI
  hide: () => ipcRenderer.send("hide"),
  petLeft: () => ipcRenderer.send("pet-left"),
  petVisible: () => ipcRenderer.invoke("pet-visible"),
  togglePet: () => ipcRenderer.send("toggle-pet"),
  toggleControl: () => ipcRenderer.send("toggle-control"),
  workArea: () => ipcRenderer.invoke("work-area"), // screen minus the taskbar
  trackWindows: (on) => ipcRenderer.send("track-windows", on), // follow the foreground window (Edges mode)
  openControl: () => ipcRenderer.send("open-control"),
  bus: {
    send: (msg) => ipcRenderer.send("bus", msg),
    on: (cb) => {
      const h = (_e, m) => cb(m);
      ipcRenderer.on("bus", h);
      return () => ipcRenderer.removeListener("bus", h);
    },
  },
  onActiveWindow: (cb) => {
    const h = (_e, w) => cb(w);
    ipcRenderer.on("active-window", h);
    return () => ipcRenderer.removeListener("active-window", h);
  },
});
