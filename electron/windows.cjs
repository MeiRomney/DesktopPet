// Watches which window is in the foreground (Windows only) so the pet can walk along its borders
// and get out of the way of fullscreen apps. It only reads the window's position, size and class
// name. Never its title or contents.
const { spawn } = require('child_process');
const { screen } = require('electron');

// One long-lived PowerShell process prints a line every 400 ms: L,T,R,B,pid,zoomed,iconic,caption,class
const SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices; using System.Text;
public static class FG {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int size);
  public static string Probe() {
    IntPtr h = GetForegroundWindow();
    if (h == IntPtr.Zero) return "";
    RECT r;
    // DWMWA_EXTENDED_FRAME_BOUNDS = the visible frame, without the invisible resize border
    if (DwmGetWindowAttribute(h, 9, out r, Marshal.SizeOf(typeof(RECT))) != 0 && !GetWindowRect(h, out r)) return "";
    uint pid; GetWindowThreadProcessId(h, out pid);
    StringBuilder cls = new StringBuilder(256); GetClassName(h, cls, 256);
    int caption = (GetWindowLong(h, -16) & 0x00C00000) == 0x00C00000 ? 1 : 0;
    return r.L + "," + r.T + "," + r.R + "," + r.B + "," + pid + "," + (IsZoomed(h) ? 1 : 0) + "," + (IsIconic(h) ? 1 : 0) + "," + caption + "," + cls;
  }
}
'@
[void][FG]::SetProcessDPIAware()
while ($true) { [Console]::Out.WriteLine([FG]::Probe()); [Console]::Out.Flush(); Start-Sleep -Milliseconds 400 }
`;

// Desktop, taskbar and other shell surfaces are not "apps" the pet should perch on.
const IGNORED = new Set([
  'Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd', 'NotifyIconOverflowWindow',
  'TopLevelWindowForOverflowXamlIsland', 'XamlExplorerHostIslandWindow', 'Windows.UI.Core.CoreWindow',
]);

/** onChange(win | null) fires only when the foreground window changes. win is in overlay (CSS px) coordinates. */
function createTracker(onChange) {
  let proc = null, buf = '', last = '__none__';

  const emit = (payload) => {
    const key = JSON.stringify(payload);
    if (key === last) return;
    last = key;
    onChange(payload);
  };

  const handle = (line) => {
    const p = line.trim().split(',');
    if (p.length < 9) return;
    const [L, T, R, B, pid, zoomed, iconic, caption] = p.slice(0, 8).map(Number);
    if (pid === process.pid) return; // the pet itself has focus (panel / chat box): keep the last known window
    const cls = p.slice(8).join(',');
    if (iconic || IGNORED.has(cls) || !(R > L && B > T)) return emit(null);

    // Physical pixels -> the same DIP units the page uses, relative to the overlay's top-left corner.
    const tl = screen.screenToDipPoint({ x: L, y: T }), br = screen.screenToDipPoint({ x: R, y: B });
    const d = screen.getPrimaryDisplay().bounds;
    const x = Math.round(tl.x - d.x), y = Math.round(tl.y - d.y), w = Math.round(br.x - tl.x), h = Math.round(br.y - tl.y);
    const cx = x + w / 2, cy = y + h / 2;
    if (cx < 0 || cx > d.width || cy < 0 || cy > d.height) return emit(null); // another monitor
    // Fullscreen = covers the whole display and has no title bar (video, game, F11 browser, slideshow).
    const fullscreen = x <= 1 && y <= 1 && w >= d.width - 2 && h >= d.height - 2 && !caption;
    emit({ x, y, w, h, maximized: zoomed === 1, fullscreen });
  };

  return {
    start() {
      if (proc || process.platform !== 'win32') return;
      last = '__none__';
      const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64');
      proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], { windowsHide: true });
      proc.stdout.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        let i;
        while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1); }
      });
      proc.stderr.on('data', (e) => { if (process.env.PET_DEV) console.warn('[window tracker]', String(e)); });
      proc.on('exit', () => { proc = null; buf = ''; });
    },
    stop() {
      if (proc) { proc.kill(); proc = null; buf = ''; }
      last = '__none__';
    },
  };
}

module.exports = { createTracker };
