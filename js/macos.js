/* macOS Web — shell: Mission Control, menus, hot corners, spaces */
window.MacOS = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let activeApp = "finder";
  let spotlightIndex = 0;
  let switcherIndex = 0;
  let switcherOpen = false;
  let menuDropdown = null;
  let desktopInited = false;
  let hotCornerArmed = true;

  const MENU_DEFS = {
    文件: [
      { label: "新建窗口", shortcut: "⌘N", action: () => openApp(activeApp === "finder" ? "finder" : activeApp) },
      { label: "打开…", shortcut: "⌘O", action: () => toast("打开文件…") },
      { sep: true },
      { label: "关闭窗口", shortcut: "⌘W", action: () => MacWM.close(activeApp) },
      { label: "存储…", shortcut: "⌘S", action: () => toast("已存储") },
    ],
    编辑: [
      { label: "撤销", shortcut: "⌘Z", action: () => document.execCommand("undo") },
      { label: "重做", shortcut: "⇧⌘Z", action: () => document.execCommand("redo") },
      { sep: true },
      { label: "剪切", shortcut: "⌘X", action: () => document.execCommand("cut") },
      { label: "拷贝", shortcut: "⌘C", action: () => document.execCommand("copy") },
      { label: "粘贴", shortcut: "⌘V", action: () => document.execCommand("paste") },
      { label: "全选", shortcut: "⌘A", action: () => document.execCommand("selectAll") },
    ],
    显示: [
      { label: "显示启动台", action: () => openApp("launchpad") },
      { label: "调度中心", shortcut: "⌃↑", action: () => toggleMissionControl() },
      { sep: true },
      { label: "进入全屏幕", shortcut: "⌃⌘F", action: () => MacWM.toggleMaximize(activeApp) },
      { label: "显示所有标签页", action: () => toast("无标签页") },
    ],
    前往: [
      { label: "个人收藏", action: () => openApp("finder") },
      { label: "文稿", action: () => openApp("finder") },
      { label: "下载", action: () => openApp("finder") },
      { sep: true },
      { label: "应用程序", action: () => openApp("launchpad") },
    ],
    窗口: [
      { label: "最小化", shortcut: "⌘M", action: () => MacWM.minimize(activeApp) },
      { label: "缩放", action: () => MacWM.toggleMaximize(activeApp) },
      { sep: true },
      { label: "前置全部窗口", action: () => MacWM.getOpen().forEach((w) => MacWM.focus(w.id)) },
      { label: "调度中心", action: () => toggleMissionControl() },
    ],
    帮助: [
      { label: "macOS Web 帮助", action: () => notify("帮助", "⌘Space Spotlight · ⌃↑ 调度中心 · 热角可用") },
      { label: "搜索", shortcut: "⌘Space", action: () => openSpotlight() },
    ],
    Shell: [
      { label: "新建窗口", action: () => openApp("terminal") },
      { label: "发送中断", shortcut: "⌃C", action: () => toast("^C") },
    ],
    格式: [
      { label: "字体…", action: () => toast("字体面板（示意）") },
      { label: "较大", shortcut: "⌘+", action: () => toast("字体放大") },
      { label: "较小", shortcut: "⌘-", action: () => toast("字体缩小") },
    ],
    历史记录: [
      { label: "后退", shortcut: "⌘[", action: () => toast("后退") },
      { label: "前进", shortcut: "⌘]", action: () => toast("前进") },
      { label: "主页", action: () => openApp("safari") },
    ],
    书签: [
      { label: "添加书签…", shortcut: "⌘D", action: () => toast("已添加书签") },
      { label: "显示收藏夹", action: () => openApp("safari") },
    ],
  };

  /* ---------- boot / login ---------- */
  function boot() {
    MacFX?.ensure();
    MacFX?.play.boot();
    const bar = $("#bootBar");
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 11 + 3;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setTimeout(() => {
          $("#boot").classList.add("hidden");
          $("#login").classList.remove("hidden");
          updateClocks();
          $("#loginPass")?.focus();
        }, 400);
      }
      if (bar) bar.style.width = p + "%";
    }, 100);
  }

  function login(e) {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    // No real password — empty or any text is fine
    const screen = $("#login");
    if (!screen || screen.classList.contains("hidden")) return;
    if (screen.dataset.loggingIn === "1") return;
    screen.dataset.loggingIn = "1";

    try {
      MacFX?.play.login();
    } catch (_) {}

    screen.style.transition = "opacity 0.55s ease, filter 0.55s ease, transform 0.55s ease";
    screen.style.opacity = "0";
    screen.style.filter = "blur(12px)";
    screen.style.transform = "scale(1.06)";
    setTimeout(() => {
      screen.classList.add("hidden");
      screen.style.opacity = "";
      screen.style.filter = "";
      screen.style.transform = "";
      screen.dataset.loggingIn = "";
      $("#desktop")?.classList.remove("hidden");
      if (!desktopInited) {
        initDesktop();
        desktopInited = true;
      } else {
        openApp("finder");
      }
      setTimeout(() => {
        notify("欢迎", "Winter 已登录 · macOS Web", { app: "settings" });
      }, 900);
    }, 520);
  }

  function updateClocks() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const h = now.getHours();
    const m = now.getMinutes();
    if ($("#loginTime")) $("#loginTime").textContent = `${h}:${pad(m)}`;
    if ($("#loginDate")) {
      $("#loginDate").textContent = `${weeks[now.getDay()]}，${months[now.getMonth()]}${now.getDate()}日`;
    }
    const menuClock = $("#menuClock");
    if (menuClock) {
      const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      menuClock.textContent = `${enDays[now.getDay()]} ${h12}:${pad(m)} ${ampm}`;
    }
    if ($("#wDay")) $("#wDay").textContent = weeks[now.getDay()];
    if ($("#wDate")) $("#wDate").textContent = String(now.getDate());
  }

  function initDesktop() {
    buildDock();
    buildDesktopIcons();
    buildLaunchpad();
    bindShellEvents();
    bindHotCorners();
    startWallpaperMotion();
    setActiveApp("finder");
    // Finder always “running” feel
    openApp("finder");
    setTimeout(() => {
      toast("提示：⌃↑ 调度中心 · 四角热角 · ⌘Space Spotlight");
    }, 700);
  }

  /* ---------- wallpaper ---------- */
  function startWallpaperMotion() {
    const wp = $("#wallpaper");
    if (!wp || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t = 0;
    const tick = () => {
      t += 0.003;
      const x1 = 20 + Math.sin(t) * 8;
      const y1 = 25 + Math.cos(t * 0.8) * 6;
      const x2 = 80 + Math.cos(t * 0.7) * 7;
      const y2 = 18 + Math.sin(t * 0.9) * 5;
      wp.style.setProperty("--wx1", x1 + "%");
      wp.style.setProperty("--wy1", y1 + "%");
      wp.style.setProperty("--wx2", x2 + "%");
      wp.style.setProperty("--wy2", y2 + "%");
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- dock ---------- */
  function buildDock() {
    const dock = $("#dock");
    if (!dock) return;
    dock.innerHTML = "";
    const apps = MacApps.catalog.filter((a) => a.dock);
    const main = apps.filter((a) => !a.end);
    const end = apps.filter((a) => a.end);

    const addItem = (app) => {
      const item = document.createElement("div");
      item.className = "dock-item";
      item.dataset.app = app.id;
      item.innerHTML = `
        <div class="tooltip">${app.name}</div>
        <div class="dock-icon">${MacIcons.get(app.icon)}</div>
        <div class="dot"></div>
      `;
      item.addEventListener("click", () => {
        MacFX?.play.click();
        openApp(app.id);
      });
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = MacWM.getAll().has(app.id);
        showContextMenu(e.clientX, e.clientY, [
          { label: "打开", action: () => openApp(app.id) },
          open ? { label: "显示全部窗口", action: () => MacWM.focus(app.id) } : null,
          open ? { label: "隐藏", action: () => MacWM.minimize(app.id) } : null,
          "sep",
          { label: "选项", action: () => toast(app.name + " · 选项") },
          open ? { label: "退出", action: () => MacWM.close(app.id) } : null,
        ].filter(Boolean));
      });
      dock.appendChild(item);
    };

    main.forEach(addItem);
    if (end.length) {
      const sep = document.createElement("div");
      sep.className = "dock-sep";
      dock.appendChild(sep);
      end.forEach(addItem);
    }

    dock.addEventListener("pointermove", (e) => {
      $$(".dock-item", dock).forEach((item) => {
        const rect = item.getBoundingClientRect();
        const mid = rect.left + rect.width / 2;
        const dist = Math.abs(e.clientX - mid);
        const scale = Math.max(1, 1.65 - dist / 120);
        const size = 52 * scale;
        item.style.width = size + "px";
        item.style.height = size + "px";
        item.style.marginBottom = Math.max(0, (size - 52) * 0.4) + "px";
      });
    });
    dock.addEventListener("pointerleave", () => {
      $$(".dock-item", dock).forEach((item) => {
        item.style.width = "";
        item.style.height = "";
        item.style.marginBottom = "";
      });
    });
  }

  function updateDockOpenState() {
    const openIds = new Set([...MacWM.getAll().keys()]);
    $$(".dock-item").forEach((item) => {
      item.classList.toggle("open", openIds.has(item.dataset.app));
    });
  }

  /* ---------- desktop icons ---------- */
  function buildDesktopIcons() {
    const root = $("#desktopIcons");
    if (!root) return;
    const icons = [
      { name: "Macintosh HD", icon: "💾", action: () => openApp("finder") },
      { name: "文稿", icon: "📁", action: () => openApp("finder") },
      { name: "欢迎.txt", icon: "📄", action: () => openApp("textedit") },
      { name: "截屏.png", icon: "🖼️", action: () => openApp("photos") },
    ];
    root.innerHTML = "";
    icons.forEach((ic) => {
      const el = document.createElement("div");
      el.className = "desk-icon";
      el.innerHTML = `<div class="di-icon">${ic.icon}</div><div class="di-label">${ic.name}</div>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!e.metaKey && !e.shiftKey) $$(".desk-icon").forEach((x) => x.classList.remove("selected"));
        el.classList.add("selected");
      });
      el.addEventListener("dblclick", () => ic.action());
      // simple drag
      let dragging = false, ox = 0, oy = 0, sx = 0, sy = 0;
      el.style.position = "relative";
      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        dragging = true;
        sx = e.clientX;
        sy = e.clientY;
        const t = el.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        ox = t ? parseFloat(t[1]) : 0;
        oy = t ? parseFloat(t[2]) : 0;
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        el.style.transform = `translate(${ox + e.clientX - sx}px, ${oy + e.clientY - sy}px)`;
      });
      el.addEventListener("pointerup", () => {
        dragging = false;
      });
      root.appendChild(el);
    });
  }

  /* ---------- launchpad ---------- */
  function buildLaunchpad() {
    const grid = $("#launchpadGrid");
    if (!grid) return;
    grid.innerHTML = "";
    MacApps.catalog
      .filter((a) => a.id !== "launchpad" && a.id !== "trash")
      .forEach((app) => {
        const el = document.createElement("div");
        el.className = "lp-app";
        el.innerHTML = `<div class="lp-icon">${MacIcons.get(app.icon)}</div><span>${app.name}</span>`;
        el.addEventListener("click", () => {
          hideLaunchpad();
          openApp(app.id);
        });
        grid.appendChild(el);
      });
    $("#lpSearch")?.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$(".lp-app", grid).forEach((el) => {
        const name = el.querySelector("span").textContent.toLowerCase();
        el.style.display = !q || name.includes(q) ? "" : "none";
      });
    });
  }

  function showLaunchpad() {
    closePanels();
    hideMissionControl();
    $("#launchpad")?.classList.remove("hidden");
    MacFX?.play.open();
  }
  function hideLaunchpad() {
    $("#launchpad")?.classList.add("hidden");
    if ($("#lpSearch")) $("#lpSearch").value = "";
  }

  /* ---------- open app ---------- */
  function openApp(id) {
    if (id === "launchpad") {
      if ($("#launchpad")?.classList.contains("hidden")) showLaunchpad();
      else hideLaunchpad();
      return;
    }
    if (id === "trash") {
      MacFX?.play.emptyTrash();
      toast("废纸篓是空的");
      return;
    }
    const app = MacApps.get(id);
    if (!app) {
      toast(`找不到应用：${id}`);
      return;
    }
    hideLaunchpad();
    hideMissionControl();
    closePanels();
    MacWM.create(app);
    updateDockOpenState();
  }

  function setActiveApp(id) {
    activeApp = id || "finder";
    const app = MacApps.get(activeApp);
    if ($("#menuAppName")) $("#menuAppName").textContent = app?.name || "Finder";
    const menus = MacApps.menus[activeApp] || MacApps.menus.default;
    const menuItems = $("#menuItems");
    if (menuItems) {
      menuItems.innerHTML = "";
      menus.forEach((m) => {
        const b = document.createElement("button");
        b.className = "mb-item";
        b.type = "button";
        b.textContent = m;
        b.dataset.menu = m;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          openMenuBar(m, b);
        });
        b.addEventListener("mouseenter", () => {
          if (menuDropdown && !menuDropdown.classList.contains("hidden")) {
            openMenuBar(m, b);
          }
        });
        menuItems.appendChild(b);
      });
    }
  }

  function openMenuBar(name, anchor) {
    closePanels(true);
    const items = MENU_DEFS[name] || [{ label: name + "（示意）", action: () => toast(name) }];
    let dd = $("#menuDropdown");
    if (!dd) {
      dd = document.createElement("div");
      dd.id = "menuDropdown";
      dd.className = "dropdown menu-dropdown";
      $("#desktop").appendChild(dd);
    }
    menuDropdown = dd;
    dd.innerHTML = "";
    items.forEach((it) => {
      if (it.sep) {
        const s = document.createElement("div");
        s.className = "sep";
        dd.appendChild(s);
        return;
      }
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<span>${it.label}</span>${it.shortcut ? `<span class="sc">${it.shortcut}</span>` : ""}`;
      b.addEventListener("click", () => {
        dd.classList.add("hidden");
        it.action?.();
      });
      dd.appendChild(b);
    });
    const r = anchor.getBoundingClientRect();
    dd.style.left = r.left + "px";
    dd.style.top = "30px";
    dd.classList.remove("hidden");
    $$(".mb-item").forEach((x) => x.classList.toggle("active", x === anchor));
  }

  /* ---------- panels ---------- */
  function closePanels(keepMenuHover = false) {
    $("#appleMenu")?.classList.add("hidden");
    $("#controlCenter")?.classList.add("hidden");
    $("#notifCenter")?.classList.add("hidden");
    $("#ctxMenu")?.classList.add("hidden");
    $("#spotlight")?.classList.add("hidden");
    $("#appSwitcher")?.classList.add("hidden");
    if (!keepMenuHover) $("#menuDropdown")?.classList.add("hidden");
    $$(".mb-item.active, .mb-status.active").forEach((el) => el.classList.remove("active"));
    switcherOpen = false;
  }

  function toggleAppleMenu() {
    const menu = $("#appleMenu");
    const open = menu.classList.contains("hidden");
    closePanels();
    if (open) {
      menu.classList.remove("hidden");
      $("#appleBtn")?.classList.add("active");
      MacFX?.play.click();
    }
  }

  function toggleControlCenter() {
    const cc = $("#controlCenter");
    const open = cc.classList.contains("hidden");
    closePanels();
    if (open) {
      cc.classList.remove("hidden");
      $("#ccBtn")?.classList.add("active");
    }
  }

  function toggleNotifCenter() {
    const nc = $("#notifCenter");
    const open = nc.classList.contains("hidden");
    closePanels();
    if (open) {
      nc.classList.remove("hidden");
      $("#menuClock")?.classList.add("active");
    }
  }

  /* ---------- Mission Control ---------- */
  function toggleMissionControl() {
    if ($("#missionControl")?.classList.contains("hidden") === false) hideMissionControl();
    else showMissionControl();
  }

  function showMissionControl() {
    closePanels();
    hideLaunchpad();
    const mc = $("#missionControl");
    if (!mc) return;
    mc.classList.remove("hidden");
    document.getElementById("desktop")?.classList.add("mc-active");
    refreshMissionControl();
    MacFX?.play.open();
  }

  function hideMissionControl() {
    $("#missionControl")?.classList.add("hidden");
    document.getElementById("desktop")?.classList.remove("mc-active");
  }

  function refreshMissionControl() {
    const strip = $("#mcWindows");
    const spaces = $("#mcSpaces");
    if (!strip || !spaces) return;

    const wins = MacWM.getAllOpenAnySpace();
    strip.innerHTML = "";
    if (!wins.length) {
      strip.innerHTML = `<div class="mc-empty">没有打开的窗口</div>`;
    } else {
      wins.forEach((w) => {
        const card = document.createElement("div");
        card.className = "mc-win";
        card.innerHTML = `
          <div class="mc-win-preview">
            <div class="mc-win-chrome"><span></span><span></span><span></span><b>${w.app.name}</b></div>
            <div class="mc-win-body">${MacIcons.get(w.app.icon)}</div>
          </div>
          <div class="mc-win-label">${w.app.name}</div>
        `;
        card.addEventListener("click", () => {
          hideMissionControl();
          if (w.el.classList.contains("minimized")) MacWM.restore(w.id);
          else MacWM.focus(w.id);
        });
        strip.appendChild(card);
      });
    }

    spaces.innerHTML = "";
    const count = MacWM.getSpaceCount();
    const cur = MacWM.getSpace();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("button");
      s.type = "button";
      s.className = "mc-space" + (i === cur ? " active" : "");
      s.innerHTML = `<div class="mc-space-thumb space-${i}"></div><span>桌面 ${i + 1}</span>`;
      s.addEventListener("click", (e) => {
        e.stopPropagation();
        MacWM.switchSpace(i);
        refreshMissionControl();
      });
      spaces.appendChild(s);
    }
  }

  function onSpaceChange(i) {
    const wp = $("#wallpaper");
    if (wp) {
      wp.dataset.space = String(i);
    }
    updateDockOpenState();
  }

  /* ---------- notifications ---------- */
  function notify(title, body, opts = {}) {
    const host = $("#notifBanners");
    if (!host) return;
    MacFX?.play.notif();
    const el = document.createElement("div");
    el.className = "notif-banner";
    el.innerHTML = `
      <div class="nb-icon">${MacIcons.get(opts.app || "settings")}</div>
      <div class="nb-text"><b>${title}</b><span>${body}</span></div>
    `;
    el.addEventListener("click", () => {
      el.remove();
      if (opts.app) openApp(opts.app);
    });
    host.appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 300);
    }, 4200);
  }

  /* ---------- spotlight ---------- */
  function openSpotlight() {
    closePanels();
    hideLaunchpad();
    hideMissionControl();
    $("#spotlight")?.classList.remove("hidden");
    const input = $("#spotlightInput");
    if (input) {
      input.value = "";
      spotlightIndex = 0;
      renderSpotlightResults("");
      setTimeout(() => input.focus(), 30);
    }
  }

  function renderSpotlightResults(q) {
    const box = $("#spotlightResults");
    if (!box) return;
    const query = q.trim().toLowerCase();
    const apps = MacApps.catalog.filter(
      (a) => a.id !== "trash" && (!query || a.name.toLowerCase().includes(query) || a.id.includes(query))
    );
    const extras = [
      { id: "_mc", name: "调度中心", icon: "launchpad", action: "mc", kind: "系统" },
      { id: "_about", name: "关于本机", icon: "about", open: "about", kind: "系统" },
      { id: "_sleep", name: "睡眠", icon: "about", action: "sleep", kind: "系统" },
      { id: "_lock", name: "锁定屏幕", icon: "settings", action: "lock", kind: "系统" },
    ].filter((x) => !query || x.name.includes(query));

    const items = [
      ...apps.map((a) => ({ ...a, kind: "应用" })),
      ...extras,
    ];

    box.innerHTML = items
      .map(
        (it, i) => `
      <div class="sp-item${i === spotlightIndex ? " active" : ""}" data-idx="${i}" data-open="${it.open || it.id || ""}" data-action="${it.action || ""}">
        <div class="sp-ico">${MacIcons.get(it.icon || "folder")}</div>
        <div><div>${it.name}</div><div class="sp-meta">${it.kind || "应用"}</div></div>
      </div>`
      )
      .join("");
    box._items = items;
    $$(".sp-item", box).forEach((el) => {
      el.addEventListener("click", () => activateSpotlightItem(el));
      el.addEventListener("mouseenter", () => {
        spotlightIndex = Number(el.dataset.idx);
        $$(".sp-item", box).forEach((x, i) => x.classList.toggle("active", i === spotlightIndex));
      });
    });
  }

  function activateSpotlightItem(el) {
    const action = el.dataset.action;
    const open = el.dataset.open;
    closePanels();
    if (action === "sleep") return sleep();
    if (action === "mc") return showMissionControl();
    if (action === "lock") return lockScreen();
    if (open && open !== "_mc" && open !== "_sleep" && open !== "_lock") openApp(open);
  }

  /* ---------- app switcher ---------- */
  function showSwitcher(next = true) {
    const open = MacWM.getOpen();
    const apps = open.length ? open.map((w) => w.app) : [MacApps.get("finder")].filter(Boolean);
    if (!apps.length) return;
    if (!switcherOpen) {
      switcherOpen = true;
      switcherIndex = 0;
      $("#appSwitcher")?.classList.remove("hidden");
    }
    switcherIndex = next
      ? (switcherIndex + 1) % apps.length
      : (switcherIndex - 1 + apps.length) % apps.length;
    const inner = $("#asInner");
    inner.innerHTML = apps
      .map(
        (a, i) => `
      <div class="as-item${i === switcherIndex ? " active" : ""}">
        <div class="as-icon">${MacIcons.get(a.icon)}</div>
        <span>${a.name}</span>
      </div>`
      )
      .join("");
    inner._apps = apps;
  }

  function commitSwitcher() {
    if (!switcherOpen) return;
    const apps = $("#asInner")?._apps || [];
    const app = apps[switcherIndex];
    closePanels();
    if (app) {
      const win = MacWM.getAll().get(app.id);
      if (win?.el.classList.contains("minimized")) MacWM.restore(app.id);
      else MacWM.focus(app.id);
    }
  }

  /* ---------- context / toast ---------- */
  function showContextMenu(x, y, items) {
    const menu = $("#ctxMenu");
    menu.innerHTML = "";
    items.forEach((it) => {
      if (it === "sep") {
        menu.appendChild(Object.assign(document.createElement("div"), { className: "sep" }));
        return;
      }
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = it.label;
      b.addEventListener("click", () => {
        menu.classList.add("hidden");
        it.action?.();
      });
      menu.appendChild(b);
    });
    menu.classList.remove("hidden");
    menu.style.left = Math.min(x, window.innerWidth - 220) + "px";
    menu.style.top = Math.min(y, window.innerHeight - items.length * 28) + "px";
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  /* ---------- power ---------- */
  function sleep() {
    closePanels();
    hideMissionControl();
    const desk = $("#desktop");
    desk.style.transition = "opacity 0.7s ease";
    desk.style.opacity = "0";
    setTimeout(() => {
      const wake = () => {
        desk.style.opacity = "1";
        window.removeEventListener("keydown", wake);
        window.removeEventListener("pointerdown", wake);
        setTimeout(() => (desk.style.transition = ""), 600);
        MacFX?.play.login();
      };
      window.addEventListener("keydown", wake, { once: true });
      window.addEventListener("pointerdown", wake, { once: true });
    }, 700);
  }

  function lockScreen() {
    MacWM.closeAll();
    closePanels();
    hideLaunchpad();
    hideMissionControl();
    $("#desktop").classList.add("hidden");
    $("#login").classList.remove("hidden");
    if ($("#loginPass")) $("#loginPass").value = "";
    toast("屏幕已锁定");
  }

  function logout() {
    MacWM.closeAll();
    closePanels();
    hideLaunchpad();
    hideMissionControl();
    $("#desktop").classList.add("hidden");
    $("#login").classList.remove("hidden");
    if ($("#loginPass")) $("#loginPass").value = "";
  }

  function restart() {
    toast("正在重新启动…");
    setTimeout(() => location.reload(), 700);
  }

  /* ---------- hot corners ---------- */
  function bindHotCorners() {
    let timer = null;
    window.addEventListener("pointermove", (e) => {
      if (!hotCornerArmed) return;
      if (!$("#desktop") || $("#desktop").classList.contains("hidden")) return;
      const m = 4;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = e.clientX;
      const y = e.clientY;
      let corner = null;
      if (x <= m && y <= m) corner = "tl";
      else if (x >= w - m && y <= m) corner = "tr";
      else if (x <= m && y >= h - m) corner = "bl";
      else if (x >= w - m && y >= h - m) corner = "br";
      if (!corner) {
        clearTimeout(timer);
        timer = null;
        return;
      }
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (corner === "tl") showMissionControl();
        if (corner === "tr") toggleNotifCenter();
        if (corner === "bl") openApp("launchpad");
        if (corner === "br") {
          // show desktop — minimize all
          MacWM.getOpen().forEach((w) => MacWM.minimize(w.id));
          toast("桌面");
        }
        hotCornerArmed = false;
        setTimeout(() => (hotCornerArmed = true), 800);
      }, 180);
    });
  }

  /* ---------- events ---------- */
  function bindShellEvents() {
    $("#appleBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAppleMenu();
    });

    $("#appleMenu")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const act = btn.dataset.action;
      closePanels();
      if (act === "about") openApp("about");
      if (act === "settings") openApp("settings");
      if (act === "appstore") toast("App Store 仅作展示");
      if (act === "sleep") sleep();
      if (act === "restart") restart();
      if (act === "shutdown") {
        $("#desktop").classList.add("hidden");
        $("#boot").classList.remove("hidden");
        if ($("#bootBar")) $("#bootBar").style.width = "0%";
        setTimeout(() => {
          $("#boot").classList.add("hidden");
          document.body.style.background = "#000";
          notify("系统", "电脑已关机 — 刷新页面重新开机");
        }, 1000);
      }
      if (act === "logout") logout();
    });

    $("#ccBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleControlCenter();
    });
    $("#spotlightBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openSpotlight();
    });
    $("#menuClock")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNotifCenter();
    });
    $("#controlCenter")?.addEventListener("click", (e) => e.stopPropagation());
    $("#notifCenter")?.addEventListener("click", (e) => e.stopPropagation());
    $("#appleMenu")?.addEventListener("click", (e) => e.stopPropagation());
    $("#menuDropdown")?.addEventListener("click", (e) => e.stopPropagation());

    $$("#controlCenter [data-toggle]").forEach((tile) => {
      tile.addEventListener("click", () => {
        tile.classList.toggle("active");
        MacFX?.play.click();
      });
    });

    $("#brightness")?.addEventListener("input", (e) => {
      document.documentElement.style.setProperty("--brightness", Number(e.target.value) / 100);
    });
    $("#volume")?.addEventListener("input", (e) => {
      MacFX?.setVolume(Number(e.target.value) / 100);
      MacFX?.play.volume();
    });

    $("#missionControl")?.addEventListener("click", (e) => {
      if (e.target.id === "missionControl" || e.target.classList.contains("mc-backdrop")) {
        hideMissionControl();
      }
    });

    $("#desktop")?.addEventListener("mousedown", (e) => {
      if (
        e.target.closest(
          ".window, .dock, .menubar, .dropdown, .control-center, .notif-center, .spotlight-overlay, .launchpad, .ctx-menu, .app-switcher, .desk-icon, .mission-control, .notif-banner"
        )
      ) {
        return;
      }
      closePanels();
      $$(".desk-icon").forEach((x) => x.classList.remove("selected"));
    });

    $("#desktop")?.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".window, .dock, .menubar, .dropdown, .control-center, .notif-center, .spotlight, .launchpad, .mission-control")) {
        return;
      }
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        { label: "新建文件夹", action: () => toast("已创建「未命名文件夹」") },
        "sep",
        { label: "获取信息", action: () => toast("Macintosh HD — Web Volume") },
        { label: "更改墙纸…", action: () => openApp("settings") },
        "sep",
        { label: "调度中心", action: () => showMissionControl() },
        { label: "使用叠放", action: () => toast("叠放已启用（示意）") },
        { label: "整理", action: () => toast("桌面已整理") },
        "sep",
        { label: "打开 Finder", action: () => openApp("finder") },
        { label: "启动台", action: () => openApp("launchpad") },
      ]);
    });

    $("#spotlightInput")?.addEventListener("input", (e) => {
      spotlightIndex = 0;
      renderSpotlightResults(e.target.value);
    });
    $("#spotlightInput")?.addEventListener("keydown", (e) => {
      const box = $("#spotlightResults");
      const items = box?._items || [];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        spotlightIndex = Math.min(items.length - 1, spotlightIndex + 1);
        renderSpotlightResults(e.target.value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        spotlightIndex = Math.max(0, spotlightIndex - 1);
        renderSpotlightResults(e.target.value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const el = box?.querySelector(".sp-item.active");
        if (el) activateSpotlightItem(el);
      } else if (e.key === "Escape") closePanels();
    });
    $("#spotlight")?.addEventListener("click", (e) => {
      if (e.target.id === "spotlight") closePanels();
    });

    window.addEventListener("keydown", (e) => {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;

      if (meta && e.key === "Tab") {
        e.preventDefault();
        showSwitcher(!e.shiftKey);
        return;
      }
      if (meta && (e.key === " " || e.code === "Space")) {
        if (typing) return; // don't steal from terminal / inputs
        e.preventDefault();
        if ($("#spotlight")?.classList.contains("hidden")) openSpotlight();
        else closePanels();
        return;
      }
      // Mission Control: Ctrl+Up or F3
      if ((e.ctrlKey && e.key === "ArrowUp") || e.key === "F3") {
        e.preventDefault();
        toggleMissionControl();
        return;
      }
      // Spaces: Ctrl+Left/Right
      if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault();
        MacWM.switchSpace(Math.max(0, MacWM.getSpace() - 1));
        return;
      }
      if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        MacWM.switchSpace(Math.min(MacWM.getSpaceCount() - 1, MacWM.getSpace() + 1));
        return;
      }
      // Lock: Ctrl+Cmd+Q simulated as Ctrl+Shift+L
      if (meta && e.shiftKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        lockScreen();
        return;
      }
      // Never steal keys while typing in inputs / terminal
      if (typing) return;

      if (meta && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        MacWM.close(activeApp);
        return;
      }
      if (meta && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        MacWM.minimize(activeApp);
        return;
      }
      if (meta && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        if (activeApp === "notes") openApp("notes");
        else if (activeApp === "textedit") openApp("textedit");
        else openApp("finder");
        return;
      }

      if (e.key === "Escape") {
        if (!$("#missionControl")?.classList.contains("hidden")) {
          hideMissionControl();
          return;
        }
        if (!$("#launchpad")?.classList.contains("hidden")) {
          hideLaunchpad();
          return;
        }
        closePanels();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (switcherOpen && (e.key === "Meta" || e.key === "Control")) commitSwitcher();
    });

  }

  function bindLoginEvents() {
    // Must bind on the login screen BEFORE desktop exists
    $("#loginForm")?.addEventListener("submit", login);
    $("#loginAvatar")?.addEventListener("click", login);
    $("#sleepBtn")?.addEventListener("click", () => login());
    $("#loginPass")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        login(e);
      }
    });
  }

  function start() {
    updateClocks();
    setInterval(updateClocks, 1000 * 10);
    bindLoginEvents();
    // unlock audio on first gesture
    const unlock = () => {
      MacFX?.ensure();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    boot();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  return {
    openApp,
    toast,
    notify,
    setActiveApp,
    updateDockOpenState,
    sleep,
    logout,
    lockScreen,
    refreshMissionControl,
    onSpaceChange,
    showMissionControl,
    hideMissionControl,
  };
})();
