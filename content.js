if (!document.getElementById('moscow-sans-font')) {
    const style = document.createElement('style');
    style.id = 'moscow-sans-font';
    style.innerHTML = `
    @font-face {
      font-family: 'Moscow Sans';
      src: url('./icons/moscowsansregular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Moscow Sans';
      src: url('./icons/moscowsansregular.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    `;
    document.head.appendChild(style);
}
const MOSCOW_SANS = "'Moscow Sans', 'YS Text', 'Inter', 'Arial', sans-serif";

const CONTAINER_SELECTOR = '[aria-labelledby="virtual-grid-header"]';
const TRACK_SELECTOR = '[data-index]';

window.__ym_tracks_collected = window.__ym_tracks_collected || new Set();
window.__ym_observer = window.__ym_observer || null;

let exportMenuVisible = false;

function extractTracksToSet(trackSet) {
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) return;
    container.querySelectorAll(TRACK_SELECTOR).forEach(card => {
        const trackLink = card.querySelector('a[aria-label^="Трек"]');
        let title = '';
        if (trackLink) {
            title = (trackLink.querySelector('span')?.textContent || '').trim();
            if (!title) {
                title = (trackLink.getAttribute('aria-label') || '').replace(/^Трек\s*/i, '').trim();
            }
        }
        const artistLinks = card.querySelectorAll('a[aria-label^="Артист"]');
        const artists = Array.from(artistLinks)
            .map(a => a.textContent.trim())
            .filter(Boolean)
            .join(', ');
        if (title && artists) {
            trackSet.add(`${title} — ${artists}`);
        }
    });
}

function showPopup(type, htmlText) {
    let color = "#fff", bg = "#232129", border = "#35323a", icon = "";
    if (type === "success") { color = "#caff70"; icon = "✓"; border = "#caff70"; }
    if (type === "error")   { color = "#ff6060"; icon = "⨯"; border = "#ff6060"; }
    if (type === "info")    { color = "#41aaff"; icon = "i"; border = "#41aaff"; }
    let popup = document.createElement("div");
    popup.innerHTML = `
      <div style="display:flex;align-items:center;gap:13px;">
        <span style="font-size:19px;font-weight:900;font-family:${MOSCOW_SANS};line-height:1.1;color:${color};background:#1a1b22;border-radius:50%;width:31px;height:31px;display:flex;align-items:center;justify-content:center;">${icon}</span>
        <span style="font-size:16px;font-family:${MOSCOW_SANS};font-weight:600;">${htmlText}</span>
      </div>
    `;
    popup.style.position = "fixed";
    popup.style.left = "50%";
    popup.style.top = "60px";
    popup.style.transform = "translateX(-50%) scale(0.95)";
    popup.style.background = bg;
    popup.style.color = color;
    popup.style.border = `1.5px solid ${border}`;
    popup.style.borderRadius = "15px";
    popup.style.padding = "13px 28px 13px 18px";
    popup.style.fontSize = "15px";
    popup.style.boxShadow = "0 7px 32px 0 rgba(0,0,0,.22), 0 1.5px 8px 0 rgba(0,0,0,.13)";
    popup.style.zIndex = 10001;
    popup.style.opacity = "0";
    popup.style.transition = "opacity 0.48s cubic-bezier(.46,1.4,.41,.92),transform 0.53s cubic-bezier(.67,1.2,.45,1)";
    popup.style.fontFamily = MOSCOW_SANS;
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.style.opacity = "1";
        popup.style.transform = "translateX(-50%) scale(1)";
    }, 20);
    setTimeout(() => {
        popup.style.opacity = "0";
        popup.style.transform = "translateX(-50%) scale(0.97)";
        setTimeout(() => document.body.removeChild(popup), 500);
    }, 1800);
}

function downloadTracksFromSet(trackSet) {
    const tracks = Array.from(trackSet);
    if (!tracks.length) {
        showPopup("error", "Треки не найдены! Прокрутите плейлист до конца и попробуйте ещё раз.");
        return;
    }
    const blob = new Blob([tracks.join("\n")], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tracks.txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 80);
    showPopup("success", `Сохранено ${tracks.length} треков`);
}

function startTrackObserver() {
    if (window.__ym_observer) {
        showPopup("info", "Слежение уже запущено");
        return;
    }
    extractTracksToSet(window.__ym_tracks_collected);
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) {
        showPopup("error", "Не найден плейлист");
        return;
    }
    window.__ym_observer = new MutationObserver(() => {
        extractTracksToSet(window.__ym_tracks_collected);
        updateCounter();
    });
    window.__ym_observer.observe(container, { childList: true, subtree: true });
    showPopup("success", "Слежение запущено!");
    updateCounter();
}
function stopTrackObserver() {
    if (window.__ym_observer) {
        window.__ym_observer.disconnect();
        window.__ym_observer = null;
    }
}
function resetTracks() {
    stopTrackObserver();
    window.__ym_tracks_collected = new Set();
    updateCounter();
    showPopup("info", "Список сброшен");
}
function updateCounter() {
    let counter = document.getElementById('ym-playlist-counter');
    if (!counter) return;
    counter.innerText = Array.from(window.__ym_tracks_collected).length;
}

