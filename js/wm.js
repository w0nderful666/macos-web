/* Window Manager — genie minimize, spaces, realistic chrome */
window.MacWM = (() => {
  let z = 100;
  const windows = new Map();
  let currentSpace = 0;
  const SPACE_COUNT = 3;

  function create(app, opts = {}) {
    const layer = document.getElementById("windowsLayer");
    if (!layer) return null;

    if (windows.has(app.id) && !opts.force) {
      const existing = windows.get(app.id);
      if (existing.space !== currentSpace) {
        switchSpace(existing.space);
      }
      if (existing.el.classList.contains("minimized")) {
        restore(app.id);
      } else {
        focus(app.id);
      }
      bounceDock(app.id);
      return existing;
    }

    const id = app.id;
    const win = document.createElement("div");
    win.className = "window" + (app.light ? " light" : "");
    win.dataset.app = id;
    win.style.zIndex = ++z;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = app.w || 700;
    const h = app.h || 450;
    const openCount = getOpen().length;
    const left = Math.max(40, Math.min(vw - w - 40, (vw - w) / 2 + (openCount % 5) * 26));
    const top = Math.max(40, Math.min(vh - h - 90, 72 + (openCount % 5) * 30));

    win.style.width = w + "px";
    win.style.height = h + "px";
    win.style.left = left + "px";
    win.style.top = top + "px";

    const titlebar = document.createElement("div");
    titlebar.className = "titlebar" + (id === "calc" || id === "about" ? " compact" : "");
    titlebar.innerHTML = `
      <div class="traffic">
        <button class="tl close" data-act="close" title="关闭" aria-label="关闭"></button>
        <button class="tl min" data-act="min" title="最小化" aria-label="最小化"></button>
        <button class="tl max" data-act="max" title="全屏幕" aria-label="全屏幕"></button>
      </div>
      <div class="titlebar-title">${app.name}</div>
      <div class="titlebar-spacer"></div>
    `;

    const body = document.createElement("div");
    body.className = "window-body";
    win.append(titlebar, body);

    if (!app.noResize) {
      ["n", "s", "e", "w", "ne", "nw", "se", "sw"].forEach((dir) => {
        const edge = document.createElement("div");
        edge.className = "win-edge edge-" + dir;
        edge.dataset.dir = dir;
        win.appendChild(edge);
        enableEdgeResize(win, edge, dir);
      });
    }

    layer.appendChild(win);
    window.MacApps.render(id, body);

    const state = {
      id,
      el: win,
      app,
      maximized: false,
      restore: null,
      space: currentSpace,
      minRect: null,
    };
    windows.set(id, state);
    applySpaceVisibility();

    titlebar.querySelector('[data-act="close"]').addEventListener("click", (e) => {
      e.stopPropagation();
      close(id);
    });
    titlebar.querySelector('[data-act="min"]').addEventListener("click", (e) => {
      e.stopPropagation();
      minimize(id);
    });
    titlebar.querySelector('[data-act="max"]').addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMaximize(id);
    });

    enableDrag(win, titlebar);
    win.addEventListener("mousedown", () => focus(id));

    // open animation from dock
    const dockItem = document.querySelector(`.dock-item[data-app="${id}"]`);
    if (dockItem && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const dr = dockItem.getBoundingClientRect();
      const wr = win.getBoundingClientRect();
      const dx = dr.left + dr.width / 2 - (wr.left + wr.width / 2);
      const dy = dr.top + dr.height / 2 - (wr.top + wr.height / 2);
      win.style.transition = "none";
      win.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
      win.style.opacity = "0.4";
      requestAnimationFrame(() => {
        win.style.transition = "transform 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease";
        win.style.transform = "";
        win.style.opacity = "";
        setTimeout(() => {
          win.style.transition = "";
        }, 400);
      });
    }

    focus(id);
    bounceDock(id);
    window.MacFX?.play.open();
    window.MacOS?.updateDockOpenState?.();
    window.MacOS?.setActiveApp?.(id);
    window.MacOS?.refreshMissionControl?.();
    return state;
  }

  function enableDrag(win, handle) {
    let sx, sy, ox, oy, dragging = false;

    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".traffic")) return;
      const state = windows.get(win.dataset.app);
      if (state?.maximized) return;
      dragging = true;
      win.classList.add("dragging");
      sx = e.clientX;
      sy = e.clientY;
      ox = win.offsetLeft;
      oy = win.offsetTop;
      handle.setPointerCapture(e.pointerId);
      focus(win.dataset.app);
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const nx = ox + (e.clientX - sx);
      const ny = oy + (e.clientY - sy);
      win.style.left = Math.max(-win.offsetWidth + 100, Math.min(window.innerWidth - 60, nx)) + "px";
      win.style.top = Math.max(28, Math.min(window.innerHeight - 50, ny)) + "px";
    });
    handle.addEventListener("pointerup", () => {
      dragging = false;
      win.classList.remove("dragging");
    });
    handle.addEventListener("dblclick", () => {
      if (!windows.get(win.dataset.app)?.app?.noResize) {
        toggleMaximize(win.dataset.app);
      }
    });
  }

  function enableEdgeResize(win, edge, dir) {
    let sx, sy, sl, st, sw, sh, resizing = false;
    edge.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const state = windows.get(win.dataset.app);
      if (state?.maximized) return;
      resizing = true;
      sx = e.clientX;
      sy = e.clientY;
      sl = win.offsetLeft;
      st = win.offsetTop;
      sw = win.offsetWidth;
      sh = win.offsetHeight;
      edge.setPointerCapture(e.pointerId);
      focus(win.dataset.app);
      win.classList.add("resizing");
    });
    edge.addEventListener("pointermove", (e) => {
      if (!resizing) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      let l = sl, t = st, w = sw, h = sh;
      if (dir.includes("e")) w = Math.max(320, sw + dx);
      if (dir.includes("s")) h = Math.max(200, sh + dy);
      if (dir.includes("w")) {
        w = Math.max(320, sw - dx);
        l = sl + (sw - w);
      }
      if (dir.includes("n")) {
        h = Math.max(200, sh - dy);
        t = st + (sh - h);
        if (t < 28) {
          h -= 28 - t;
          t = 28;
        }
      }
      win.style.left = l + "px";
      win.style.top = t + "px";
      win.style.width = w + "px";
      win.style.height = h + "px";
    });
    edge.addEventListener("pointerup", () => {
      resizing = false;
      win.classList.remove("resizing");
    });
  }

  function focus(id) {
    const state = windows.get(id);
    if (!state) return;
    if (state.space !== currentSpace) switchSpace(state.space);
    state.el.style.zIndex = ++z;
    document.querySelectorAll(".window").forEach((w) => w.classList.toggle("focused", w === state.el));
    window.MacOS?.setActiveApp?.(id);
  }

  function close(id) {
    const state = windows.get(id);
    if (!state) return;
    window.MacFX?.play.close();
    state.el.classList.add("closing");
    setTimeout(() => {
      state.el.remove();
      windows.delete(id);
      window.MacOS?.updateDockOpenState?.();
      window.MacOS?.refreshMissionControl?.();
      const remaining = getOpen().sort(
        (a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex)
      );
      if (remaining[0]) focus(remaining[0].id);
      else window.MacOS?.setActiveApp?.("finder");
    }, 180);
  }

  function dockTarget(id) {
    const item = document.querySelector(`.dock-item[data-app="${id}"]`);
    if (!item) return { x: window.innerWidth / 2, y: window.innerHeight - 20 };
    const r = item.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function minimize(id) {
    const state = windows.get(id);
    if (!state || state.el.classList.contains("minimized")) return;
    window.MacFX?.play.min();

    const el = state.el;
    const rect = el.getBoundingClientRect();
    const target = dockTarget(id);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;

    state.minRect = {
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
      transform: el.style.transform,
    };

    el.style.transition = "transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease";
    el.style.transformOrigin = "center center";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
    el.style.opacity = "0";

    setTimeout(() => {
      el.classList.add("minimized");
      el.style.transition = "";
      el.style.transform = "";
      el.style.opacity = "";
      window.MacOS?.updateDockOpenState?.();
      window.MacOS?.refreshMissionControl?.();
      const remaining = getOpen().sort(
        (a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex)
      );
      if (remaining[0]) focus(remaining[0].id);
      else window.MacOS?.setActiveApp?.("finder");
    }, 430);
  }

  function restore(id) {
    const state = windows.get(id);
    if (!state) return;
    const el = state.el;
    el.classList.remove("minimized");

    const target = dockTarget(id);
    const rect = { left: parseFloat(el.style.left), top: parseFloat(el.style.top), width: parseFloat(el.style.width), height: parseFloat(el.style.height) };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;

    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease";
      el.style.transform = "";
      el.style.opacity = "";
      setTimeout(() => {
        el.style.transition = "";
      }, 420);
    });
    focus(id);
    window.MacFX?.play.open();
    window.MacOS?.updateDockOpenState?.();
  }

  function toggleMaximize(id) {
    const state = windows.get(id);
    if (!state || state.app.noResize) return;
    window.MacFX?.play.max();
    if (!state.maximized) {
      state.restore = {
        left: state.el.style.left,
        top: state.el.style.top,
        width: state.el.style.width,
        height: state.el.style.height,
      };
      state.el.classList.add("maximized");
      state.maximized = true;
    } else {
      state.el.classList.remove("maximized");
      if (state.restore) Object.assign(state.el.style, state.restore);
      state.maximized = false;
    }
    focus(id);
  }

  function bounceDock(id) {
    const item = document.querySelector(`.dock-item[data-app="${id}"]`);
    if (!item) return;
    item.classList.remove("bounce");
    void item.offsetWidth;
    item.classList.add("bounce");
    setTimeout(() => item.classList.remove("bounce"), 600);
  }

  function getOpen() {
    return [...windows.values()].filter(
      (w) => !w.el.classList.contains("minimized") && w.space === currentSpace
    );
  }

  function getAllOpenAnySpace() {
    return [...windows.values()].filter((w) => !w.el.classList.contains("minimized"));
  }

  function getAll() {
    return windows;
  }

  function closeAll() {
    [...windows.keys()].forEach(close);
  }

  function getSpace() {
    return currentSpace;
  }

  function getSpaceCount() {
    return SPACE_COUNT;
  }

  function applySpaceVisibility() {
    windows.forEach((w) => {
      const on = w.space === currentSpace;
      w.el.classList.toggle("space-hidden", !on);
      if (!on) w.el.classList.remove("focused");
    });
    document.getElementById("desktop")?.style.setProperty("--space-tint", currentSpace);
    document.body.dataset.space = String(currentSpace);
  }

  function switchSpace(index) {
    if (index < 0 || index >= SPACE_COUNT || index === currentSpace) {
      currentSpace = index;
      applySpaceVisibility();
      return;
    }
    const dir = index > currentSpace ? 1 : -1;
    currentSpace = index;
    applySpaceVisibility();
    const layer = document.getElementById("windowsLayer");
    if (layer) {
      layer.animate(
        [
          { transform: `translateX(${dir * -40}px)`, opacity: 0.7 },
          { transform: "translateX(0)", opacity: 1 },
        ],
        { duration: 280, easing: "cubic-bezier(0.22,1,0.36,1)" }
      );
    }
    window.MacOS?.onSpaceChange?.(currentSpace);
  }

  function moveToSpace(id, space) {
    const state = windows.get(id);
    if (!state) return;
    state.space = space;
    applySpaceVisibility();
  }

  return {
    create,
    focus,
    close,
    minimize,
    restore,
    toggleMaximize,
    getOpen,
    getAllOpenAnySpace,
    getAll,
    closeAll,
    getSpace,
    getSpaceCount,
    switchSpace,
    moveToSpace,
    bounceDock,
  };
})();
