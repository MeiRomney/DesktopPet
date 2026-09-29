const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  clickThrough: (on) => ipcRenderer.send('click-through', on),
  react: (event) => ipcRenderer.invoke('react', event),
  hide: () => ipcRenderer.send('hide'),
});
