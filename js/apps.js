/* Application definitions & content renderers */
window.MacApps = (() => {
  const NOTES = [
    {
      id: 1,
      title: "欢迎使用 macOS Web",
      body: "这是一个纯前端实现的 macOS 桌面环境。\n\n试试这些操作：\n• 拖动窗口标题栏\n• Dock 图标悬停放大\n• ⌘Space 打开 Spotlight\n• ⌘Tab 切换应用\n• 右键桌面打开菜单\n• 点击右上角控制中心\n\n享受探索 ✨",
      date: "今天",
    },
    {
      id: 2,
      title: "购物清单",
      body: "□ 咖啡豆\n□ 显示器支架\n□ 机械键盘键帽\n□ 无线充电器",
      date: "昨天",
    },
    {
      id: 3,
      title: "灵感碎片",
      body: "玻璃拟态 + 景深模糊 = 系统级质感\n动效要克制，反馈要即时。\n真实感来自细节密度，而不是堆特效。",
      date: "周一",
    },
  ];

  const FINDER_FILES = {
    个人收藏: [
      { name: "文稿", icon: "📁", type: "folder" },
      { name: "下载", icon: "📁", type: "folder" },
      { name: "桌面", icon: "🖥️", type: "folder" },
      { name: "应用程序", icon: "⬛", type: "folder" },
    ],
    文稿: [
      { name: "项目计划.md", icon: "📄", type: "file" },
      { name: "设计规范.pdf", icon: "📕", type: "file" },
      { name: "截图", icon: "📁", type: "folder" },
      { name: "README.txt", icon: "📄", type: "file" },
      { name: "预算.xlsx", icon: "📊", type: "file" },
    ],
    下载: [
      { name: "macos-web.zip", icon: "🗜️", type: "file" },
      { name: "wallpaper.png", icon: "🖼️", type: "file" },
      { name: "demo.mp4", icon: "🎬", type: "file" },
    ],
    应用程序: [
      { name: "Safari", icon: "🧭", type: "app", app: "safari" },
      { name: "备忘录", icon: "📝", type: "app", app: "notes" },
      { name: "计算器", icon: "🔢", type: "app", app: "calc" },
      { name: "终端", icon: "⬛", type: "app", app: "terminal" },
      { name: "系统设置", icon: "⚙️", type: "app", app: "settings" },
      { name: "音乐", icon: "🎵", type: "app", app: "music" },
    ],
  };

  const catalog = [
    { id: "finder", name: "Finder", icon: "finder", dock: true, w: 780, h: 480 },
    { id: "safari", name: "Safari", icon: "safari", dock: true, w: 900, h: 560, light: false },
    { id: "notes", name: "备忘录", icon: "notes", dock: true, w: 720, h: 460 },
    { id: "calc", name: "计算器", icon: "calc", dock: true, w: 260, h: 380, noResize: true },
    { id: "terminal", name: "终端", icon: "terminal", dock: true, w: 640, h: 400 },
    { id: "settings", name: "系统设置", icon: "settings", dock: true, w: 760, h: 520 },
    { id: "launchpad", name: "启动台", icon: "launchpad", dock: true, special: "launchpad" },
    { id: "photos", name: "照片", icon: "photos", dock: true, w: 800, h: 520 },
    { id: "music", name: "音乐", icon: "music", dock: true, w: 420, h: 520 },
    { id: "calendar", name: "日历", icon: "calendar", dock: true, w: 520, h: 480 },
    { id: "textedit", name: "文本编辑", icon: "textedit", dock: true, w: 560, h: 420, light: true },
    { id: "messages", name: "信息", icon: "messages", dock: false, w: 480, h: 520 },
    { id: "about", name: "关于本机", icon: "about", dock: false, w: 280, h: 380, noResize: true },
    { id: "trash", name: "废纸篓", icon: "trash", dock: true, special: "trash", end: true },
  ];

  const menus = {
    finder: ["文件", "编辑", "显示", "前往", "窗口", "帮助"],
    safari: ["文件", "编辑", "显示", "历史记录", "书签", "窗口", "帮助"],
    notes: ["文件", "编辑", "格式", "显示", "窗口", "帮助"],
    calc: ["文件", "编辑", "显示", "窗口", "帮助"],
    terminal: ["Shell", "编辑", "显示", "窗口", "帮助"],
    settings: ["文件", "编辑", "显示", "窗口", "帮助"],
    default: ["文件", "编辑", "显示", "窗口", "帮助"],
  };

  function get(id) {
    return catalog.find((a) => a.id === id);
  }

  /* ---------- renderers ---------- */
  function renderFinder(body) {
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "finder";
    let current = "个人收藏";
    let view = "icon"; // icon | list
    let selected = null;

    const side = document.createElement("div");
    side.className = "finder-sidebar";
    side.innerHTML = `<div class="fs-label">个人收藏</div>`;
    const locs = [
      ["个人收藏", "★"],
      ["文稿", "📄"],
      ["下载", "⬇"],
      ["应用程序", "⬛"],
    ];
    locs.forEach(([name, ico]) => {
      const b = document.createElement("button");
      b.innerHTML = `<span style="width:16px;text-align:center">${ico}</span> ${name}`;
      b.dataset.loc = name;
      if (name === current) b.classList.add("active");
      b.addEventListener("click", () => {
        current = name;
        side.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x.dataset.loc === current));
        paint();
      });
      side.appendChild(b);
    });
    side.insertAdjacentHTML(
      "beforeend",
      `<div class="fs-label" style="margin-top:12px">位置</div>
       <button type="button" disabled style="opacity:.5">Macintosh HD</button>
       <button type="button" disabled style="opacity:.5">iCloud 云盘</button>`
    );

    const main = document.createElement("div");
    main.className = "finder-main";
    const toolbar = document.createElement("div");
    toolbar.className = "finder-toolbar";
    toolbar.innerHTML = `
      <button type="button" class="ft-nav" data-nav="back" title="后退">‹</button>
      <button type="button" class="ft-nav" data-nav="fwd" title="前进">›</button>
      <span class="path"></span>
      <span style="flex:1"></span>
      <button type="button" class="ft-view" data-view="icon" title="图标">▦</button>
      <button type="button" class="ft-view" data-view="list" title="列表">☰</button>
    `;
    const path = toolbar.querySelector(".path");
    const content = document.createElement("div");
    content.className = "finder-content";
    const status = document.createElement("div");
    status.className = "finder-status";

    toolbar.querySelectorAll(".ft-view").forEach((btn) => {
      btn.addEventListener("click", () => {
        view = btn.dataset.view;
        paint();
      });
    });
    toolbar.querySelector('[data-nav="back"]')?.addEventListener("click", () => {
      current = "个人收藏";
      side.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x.dataset.loc === current));
      paint();
    });

    main.append(toolbar, content, status);

    function paint() {
      path.textContent = current === "个人收藏" ? "个人收藏" : `个人收藏  ›  ${current}`;
      content.innerHTML = "";
      content.classList.toggle("list-view", view === "list");
      const files = FINDER_FILES[current] || [];
      files.forEach((f) => {
        const el = document.createElement("div");
        el.className = "finder-file" + (selected === f.name ? " selected" : "");
        if (view === "list") {
          el.innerHTML = `<div class="ff-icon" style="font-size:18px">${f.icon}</div><div class="ff-name">${f.name}</div><div class="ff-kind">${f.type === "folder" ? "文件夹" : f.type === "app" ? "应用程序" : "文稿"}</div>`;
        } else {
          el.innerHTML = `<div class="ff-icon">${f.icon}</div><div>${f.name}</div>`;
        }
        el.addEventListener("click", (e) => {
          content.querySelectorAll(".finder-file").forEach((x) => x.classList.remove("selected"));
          el.classList.add("selected");
          selected = f.name;
          e.stopPropagation();
        });
        el.addEventListener("dblclick", () => {
          if (f.type === "folder" && FINDER_FILES[f.name]) {
            current = f.name;
            side.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x.dataset.loc === current));
            paint();
          } else if (f.type === "app" && f.app) {
            window.MacOS.openApp(f.app);
          } else if (f.name.endsWith(".txt") || f.name.endsWith(".md")) {
            window.MacOS.openApp("textedit");
          } else if (f.name.match(/\.(png|jpg|jpeg)$/i)) {
            window.MacOS.openApp("photos");
          } else {
            window.MacOS.toast(`打开「${f.name}」`);
          }
        });
        content.appendChild(el);
      });
      status.textContent = `${files.length} 个项目` + (selected ? `  ·  已选择「${selected}」` : "");
    }
    paint();
    root.append(side, main);
    body.appendChild(root);
  }

  function renderSafari(body) {
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "safari-chrome";
    root.innerHTML = `
      <div class="safari-bar">
        <div class="safari-nav">
          <button type="button" data-act="back" title="后退">‹</button>
          <button type="button" data-act="fwd" title="前进">›</button>
          <button type="button" data-act="reload" title="重新加载">↻</button>
        </div>
        <div class="safari-url">
          <span class="lock" style="opacity:.5">🔒</span>
          <input type="text" value="" placeholder="搜索或输入网站名称" spellcheck="false" />
        </div>
        <button type="button" data-act="home" title="主页" style="padding:0 8px;opacity:.8">⌂</button>
        <button type="button" data-act="external" title="在系统浏览器新标签打开（真实访问）" class="safari-ext">↗ 新标签</button>
      </div>
      <div class="safari-page"></div>
      <div class="safari-status"><span id="sfStatus">完成</span></div>
    `;
    const page = root.querySelector(".safari-page");
    const input = root.querySelector("input");
    const status = root.querySelector("#sfStatus");
    const lock = root.querySelector(".lock");

    // Sites that often allow embedding (not guaranteed)
    const embeddable = [
      { name: "Example", url: "https://example.com", color: "#0a84ff", letter: "E" },
      { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page", color: "#000", letter: "W" },
      { name: "Wiki·中文", url: "https://zh.wikipedia.org", color: "#333", letter: "维" },
      { name: "CERN", url: "https://info.cern.ch", color: "#0055a5", letter: "C" },
      { name: "httpbin", url: "https://httpbin.org/html", color: "#6b4fbb", letter: "H" },
      { name: "Mozilla", url: "https://www.mozilla.org", color: "#ff7139", letter: "M" },
      { name: "Apple*", url: "https://www.apple.com", color: "#555", letter: "" },
      { name: "GitHub*", url: "https://github.com", color: "#24292f", letter: "GH" },
    ];

    const history = [];
    let hIdx = -1;
    let currentUrl = "favorites://";

    const setStatus = (t) => {
      if (status) status.textContent = t;
    };

    const home = () => {
      currentUrl = "favorites://";
      input.value = "";
      lock.textContent = "★";
      page.innerHTML = `
        <div class="safari-home">
          <h1>开始使用</h1>
          <p>地址栏输入网址回车即可尝试内嵌浏览。标 * 的站点多半禁止 iframe，请点「↗ 新标签」用系统浏览器<strong>真实打开</strong>。</p>
          <div class="safari-favs">
            ${embeddable
              .map(
                (f) => `
              <div class="safari-fav" data-url="${f.url}">
                <div class="sf-icon" style="background:${f.color}">${f.letter}</div>
                <span>${f.name}</span>
              </div>`
              )
              .join("")}
          </div>
          <div class="safari-note">
            <b>关于「能不能真的上网」</b>
            <p>可以，但分两种模式：</p>
            <ol>
              <li><b>内嵌浏览</b>：用 iframe。很多大站（Google、GitHub、Apple…）设置了 <code>X-Frame-Options</code> / CSP，会显示空白——这是浏览器安全策略，不是我们没写。</li>
              <li><b>新标签真实访问</b>：点「↗ 新标签」，用你系统默认浏览器完整打开，功能与平时上网相同。</li>
            </ol>
            <p>建议先试 <b>Example</b>、<b>Wikipedia</b>、<b>CERN</b>（通常可内嵌）。</p>
          </div>
        </div>`;
      page.querySelectorAll(".safari-fav").forEach((fav) => {
        fav.addEventListener("click", () => navigate(fav.dataset.url, true));
      });
      setStatus("收藏夹");
    };

    const showBlocked = (u) => {
      page.innerHTML = `
        <div class="safari-blocked">
          <div class="sb-icon">🛡</div>
          <h2>此网站不允许被嵌入</h2>
          <p>目标站点通过安全头禁止在 iframe 中显示。<br/>这在真实浏览器里也一样。</p>
          <p class="sb-url">${u}</p>
          <div class="sb-actions">
            <button type="button" class="sb-open">在新标签页真实打开</button>
            <button type="button" class="sb-home">返回主页</button>
          </div>
          <p class="sb-tip">提示：Wikipedia、example.com 等通常可以内嵌预览。</p>
        </div>`;
      page.querySelector(".sb-open")?.addEventListener("click", () => {
        window.open(u, "_blank", "noopener,noreferrer");
        setStatus("已在系统浏览器打开");
      });
      page.querySelector(".sb-home")?.addEventListener("click", home);
    };

    const navigate = (url, push = true) => {
      if (!url || url === "about:blank" || url === "favorites://" || url === "favorites") {
        if (push) pushHistory("favorites://");
        return home();
      }
      let u = url.trim();
      // search shortcut
      if (!/^[a-z]+:\/\//i.test(u) && !u.includes(".") && u.includes(" ")) {
        u = "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(u);
      } else if (!/^https?:\/\//i.test(u)) {
        u = "https://" + u;
      }

      currentUrl = u;
      input.value = u.replace(/^https?:\/\//, "");
      lock.textContent = u.startsWith("https") ? "🔒" : "⚠️";
      if (push) pushHistory(u);
      setStatus("正在载入…");

      page.innerHTML = "";
      const frame = document.createElement("iframe");
      frame.title = "Safari";
      frame.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      );
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.src = u;

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        // Can't reliably detect X-Frame block; show helper bar
        setStatus("若页面空白，站点可能禁止嵌入 — 请用「新标签」");
        const bar = document.createElement("div");
        bar.className = "safari-embed-warn";
        bar.innerHTML = `若下方空白，<button type="button">在新标签真实打开此站</button> 或尝试 Wikipedia / example.com`;
        bar.querySelector("button")?.addEventListener("click", () => {
          window.open(u, "_blank", "noopener,noreferrer");
        });
        if (!page.querySelector(".safari-embed-warn")) page.prepend(bar);
      }, 2800);

      frame.addEventListener("load", () => {
        settled = true;
        clearTimeout(timer);
        setStatus(u);
        // try to detect empty blocked frame (cross-origin will throw)
        try {
          const doc = frame.contentDocument;
          if (doc && doc.body && doc.body.innerHTML.trim() === "") {
            showBlocked(u);
          }
        } catch (_) {
          // cross-origin success path — page likely loaded
        }
      });
      frame.addEventListener("error", () => {
        settled = true;
        clearTimeout(timer);
        showBlocked(u);
      });

      page.appendChild(frame);
    };

    const pushHistory = (u) => {
      history.splice(hIdx + 1);
      history.push(u);
      hIdx = history.length - 1;
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        navigate(input.value, true);
      }
    });
    root.querySelector('[data-act="home"]').addEventListener("click", () => {
      pushHistory("favorites://");
      home();
    });
    root.querySelector('[data-act="back"]').addEventListener("click", () => {
      if (hIdx > 0) {
        hIdx--;
        const u = history[hIdx];
        if (u === "favorites://") home();
        else navigate(u, false);
      }
    });
    root.querySelector('[data-act="fwd"]').addEventListener("click", () => {
      if (hIdx < history.length - 1) {
        hIdx++;
        const u = history[hIdx];
        if (u === "favorites://") home();
        else navigate(u, false);
      }
    });
    root.querySelector('[data-act="reload"]').addEventListener("click", () => {
      if (currentUrl === "favorites://") home();
      else navigate(currentUrl, false);
    });
    root.querySelector('[data-act="external"]').addEventListener("click", () => {
      let u = currentUrl;
      if (!u || u === "favorites://") {
        u = input.value.trim();
        if (u && !/^https?:\/\//i.test(u)) u = "https://" + u;
      }
      if (u && u !== "favorites://") {
        window.open(u, "_blank", "noopener,noreferrer");
        setStatus("已在系统浏览器打开");
        window.MacOS?.toast?.("已在新标签页打开（真实浏览）");
      } else {
        window.MacOS?.toast?.("请先输入网址");
      }
    });

    pushHistory("favorites://");
    home();
    body.appendChild(root);
  }

  function renderNotes(body) {
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "notes";
    let active = NOTES[0].id;

    const list = document.createElement("div");
    list.className = "notes-list";
    const editor = document.createElement("div");
    editor.className = "notes-editor";

    const paintList = () => {
      list.innerHTML = "";
      NOTES.forEach((n) => {
        const item = document.createElement("div");
        item.className = "notes-list-item" + (n.id === active ? " active" : "");
        item.innerHTML = `<b>${n.title}</b><small>${n.date} · ${n.body.split("\n")[0].slice(0, 24)}</small>`;
        item.addEventListener("click", () => {
          active = n.id;
          paintList();
          paintEditor();
        });
        list.appendChild(item);
      });
    };

    const paintEditor = () => {
      const n = NOTES.find((x) => x.id === active);
      editor.innerHTML = `<div class="n-date">${n.date} 09:41</div><textarea spellcheck="false"></textarea>`;
      const ta = editor.querySelector("textarea");
      ta.value = n.body;
      ta.addEventListener("input", () => {
        n.body = ta.value;
        const first = ta.value.split("\n").find((l) => l.trim()) || "新建备忘录";
        n.title = first.slice(0, 24);
        paintList();
      });
    };

    paintList();
    paintEditor();
    root.append(list, editor);
    body.appendChild(root);
  }

  function renderCalc(body) {
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "calc";
    const display = document.createElement("div");
    display.className = "calc-display";
    display.textContent = "0";
    const keys = document.createElement("div");
    keys.className = "calc-keys";

    let cur = "0";
    let prev = null;
    let op = null;
    let fresh = false;

    const show = () => {
      display.textContent = cur.length > 10 ? Number(cur).toExponential(5) : cur;
    };

    const input = (k) => {
      if ("0123456789".includes(k)) {
        if (fresh || cur === "0") {
          cur = k;
          fresh = false;
        } else cur += k;
      } else if (k === ".") {
        if (fresh) {
          cur = "0.";
          fresh = false;
        } else if (!cur.includes(".")) cur += ".";
      } else if (k === "AC") {
        cur = "0";
        prev = null;
        op = null;
      } else if (k === "±") {
        cur = String(-Number(cur));
      } else if (k === "%") {
        cur = String(Number(cur) / 100);
      } else if ("+-×÷".includes(k)) {
        if (prev !== null && op && !fresh) compute();
        prev = Number(cur);
        op = k;
        fresh = true;
      } else if (k === "=") {
        compute();
        op = null;
        prev = null;
        fresh = true;
      }
      keys.querySelectorAll(".op").forEach((b) => b.classList.toggle("active", b.dataset.k === op));
      show();
    };

    const compute = () => {
      if (prev === null || !op) return;
      const a = prev;
      const b = Number(cur);
      let r = b;
      if (op === "+") r = a + b;
      if (op === "-") r = a - b;
      if (op === "×") r = a * b;
      if (op === "÷") r = b === 0 ? "Error" : a / b;
      cur = r === "Error" ? "Error" : String(Math.round(r * 1e10) / 1e10);
      prev = null;
    };

    const layout = [
      ["AC", "fn"], ["±", "fn"], ["%", "fn"], ["÷", "op"],
      ["7", ""], ["8", ""], ["9", ""], ["×", "op"],
      ["4", ""], ["5", ""], ["6", ""], ["-", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["+", "op"],
      ["0", "zero"], [".", ""], ["=", "op"],
    ];
    layout.forEach(([k, cls]) => {
      const b = document.createElement("button");
      b.textContent = k;
      b.dataset.k = k;
      if (cls) b.className = cls;
      b.addEventListener("click", () => input(k));
      keys.appendChild(b);
    });

    root.append(display, keys);
    body.appendChild(root);
  }

  function renderTerminal(body) {
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "term";
    const history = [];
    let hIdx = -1;
    let busy = false;

    const scroll = document.createElement("div");
    scroll.className = "term-scroll";
    const inputLine = document.createElement("div");
    inputLine.className = "term-input-line";
    inputLine.innerHTML = `<span class="t-prompt"></span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" />`;
    const promptEl = inputLine.querySelector(".t-prompt");
    const input = inputLine.querySelector("input");

    const updatePrompt = () => {
      const p = window.MacVFS ? MacVFS.promptPath() : "~";
      promptEl.textContent = `winter@macos-web ${p} %`;
    };

    const println = (text, cls = "t-out", asHtml = false) => {
      const line = document.createElement("div");
      line.className = `t-line ${cls}`;
      if (asHtml) line.innerHTML = text;
      else {
        line.textContent = text;
        line.style.whiteSpace = "pre-wrap";
      }
      scroll.appendChild(line);
      root.scrollTop = root.scrollHeight;
    };

    const printCmd = (cmd) => {
      const line = document.createElement("div");
      line.className = "t-line";
      line.innerHTML = `<span class="t-prompt">${MacShell.escapeHtml(promptEl.textContent)}</span> <span class="t-cmd">${MacShell.escapeHtml(cmd)}</span>`;
      scroll.appendChild(line);
    };

    root.appendChild(scroll);
    root.appendChild(inputLine);
    body.appendChild(root);
    updatePrompt();

    println("Last login: " + new Date().toLocaleString() + " on ttys001", "t-out");
    println("⚠ Simulated shell only — no host FS/process/network. Type: safety", "t-err");
    println("macOS Web shell — help | neofetch | ls -la | tree | ps", "t-out");

    const runLine = async (raw) => {
      const cmd = raw.trim();
      printCmd(cmd);
      if (!cmd) {
        updatePrompt();
        return;
      }
      history.push(cmd);
      hIdx = history.length;

      // support simple && chains
      const parts = cmd.split(/&&/).map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        const result = await MacShell.run(part, { history });
        if (result.clear) {
          scroll.innerHTML = "";
          continue;
        }
        if (result.out) {
          if (result.isHtml) println(result.out, result.code ? "t-err" : "t-out", true);
          else println(result.out, result.code ? "t-err" : "t-out", false);
        }
        if (result.code !== 0) break;
      }
      updatePrompt();
      root.scrollTop = root.scrollHeight;
    };

    input.addEventListener("keydown", async (e) => {
      // stop OS shortcuts from eating keys while typing
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        if (busy) return;
        const v = input.value;
        input.value = "";
        busy = true;
        input.disabled = true;
        try {
          await runLine(v);
        } finally {
          busy = false;
          input.disabled = false;
          input.focus();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!history.length) return;
        hIdx = Math.max(0, hIdx - 1);
        input.value = history[hIdx] || "";
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hIdx < history.length - 1) {
          hIdx++;
          input.value = history[hIdx] || "";
        } else {
          hIdx = history.length;
          input.value = "";
        }
      } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        // allow copy; Ctrl+C empty = interrupt aesthetic
        if (!input.value) {
          e.preventDefault();
          println("^C", "t-err");
        }
      } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        scroll.innerHTML = "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        // crude tab complete: files in cwd
        try {
          const names = MacVFS.list();
          const cur = input.value;
          const segs = cur.split(/\s+/);
          const last = segs.pop() || "";
          const hit = names.find((n) => n.startsWith(last));
          if (hit) {
            segs.push(hit);
            input.value = segs.join(" ") + (MacVFS.stat(hit).type === "dir" ? "/" : "");
          }
        } catch (_) {}
      }
    });

    // click terminal focuses input
    root.addEventListener("mousedown", (e) => {
      if (e.target !== input) {
        e.preventDefault();
        input.focus();
      }
    });

    // refocus when window focused
    body.closest(".window")?.addEventListener("mousedown", () => {
      setTimeout(() => input.focus(), 30);
    });

    setTimeout(() => input.focus(), 120);
  }

  function renderSettings(body) {
    body.innerHTML = "";
    const root = document.createElement("div");
    root.className = "settings";
    const items = [
      { id: "wifi", name: "Wi‑Fi", color: "#0a84ff", icon: "◉" },
      { id: "bt", name: "蓝牙", color: "#0a84ff", icon: "⬡" },
      { id: "display", name: "显示器", color: "#30d158", icon: "▣" },
      { id: "sound", name: "声音", color: "#bf5af2", icon: "♪" },
      { id: "focus", name: "专注模式", color: "#5e5ce6", icon: "☾" },
      { id: "wallpaper", name: "墙纸", color: "#64d2ff", icon: "🖼" },
      { id: "general", name: "通用", color: "#8e8e93", icon: "⚙" },
      { id: "about", name: "关于", color: "#8e8e93", icon: "" },
    ];
    let active = "wifi";

    const side = document.createElement("div");
    side.className = "settings-side";
    side.innerHTML = `<input class="ss-search" placeholder="搜索" />`;
    const main = document.createElement("div");
    main.className = "settings-main";

    items.forEach((it) => {
      const b = document.createElement("button");
      b.innerHTML = `<span class="ss-ico" style="background:${it.color}">${it.icon}</span>${it.name}`;
      b.addEventListener("click", () => {
        active = it.id;
        paint();
      });
      side.appendChild(b);
    });

    const paint = () => {
      side.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", items[i].id === active));
      const title = items.find((x) => x.id === active).name;
      const panels = {
        wifi: `
          <h2>Wi‑Fi</h2>
          <div class="settings-card">
            <div class="settings-row"><span>Wi‑Fi</span><div class="toggle on" data-tog></div></div>
            <div class="settings-row"><span>Lumen_5G</span><span class="val">已连接</span></div>
            <div class="settings-row"><span>Neighbor_2.4</span><span class="val">安全</span></div>
            <div class="settings-row"><span>Cafe_Guest</span><span class="val">开放</span></div>
          </div>`,
        bt: `
          <h2>蓝牙</h2>
          <div class="settings-card">
            <div class="settings-row"><span>蓝牙</span><div class="toggle on" data-tog></div></div>
            <div class="settings-row"><span>AirPods Pro</span><span class="val">未连接</span></div>
            <div class="settings-row"><span>Magic Keyboard</span><span class="val">已连接</span></div>
          </div>`,
        display: `
          <h2>显示器</h2>
          <div class="settings-card">
            <div class="settings-row"><span>亮度</span><span class="val">自动</span></div>
            <div class="settings-row"><span>原彩显示</span><div class="toggle on" data-tog></div></div>
            <div class="settings-row"><span>夜览</span><div class="toggle" data-tog></div></div>
            <div class="settings-row"><span>分辨率</span><span class="val">默认</span></div>
          </div>`,
        sound: `
          <h2>声音</h2>
          <div class="settings-card">
            <div class="settings-row"><span>输出音量</span><span class="val">62%</span></div>
            <div class="settings-row"><span>提示音</span><div class="toggle on" data-tog></div></div>
            <div class="settings-row"><span>启动时播放声音</span><div class="toggle" data-tog></div></div>
          </div>`,
        focus: `
          <h2>专注模式</h2>
          <div class="settings-card">
            <div class="settings-row"><span>勿扰模式</span><div class="toggle" data-tog></div></div>
            <div class="settings-row"><span>工作</span><div class="toggle" data-tog></div></div>
            <div class="settings-row"><span>个人</span><div class="toggle" data-tog></div></div>
          </div>`,
        wallpaper: `
          <h2>墙纸</h2>
          <div class="settings-card">
            <div class="settings-row"><span>当前墙纸</span><span class="val">Sequoia Gradient</span></div>
            <div class="settings-row"><span>动态墙纸</span><div class="toggle on" data-tog></div></div>
          </div>
          <p style="opacity:.55;font-size:12px;margin-top:8px">本 Demo 使用程序化渐变墙纸，无需外部图片。</p>`,
        general: `
          <h2>通用</h2>
          <div class="settings-card">
            <div class="settings-row"><span>关于本机</span><span class="val">›</span></div>
            <div class="settings-row"><span>软件更新</span><span class="val">已是最新</span></div>
            <div class="settings-row"><span>储存空间</span><span class="val">128 GB 可用</span></div>
            <div class="settings-row"><span>日期与时间</span><span class="val">自动</span></div>
          </div>`,
        about: `
          <h2>关于</h2>
          <div class="settings-card">
            <div class="settings-row"><span>名称</span><span class="val">macOS Web</span></div>
            <div class="settings-row"><span>芯片</span><span class="val">JavaScript Engine</span></div>
            <div class="settings-row"><span>内存</span><span class="val">Browser Heap</span></div>
            <div class="settings-row"><span>序号</span><span class="val">WEBOS2026</span></div>
          </div>`,
      };
      main.innerHTML = panels[active] || `<h2>${title}</h2>`;
      main.querySelectorAll("[data-tog]").forEach((t) => {
        t.addEventListener("click", () => t.classList.toggle("on"));
      });
      if (active === "general") {
        main.querySelector(".settings-row")?.addEventListener("click", () => window.MacOS.openApp("about"));
      }
    };

    paint();
    root.append(side, main);
    body.appendChild(root);
  }

  function renderAbout(body) {
    body.innerHTML = `
      <div class="about-mac">
        <div class="am-logo"></div>
        <h2>macOS Web</h2>
        <div class="am-chip">Sequoia-inspired · Browser Build</div>
        <div class="am-specs">
          <div><b>芯片</b> JavaScript Engine</div>
          <div><b>内存</b> ${(navigator.deviceMemory || 8)} GB (reported)</div>
          <div><b>启动磁盘</b> Browser Storage</div>
          <div><b>序号</b> W3B-MAC-2026</div>
          <div><b>版本</b> 15.0 (WebOS)</div>
        </div>
        <button class="am-btn" type="button" id="aboutMore">更多信息…</button>
      </div>`;
    body.querySelector("#aboutMore")?.addEventListener("click", () => {
      window.MacOS.openApp("settings");
    });
  }

  function renderTextEdit(body) {
    body.innerHTML = `
      <div class="textedit">
        <div class="textedit-toolbar">
          <button type="button" data-te="save">存储到 VFS</button>
          <button type="button" data-te="saveas">存储为…</button>
          <span style="opacity:.3;margin:0 6px">|</span>
          <button type="button"><b>B</b></button>
          <button type="button"><i>I</i></button>
          <button type="button"><u>U</u></button>
          <span class="te-path" style="margin-left:auto;opacity:.5;font-size:11px">未存储</span>
        </div>
        <textarea spellcheck="false"></textarea>
      </div>`;
    const ta = body.querySelector("textarea");
    const pathEl = body.querySelector(".te-path");
    let filePath = "/Users/winter/Documents/untitled.txt";

    if (window.__macOpenFile) {
      filePath = window.__macOpenFile.path;
      ta.value = window.__macOpenFile.content;
      pathEl.textContent = filePath;
      window.__macOpenFile = null;
    } else {
      ta.value =
        "macOS Web — 文本编辑\n\n在这里自由书写。点「存储到 VFS」可写入虚拟磁盘，\n然后在终端 cat 该文件。\n";
    }

    const save = (path) => {
      try {
        MacVFS.write(path, ta.value, false);
        filePath = MacVFS.normalize(path);
        pathEl.textContent = filePath;
        window.MacOS?.toast?.("已存储 " + filePath);
      } catch (e) {
        window.MacOS?.toast?.(String(e.message || e));
      }
    };

    body.querySelector('[data-te="save"]')?.addEventListener("click", () => save(filePath));
    body.querySelector('[data-te="saveas"]')?.addEventListener("click", () => {
      const p = prompt("存储路径", filePath);
      if (p) save(p);
    });
  }

  function renderPhotos(body) {
    const grads = [
      "linear-gradient(135deg,#667eea,#764ba2)",
      "linear-gradient(135deg,#f093fb,#f5576c)",
      "linear-gradient(135deg,#4facfe,#00f2fe)",
      "linear-gradient(135deg,#43e97b,#38f9d7)",
      "linear-gradient(135deg,#fa709a,#fee140)",
      "linear-gradient(135deg,#30cfd0,#330867)",
      "linear-gradient(135deg,#a18cd1,#fbc2eb)",
      "linear-gradient(135deg,#ff9a9e,#fecfef)",
      "linear-gradient(135deg,#ffecd2,#fcb69f)",
      "linear-gradient(135deg,#ff6e7f,#bfe9ff)",
      "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
      "linear-gradient(135deg,#f77062,#fe5196)",
    ];
    body.innerHTML = `<div class="photos"><div class="photos-grid">${grads
      .map((g) => `<div class="ph" style="background-image:${g}"></div>`)
      .join("")}</div></div>`;
  }

  function renderMusic(body) {
    body.innerHTML = `
      <div class="music-app">
        <div class="music-art">♫</div>
        <h3>Sequoia Sunset</h3>
        <p>macOS Web Radio</p>
        <div class="music-controls">
          <button type="button">⏮</button>
          <button type="button" class="play" id="musicPlay">▶</button>
          <button type="button">⏭</button>
        </div>
        <div class="music-bar"><i></i></div>
      </div>`;
    let playing = false;
    body.querySelector("#musicPlay")?.addEventListener("click", (e) => {
      playing = !playing;
      e.currentTarget.textContent = playing ? "⏸" : "▶";
      window.MacOS.toast(playing ? "正在播放 · Sequoia Sunset" : "已暂停");
    });
  }

  function renderCalendar(body) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const today = now.getDate();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const names = ["日", "一", "二", "三", "四", "五", "六"];
    let cells = names.map((n) => `<div class="hd">${n}</div>`).join("");
    for (let i = 0; i < first; i++) {
      cells += `<div class="day muted">${prevDays - first + i + 1}</div>`;
    }
    for (let d = 1; d <= days; d++) {
      cells += `<div class="day${d === today ? " today" : ""}">${d}</div>`;
    }
    body.innerHTML = `<div class="cal-app"><h2>${y}年${m + 1}月</h2><div class="cal-grid">${cells}</div></div>`;
  }

  function renderMessages(body) {
    body.innerHTML = `
      <div class="notes" style="background:#1c1c1e">
        <div class="notes-list">
          <div class="notes-list-item active"><b>Siri 建议</b><small>今天 · 欢迎使用 macOS Web</small></div>
          <div class="notes-list-item"><b>设计团队</b><small>昨天 · 视觉稿已更新</small></div>
          <div class="notes-list-item"><b>家人</b><small>周一 · 晚饭一起吃？</small></div>
        </div>
        <div class="notes-editor">
          <div class="n-date">信息</div>
          <div style="flex:1;display:flex;flex-direction:column;gap:10px;justify-content:flex-end;padding-bottom:12px">
            <div style="align-self:flex-start;background:#3a3a3c;padding:8px 12px;border-radius:16px;font-size:14px;max-width:80%">嗨，欢迎来到 macOS Web 👋</div>
            <div style="align-self:flex-end;background:#0a84ff;padding:8px 12px;border-radius:16px;font-size:14px;max-width:80%">看起来很真实！</div>
            <div style="align-self:flex-start;background:#3a3a3c;padding:8px 12px;border-radius:16px;font-size:14px;max-width:80%">Dock、窗口、Spotlight 都可以玩。</div>
          </div>
          <input style="background:rgba(255,255,255,.08);border-radius:16px;padding:8px 14px;font-size:13px" placeholder="iMessage" />
        </div>
      </div>`;
  }

  const renderers = {
    finder: renderFinder,
    safari: renderSafari,
    notes: renderNotes,
    calc: renderCalc,
    terminal: renderTerminal,
    settings: renderSettings,
    about: renderAbout,
    textedit: renderTextEdit,
    photos: renderPhotos,
    music: renderMusic,
    calendar: renderCalendar,
    messages: renderMessages,
  };

  function render(id, body) {
    const fn = renderers[id];
    if (fn) fn(body);
    else body.innerHTML = `<div style="padding:24px;opacity:.6">App “${id}” 尚未实现。</div>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return { catalog, get, menus, render };
})();
