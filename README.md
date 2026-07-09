# macOS Web · DEMO

> **这是一个演示项目（Demo）**，不是真正的 macOS，也不是系统软件。  
> 纯前端页面模拟桌面交互，方便在浏览器里「写出来试试看效果」。

**在线体验（GitHub Pages）：**  
**https://w0nderful666.github.io/macos-web/**

仓库：https://github.com/w0nderful666/macos-web

---

## 这是什么？

一个 **纯 HTML / CSS / JavaScript** 的 macOS 风格桌面 Demo：

- 开机动画、登录界面  
- 菜单栏、Dock 放大、窗口拖拽/缩放  
- Mission Control、多桌面、热角、Spotlight  
- Finder / Safari / 备忘录 / 计算器 / 终端 等示意 App  

**登录密码：随便填（可空）→ 回车，或点头像进入。**

---

## 重要说明（请先读）

| 项目 | 说明 |
|------|------|
| **性质** | 视觉与交互 **Demo / 作品展示**，用于学习与炫技 |
| **不是** | 真实操作系统、远程桌面、或任何系统管理工具 |
| **终端** | **完全模拟**：不访问真实磁盘、真实进程、真实网络 |
| **文件系统** | 浏览器 `localStorage` 虚拟盘，有容量限制 |
| **与 Apple** | 非官方、无关联；macOS 为 Apple 商标 |

终端里输入 `safety` 可看安全模型摘要。

Safari 里点「↗ 新标签」会用你的浏览器打开网址（需你主动点击），与普通网页链接相同。

---

## 本地运行

任意静态服务器即可：

```bash
cd macos-web
python3 -m http.server 8766
# 或: perl serve.pl 8766
```

打开 http://127.0.0.1:8766/

---

## 快捷键（Demo 内）

| 快捷键 | 作用 |
|--------|------|
| `Ctrl/⌘ + Space` | Spotlight |
| `Ctrl/⌘ + Tab` | 应用切换 |
| `Ctrl + ↑` / `F3` | 调度中心 |
| `Ctrl + ← / →` | 切换桌面 |
| `Ctrl/⌘ + Shift + L` | 锁屏（回登录） |

热角：左上调度中心 · 右上通知 · 左下启动台 · 右下显示桌面。

---

## 终端试玩（模拟）

```text
help
safety
neofetch
ls -la
mkdir demo && cd demo && echo hi > a.txt && cat a.txt
ps
```

---

## 技术栈

- 零构建、零框架依赖  
- 静态资源，适合 **GitHub Pages** 直接托管  
- 相对路径引用，子路径部署可用  

```text
macos-web/
├── index.html
├── css/macos.css
├── js/          # vfs / shell / wm / apps …
├── serve.pl     # 可选本地服务
└── README.md
```

---

## 免责声明

仅供演示与学习。请勿用于钓鱼或伪造系统骗取真实密码。本 Demo 登录接受任意密码，仅为进入界面。

MIT License — 详见 [LICENSE](./LICENSE)。
