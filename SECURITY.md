# Security Policy

## What this project is

**macOS Web** is a static browser demo. All “OS” behavior is simulated in JavaScript.

## Guarantees (by design)

1. **No host filesystem access** — VFS uses `localStorage` only.  
2. **No host process control** — `ps` / `kill` only affect in-page windows.  
3. **No shell escape** — commands are an allowlist `switch`, not `eval`.  
4. **No terminal network** — `curl` is mocked and does not call `fetch`.  
5. **No native code** — pure HTML/CSS/JS, no WASM runtime required.

## What users should know

- **Safari “open in new tab”** is intentional real navigation (user gesture).  
- **localStorage** can store user-created virtual files in that browser profile only.  
- **Third-party sites** loaded in iframes or new tabs follow those sites’ own policies.

## Reporting issues

If you find a way for this demo to read host files, execute host commands, or perform silent cross-origin requests from the Terminal, please open a GitHub issue with reproduction steps.
