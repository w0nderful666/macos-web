/* App icon factory — pure SVG, no external assets */
window.MacIcons = (() => {
  const svg = (body, view = "100") =>
    `<svg viewBox="0 0 ${view} ${view}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${body}</svg>`;

  const icons = {
    finder: () =>
      svg(`
      <defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e90ff"/><stop offset="100%" stop-color="#0a5cd6"/>
      </linearGradient></defs>
      <rect width="100" height="100" rx="22" fill="url(#fg)"/>
      <circle cx="38" cy="42" r="18" fill="#fff"/>
      <circle cx="62" cy="42" r="18" fill="#fff" opacity="0.92"/>
      <path d="M28 68c6 12 38 12 44 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="40" r="3" fill="#0a5cd6"/><circle cx="67" cy="40" r="3" fill="#0a5cd6"/>
    `),

    safari: () =>
      svg(`
      <defs><radialGradient id="sg" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#5ac8fa"/><stop offset="100%" stop-color="#007aff"/>
      </radialGradient></defs>
      <rect width="100" height="100" rx="22" fill="url(#sg)"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#fff" stroke-width="3" opacity="0.9"/>
      <circle cx="50" cy="50" r="2.5" fill="#fff"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315]
        .map((a, i) => {
          const r = ((a - 90) * Math.PI) / 180;
          const x1 = 50 + Math.cos(r) * 12;
          const y1 = 50 + Math.sin(r) * 12;
          const x2 = 50 + Math.cos(r) * 28;
          const y2 = 50 + Math.sin(r) * 28;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="${i % 2 ? 1.5 : 2.2}" stroke-linecap="round" opacity="0.9"/>`;
        })
        .join("")}
      <polygon points="50,22 56,48 50,44 44,48" fill="#ff3b30"/>
      <polygon points="50,78 44,52 50,56 56,52" fill="#fff"/>
    `),

    notes: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="#fff"/>
      <rect x="0" y="0" width="100" height="28" rx="22" fill="#ffd60a"/>
      <rect x="0" y="14" width="100" height="14" fill="#ffd60a"/>
      <line x1="18" y1="42" x2="82" y2="42" stroke="#d1d1d6" stroke-width="3" stroke-linecap="round"/>
      <line x1="18" y1="56" x2="82" y2="56" stroke="#d1d1d6" stroke-width="3" stroke-linecap="round"/>
      <line x1="18" y1="70" x2="60" y2="70" stroke="#d1d1d6" stroke-width="3" stroke-linecap="round"/>
    `),

    calc: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="#1c1c1e"/>
      <rect x="12" y="12" width="76" height="24" rx="6" fill="#2c2c2e"/>
      <circle cx="24" cy="54" r="8" fill="#a5a5a5"/>
      <circle cx="50" cy="54" r="8" fill="#a5a5a5"/>
      <circle cx="76" cy="54" r="8" fill="#ff9f0a"/>
      <circle cx="24" cy="78" r="8" fill="#333"/>
      <circle cx="50" cy="78" r="8" fill="#333"/>
      <circle cx="76" cy="78" r="8" fill="#ff9f0a"/>
    `),

    terminal: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="#1a1a1c"/>
      <rect x="10" y="14" width="80" height="72" rx="8" fill="#0c0c0e"/>
      <path d="M24 40l12 10-12 10" stroke="#28c840" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="42" y1="60" x2="68" y2="60" stroke="#28c840" stroke-width="4" stroke-linecap="round"/>
    `),

    settings: () =>
      svg(`
      <defs><linearGradient id="stg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#8e8e93"/><stop offset="100%" stop-color="#636366"/>
      </linearGradient></defs>
      <rect width="100" height="100" rx="22" fill="url(#stg)"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="#fff" stroke-width="6"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const x = 50 + Math.cos(a) * 30;
        const y = 50 + Math.sin(a) * 30;
        return `<rect x="${x - 4}" y="${y - 7}" width="8" height="14" rx="2" fill="#fff" transform="rotate(${i * 45} ${x} ${y})"/>`;
      }).join("")}
    `),

    launchpad: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="url(#lg)"/>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7b5cff"/><stop offset="100%" stop-color="#2f6bff"/>
      </linearGradient></defs>
      ${[0, 1, 2]
        .flatMap((r) =>
          [0, 1, 2].map((c) => {
            const colors = ["#ff453a", "#ff9f0a", "#30d158", "#64d2ff", "#bf5af2", "#ff375f", "#ffd60a", "#5e5ce6", "#ac8e68"];
            return `<circle cx="${28 + c * 22}" cy="${28 + r * 22}" r="8" fill="${colors[r * 3 + c]}"/>`;
          })
        )
        .join("")}
    `),

    trash: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="#8e8e93"/>
      <path d="M32 30h36l-3 48H35L32 30z" fill="#f5f5f7"/>
      <rect x="28" y="24" width="44" height="8" rx="2" fill="#f5f5f7"/>
      <rect x="40" y="18" width="20" height="8" rx="2" fill="#f5f5f7"/>
      <line x1="42" y1="38" x2="42" y2="66" stroke="#8e8e93" stroke-width="3"/>
      <line x1="50" y1="38" x2="50" y2="66" stroke="#8e8e93" stroke-width="3"/>
      <line x1="58" y1="38" x2="58" y2="66" stroke="#8e8e93" stroke-width="3"/>
    `),

    textedit: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="#fff"/>
      <path d="M22 18h40l16 16v48a6 6 0 01-6 6H22a6 6 0 01-6-6V24a6 6 0 016-6z" fill="#f2f2f7" stroke="#d1d1d6"/>
      <path d="M62 18v14h14" fill="#e5e5ea" stroke="#d1d1d6"/>
      <line x1="28" y1="48" x2="72" y2="48" stroke="#007aff" stroke-width="3"/>
      <line x1="28" y1="60" x2="64" y2="60" stroke="#c7c7cc" stroke-width="3"/>
      <line x1="28" y1="72" x2="56" y2="72" stroke="#c7c7cc" stroke-width="3"/>
    `),

    photos: () =>
      svg(`
      <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff2d55"/><stop offset="33%" stop-color="#ff9f0a"/>
        <stop offset="66%" stop-color="#30d158"/><stop offset="100%" stop-color="#007aff"/>
      </linearGradient></defs>
      <rect width="100" height="100" rx="22" fill="#1c1c1e"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="url(#pg)" stroke-width="14"/>
    `),

    music: () =>
      svg(`
      <defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fc3c44"/><stop offset="100%" stop-color="#fa2d55"/>
      </linearGradient></defs>
      <rect width="100" height="100" rx="22" fill="url(#mg)"/>
      <circle cx="36" cy="68" r="12" fill="#fff"/>
      <circle cx="68" cy="60" r="10" fill="#fff"/>
      <path d="M48 68V30l32-6v38" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    `),

    calendar: () => {
      const d = new Date();
      const day = d.getDate();
      const week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][d.getDay()];
      return svg(`
      <rect width="100" height="100" rx="22" fill="#fff"/>
      <rect x="0" y="0" width="100" height="28" rx="22" fill="#ff3b30"/>
      <rect x="0" y="14" width="100" height="14" fill="#ff3b30"/>
      <text x="50" y="20" text-anchor="middle" fill="#fff" font-size="11" font-family="system-ui" font-weight="600">${week}</text>
      <text x="50" y="68" text-anchor="middle" fill="#1d1d1f" font-size="40" font-family="system-ui" font-weight="300">${day}</text>
    `);
    },

    about: () =>
      svg(`
      <rect width="100" height="100" rx="22" fill="#2c2c2e"/>
      <path fill="#fff" d="M62 28c2-5 4-10 3-15-5 0-11 3-14 7-3 3-5 8-5 13 5 0 11-2 16-5zM68 48c0-10 8-15 9-16-5-7-13-8-16-8-7-1-13 4-16 4s-9-4-14-4c-7 0-14 4-18 11-8 13-2 32 5 43 4 5 8 11 14 10s8-3 14-3 8 3 14 3 10-5 13-10c5-7 7-14 7-14s-11-4-11-16z"/>
    `),

    folder: () =>
      svg(`
      <rect width="100" height="100" rx="18" fill="transparent"/>
      <path d="M12 30a8 8 0 018-8h20l8 8h32a8 8 0 018 8v36a8 8 0 01-8 8H20a8 8 0 01-8-8V30z" fill="#0a84ff"/>
      <path d="M12 42h76v32a8 8 0 01-8 8H20a8 8 0 01-8-8V42z" fill="#409cff"/>
    `, "100"),

    messages: () =>
      svg(`
      <defs><linearGradient id="msg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#64d2ff"/><stop offset="100%" stop-color="#0a84ff"/>
      </linearGradient></defs>
      <rect width="100" height="100" rx="22" fill="url(#msg)"/>
      <ellipse cx="50" cy="46" rx="30" ry="22" fill="#fff"/>
      <path d="M38 64l-8 16 18-12" fill="#fff"/>
    `),
  };

  function get(name) {
    const fn = icons[name] || icons.folder;
    return fn();
  }

  function el(name) {
    const wrap = document.createElement("div");
    wrap.innerHTML = get(name);
    return wrap.firstElementChild;
  }

  return { get, el, icons };
})();
