/* Shell command runner for Terminal — SIMULATED only (MacVFS in-browser).
 * Security:
 *  - Never touches host FS, shell, or native processes
 *  - No eval / Function / dynamic code execution of user input
 *  - No real network from terminal (curl is mocked)
 *  - open/kill only control in-page window manager
 */
window.MacShell = (() => {
  const MAX_CMD_LEN = 2000;
  const MAX_OUT_LEN = 20000;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clip(s, n = MAX_OUT_LEN) {
    s = String(s ?? "");
    return s.length > n ? s.slice(0, n) + "\n… (output truncated)" : s;
  }

  function parse(line) {
    // simple: support echo hello > file and >> append
    let append = false;
    let redir = null;
    let core = line;
    const m = line.match(/^(.*?)(>>|>)\s*(.+)$/);
    if (m) {
      core = m[1].trim();
      append = m[2] === ">>";
      redir = m[3].trim();
    }
    const parts = [];
    let cur = "";
    let q = null;
    for (let i = 0; i < core.length; i++) {
      const c = core[i];
      if (q) {
        if (c === q) q = null;
        else cur += c;
      } else if (c === '"' || c === "'") {
        q = c;
      } else if (/\s/.test(c)) {
        if (cur) parts.push(cur);
        cur = "";
      } else cur += c;
    }
    if (cur) parts.push(cur);
    return { argv: parts, redir, append };
  }

  async function run(line, ctx = {}) {
    if (String(line || "").length > MAX_CMD_LEN) {
      return { out: "zsh: command too long (simulated shell limit)", code: 1 };
    }
    const { argv, redir, append } = parse(line);
    if (!argv.length) return { out: "", code: 0 };

    const [cmd, ...args] = argv;
    // Block anything that looks like host-shell invocation (defense in depth)
    const blocked = new Set([
      "bash", "sh", "zsh", "fish", "cmd", "powershell", "pwsh",
      "sudo", "su", "doas", "chmod", "chown", "mount", "umount",
      "dd", "mkfs", "fdisk", "nc", "ncat", "netcat", "ssh", "scp",
      "wget", "ftp", "telnet", "python", "python3", "node", "perl",
      "ruby", "php", "gcc", "make", "docker", "kubectl", "systemctl",
    ]);
    if (blocked.has(cmd) || cmd.includes("/") || cmd.includes("\\") || cmd.includes("..")) {
      // Allow path-like only for our builtins that take paths as args, not as cmd name
      if (blocked.has(cmd) || cmd.includes("/") || cmd.includes("\\")) {
        return {
          out: clip(
            `zsh: simulated shell — «${cmd}» is not available.\n` +
              "This terminal cannot run host programs or access your real OS.\n" +
              "Type 'help' for built-in simulated commands."
          ),
          code: 127,
        };
      }
    }

    const vfs = window.MacVFS;
    if (!vfs) return { out: "vfs unavailable", code: 1 };
    let out = "";
    let code = 0;
    let isHtml = false;

    const err = (msg) => {
      out = msg;
      code = 1;
    };

    try {
      switch (cmd) {
        case "help":
        case "?":
          out = [
            "macOS Web shell — virtual OS commands",
            "",
            "  help                 显示帮助",
            "  clear                清屏",
            "  pwd / cd [dir]       路径",
            "  ls [-la] [path]      列表",
            "  tree [path]          目录树",
            "  cat <file>           读文件",
            "  echo <text>          输出（支持 > >> 重定向）",
            "  touch <file>         创建/更新文件",
            "  mkdir [-p] <dir>     建目录",
            "  rm [-r] <path>       删除",
            "  write <file> <text>  写入文本",
            "  head <file>          前几行",
            "  wc <file>            字数统计",
            "  stat <path>          元信息",
            "  df / free            磁盘/内存（示意）",
            "  ps / top             进程（打开的窗口）",
            "  kill <app>           关闭应用窗口",
            "  open <app|file>      打开应用或文件",
            "  curl <url>           模拟 HTTP（无真实网络）",
            "  whoami / hostname / date / uname / env",
            "  history              命令历史",
            "  neofetch             系统信息",
            "  resetfs              重置虚拟磁盘",
            "  safety               安全说明",
            "",
            "⚠ 纯浏览器模拟：不访问真实磁盘/进程/网络。",
            "示例:  mkdir demo && cd demo && echo hi > a.txt && cat a.txt",
          ].join("\n");
          break;

        case "safety":
        case "security":
          out = [
            "macOS Web Terminal — Security Model",
            "─────────────────────────────────",
            "✓ Virtual FS only (browser localStorage sandbox)",
            "✓ No host shell, no native binaries, no Node/Python",
            "✓ No real process control (ps/kill = in-page windows)",
            "✓ curl is MOCKED — does not send network requests",
            "✓ Commands are a fixed switch-case (no eval)",
            "✓ Cannot read your real files or system config",
            "",
            "Safari «新标签» opens sites in your real browser by design",
            "(user-initiated navigation only).",
          ].join("\n");
          break;

        case "pwd":
          out = vfs.getCwd();
          break;

        case "cd": {
          const t = args[0] || vfs.home();
          const path = t === "~" ? vfs.home() : t.startsWith("~/") ? vfs.home() + t.slice(1) : t;
          vfs.setCwd(path);
          out = "";
          break;
        }

        case "ls": {
          let path = vfs.getCwd();
          let long = false;
          args.forEach((a) => {
            if (a.startsWith("-")) {
              if (a.includes("l") || a.includes("a")) long = true;
            } else path = a === "~" ? vfs.home() : a;
          });
          path = path === "~" ? vfs.home() : path;
          const base = vfs.normalize(path);
          const names = vfs.list(base);
          const fullOf = (n) => (base === "/" ? "/" + n : base.replace(/\/$/, "") + "/" + n);
          if (!long) {
            out = names
              .map((n) => {
                const node = vfs.resolve(fullOf(n)).node;
                return node?.type === "dir" ? n + "/" : n;
              })
              .join("  ");
          } else {
            out = names
              .map((n) => {
                const st = vfs.stat(fullOf(n));
                const mode = st.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
                const t = new Date(st.mtime).toLocaleString();
                return `${mode}  winter  staff  ${String(st.size).padStart(6)}  ${t}  ${n}${st.type === "dir" ? "/" : ""}`;
              })
              .join("\n");
          }
          break;
        }

        case "tree":
          out = vfs.tree(args[0] ? (args[0] === "~" ? vfs.home() : args[0]) : vfs.getCwd());
          break;

        case "cat": {
          if (!args[0]) {
            err("usage: cat <file>");
            break;
          }
          out = vfs.read(args[0] === "~" ? vfs.home() : args[0]);
          break;
        }

        case "head": {
          if (!args[0]) {
            err("usage: head <file>");
            break;
          }
          out = vfs.read(args[0]).split("\n").slice(0, 10).join("\n");
          break;
        }

        case "wc": {
          if (!args[0]) {
            err("usage: wc <file>");
            break;
          }
          const t = vfs.read(args[0]);
          const lines = t ? t.split("\n").length : 0;
          const words = t.trim() ? t.trim().split(/\s+/).length : 0;
          out = ` ${lines}  ${words}  ${t.length} ${args[0]}`;
          break;
        }

        case "stat": {
          if (!args[0]) {
            err("usage: stat <path>");
            break;
          }
          const st = vfs.stat(args[0]);
          out = `  File: ${st.path}\n  Type: ${st.type}\n  Size: ${st.size}\n  Modify: ${new Date(st.mtime).toISOString()}`;
          break;
        }

        case "echo":
          out = args.join(" ");
          break;

        case "write": {
          if (args.length < 2) {
            err("usage: write <file> <text...>");
            break;
          }
          const file = args[0];
          const text = args.slice(1).join(" ") + "\n";
          vfs.write(file, text, false);
          out = `wrote ${text.length} bytes → ${vfs.normalize(file)}`;
          break;
        }

        case "touch":
          if (!args[0]) err("usage: touch <file>");
          else {
            args.forEach((f) => vfs.touch(f));
            out = "";
          }
          break;

        case "mkdir": {
          let p = false;
          const dirs = [];
          args.forEach((a) => {
            if (a === "-p") p = true;
            else dirs.push(a);
          });
          if (!dirs.length) err("usage: mkdir [-p] <dir>");
          else {
            dirs.forEach((d) => {
              if (p) {
                // create parents; ignore if exists
                const full = vfs.normalize(d);
                if (!vfs.exists(full)) vfs.mkdir(full);
                else {
                  // ensure intermediate via write-less mkdir path
                  try {
                    vfs.mkdir(full);
                  } catch (e) {
                    if (!String(e.message).includes("exists")) throw e;
                  }
                }
              } else {
                vfs.mkdir(d);
              }
            });
            out = "";
          }
          break;
        }

        case "rm": {
          let rec = false;
          const paths = [];
          args.forEach((a) => {
            if (a === "-r" || a === "-rf" || a === "-fr") rec = true;
            else paths.push(a);
          });
          if (!paths.length) err("usage: rm [-r] <path>");
          else {
            paths.forEach((p) => vfs.rm(p, rec));
            out = "";
          }
          break;
        }

        case "df":
          out = "Filesystem     Size  Used Avail Use% Mounted on\nvfs            128M  4.2M  124M   4% /\nlocalStorage   5.0M  0.1M  4.9M   2% /Users/winter";
          break;

        case "free":
        case "memory": {
          const mem = performance.memory;
          if (mem) {
            const mb = (n) => (n / 1048576).toFixed(1) + " MB";
            out = `JS Heap  used ${mb(mem.usedJSHeapSize)} / total ${mb(mem.totalJSHeapSize)} / limit ${mb(mem.jsHeapSizeLimit)}`;
          } else {
            out = `Memory: ~${navigator.deviceMemory || "?"} GB device (browser reported)\nHeap detail unavailable in this browser.`;
          }
          break;
        }

        case "ps":
        case "top": {
          const rows = [["PID", "TTY", "STAT", "TIME", "COMMAND"]];
          let pid = 100;
          rows.push([String(pid++), "ttys000", "Ss", "0:00.01", "-zsh"]);
          const wins = window.MacWM ? [...window.MacWM.getAll().values()] : [];
          wins.forEach((w) => {
            rows.push([
              String(pid++),
              "??",
              w.el.classList.contains("minimized") ? "S" : "R",
              "0:00.12",
              w.app.name.replace(/\s/g, "") + ".app",
            ]);
          });
          rows.push([String(pid++), "??", "S", "0:00.00", "WindowServer"]);
          const widths = [0, 1, 2, 3, 4].map((i) => Math.max(...rows.map((r) => r[i].length)));
          out = rows
            .map((r) => r.map((c, i) => c.padEnd(widths[i] + 2)).join(""))
            .join("\n");
          break;
        }

        case "kill": {
          if (!args[0]) {
            err("usage: kill <appId|AppName>");
            break;
          }
          const key = args[0].replace(/\.app$/i, "").toLowerCase();
          const catalog = window.MacApps?.catalog || [];
          const app = catalog.find((a) => a.id === key || a.name.toLowerCase() === key);
          if (app && window.MacWM?.getAll().has(app.id)) {
            window.MacWM.close(app.id);
            out = `terminated ${app.name}`;
          } else {
            err(`No process: ${args[0]}`);
          }
          break;
        }

        case "open": {
          if (!args[0]) {
            err("usage: open <app|file>");
            break;
          }
          const target = args[0];
          const catalog = window.MacApps?.catalog || [];
          const app = catalog.find(
            (a) => a.id === target.replace(/\.app$/i, "") || a.name.toLowerCase() === target.toLowerCase()
          );
          if (app) {
            window.MacOS?.openApp(app.id);
            out = `Opening ${app.name}...`;
            break;
          }
          // open file by extension
          if (vfs.exists(target)) {
            const st = vfs.stat(target);
            if (st.type === "dir") {
              window.MacOS?.openApp("finder");
              out = `Opening folder ${st.path}`;
            } else if (/\.(txt|md|log|json|js|css|html)$/i.test(target)) {
              const content = vfs.read(target);
              window.MacOS?.openApp("textedit");
              // stash for textedit to pick up
              window.__macOpenFile = { path: st.path, content };
              out = `Opening ${st.path} in TextEdit`;
            } else {
              out = `Don't know how to open ${target}`;
            }
          } else {
            err(`No such file or app: ${target}`);
          }
          break;
        }

        case "whoami":
          out = "winter";
          break;
        case "hostname":
          out = "macos-web.local";
          break;
        case "date":
          out = new Date().toString();
          break;
        case "uname":
          out = args.includes("-a")
            ? "Darwin macos-web 24.0.0 Darwin Kernel Version 24.0.0 (Web); root:xnu-web/RELEASE_X86_64 x86_64"
            : "Darwin";
          break;
        case "env":
          out = [
            "USER=winter",
            "HOME=/Users/winter",
            "SHELL=/bin/zsh",
            "TERM=xterm-web",
            "LANG=zh_CN.UTF-8",
            `PWD=${vfs.getCwd()}`,
          ].join("\n");
          break;

        case "history":
          out = (ctx.history || []).map((c, i) => `  ${i + 1}  ${c}`).join("\n") || "  (empty)";
          break;

        case "neofetch":
          isHtml = true;
          out = `<span style="color:#0a84ff;white-space:pre">          .:'
      __ :'__
   .'\`  \`-'  \`'.
  :          .-'
  :         :     
   :_________:\`-.</span>  <b>winter@macos-web</b>
<span style="color:#0a84ff">    \`.__.-.__.'</span>
OS: macOS Web 15 (Browser)
Host: Pure HTML/CSS/JS
Kernel: JavaScript
Shell: zsh-web 2.0
DE: Aqua Web
Resolution: ${window.innerWidth}x${window.innerHeight}
Terminal: Web Terminal
CPU: ${navigator.hardwareConcurrency || "?"} threads
Memory: ${navigator.deviceMemory ? navigator.deviceMemory + " GB" : "n/a"}
Disk: VFS on localStorage`;
          break;

        case "curl": {
          // INTENTIONALLY MOCKED — no fetch(), no real network from terminal.
          // Prevents using this demo as a browser-side SSRF / LAN probe tool.
          if (!args[0]) {
            err("usage: curl <url>   (simulated — no real network)");
            break;
          }
          let url = args[0];
          if (!/^https?:\/\//i.test(url)) url = "https://" + url;
          let host = url;
          try {
            host = new URL(url).host;
          } catch (_) {}
          out = [
            `*   Trying (simulated) ${host}...`,
            `*   Connected to ${host} (0.0.0.0) port 443`,
            `> GET ${url} HTTP/1.1`,
            `> Host: ${host}`,
            `> User-Agent: macos-web-curl/sim`,
            `>`,
            `< HTTP/1.1 200 OK`,
            `< Content-Type: text/plain`,
            `<`,
            `[simulated body] macOS Web curl does not perform real HTTP.`,
            `Requested: ${url}`,
            `Use Safari →「↗ 新标签」for real browsing (your browser, your click).`,
          ].join("\n");
          break;
        }

        case "wget":
          err("wget: disabled in simulated shell. Type 'safety' for details.");
          break;

        case "resetfs":
          vfs.reset();
          out = "virtual filesystem reset.";
          break;

        case "clear":
          return { out: "", code: 0, clear: true };

        default:
          // support simple && chain only for same line already split? skip
          err(`zsh: command not found: ${cmd}\nType 'help' for available commands.`);
      }
    } catch (e) {
      err(String(e.message || e));
    }

    // redirection
    if (redir && code === 0 && !isHtml) {
      try {
        vfs.write(redir, out + (out.endsWith("\n") ? "" : "\n"), append);
        out = "";
      } catch (e) {
        out = String(e.message || e);
        code = 1;
      }
    }

    return { out: isHtml ? out : clip(out), code, isHtml };
  }

  return { run, parse, escapeHtml };
})();
