/* Virtual filesystem — 100% in-browser (localStorage only).
 * Does NOT access host disk, WSL paths, or native APIs.
 */
window.MacVFS = (() => {
  const STORE_KEY = "macos-web-vfs-v1";
  const MAX_FILE_BYTES = 256 * 1024; // 256 KB per file
  const MAX_TREE_BYTES = 1024 * 1024; // ~1 MB serialized tree

  /** @typedef {{ type: 'dir'|'file', name: string, children?: Object, content?: string, mtime: number, size?: number }} Node */

  function now() {
    return Date.now();
  }

  function defaultTree() {
    /** @type {Node} */
    const root = {
      type: "dir",
      name: "/",
      mtime: now(),
      children: {},
    };

    const mk = (parent, name, type, content = "") => {
      const node =
        type === "dir"
          ? { type: "dir", name, mtime: now(), children: {} }
          : { type: "file", name, mtime: now(), content, size: content.length };
      parent.children[name] = node;
      return node;
    };

    const users = mk(root, "Users", "dir");
    const winter = mk(users, "winter", "dir");
    const home = winter;
    ["Desktop", "Documents", "Downloads", "Applications", "Pictures", "Music", "Movies", "Library"].forEach((d) =>
      mk(home, d, "dir")
    );
    mk(home, ".zshrc", "file", "# macOS Web shell config\nexport TERM=xterm-web\n");
    mk(home, "README.txt", "file", "Welcome to macOS Web virtual filesystem.\nTry: ls, cd, cat, mkdir, touch, rm, tree, ps, open\n");
    mk(home.Documents || home.children.Documents, "notes.txt", "file", "Hello from virtual disk.\n");
    mk(home.children.Desktop, "welcome.txt", "file", "Drag me in spirit — this lives in VFS.\n");
    mk(home.children.Downloads, "install.log", "file", "[ok] macos-web ready\n");

    const etc = mk(root, "etc", "dir");
    mk(etc, "hostname", "file", "macos-web\n");
    mk(etc, "os-release", "file", 'NAME="macOS Web"\nVERSION="15.0"\nID=macos-web\n');

    const tmp = mk(root, "tmp", "dir");
    mk(tmp, "session.log", "file", "session started\n");

    const bin = mk(root, "bin", "dir");
    ["ls", "cd", "cat", "pwd", "echo", "mkdir", "touch", "rm", "ps", "open", "help"].forEach((c) =>
      mk(bin, c, "file", `#!/bin/web\n# ${c} builtin\n`)
    );

    return root;
  }

  let root = null;
  let cwd = "/Users/winter";

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        root = data.root;
        cwd = data.cwd || "/Users/winter";
        return;
      }
    } catch (_) {}
    root = defaultTree();
    cwd = "/Users/winter";
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ root, cwd }));
    } catch (_) {}
  }

  function normalize(path, base = cwd) {
    if (!path || path === ".") return base;
    let p = path.startsWith("/") ? path : join(base, path);
    const parts = p.split("/").filter(Boolean);
    const stack = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") stack.pop();
      else stack.push(part);
    }
    return "/" + stack.join("/");
  }

  function join(a, b) {
    if (b.startsWith("/")) return b;
    if (a.endsWith("/")) return a + b;
    return a + "/" + b;
  }

  function resolve(path) {
    const full = normalize(path);
    if (full === "/") return { node: root, path: "/", parent: null, name: "/" };
    const parts = full.split("/").filter(Boolean);
    let node = root;
    let parent = null;
    let name = "";
    for (const part of parts) {
      if (!node || node.type !== "dir" || !node.children[part]) {
        return { node: null, path: full, parent: node, name: part, missing: true };
      }
      parent = node;
      node = node.children[part];
      name = part;
    }
    return { node, path: full, parent, name };
  }

  function ensureDir(path) {
    const full = normalize(path);
    if (full === "/") return root;
    const parts = full.split("/").filter(Boolean);
    let node = root;
    for (const part of parts) {
      if (!node.children[part]) {
        node.children[part] = { type: "dir", name: part, mtime: now(), children: {} };
      }
      node = node.children[part];
      if (node.type !== "dir") throw new Error(`Not a directory: ${part}`);
    }
    return node;
  }

  function list(path = cwd) {
    const { node } = resolve(path);
    if (!node) throw new Error(`No such file or directory: ${path}`);
    if (node.type !== "dir") throw new Error(`Not a directory: ${path}`);
    return Object.keys(node.children).sort((a, b) => {
      const A = node.children[a];
      const B = node.children[b];
      if (A.type !== B.type) return A.type === "dir" ? -1 : 1;
      return a.localeCompare(b);
    });
  }

  function read(path) {
    const { node } = resolve(path);
    if (!node) throw new Error(`No such file or directory: ${path}`);
    if (node.type !== "file") throw new Error(`Is a directory: ${path}`);
    return node.content || "";
  }

  function approxSize(node) {
    if (!node) return 0;
    if (node.type === "file") return (node.content || "").length + 64;
    let n = 64;
    Object.values(node.children || {}).forEach((c) => {
      n += approxSize(c);
    });
    return n;
  }

  function write(path, content, append = false) {
    content = String(content ?? "");
    const full = normalize(path);
    // path safety: no null bytes
    if (full.includes("\0") || path.includes("\0")) throw new Error("Invalid path");
    const parts = full.split("/").filter(Boolean);
    const name = parts.pop();
    if (!name || name === "." || name === "..") throw new Error("Invalid path");
    const dirPath = "/" + parts.join("/");
    const dir = ensureDir(dirPath === "/" ? "/" : dirPath);
    if (dir.children[name] && dir.children[name].type === "dir") {
      throw new Error(`Is a directory: ${path}`);
    }
    const prev = dir.children[name]?.content || "";
    const next = append ? prev + content : content;
    if (next.length > MAX_FILE_BYTES) {
      throw new Error(`File too large (max ${MAX_FILE_BYTES} bytes in simulated FS)`);
    }
    if (approxSize(root) - (prev.length || 0) + next.length > MAX_TREE_BYTES) {
      throw new Error("Virtual disk full (simulated quota ~1MB)");
    }
    dir.children[name] = {
      type: "file",
      name,
      content: next,
      size: next.length,
      mtime: now(),
    };
    save();
    return full;
  }

  function mkdir(path) {
    const full = normalize(path);
    const existing = resolve(full).node;
    if (existing) {
      if (existing.type === "dir") return full; // idempotent
      throw new Error(`File exists: ${path}`);
    }
    ensureDir(full);
    save();
    return full;
  }

  function touch(path) {
    const { node } = resolve(path);
    if (node) {
      node.mtime = now();
      save();
      return normalize(path);
    }
    return write(path, "");
  }

  function rm(path, recursive = false) {
    const full = normalize(path);
    if (full === "/" || full === "/Users" || full === "/Users/winter") {
      throw new Error("Permission denied");
    }
    const { node, parent, name } = resolve(full);
    if (!node) throw new Error(`No such file or directory: ${path}`);
    if (node.type === "dir") {
      const keys = Object.keys(node.children || {});
      if (keys.length && !recursive) throw new Error(`Directory not empty: ${path}`);
    }
    delete parent.children[name];
    save();
  }

  function stat(path) {
    const { node, path: full } = resolve(path);
    if (!node) throw new Error(`No such file or directory: ${path}`);
    return {
      path: full,
      type: node.type,
      size: node.type === "file" ? (node.content || "").length : Object.keys(node.children || {}).length,
      mtime: node.mtime,
    };
  }

  function tree(path = cwd, prefix = "", depth = 0, maxDepth = 4) {
    const { node, path: full } = resolve(path);
    if (!node) return `No such path: ${path}`;
    if (node.type === "file") return full;
    let out = depth === 0 ? full + "\n" : "";
    if (depth >= maxDepth) return out;
    const names = Object.keys(node.children || {}).sort();
    names.forEach((name, i) => {
      const last = i === names.length - 1;
      const branch = last ? "└── " : "├── ";
      const child = node.children[name];
      out += prefix + branch + name + (child.type === "dir" ? "/" : "") + "\n";
      if (child.type === "dir") {
        out += tree(full === "/" ? "/" + name : full + "/" + name, prefix + (last ? "    " : "│   "), depth + 1, maxDepth);
      }
    });
    return out;
  }

  function getCwd() {
    return cwd;
  }

  function setCwd(path) {
    const full = normalize(path);
    const { node } = resolve(full);
    if (!node) throw new Error(`No such file or directory: ${path}`);
    if (node.type !== "dir") throw new Error(`Not a directory: ${path}`);
    cwd = full;
    save();
    return cwd;
  }

  function home() {
    return "/Users/winter";
  }

  function promptPath() {
    if (cwd === "/Users/winter") return "~";
    if (cwd.startsWith("/Users/winter/")) return "~" + cwd.slice("/Users/winter".length);
    return cwd;
  }

  function reset() {
    root = defaultTree();
    cwd = "/Users/winter";
    save();
  }

  function exists(path) {
    return !!resolve(path).node;
  }

  // boot
  load();

  return {
    normalize,
    resolve,
    list,
    read,
    write,
    mkdir,
    touch,
    rm,
    stat,
    tree,
    getCwd,
    setCwd,
    home,
    promptPath,
    reset,
    exists,
    save,
  };
})();