function showInstruction() {
    if (document.getElementById("ym-playlist-save-panel")) return;

    const panel = document.createElement("div");
    panel.id = "ym-playlist-save-panel";
    panel.style.position = "fixed";
    panel.style.top = "30px";
    panel.style.right = "32px";
    panel.style.zIndex = "10000";
    panel.style.background = "#232129";
    panel.style.borderRadius = "16px";
    panel.style.boxShadow = "0 9px 32px 0 rgba(0,0,0,.22)";
    panel.style.padding = "24px 28px 18px 28px";
    panel.style.border = "1.5px solid #35323a";
    panel.style.maxWidth = "390px";
    panel.style.fontFamily = MOSCOW_SANS;
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.alignItems = "flex-start";
    panel.style.gap = "13px";
    panel.style.userSelect = "text";
    panel.style.transition = "box-shadow 0.33s";

    const h = document.createElement("div");
    h.innerHTML = `<span style="font-size: 19px; font-weight: 900; color: #fff; letter-spacing:0.07em;font-family:${MOSCOW_SANS}">Экспорт треков из плейлиста</span>`;
    panel.appendChild(h);

    const info = document.createElement("div");
    info.style.fontSize = "15.5px";
    info.style.color = "#e1e1e6";
    info.style.lineHeight = "1.7";
    info.style.fontFamily = MOSCOW_SANS;
    info.innerHTML =
        `<b style="color:#caff70;">Как сохранить все треки из плейлиста:</b>
        <ul style="margin:9px 0 0 18px;padding:0;line-height:1.8;font-size:14.6px;font-family:${MOSCOW_SANS}">
        <li><b>Старт слежения</b> — начнётся сбор треков.</li>
        <li><b>Плавно прокручивайте</b> плейлист до самого конца.<br>
        <span style="color:#999;font-size:13px;">(Не листайте слишком быстро — соберутся не все треки!)</span></li>
        <li>Дошли до конца — <b>нажмите «Сохранить»</b>.</li>
        <li>Хотите начать заново? <b>«Сброс»</b> — очистит всё.</li>
        </ul>
        <div style="margin-top:9px;color:#888;font-size:13px;font-family:${MOSCOW_SANS}">Треки добавляются автоматически, даже если они исчезают с экрана.</div>`;
    panel.appendChild(info);

    
    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.flexDirection = "column";
    btns.style.alignItems = "stretch";
    btns.style.gap = "10px";
    btns.style.width = "100%";
    btns.style.margin = "7px 0 0 0";

    function makeBtn(label, color, onClick, accent) {
        const btn = document.createElement("button");
        btn.innerText = label;
        btn.style.background = color;
        btn.style.color = accent ? "#232129" : "#fff";
        btn.style.fontFamily = MOSCOW_SANS;
        btn.style.fontSize = "16px";
        btn.style.fontWeight = 800;
        btn.style.border = "none";
        btn.style.borderRadius = "9px";
        btn.style.padding = "12px 0";
        btn.style.margin = "0";
        btn.style.boxShadow = accent
            ? "0 3px 14px 0 rgba(202,255,112,0.10)"
            : "0 1px 4px 0 rgba(0,0,0,.03)";
        btn.style.cursor = "pointer";
        btn.style.transition = "background 0.18s,box-shadow 0.18s,transform 0.13s";
        btn.style.letterSpacing = "0.04em";
        btn.onmouseenter = () => {
            btn.style.background = accent ? "#eafcbe" : "#35323a";
            btn.style.transform = "scale(1.04)";
        };
        btn.onmouseleave = () => {
            btn.style.background = color;
            btn.style.transform = "none";
        };
        btn.onclick = onClick;
        return btn;
    }

    btns.appendChild(makeBtn("Старт слежения", "#caff70", startTrackObserver, true));
    btns.appendChild(makeBtn("Сохранить", "#35323a", function () {
        stopTrackObserver();
        downloadTracksFromSet(window.__ym_tracks_collected);
    }, false));
    btns.appendChild(makeBtn("Сброс", "#35323a", resetTracks, false));
    panel.appendChild(btns);

    
    const counterWrap = document.createElement("div");
    counterWrap.style.marginTop = "10px";
    counterWrap.style.fontSize = "15px";
    counterWrap.style.color = "#caff70";
    counterWrap.style.fontFamily = MOSCOW_SANS;
    counterWrap.innerHTML =
        `<span style="opacity:0.7;">Собрано:</span> <span id="ym-playlist-counter" style="font-weight:900;font-size:17px;color:#caff70;">0</span>`;
    panel.appendChild(counterWrap);

    document.body.appendChild(panel);
    exportMenuVisible = true;
    updateCounter();
}


function ensureExportMenu(visible) {
    const exists = !!document.getElementById("ym-playlist-save-panel");
    if (visible && !exists) {
        showInstruction();
    } else if (!visible && exists) {
        document.getElementById("ym-playlist-save-panel").remove();
        exportMenuVisible = false;
    }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setExportMenuState') {
        ensureExportMenu(message.visible);
    }
    if (message.action === 'getExportMenuState') {
        sendResponse({ visible: exportMenuVisible });
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === "Escape" && exportMenuVisible) {
        ensureExportMenu(false);
    }
});