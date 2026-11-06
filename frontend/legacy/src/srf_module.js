const SRF_HOST = document.createElement('div'); SRF_HOST.id = 'srf-host';
const SRF_ROOT = SRF_HOST.attachShadow({ mode: 'open' });
SRF_ROOT.innerHTML = "<style>\n/* Layout: one ERP workbench. Sticky role bar; each role gets its working view. Corporate Finance view = settings console (section index | section | draft changes + impact). */\n:host{\n  --bg:#F3F5F8; --surface:#FFFFFF; --sunk:#EEF1F6; --ink:#1B2230; --muted:#5B6476; --line:#DCE1E9;\n  --accent:#2F4AA0; --accent-soft:#E5EAF8; --on-accent:#FFFFFF;\n  --good:#1D7448; --good-soft:#E2F2E9; --warn:#8F5B00; --warn-soft:#FBEFD8; --bad:#B0261E; --bad-soft:#FBE5E3;\n  --blue:#1F5FBF; --blue-soft:#E3EDFB; --orange:#A85400; --orange-soft:#FDEBD3; --grey:#5B6476; --grey-soft:#ECEFF3;\n  --f-ui:\"IBM Plex Sans\",system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --f-num:\"IBM Plex Mono\",ui-monospace,SFMono-Regular,Menlo,monospace;\n  --r:8px;\n}\n@media (prefers-color-scheme:dark){:host(:not([data-theme=\"light\"])){\n  --bg:#10141B; --surface:#171C25; --sunk:#1D2330; --ink:#E6E9EF; --muted:#9BA4B5; --line:#2A3140;\n  --accent:#8FA5F2; --accent-soft:#22305C; --on-accent:#0E1422;\n  --good:#6CCB98; --good-soft:#16321F; --warn:#E5B866; --warn-soft:#3A2B10; --bad:#F2897F; --bad-soft:#3C1B19; --blue:#8DB6F5; --blue-soft:#1B2C47; --orange:#F0B060; --orange-soft:#3A2810; --grey:#A3ACBC; --grey-soft:#262C38; color-scheme:dark}}\n:host([data-theme=\"dark\"]){\n  --bg:#10141B; --surface:#171C25; --sunk:#1D2330; --ink:#E6E9EF; --muted:#9BA4B5; --line:#2A3140;\n  --accent:#8FA5F2; --accent-soft:#22305C; --on-accent:#0E1422;\n  --good:#6CCB98; --good-soft:#16321F; --warn:#E5B866; --warn-soft:#3A2B10; --bad:#F2897F; --bad-soft:#3C1B19; --blue:#8DB6F5; --blue-soft:#1B2C47; --orange:#F0B060; --orange-soft:#3A2810; --grey:#A3ACBC; --grey-soft:#262C38; color-scheme:dark}\n*{box-sizing:border-box}\n:host{display:block;background:var(--bg);color:var(--ink);font-family:var(--f-ui);font-size:14px;line-height:1.45;border-radius:8px;overflow:hidden}\n\n.top{position:relative;z-index:1;background:var(--surface);border-bottom:1px solid var(--line)}\n.top-in,.main{max-width:1280px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}\n.top-in{display:flex;flex-wrap:wrap;align-items:center;gap:10px 20px;padding-block:10px;justify-content:space-between}\n.brand{display:flex;flex-direction:column}\n.brand b{font-size:15px;letter-spacing:.01em}\n.brand span{font-size:12px;color:var(--muted)}\n.roles{display:flex;gap:4px;flex-wrap:wrap}\n.roles button{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:6px 11px;border-radius:999px;font:inherit;font-size:13px;cursor:pointer;display:flex;gap:6px;align-items:center}\n.roles button[aria-pressed=\"true\"]{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}\n.cnt{font-family:var(--f-num);font-size:11px;background:var(--bad);color:#fff;border-radius:999px;padding:0 6px;min-width:18px;text-align:center}\n.roles button[aria-pressed=\"true\"] .cnt{background:var(--on-accent);color:var(--accent)}\n.main{padding-block:20px 48px;display:flex;flex-direction:column;gap:16px}\nh1{font-size:20px;margin:0;text-wrap:balance}\nh2{font-size:15px;margin:0}\nh3{font-size:12px;margin:0;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600}\n.sub,.lead{color:var(--muted);margin:2px 0 0;max-width:72ch}\n.row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}\n.grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;align-items:start}\n@media (max-width:900px){.grid{grid-template-columns:minmax(0,1fr)}}\n.cp{display:grid;grid-template-columns:200px minmax(0,1fr) 300px;gap:16px;align-items:start}\n@media (max-width:1080px){.cp{grid-template-columns:minmax(0,1fr) 290px}.cpnav{grid-column:1/-1}}\n@media (max-width:760px){.cp{grid-template-columns:minmax(0,1fr)}}\n.panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0}\n.rail{position:sticky;top:calc(env(safe-area-inset-top,0px) + 76px)}\n@media (max-width:900px){.rail{position:static}}\n.cp2{display:grid;grid-template-columns:210px minmax(0,1fr);gap:16px;align-items:start}\n@media (max-width:1080px){.cp2{grid-template-columns:minmax(0,1fr)}}\n.who{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}\n.who select{font-size:13px;padding:4px 6px;max-width:100%;min-width:0}\n.roles{align-items:center}.roles>.pill{align-self:center}\n@media (max-width:640px){.top-in{gap:8px}.roles{width:100%}.who{flex:1 1 100%;min-width:0}.who select{flex:1;width:100%}.roles button{padding:5px 10px}}\ntd.na{color:var(--muted);text-align:center}\n.sp{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:2px 10px 2px 8px;border-radius:999px;white-space:nowrap}\n.sp::before{content:\"\";width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}\n.sp-grey{background:var(--grey-soft);color:var(--grey)}.sp-blue{background:var(--blue-soft);color:var(--blue)}.sp-orange{background:var(--orange-soft);color:var(--orange)}.sp-green{background:var(--good-soft);color:var(--good)}.sp-red{background:var(--bad-soft);color:var(--bad)}\n.tip{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;border:1px solid var(--muted);color:var(--muted);font-size:11px;font-weight:600;cursor:help;position:relative;margin-left:4px;vertical-align:middle;text-transform:none;letter-spacing:0}\n.tip:hover::after,.tip:focus::after{content:attr(data-tip);position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);background:var(--ink);color:var(--bg);font-weight:400;font-size:12px;line-height:1.4;padding:7px 9px;border-radius:6px;width:max-content;max-width:240px;z-index:30;white-space:normal;text-align:left}\n.av{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:10.5px;font-weight:600;flex:none;margin-right:6px;vertical-align:middle;font-family:var(--f-ui)}\n.chip2 .av{width:20px;height:20px;font-size:9.5px;margin:0 0 0 -6px}\n.who-line{display:flex;align-items:center}\n.hello{font-size:22px}\n.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}\n.card2{font:inherit;color:var(--ink);text-align:left;cursor:pointer;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}\n.card2:hover{border-color:var(--accent)}.card2[aria-pressed=\"true\"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}\n.card2 .big{font-size:28px;line-height:1.1;font-weight:600;font-family:var(--f-num)}\n.actions{display:flex;gap:10px 16px;flex-wrap:wrap;justify-content:space-between;align-items:center}\n.btn.lg{padding:10px 18px;font-size:14px}\n.steps{display:flex;gap:8px;list-style:none;margin:0;padding:0 0 4px;overflow-x:auto}\n.steps button{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:5px 14px 5px 5px;font:inherit;font-size:13px;color:var(--muted);cursor:pointer;white-space:nowrap}\n.steps .n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--sunk);font-weight:600;font-size:12px;font-family:var(--f-num)}\n.steps [aria-current=\"step\"]{border-color:var(--accent);color:var(--ink);font-weight:600}.steps [aria-current=\"step\"] .n{background:var(--accent);color:var(--on-accent)}\n.steps .done{color:var(--ink)}.steps .done .n{background:var(--good-soft);color:var(--good)}\n.wz h2{font-size:16px;display:flex;align-items:center;gap:4px}\n.wznav{border-top:1px solid var(--line);padding-top:12px}\n.pick{display:flex;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:8px;cursor:pointer;background:var(--surface)}\n.pick.sel{border-color:var(--accent);background:var(--accent-soft)}.pick input{width:18px;height:18px;flex:none}\n.stu{border:1px solid var(--line);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--surface)}\n.rolerow{display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;align-items:start;padding:8px 0;border-top:1px solid var(--line)}\n@media (max-width:600px){.rolerow{grid-template-columns:minmax(0,1fr)}}\n.chip2{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--sunk);border-radius:999px;padding:3px 4px 3px 10px;font-size:13px}\n.chip2.badc{border-color:var(--bad);background:var(--bad-soft)}\n.chip2 button{border:0;background:none;color:var(--muted);cursor:pointer;font:inherit;font-size:15px;line-height:1;padding:0 6px}\n.chips select{max-width:240px}\n.two{display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;align-items:start}\n@media (max-width:900px){.two{grid-template-columns:minmax(0,1fr)}}\nul.plain.bad{color:var(--bad)}\ndetails summary{cursor:pointer;color:var(--accent);font-size:13px}\n.fs{border:0;padding:0;margin:0;min-width:0;display:flex;flex-direction:column;gap:12px}\n.cpmore{padding:7px 10px;color:var(--muted);font-size:13px}\n.spec{max-width:900px;display:flex;flex-direction:column;gap:28px}\n.spec section{display:flex;flex-direction:column;gap:10px;scroll-margin-top:calc(env(safe-area-inset-top,0px) + 80px)}\n.spec h2{font-size:17px;margin:0;padding-top:6px;border-top:1px solid var(--line)}\n.spec section:first-child h2{border-top:0;padding-top:0}\n.spec h3{margin-top:6px}\n.spec p,.spec li{max-width:76ch;margin:0}\n.spec ul,.spec ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px}\n.spec td{white-space:normal;min-width:90px}\n.spec code{font-family:var(--f-num);font-size:12px}\n.spec .dia{border:1px solid var(--line);padding:8px;background:var(--surface)}\n.spec .dia svg{display:block;width:100%;min-width:640px;height:auto}\n.top .specbtn[aria-pressed=\"true\"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}\n.cpnav{position:sticky;top:calc(env(safe-area-inset-top,0px) + 76px);display:flex;flex-direction:column;gap:2px}\n@media (max-width:1080px){.cp2 .cpnav,.cpnav{position:static;flex-direction:row;overflow-x:auto;padding-bottom:4px}}\n.cpnav button{font:inherit;font-size:13px;text-align:left;background:none;border:0;border-radius:6px;padding:7px 10px;color:var(--muted);cursor:pointer;display:flex;justify-content:space-between;gap:8px;white-space:nowrap}\n.cpnav button[aria-current=\"true\"]{background:var(--accent-soft);color:var(--accent);font-weight:600}\n.cpnav .dot{width:7px;height:7px;border-radius:50%;background:var(--warn);align-self:center}\n.cpnav hr{border:0;border-top:1px solid var(--line);margin:6px 0;width:100%}\nlabel.f{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)}\ninput,select,textarea{font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:6px 8px;min-width:0}\ninput[type=number]{width:96px;font-family:var(--f-num)}\ntextarea{width:100%;min-height:56px;resize:vertical}\ninput:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n.chg{border-color:var(--warn)!important;background:var(--warn-soft)}\n.btn{font:inherit;font-size:13px;font-weight:500;border-radius:6px;padding:7px 12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer}\n.btn:hover:not(:disabled){border-color:var(--accent)}\n.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}\n.btn.bad{color:var(--bad);border-color:var(--bad)}\n.btn.sm{padding:3px 8px;font-size:12px}\n.btn:disabled{opacity:.45;cursor:not-allowed}\n.tw{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r)}\ntable{border-collapse:collapse;width:100%;font-size:13px}\nth,td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top;white-space:nowrap}\nth{background:var(--sunk);font-weight:600;font-size:12px;color:var(--muted)}\ntr:last-child td{border-bottom:0}\ntd.n,th.n{text-align:right}\n.num,td.n{font-family:var(--f-num);font-variant-numeric:tabular-nums}\ntr.tot td{font-weight:600;background:var(--sunk)}\ntr.off td{color:var(--muted)}\n.pill{display:inline-block;font-size:11.5px;font-weight:500;padding:1px 8px;border-radius:999px;background:var(--sunk);color:var(--muted);white-space:nowrap}\n.pill.good{background:var(--good-soft);color:var(--good)}\n.pill.warn{background:var(--warn-soft);color:var(--warn)}\n.pill.bad{background:var(--bad-soft);color:var(--bad)}\n.pill.acc{background:var(--accent-soft);color:var(--accent)}\n.adm{border:1px solid var(--line);border-radius:var(--r);overflow:hidden}\n.adm-h{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--sunk)}\n.adm-h b{font-family:var(--f-num);font-weight:500}\n.roles-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:12px}\n.role{border:1px dashed var(--line);border-radius:6px;padding:8px 10px;display:flex;flex-direction:column;gap:6px;min-width:0}\n.role-h{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--muted)}\n.role-h strong{color:var(--ink);font-size:13px}\n.chk{display:flex;gap:6px;align-items:flex-start;font-size:13px}\n.chk.dis{color:var(--muted)}\n.id{font-family:var(--f-num);font-size:11.5px;color:var(--muted)}\n.kv{display:grid;grid-template-columns:1fr auto;gap:6px 12px;font-size:13px;margin:0}\n.kv dt{color:var(--muted)} .kv dd{margin:0;text-align:right;font-family:var(--f-num);font-variant-numeric:tabular-nums}\n.kv .big{font-size:16px;font-weight:600;color:var(--ink)}\n.bar{height:6px;border-radius:3px;background:var(--sunk);overflow:hidden}\n.bar i{display:block;height:100%;background:var(--accent)}\n.bar i.over{background:var(--bad)}\n.msg{font-size:12.5px;padding:8px 10px;border-radius:6px;background:var(--warn-soft);color:var(--warn)}\n.msg.bad{background:var(--bad-soft);color:var(--bad)}\n.msg.good{background:var(--good-soft);color:var(--good)}\n.msg.info{background:var(--accent-soft);color:var(--accent)}\nul.plain{margin:0;padding-left:18px;font-size:12.5px;color:var(--muted)}\n.tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);flex-wrap:wrap}\n.tabs button{font:inherit;font-size:13px;background:none;border:0;border-bottom:2px solid transparent;padding:8px 12px;color:var(--muted);cursor:pointer}\n.tabs button[aria-selected=\"true\"]{color:var(--ink);border-bottom-color:var(--accent);font-weight:600}\n.queue{display:flex;flex-direction:column;gap:6px}\n.qi{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--surface);cursor:pointer;text-align:left;font:inherit;color:var(--ink);width:100%}\n.qi[aria-current=\"true\"]{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent)}\n.checks{display:flex;flex-wrap:wrap;gap:4px}\n.sw{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)}\n.sw:last-child{border-bottom:0}\n.sw input{margin-top:3px}\n.sw b{display:block;font-weight:500}.sw span{font-size:12.5px;color:var(--muted)}\n.opt{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}\n.card{border:1px solid var(--line);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px}\n.chips{display:flex;flex-wrap:wrap;gap:6px}\n.chipx{display:inline-flex;gap:4px;align-items:center;font-size:12.5px;border:1px solid var(--line);border-radius:999px;padding:2px 4px 2px 10px}\n.chipx button{border:0;background:none;color:var(--muted);cursor:pointer;font:inherit;padding:0 4px}\nul.diff{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:12.5px;max-height:240px;overflow:auto}\nul.diff li{border-left:3px solid var(--warn);padding:2px 0 2px 8px}\nul.diff s{color:var(--muted)}\n.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));background:var(--ink);color:var(--bg);padding:9px 14px;border-radius:6px;font-size:13px;z-index:20;max-width:calc(100% - 32px)}\n.foot{font-size:12px;color:var(--muted);max-width:90ch}\n.empty{color:var(--muted);font-size:13px;padding:12px;text-align:center;border:1px dashed var(--line);border-radius:6px}\n@media (prefers-reduced-motion:no-preference){.btn,.qi{transition:border-color .15s}}\n\n/* ===== Enterprise redesign (Redwood-inspired): warm neutrals, dark global header, tab strip, dark CTAs, train steps ===== */\n:root{\n  --bg:#F5F4F2; --surface:#FFFFFF; --sunk:#F1EFED; --ink:#161513; --muted:#655F5A; --line:#E0DCD7;\n  --accent:#227E9E; --accent-soft:#E4F1F5; --on-accent:#FFFFFF;\n  --cta:#312D2A; --on-cta:#FFFFFF; --hdr:#312D2A; --hdr-ink:#FFFFFF; --hdr-muted:#CFC9C3; --hdr-line:#4A4541;\n  --good:#3F7A1E; --good-soft:#EAF3E2; --warn:#9A5A08; --warn-soft:#FCF0DE; --bad:#B8402F; --bad-soft:#FBE8E5;\n  --blue:#1F6E8C; --blue-soft:#E2F0F5; --orange:#A25A08; --orange-soft:#FCEEDB; --grey:#655F5A; --grey-soft:#EFECE9;\n  --f-ui:\"Inter\",system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif; --f-num:var(--f-ui);\n  --r:6px; --sh:0 1px 2px rgba(22,21,19,.06),0 1px 4px rgba(22,21,19,.04);\n}\n@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){\n  --bg:#1C1A18; --surface:#262320; --sunk:#2E2B28; --ink:#F1EFED; --muted:#B3ACA5; --line:#3D3935;\n  --accent:#6BBCD8; --accent-soft:#1E3A44; --on-accent:#10181B; --cta:#F1EFED; --on-cta:#161513; --hdr:#121110; --hdr-ink:#F1EFED; --hdr-muted:#A8A19A; --hdr-line:#34302C;\n  --good:#8BC76A; --good-soft:#20311A; --warn:#E6B266; --warn-soft:#3A2A12; --bad:#F08C7C; --bad-soft:#3E1F1A; --blue:#7CC2DC; --blue-soft:#1A3139; --orange:#EDB06A; --orange-soft:#3A2913; --grey:#B3ACA5; --grey-soft:#33302C; --sh:none}}\n:root[data-theme=\"dark\"]{\n  --bg:#1C1A18; --surface:#262320; --sunk:#2E2B28; --ink:#F1EFED; --muted:#B3ACA5; --line:#3D3935;\n  --accent:#6BBCD8; --accent-soft:#1E3A44; --on-accent:#10181B; --cta:#F1EFED; --on-cta:#161513; --hdr:#121110; --hdr-ink:#F1EFED; --hdr-muted:#A8A19A; --hdr-line:#34302C;\n  --good:#8BC76A; --good-soft:#20311A; --warn:#E6B266; --warn-soft:#3A2A12; --bad:#F08C7C; --bad-soft:#3E1F1A; --blue:#7CC2DC; --blue-soft:#1A3139; --orange:#EDB06A; --orange-soft:#3A2913; --grey:#B3ACA5; --grey-soft:#33302C; --sh:none}\nbody{margin:0;font-feature-settings:\"tnum\" 1,\"cv11\" 1;-webkit-font-smoothing:antialiased}\n.card2 .sp{max-width:100%;white-space:normal}\n.fcbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:4px;background:var(--surface);font-size:13px;color:var(--muted)}\n.fcbar b{color:var(--ink)}\ntr.editing td{background:var(--accent-soft)}\n.awacts{display:flex;flex-direction:column;gap:4px;align-items:stretch}\n@media (max-width:640px){.awacts{flex-direction:row;flex-wrap:wrap}}\ntable.stack td:first-child{white-space:normal;min-width:150px}\n@media (max-width:640px){table.stack thead{display:none}table.stack,table.stack tbody,table.stack tr,table.stack td{display:block;width:100%}\n  table.stack tr{border-bottom:1px solid var(--line);padding:8px 0}table.stack td{border:0;padding:4px 12px;white-space:normal!important;min-width:0!important}\n  table.stack td[data-l]::before{content:attr(data-l);display:block;font-size:11.5px;color:var(--muted);font-weight:600}\n  table.stack td .row{flex-wrap:wrap!important}}\n@media (max-width:1080px){.cp2 .cpnav{flex-wrap:wrap;overflow:visible;gap:6px;padding-bottom:0}\n  .cp2 .cpnav>button,.cp2 .cpnav details>button{border:1px solid var(--line);border-left-width:1px;border-radius:4px;background:var(--surface);padding:6px 10px;white-space:nowrap}\n  .cp2 .cpnav>button[aria-current=\"true\"],.cp2 .cpnav details>button[aria-current=\"true\"]{border-color:var(--accent);background:var(--accent-soft);color:var(--ink)}\n  .cp2 .cpnav details{display:contents}.cp2 .cpnav details>summary{flex-basis:100%;padding:4px 2px}}\n\n.top{background:var(--surface);border-bottom:1px solid var(--line);box-shadow:var(--sh)}\n.gh{background:var(--hdr);color:var(--hdr-ink)}\n.gh .top-in{padding-block:8px;min-height:52px}\n.brand{flex-direction:row;align-items:center;gap:10px}\n.brand>div{display:flex;flex-direction:column}\n.brand b{font-size:16px;font-weight:600;letter-spacing:0}\n.brand span#brandsub{color:var(--hdr-muted);font-size:12px}\n.mark{display:grid;place-items:center;width:32px;height:32px;border-radius:4px;background:var(--hdr-ink);color:var(--hdr);font-weight:700;font-size:12px;letter-spacing:.02em;flex:none}\n.ghr{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;min-width:0}\n.ghr .who{color:var(--hdr-muted)}\n.ghr .who select{background:transparent;color:var(--hdr-ink);border:1px solid var(--hdr-line);border-radius:4px;padding:5px 8px}\n.ghr .who select option{color:#161513;background:#fff}\n.ghr .av{background:var(--hdr-ink);color:var(--hdr);width:28px;height:28px;font-size:11px}\n.ghr .pill.acc{background:transparent;border:1px solid var(--hdr-line);color:var(--hdr-ink);font-size:12px;padding:3px 10px}\n.ghr .specbtn{font:inherit;font-size:13px;background:transparent;color:var(--hdr-ink);border:1px solid var(--hdr-line);border-radius:4px;padding:6px 12px;cursor:pointer}\n.ghr .specbtn:hover{background:rgba(255,255,255,.08)}\n.ghr .specbtn[aria-pressed=\"true\"]{background:var(--hdr-ink);color:var(--hdr);border-color:var(--hdr-ink)}\n.ghr :focus-visible{outline-color:var(--hdr-ink)}\n.navbar{background:var(--surface)}\n.navbar .top-in{display:flex;flex-wrap:nowrap;gap:0;padding-block:0;overflow-x:auto;scrollbar-width:thin;justify-content:flex-start}\n.roles button{border:0;border-radius:0;background:none;color:var(--muted);padding:13px 14px 11px;border-bottom:3px solid transparent;font-size:14px;font-weight:500;white-space:nowrap}\n.roles button:hover{color:var(--ink);background:var(--sunk)}\n.roles button[aria-pressed=\"true\"]{background:none;color:var(--ink);border-bottom-color:var(--accent);font-weight:600}\n.cnt{background:var(--bad);font-family:var(--f-ui);font-weight:600}\n.roles button[aria-pressed=\"true\"] .cnt{background:var(--bad);color:#fff}\n.main{padding-block:24px 48px}\nh1{font-size:22px;font-weight:600;letter-spacing:-.005em}\nh2{font-size:16px;font-weight:600}\nh3{letter-spacing:.04em;font-size:11.5px}\n.hello{font-size:24px;font-weight:600}\n.panel{border-radius:var(--r);box-shadow:var(--sh);padding:20px}\n.rail,.cpnav{top:calc(env(safe-area-inset-top,0px) + 112px)}\n.card2{border-radius:var(--r);box-shadow:var(--sh);padding:16px;border-top:3px solid var(--line)}\n.card2:hover{border-color:var(--line);border-top-color:var(--accent)}\n.card2[aria-pressed=\"true\"]{border-color:var(--line);border-top-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}\n.card2 .big{font-size:30px;font-weight:600}\n.btn{border-radius:4px;padding:8px 14px;font-weight:600;border-color:var(--ink);color:var(--ink);background:var(--surface)}\n.btn:hover:not(:disabled){background:var(--sunk);border-color:var(--ink)}\n.btn.pri{background:var(--cta);border-color:var(--cta);color:var(--on-cta)}\n.btn.pri:hover:not(:disabled){background:var(--cta);opacity:.88;border-color:var(--cta)}\n.btn.bad{color:var(--bad);border-color:var(--bad)}\n.btn.bad:hover:not(:disabled){background:var(--bad-soft);border-color:var(--bad)}\n.btn.sm{padding:4px 10px}\n.btn.lg{padding:11px 20px}\ninput,select,textarea{border-radius:4px;border-color:#B9B3AD;padding:7px 9px}\n:root[data-theme=\"dark\"] input,:root[data-theme=\"dark\"] select,:root[data-theme=\"dark\"] textarea{border-color:#5A544F}\n@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]) input,:root:not([data-theme=\"light\"]) select,:root:not([data-theme=\"light\"]) textarea{border-color:#5A544F}}\ninput:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:0;border-color:var(--accent)}\nlabel.f{font-weight:500;color:var(--muted)}\n.tw{border-radius:var(--r);background:var(--surface)}\nth{background:var(--sunk);color:var(--ink);font-weight:600;font-size:12.5px;border-bottom:1px solid #CFC9C3;padding:9px 12px}\ntd{padding:9px 12px}\ntbody tr:hover td{background:color-mix(in srgb,var(--accent-soft) 45%,transparent)}\n.sp{border-radius:4px;font-weight:600;padding:3px 9px 3px 8px}\n.pill{border-radius:4px}\n.tabs{gap:0}\n.tabs button{border-bottom-width:3px;padding:10px 14px;font-size:14px}\n.tabs button:hover{color:var(--ink)}\n.qi{border-radius:var(--r)}\n.qi[aria-current=\"true\"]{box-shadow:inset 4px 0 0 var(--accent)}\n.pick,.stu,.card{border-radius:var(--r)}\n.chip2,.chipx{border-radius:4px}\n.msg{border-radius:4px;border-left:4px solid currentColor}\n.cpnav button{border-radius:0;border-left:3px solid transparent}\n.cpnav button[aria-current=\"true\"]{background:var(--accent-soft);color:var(--ink);border-left-color:var(--accent)}\n.toast{border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.2)}\n/* Wizard as a train: numbered stops joined by a line */\n.steps{gap:0;padding:4px 0 8px;counter-reset:none}\n.steps li{flex:1 1 0;min-width:96px;position:relative}\n.steps li+li::before{content:\"\";position:absolute;top:17px;right:calc(50% + 18px);left:calc(-50% + 18px);height:2px;background:var(--line)}\n.steps li:has(.done)+li::before,.steps li:has(.done)::before{background:var(--accent)}\n.steps button{flex-direction:column;gap:6px;width:100%;border:0;background:none;border-radius:0;padding:2px 4px;font-size:12.5px;white-space:normal;text-align:center}\n.steps .n{width:32px;height:32px;border:2px solid var(--line);background:var(--surface);font-size:13px;color:var(--muted)}\n.steps [aria-current=\"step\"]{color:var(--ink)}\n.steps [aria-current=\"step\"] .n{background:var(--accent);border-color:var(--accent);color:var(--on-accent);box-shadow:0 0 0 4px var(--accent-soft)}\n.steps .done .n{background:var(--surface);border-color:var(--accent);color:var(--accent)}\n@media (max-width:640px){\n  .gh .top-in{gap:8px}.ghr{width:100%}.ghr .who{flex:1 1 100%}.ghr .who select{flex:1;width:100%}\n  .ghr .wl{display:none}.roles{width:auto}.roles button{padding:12px 11px 10px;font-size:13px}\n  .steps li{min-width:64px}.steps button{font-size:11.5px}\n}\n\n.top .gh{display:none}.navbar{display:none}\n.srf-strip{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--surface);border-bottom:1px solid var(--line);font-size:12.5px;color:var(--muted)}\n.srf-strip #ghr{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px 14px}.srf-strip .who{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--ink)}.srf-strip select{font:inherit;padding:3px 6px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--ink)}\n.srf-strip .specbtn{font:inherit;background:none;border:1px solid var(--line);border-radius:6px;padding:3px 8px;color:var(--ink);cursor:pointer}\n.main{padding:0 0 24px}\n.top{border:1px solid var(--line);border-radius:var(--r);margin-bottom:12px;background:var(--surface)}.top .srf-strip{padding:8px 14px}\n.hello{font-size:18px;font-weight:600;margin:0 0 2px}.actions .sub{margin:0}.actions .id{margin:2px 0 0}\n.cards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:12px 0 16px}.card2{text-align:left;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}.card2 .big{font-size:24px;font-weight:700;letter-spacing:-.01em;display:block;margin:4px 0 2px}.card2 .id{font-size:12px;color:var(--muted)}\n.panel{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:14px}\n@media (max-width:980px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}\n/* phones: tables with up to 8 columns become stacked cards (labels come from the header via data-h, set by the bridge after each render) */\n.ratebox{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}.ratebox select{min-width:110px}\n@media (max-width:700px){\n  .hide-m,.tw table.stack td.hide-m{display:none}\n  .tw table.stack{display:block;border:0}.tw table.stack thead{display:none}.tw table.stack tbody{display:block}\n  .tw table.stack tr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;padding:10px 12px;border-bottom:1px solid var(--line)}\n  .tw table.stack td{display:block;padding:0;border:0;min-width:0;overflow-wrap:anywhere}.tw table.stack td.n{text-align:left}\n  .tw table.stack td[data-h]:not([data-h=\"\"])::before{content:attr(data-h);display:block;font-size:11px;color:var(--muted);margin-bottom:1px}\n  .tw table.stack td.full,.tw table.stack td:first-child,.tw table.stack td[data-h=\"\"]{grid-column:1 / -1}\n  .tw table.stack td[data-h=\"\"]{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}\n  .tw table.stack td:first-child{font-weight:600}\n  .tw table.stack tr.tot,.tw table.stack tfoot{display:none}\n}\n/* Uniform look: take the Fee Desk theme tokens (light/dark) and fonts instead of the module's own palette */\n:host, :host([data-theme=\"dark\"]), :host(:not([data-theme=\"light\"])) { --bg: var(--fd-bg); --surface: var(--fd-surface); --sunk: var(--fd-surface-2); --ink: var(--fd-ink); --muted: var(--fd-ink-2); --line: var(--fd-line); --accent: var(--fd-accent); --accent-soft: var(--fd-accent-soft); --on-accent: var(--fd-accent-ink); --good: var(--fd-good); --good-soft: var(--fd-good-soft); --warn: var(--fd-warn); --warn-soft: var(--fd-warn-soft); --bad: var(--fd-bad); --bad-soft: var(--fd-bad-soft); --f-ui: var(--fd-f-body); --f-num: var(--fd-f-body); --r: 8px; font-size: 14px; }\n:host h1, :host h2.h1, :host .hello h1 { font-family: var(--fd-f-display); font-weight: 600; letter-spacing: -.01em; }\n</style><header class=\"top\"><div class=\"srf-strip\"><span id=\"brandsub\"></span><span id=\"ghr\"></span></div><nav class=\"navbar\" aria-label=\"Screens\"><div class=\"top-in roles\" id=\"roles\"></div></nav></header><main class=\"main\" id=\"app\"></main><div class=\"toast\" id=\"toast\" hidden></div><template id=\"spec-tpl\">\n<section id=\"sp1\"><h2>1. Purpose and scope</h2>\n<p>The SRF module replaces all branch SRF Excel sheets with one ERP workflow. It covers Principal submission, verification, HR payment, Corporate Finance policy and a separate System Admin Control Center, with every step audited. This specification consolidates the original requirement, the functional specification, the technical design and every control added since.</p>\n<p><b>In scope:</b> SRF eligibility from Admissions and Fee Collection, branch-wise staff assignment from HRMS, submission, two-level verification, payment via payroll or bank, refund and recovery, policy configuration with dated versions, logins and role permissions, branch, region and zone masters, reports and audit logs.</p>\n<p><b>Out of scope:</b> the fee collection screen, payroll calculation and HRMS data entry. SRF reads these systems and never writes back, except the payroll earning and deduction feed.</p>\n<div class=\"tw\"><table><thead><tr><th>Term</th><th>Meaning</th></tr></thead><tbody>\n<tr><td>SRF</td><td>Seat Reservation Fee collected from a student at new admission</td></tr>\n<tr><td>SRF incentive</td><td>Amount paid to eligible staff out of SRF by Corporate Office; never a branch expense</td></tr>\n<tr><td>Incentive line</td><td>One employee \u00d7 one role \u00d7 one admission; the unit verified, paid, held or recovered</td></tr>\n<tr><td>Submission</td><td>A Principal's batch of eligible admissions for one branch and period</td></tr>\n<tr><td>Sadqa</td><td>A non-staff deduction from SRF, posted to its own ledger</td></tr>\n<tr><td>SRF balance</td><td>SRF collected \u2212 staff incentive \u2212 non-staff deductions</td></tr>\n<tr><td>Policy version</td><td>A dated rule set; each admission uses the version effective on its receipt date</td></tr>\n<tr><td>Posting</td><td>An employee's branch mapping in HRMS for a date range</td></tr>\n<tr><td>Data scope</td><td>The branches a login can see: specific branches, zones, regions or corporate-wide</td></tr>\n<tr><td>Active role</td><td>The role a multi-role user is acting in; recorded on every action</td></tr>\n</tbody></table></div></section>\n\n<section id=\"sp2\"><h2>2. Roles and separation of duties</h2>\n<p>Seven roles, each with its own permissions. System Admin and Corporate Finance are completely separate, and neither gains the other's rights automatically.</p>\n<div class=\"tw\"><table><thead><tr><th>Role</th><th>Main responsibility</th><th>Must not control</th></tr></thead><tbody>\n<tr><td>Principal</td><td>Create and submit SRF requests for mapped branches only; track their status</td><td>Other branches' data, policy, verification, payment</td></tr>\n<tr><td>Accounts / Finance Verifier</td><td>Level 1 verification of SRF collection and eligible claims</td><td>User access, logins, policy, payment</td></tr>\n<tr><td>Corporate Finance</td><td>SRF policy, rates, effective dates, limits; verification and level 2 approval; reversal approval; finance reports and finance audit trail</td><td>Logins, password resets, role permissions, Principal-to-branch mapping, System Admin controls</td></tr>\n<tr><td>HR</td><td>Create payment batches, mark paid, hold, request reversal, settle recovery</td><td>Policy, verification, system access</td></tr>\n<tr><td>System Admin</td><td>Logins, user access, branch and HRMS mapping, permissions, workflow routing, notifications, locks, audit logs</td><td>SRF rates, verification, payment approval</td></tr>\n<tr><td>Auditor</td><td>Read and download everything, including all audit logs</td><td>Any change</td></tr>\n<tr><td>Management</td><td>Read and download reports and dashboards</td><td>Any change</td></tr>\n</tbody></table></div>\n<h3>Default permissions</h3>\n<div class=\"tw\"><table><thead><tr><th>Role</th><th>SRF submission</th><th>Verification</th><th>HR payment</th><th>Finance policy</th><th>Reports</th><th>Audit logs</th><th>System Admin</th></tr></thead><tbody>\n<tr><td>Principal</td><td>View, Create, Edit, Submit, Download</td><td>\u2013</td><td>\u2013</td><td>\u2013</td><td>View, Download</td><td>\u2013</td><td>\u2013</td></tr>\n<tr><td>Accounts</td><td>\u2013</td><td>View, Verify, Download</td><td>View</td><td>\u2013</td><td>View, Download</td><td>\u2013</td><td>\u2013</td></tr>\n<tr><td>HR</td><td>\u2013</td><td>View</td><td>View, Create, Pay, Reverse, Download</td><td>\u2013</td><td>View, Download</td><td>\u2013</td><td>\u2013</td></tr>\n<tr><td>Corporate Finance</td><td>\u2013</td><td>View, Verify, Approve, Download</td><td>View, Approve</td><td>View, Create, Edit, Approve</td><td>View, Download</td><td>View, Download (finance only)</td><td>\u2013</td></tr>\n<tr><td>System Admin</td><td>\u2013</td><td>\u2013</td><td>\u2013</td><td>\u2013</td><td>\u2013</td><td>View, Download</td><td>View, Edit, Admin</td></tr>\n<tr><td>Auditor</td><td>View</td><td>View, Download</td><td>View, Download</td><td>View</td><td>View, Download</td><td>View, Download</td><td>\u2013</td></tr>\n<tr><td>Management</td><td>\u2013</td><td>\u2013</td><td>\u2013</td><td>\u2013</td><td>View, Download</td><td>\u2013</td><td>\u2013</td></tr>\n</tbody></table></div>\n<h3>Rules that cannot be overridden</h3>\n<p>Hard-coded separation-of-duties locks. The permission screen shows them as <b>SoD</b> and will not grant them.</p>\n<ul>\n<li>Only System Admin can open the System Admin Control Center.</li>\n<li>System Admin can never create, edit, submit, verify, approve, pay or reverse anything on the submission, verification, payment or policy screens.</li>\n<li>Only Principals create and submit SRF requests.</li>\n<li>Only Accounts and Corporate Finance verify; only Corporate Finance gives level 2 approval.</li>\n<li>Only HR creates batches, pays and requests reversals; only Corporate Finance approves reversals.</li>\n<li>Only Corporate Finance edits or publishes SRF policy.</li>\n<li>Auditor and Management are read-only.</li>\n<li>No user verifies or approves their own submission, approves their own incentive line, releases a batch containing their own payment, or approves a reversal they requested.</li>\n<li>One person may hold two roles only with a management authorisation reference on the login; every action records the active role used.</li>\n</ul></section>\n\n<section id=\"sp3\"><h2>3. Logins, data scope and Principal access</h2>\n<p>Every user has a personal login mapped to an HRMS employee ID. What they see is the intersection of their role permissions and their data scope.</p>\n<div class=\"tw\"><table><thead><tr><th>Field</th><th>Rule</th></tr></thead><tbody>\n<tr><td>Login</td><td>3\u201330 lowercase letters, digits or dots; unique</td></tr>\n<tr><td>Name, employee ID</td><td>From HRMS. A Principal's ID must be an active HRMS employee with designation Principal or Vice Principal</td></tr>\n<tr><td>Roles</td><td>One or more; more than one needs a management authorisation reference</td></tr>\n<tr><td>Data scope</td><td>Specific branches, zones, regions or corporate-wide. A Principal can only have specific branches</td></tr>\n<tr><td>Region, zone</td><td>Derived from the mapped branches, never typed</td></tr>\n<tr><td>Status</td><td>Active or Inactive</td></tr>\n<tr><td>Temporary password</td><td>Set on creation and on reset; the user must set their own at next sign-in before anything else is available</td></tr>\n</tbody></table></div>\n<h3>Sign-in behaviour</h3>\n<ul><li>A deactivated login is refused at once; the attempt is logged and System Admin is notified. Historical audit records are unaffected.</li>\n<li>A user with more than one role chooses an active role; switching is logged.</li>\n<li>Only screens the active role can view appear; buttons for actions the role lacks are disabled, and the service refuses them too.</li></ul>\n<h3>Principal branch access</h3>\n<ul><li>Branch selection defaults to the Principal's mapped branch; if more than one is mapped, only those appear.</li>\n<li>Receipts, staff, submissions, reports and downloads are limited to mapped branches. Data of any other branch cannot be seen, searched, edited, downloaded or submitted.</li>\n<li>Only staff mapped to the selected branch in HRMS can be assigned (section 5.2).</li>\n<li>A submitted request cannot be changed; it can be revised only after it is returned for correction.</li></ul></section>\n\n<section id=\"sp4\"><h2>4. Workflow and statuses</h2>\n<p>Status is tracked per submission through verification and per incentive line through payment, so a partly approved submission can pay some lines while others are held.</p>\n<div class=\"tw dia\">{{WF}}</div>\n<p>Red boxes are terminal or problem states. A receipt refunded or cancelled after verification moves unpaid lines to hold (or cancels them) and paid lines to Recovery Required, as the published refund rule says. System Admin can lock any submission, which stops every action on it until unlocked.</p>\n<div class=\"tw\"><table><thead><tr><th>Principal sees</th><th>System status</th></tr></thead><tbody>\n<tr><td>Draft</td><td>Saved, not submitted</td></tr><tr><td>Submitted</td><td>Pending Accounts Verification, Pending L2 Verification, On Hold</td></tr>\n<tr><td>Returned</td><td>Returned to Principal (only state that allows changes)</td></tr><tr><td>Verified</td><td>Verified or Partially Verified, nothing yet with HR</td></tr>\n<tr><td>Rejected</td><td>Rejected</td></tr><tr><td>Pending HR Payment</td><td>Any approved line pending, in payroll, released or on hold</td></tr>\n<tr><td>Paid</td><td>Every approved line Paid, Recovered or Written off</td></tr></tbody></table></div>\n<div class=\"tw\"><table><thead><tr><th>Line payment status</th><th>Set by</th><th>Next allowed</th></tr></thead><tbody>\n<tr><td>Pending HR Processing</td><td>System on approval</td><td>Included in Payroll, Payment Released, On Hold</td></tr>\n<tr><td>Included in Payroll / Payment Released</td><td>HR batch</td><td>Paid, On Hold</td></tr>\n<tr><td>Paid</td><td>HR with payroll reference or bank UTR</td><td>Reversed, Recovery Required, Written off</td></tr>\n<tr><td>On Hold</td><td>HR (reason) or system (refund)</td><td>Pending HR Processing</td></tr>\n<tr><td>Cancelled</td><td>System, refund before payment when policy says cancel</td><td>None</td></tr>\n<tr><td>Reversed</td><td>Corporate Finance approval of HR request</td><td>None</td></tr>\n<tr><td>Recovery Required</td><td>System, refund after payment</td><td>Recovered</td></tr></tbody></table></div></section>\n\n<section id=\"sp5\"><h2>5. Principal submission</h2>\n<p>The Principal picks who earned the incentive; the system supplies every student, receipt, employee and amount, and blocks anything ineligible or duplicated.</p>\n<h3>5.1 Eligibility</h3>\n<ul><li>Each SRF receipt creates an eligibility record: academic year, branch, student, enrolment no., class, admission date, category, receipt no., amount, collection date, payment mode, receipt and admission status.</li>\n<li>Eligible only when the receipt is Active, admission Confirmed, it is a new admission, the category is eligible, and the receipt is not claimed in any other live submission.</li>\n<li>Ineligible receipts stay visible, greyed out with the reason.</li></ul>\n<h3>5.2 Branch-wise staff assignment</h3>\n<ul><li>Staff lists show only employees <b>Active</b> in HRMS, <b>mapped to the selected branch on that admission's receipt date</b>, with a designation eligible in the policy. Inactive, resigned, relieved, suspended, unauthorised and transferred-out employees never appear.</li>\n<li>An eligible-staff table shows biometric ID, name, designation, department, status, branch, SRF role and attendance, with counts of anyone left out and why, without naming other branches' staff.</li>\n<li>Pool roles (FOE, Cashier, Security, Aya) are pre-filled with present staff up to the slot limit; per-admission roles (Principal, Counsellor) are picked per student. Absent staff are excluded and listed as exceptions.</li>\n<li>Checking an employee ID that is not mapped to the selected branch on the receipt date, or does not exist, shows exactly: <b>\u201cThis employee is not mapped to the selected branch and cannot be assigned for SRF incentive.\u201d</b> The attempt is logged.</li>\n<li>If HRMS mapping changes while a draft is open, the line shows the same message with a Remove button and submission is blocked until fixed.</li>\n<li>At submission each line stores a snapshot: branch on the receipt date, designation, department, status and name. Later transfers never change it.</li></ul>\n<h3>5.3 Before submit</h3>\n<p>The summary shows admissions, beneficiaries, total SRF, staff incentive, Sadqa, SRF balance, exceptions and warnings. Submission is blocked when an admission exceeds the per-admission cap (or only warned, if the policy says so); an admission has no staff or misses a required document; a line fails the staff-mapping check; the same employee appears twice on one admission; the same receipts were already submitted or a returned submission was already revised; or the Principal is not mapped to the branch. Warnings: a receipt claimed elsewhere since the draft opened, and an open submission covering an overlapping period.</p>\n<h3>5.4 Duplicate prevention</h3>\n<div class=\"tw\"><table><thead><tr><th>Risk</th><th>Control</th></tr></thead><tbody>\n<tr><td>Same receipt claimed twice</td><td>Unique claim per receipt across live submissions; fingerprint of branch + receipts</td></tr>\n<tr><td>Double-click on Submit</td><td>Second click within 1.5 s ignored; idempotency key on the API</td></tr>\n<tr><td>Receipt changed while drafting</td><td>Every receipt re-checked at the moment of submit</td></tr>\n<tr><td>Same person twice on an admission</td><td>Blocked; already-chosen staff disabled in other slots</td></tr>\n<tr><td>Returned request revised twice</td><td>Blocked; points to the newer revision</td></tr>\n<tr><td>Same student in two live submissions</td><td>Accounts check \u201cClaimed only here\u201d fails</td></tr>\n<tr><td>Same receipt in a second live submission (two sessions, shared workspace)</td><td>Checked against the submissions themselves at Submit and again at Verify; the earlier submission wins, the later line must be rejected</td></tr>\n<tr><td>Rejected claim raised again</td><td>Blocked: a rejected receipt is not claimable. Accounts use Return for a corrected resubmission</td></tr>\n<tr><td>Same receipt number on two admissions in ERP</td><td>Both held until Fee Collection is corrected; Accounts check \u201cReceipt unique in ERP\u201d</td></tr>\n<tr><td>Same employee paid twice for one receipt</td><td>Blocked at Verify (\u201cNot paid before\u201d), at Create batch (line put on hold with the earlier line reference) and at Release hold</td></tr>\n<tr><td>Same line in two payment batches</td><td>Blocked at Create batch; batch and line references are checked, not only the status</td></tr>\n<tr><td>One bank UTR on two batches</td><td>Blocked at Mark paid</td></tr>\n<tr><td>Payroll run reference reused for another period</td><td>Blocked at Mark paid; one payroll run pays one period</td></tr>\n<tr><td>Mark paid or Include in payroll clicked twice</td><td>Second action ignored; status and reference unchanged</td></tr></tbody></table></div>\n<h3>5.5 Drafts and status tracking</h3>\n<p>Drafts can be saved and reopened. A status panel counts and lists the branch's Draft, Submitted, Returned, Verified, Rejected, Pending HR Payment and Paid items with Accounts remarks. Only Returned items offer Revise; everything else shows Locked.</p></section>\n\n<section id=\"sp6\"><h2>6. Verification</h2>\n<p>Level 1 goes to the role System Admin routes it to (Accounts by default; Corporate Finance can also act). Anything above Corporate Finance's threshold then needs level 2 approval by Corporate Finance.</p>\n<div class=\"tw\"><table><thead><tr><th>Level</th><th>Check</th></tr></thead><tbody>\n<tr><td>Admission</td><td>Admission confirmed</td></tr><tr><td>Admission</td><td>New admission</td></tr>\n<tr><td>Admission</td><td>Receipt active (no refund, reversal, cancellation or adjustment)</td></tr><tr><td>Admission</td><td>Amount matches the ERP receipt</td></tr>\n<tr><td>Admission</td><td>Claimed only here: no other live submission has this student</td></tr><tr><td>Admission</td><td>Category eligible under the policy version used</td></tr>\n<tr><td>Line</td><td>Mapped to branch: HRMS posting on the receipt date matches the submission branch</td></tr><tr><td>Line</td><td>Employee active in HRMS now</td></tr>\n<tr><td>Line</td><td>Present on the receipt date</td></tr><tr><td>Line</td><td>Amount equals the rule in the policy version used</td></tr></tbody></table></div>\n<p>Each line shows department, <b>branch at submission</b> and <b>current branch</b>; a difference is highlighted as transferred after submission. Lines failing any check start unticked.</p>\n<ul><li>Actions: approve all, approve selected lines, return, reject, hold, release hold. Remarks are mandatory for partial approval, return, reject and hold. Verifiers cannot change amounts or staff.</li>\n<li>Approval creates a verification reference (SRF-VER-2026-000001) and records the verifier and active role. Above the threshold, level 1 approval moves it to Pending L2 Verification.</li>\n<li>Queue items older than the target days are marked Overdue.</li>\n<li>No one can act on their own submission or approve a line that pays themselves. Submissions outside the user's data scope are not visible. Locked submissions cannot be acted on.</li></ul></section>\n\n<section id=\"sp7\"><h2>7. HR payment</h2>\n<p>HR pays only approved lines, grouped by employee, in batches that follow the published payment cycle. SRF is always a Corporate Office incentive, never a branch expense.</p>\n<div class=\"tw\"><table><thead><tr><th>Frequency</th><th>Cut-off</th><th>HR picks</th></tr></thead><tbody>\n<tr><td>Daily</td><td>A time (default 17:00)</td><td>Payment date</td></tr><tr><td>Weekly</td><td>A weekday (default Friday)</td><td>Payment week</td></tr>\n<tr><td>Fortnightly</td><td>First cut-off day; second is 14 days later</td><td>Period month</td></tr><tr><td>Monthly</td><td>Day of month (default 20)</td><td>Payroll month</td></tr>\n<tr><td>Quarterly</td><td>Day in the quarter's last month</td><td>Period month</td></tr></tbody></table></div>\n<ul><li>Daily and weekly cycles need off-cycle bank payments switched on.</li>\n<li>Rows show designation, branch at submission, current branch, student, role, amount, verification reference, status and total unpaid SRF.</li>\n<li>Batches go to payroll (earning code SRF_INC) or bank transfer; the reference carries the period, e.g. SRF-PAY-2026W43-001.</li>\n<li>The monthly cap per employee applies across all batches in the calendar month; excess is carried forward or not payable, as the policy says.</li>\n<li>Mark paid needs the payroll run reference or bank UTR; bank payments also need proof. A UTR can be used on one batch only.</li>\n<li>Hold and release need a reason; a line whose receipt is no longer active cannot be released. Locked or out-of-scope lines are excluded.</li>\n<li>HR requests a reversal with a reason; Corporate Finance approves. Nobody approves a reversal they requested or one on their own payment, and nobody releases a batch with their own SRF payment.</li>\n<li>Refund after payment creates Recovery Required (or Written off, if the policy says so), settled through payroll deduction SRF_REC or cash over up to the configured months.</li></ul></section>\n\n<section id=\"sp8\"><h2>8. Corporate Finance policy</h2>\n<p>One central, versioned rule set drives every amount. Only Corporate Finance can edit and publish it, and every published change becomes a new dated version.</p>\n<div class=\"tw\"><table><thead><tr><th>Section</th><th>What is set</th><th>Version 1 value</th></tr></thead><tbody>\n<tr><td>Roles and rates</td><td>Role on/off, HRMS designations, per-admission or pool, slots, fixed \u20b9 or % of SRF</td><td>Principal 400 \u00d71, Counsellor 800 \u00d72, FOE 50 \u00d72, Cashier 50 \u00d72 (incl. Accountant), Security 50 \u00d73, Aya 50 \u00d76</td></tr>\n<tr><td>Scope rules</td><td>Rate overrides by branch, class or category; precedence class \u2192 category \u2192 branch</td><td>None</td></tr>\n<tr><td>Deductions</td><td>Non-staff deductions with basis, amount and ledger</td><td>Sadqa \u20b9500, Sadqa Payable</td></tr>\n<tr><td>Limits</td><td>Max per admission (block or warn); max per employee per month (carry or not payable)</td><td>\u20b91,550; \u20b910,000 (example), carry forward</td></tr>\n<tr><td>Admission categories</td><td>Which categories earn incentive</td><td>General only</td></tr>\n<tr><td>Attendance</td><td>Date checked; half day, leave, weekly off</td><td>Collection date</td></tr>\n<tr><td>Multiple roles</td><td>One person in two roles on one admission</td><td>Not allowed</td></tr>\n<tr><td>Required documents</td><td>Document per role that must be attached</td><td>None</td></tr>\n<tr><td>Approval</td><td>Level 2 threshold and verification target days</td><td>\u20b910,000; 7 days</td></tr>\n<tr><td>Payment cycle</td><td>Frequency, cut-off, default method, payroll codes, off-cycle bank payments</td><td>Monthly, day 20, payroll, SRF_INC / SRF_REC</td></tr>\n<tr><td>Refund and recovery</td><td>Before payment: hold or cancel; after: recover or write off; recover via; months; partial refund</td><td>Hold; recover via payroll over 2 months; full</td></tr>\n<tr><td>Version history</td><td>Every version, who, when, reason; load an old version into the draft</td><td>v1 from 01/04/2026</td></tr>\n<tr><td>Reversal and recovery cases</td><td>Approve HR reversal requests</td><td>\u2013</td></tr></tbody></table></div>\n<p>A line pays only if the employee is active, mapped to the branch on the receipt date and present. Line = fixed amount, or SRF \u00d7 percentage; Balance = SRF \u2212 \u03a3 lines \u2212 \u03a3 deductions. Rounding is per line to the nearest rupee.</p>\n<h3>Worked example \u2013 26IQB0072, Chamanganj, 11/08/2026</h3>\n<div class=\"tw\"><table><thead><tr><th>Slot</th><th class=\"n\">Line (\u20b9)</th></tr></thead><tbody>\n<tr><td>Principal</td><td class=\"n\">400</td></tr><tr><td>Counsellor 1</td><td class=\"n\">800</td></tr><tr><td>Cashier 1</td><td class=\"n\">50</td></tr><tr><td>Security 1</td><td class=\"n\">50</td></tr>\n<tr><td>Aya 1\u20135 (Aya 6 absent, excluded)</td><td class=\"n\">250</td></tr><tr class=\"tot\"><td>Staff incentive</td><td class=\"n\">1,550</td></tr>\n<tr><td>Sadqa</td><td class=\"n\">500</td></tr><tr class=\"tot\"><td>SRF balance (5,000 \u2212 1,550 \u2212 500)</td><td class=\"n\">2,950</td></tr></tbody></table></div>\n<p>This matches the branch Excel sheet exactly. Edits build a highlighted draft with an impact preview; publishing needs an effective date after the current version, a reason and confirmation, and is blocked if the preview breaches a blocking cap. Unsubmitted admissions recalculate at once; submitted lines keep their version.</p></section>\n\n<section id=\"sp9\"><h2>9. System Admin Control Center</h2>\n<p>System Admin owns access, mapping and technical controls and makes no financial decisions. Every change is written to the audit log with old and new values.</p>\n<div class=\"tw\"><table><thead><tr><th>Section</th><th>Controls</th></tr></thead><tbody>\n<tr><td>Users and logins</td><td>Create, edit, activate, deactivate and reset logins; map employee ID, roles and data scope; region and zone from mapped branches; staff self-service on/off. Cannot deactivate own login or remove own System Admin role</td></tr>\n<tr><td>Role permissions</td><td>Matrix of 7 screens \u00d7 View, Create, Edit, Submit, Verify, Approve, Pay, Reverse, Download, Admin per role; SoD cells locked with the rule shown on hover</td></tr>\n<tr><td>Workflow and notifications</td><td>Routing: level 1 (Accounts or Corporate Finance), level 2 (Corporate Finance), payment (HR), reversal approval (Corporate Finance). Recipients for Submitted, Returned, Verified, Rejected, Batch created, Paid, Recovery required, Policy published, Login denied</td></tr>\n<tr><td>Submission locks</td><td>Lock or unlock any submission with a reason; never changes amounts or decisions</td></tr>\n<tr><td>Branches</td><td>Add, edit, delete. Code 2\u20135 letters or digits, fixed; unique names; region and zone from lists. Branches with receipts, staff, submissions, published rules or mapped logins cannot be deleted; the attempt is logged</td></tr>\n<tr><td>Regions and zones</td><td>Fixed lists. Each zone belongs to one region; a branch belongs to one zone. Moving a zone moves its branches. A region with zones, or a zone with branches, cannot be deleted</td></tr>\n<tr><td>HRMS staff mapping</td><td>Transfer with effective date, correct the current posting, or change employment status; each needs an HRMS order reference and a reason. Full posting history per employee</td></tr>\n<tr><td>Integrations</td><td>HRMS sync frequency and Sync now; Fee Collection receipt-event test</td></tr>\n<tr><td>User activity</td><td>Per user: sign-ins, denied sign-ins, logged actions, last login</td></tr></tbody></table></div>\n<p><b>Creating a Principal login:</b> enter login, name and an HRMS employee ID that is an active Principal or Vice Principal; choose one or more branches (region and zone fill in); the login starts with a temporary password; a second role later needs a management authorisation reference.</p></section>\n\n<section id=\"sp10\"><h2>10. Reports and dashboards</h2>\n<p>Every report sums incentive lines live and is filtered to the viewer's data scope.</p>\n<div class=\"tw\"><table><thead><tr><th>Metric</th><th>Definition</th></tr></thead><tbody>\n<tr><td>Gross SRF collected</td><td>SRF receipts for new admissions in the period, any status</td></tr>\n<tr><td>Cancelled/refunded SRF</td><td>Gross receipts now Cancelled, Refunded or Adjusted</td></tr>\n<tr><td>Net eligible SRF</td><td>Active receipts of confirmed admissions in eligible categories</td></tr>\n<tr><td>Approved incentive</td><td>Approved lines not reversed or cancelled</td></tr>\n<tr><td>Paid incentive</td><td>Lines in Paid</td></tr>\n<tr><td>Pending incentive</td><td>Approved \u2212 paid \u2212 on hold \u2212 recovery \u2212 recovered or written off</td></tr>\n<tr><td>SRF balance</td><td>Net eligible SRF \u2212 approved incentive \u2212 Sadqa</td></tr>\n<tr><td>Ageing</td><td>Days in current status; Overdue beyond the verification target</td></tr></tbody></table></div>\n<div class=\"tw\"><table><thead><tr><th>Report</th><th>Key columns</th><th>Users</th></tr></thead><tbody>\n<tr><td>Branch-wise SRF collection</td><td>Branch, region, zone, admissions, gross, cancelled, net eligible, approved, paid, pending, Sadqa, balance, pending verification, rejected/returned</td><td>Finance, Management, Principal (own)</td></tr>\n<tr><td>Staff-wise SRF payment</td><td>Biometric ID, employee, designation, branch at submission, current branch, admissions, approved, paid, pending, hold/recovery, payment date, reference, status</td><td>HR, Finance, Auditor</td></tr>\n<tr><td>Student-wise SRF audit</td><td>Enrolment, student, branch, class, receipt, SRF, date, staff and roles, incentive, policy version, submission, verification, payment and receipt status</td><td>Finance, Auditor</td></tr>\n<tr><td>Pending actions</td><td>Pending verification, returned, pending HR payment, on hold, recovery required, reversals awaiting Finance</td><td>Each role</td></tr>\n<tr><td>Management dashboard</td><td>Collected vs paid, net balance, branch ranking, incentive by designation, ageing, month-wise trend, refund impact, payment status; group \u2192 region \u2192 zone \u2192 branch</td><td>Management, Finance</td></tr></tbody></table></div>\n<p>Every report exports to Excel and PDF only where the role has Download, and never beyond the user's data scope.</p></section>\n\n<section id=\"sp11\"><h2>11. Audit trail and security</h2>\n<p>Every significant action, including every refused attempt, writes an append-only record that no role can edit or delete. Each record holds when, user and login, active role, category (Finance or System), action and record, old \u2192 new value, reason and IP/device.</p>\n<p><b>Logged:</b> sign-in, denied sign-in, role switch, password reset and change; user, permission, routing and notification changes; branch, region, zone and HRMS mapping changes; locks; policy changes; drafts and submissions; verification decisions; batches, payments, holds, reversals, recoveries; Fee Collection receipt events; audit downloads; and every blocked action or deletion attempt. System Admin and Auditor see all categories; Corporate Finance sees the finance trail only.</p>\n<ul><li>Permissions and data scope are enforced by the service on every call, not only by the screen.</li>\n<li>System Admin access never grants Corporate Finance rights, and the reverse.</li>\n<li>Deactivation removes access immediately; audit history stays intact.</li>\n<li>Submitted and verified records are never deleted; corrections happen by return, revision, reversal or adjustment.</li>\n<li>Money is stored as DECIMAL(12,2); amounts are written only by the calculation service.</li></ul></section>\n\n<section id=\"sp12\"><h2>12. Technical design</h2>\n<p>SRF runs as one service inside the ERP: it reads four source systems, keeps its own incentive-line ledger and audit log, enforces access and separation of duties on every call, and is the only route for SRF amounts into Payroll and the GL.</p>\n<div class=\"tw dia\">{{ARCH}}</div>\n<div class=\"tw\"><table><thead><tr><th>Table</th><th>Purpose</th><th>Key columns</th></tr></thead><tbody>\n<tr><td><code>srf_eligibility</code></td><td>One row per SRF receipt</td><td>receipt_id (unique), admission_id, branch_id, category, class_id, srf_amount, collection_date, statuses, claimed_by_submission_id</td></tr>\n<tr><td><code>srf_policy_version</code></td><td>Dated rule set</td><td>version_no, effective_from, published_by, reason, payload</td></tr>\n<tr><td><code>srf_submission</code></td><td>Principal's batch</td><td>ref_no, branch_id, period, status, level, revision_no, submitted_by, submitted_role, fingerprint, lock</td></tr>\n<tr><td><code>srf_incentive_line</code></td><td>Employee \u00d7 role \u00d7 admission</td><td>employee_id, role, slot, amount, rule_source, snapshot, verification_status, payment_status, batch_id</td></tr>\n<tr><td><code>srf_verification</code></td><td>Decisions</td><td>ref_no, level, decision, remarks, verifier_id, active_role</td></tr>\n<tr><td><code>srf_payment_batch</code></td><td>HR batch</td><td>ref_no, period, method, earning_code, created_by, payroll_ref or utr (unique), proof</td></tr>\n<tr><td><code>srf_reversal</code>, <code>srf_recovery</code></td><td>Reversals and recoveries</td><td>line_id, requested_by, approved_by, reason, method, status</td></tr>\n<tr><td><code>sys_user</code>, <code>sys_user_role</code>, <code>sys_user_scope</code></td><td>Logins, roles, data scope</td><td>login, employee_id, status, temp_password_flag, auth_ref; role; scope_type, scope_id</td></tr>\n<tr><td><code>sys_role_permission</code></td><td>Permission matrix</td><td>role, screen, action; SoD locks enforced</td></tr>\n<tr><td><code>sys_routing</code>, <code>sys_notification</code></td><td>Routing and recipients</td><td>step, role; event, recipient</td></tr>\n<tr><td><code>mst_branch</code>, <code>mst_region</code>, <code>mst_zone</code></td><td>Masters</td><td>branch code (immutable), name (unique), zone_id; region_id</td></tr>\n<tr><td><code>hr_posting</code> (read)</td><td>HRMS postings</td><td>employee_id, branch_id, from_date, to_date, order_ref</td></tr>\n<tr><td><code>audit_log</code></td><td>Append-only</td><td>at, user, login, active_role, category, action, record, old, new, reason, ip, device, previous-row hash</td></tr></tbody></table></div>\n<p><b>Calculation:</b> pick the version effective on the receipt date; resolve each role's rate (class, then category, then branch rule, else default); check each employee's posting, status, designation and attendance; sum lines, subtract deductions, check the cap. Re-run on submit, on verification open and at batch creation; client figures are never trusted.</p>\n<p><b>Events:</b> fee.receipt.created / status_changed, admission.status_changed, hrms.employee.updated, hrms.posting.changed, attendance.day_closed, payroll.run_posted. <b>APIs</b> (REST, idempotency key on every write) for submission, verification, payment, policy, reports, audit and admin; every call carries the active role and is checked against permissions, SoD locks and data scope.</p>\n<p><b>Non-functional:</b> branch-month list under 2 s, dashboard under 5 s; optimistic locking; read-only reports if HRMS or Payroll is down; files PDF/JPG/PNG up to 10 MB, virus-scanned; UTC stored, local time shown; retention at least 8 years (Finance to confirm).</p></section>\n\n<section id=\"sp13\"><h2>13. Accounting, migration and rollout</h2>\n<p>Proposed entries (Finance to confirm), all in the Corporate cost centre:</p>\n<div class=\"tw\"><table><thead><tr><th>Event</th><th>Debit</th><th>Credit</th></tr></thead><tbody>\n<tr><td>SRF collected</td><td>Bank / Cash</td><td>SRF Collection (Corporate)</td></tr><tr><td>Sadqa allocated</td><td>SRF Collection</td><td>Sadqa Payable</td></tr>\n<tr><td>Line approved</td><td>SRF Staff Incentive Expense</td><td>SRF Incentive Payable</td></tr><tr><td>Paid via payroll</td><td>SRF Incentive Payable</td><td>Salary Payable</td></tr>\n<tr><td>Paid off-cycle</td><td>SRF Incentive Payable</td><td>Bank</td></tr><tr><td>Refund after payment</td><td>Staff Recovery Receivable</td><td>SRF Staff Incentive Expense</td></tr>\n<tr><td>Recovery deducted</td><td>Salary Payable</td><td>Staff Recovery Receivable</td></tr><tr><td>Written off</td><td>SRF Write-off Expense</td><td>Staff Recovery Receivable</td></tr></tbody></table></div>\n<ol><li><b>Masters and access:</b> System Admin loads regions, zones, branches and personal logins, and confirms the permission matrix.</li>\n<li><b>Policy:</b> Corporate Finance publishes version 1 and settles the open decisions.</li>\n<li><b>HRMS check:</b> confirm postings, designations, departments and status.</li>\n<li><b>History:</b> load this year's Excel claims as Paid (migrated); unmatched rows go to an exception list.</li>\n<li><b>Pilot:</b> Chamanganj and Akbarbagh Girls for one cycle; totals must match the sheets.</li>\n<li><b>Parallel run</b> across all branches for one cycle, then <b>cut-over</b> and a month of daily reconciliation.</li></ol></section>\n\n<section id=\"sp14\"><h2>14. Acceptance tests and open decisions</h2>\n<div class=\"tw\"><table><thead><tr><th>#</th><th>Scenario</th><th>Expected</th></tr></thead><tbody>\n<tr><td>AT-01</td><td>Chamanganj 11/08/2026, two General admissions at \u20b95,000</td><td>Incentive 3,100, Sadqa 1,000, balance 5,900</td></tr>\n<tr><td>AT-02</td><td>Receipt 26IQB0072 in a second submission</td><td>Blocked: claimed in SRF-SUB-2026-0001</td></tr>\n<tr><td>AT-03</td><td>Double-click Submit</td><td>One submission only</td></tr>\n<tr><td>AT-04</td><td>Same counsellor in two slots</td><td>Blocked</td></tr>\n<tr><td>AT-05</td><td>Akbarbagh Principal checks ID CHM-101</td><td>Not-mapped message shown and logged</td></tr>\n<tr><td>AT-06</td><td>Resigned ABG-301 and transferred ABG-302</td><td>Neither appears for 07/10/2026 receipts</td></tr>\n<tr><td>AT-07</td><td>Employee transferred after submission</td><td>Snapshot unchanged; current branch highlighted</td></tr>\n<tr><td>AT-08</td><td>HRMS correction for the receipt date</td><td>\u201cMapped to branch\u201d check fails</td></tr>\n<tr><td>AT-09</td><td>Principal tries another branch</td><td>Not offered; submit refuses</td></tr>\n<tr><td>AT-10</td><td>Principal or Accounts edits policy</td><td>Refused and logged</td></tr>\n<tr><td>AT-11</td><td>System Admin verifies or publishes policy</td><td>Refused and logged</td></tr>\n<tr><td>AT-12</td><td>Corporate Finance creates a user or changes permissions</td><td>Refused and logged</td></tr>\n<tr><td>AT-13</td><td>Verifier opens own submission or own line</td><td>Actions disabled; refused if forced</td></tr>\n<tr><td>AT-14</td><td>Approved amount above level 2 threshold</td><td>Moves to Pending L2 Verification</td></tr>\n<tr><td>AT-15</td><td>Deactivated login signs in</td><td>Refused, logged, System Admin notified</td></tr>\n<tr><td>AT-16</td><td>Reset login then sign in</td><td>Only the set-password screen until changed</td></tr>\n<tr><td>AT-17</td><td>Locked submission</td><td>No verification or payment possible</td></tr>\n<tr><td>AT-18</td><td>Same bank UTR on a second batch</td><td>Blocked</td></tr>\n<tr><td>AT-19</td><td>Refund after payment</td><td>Recovery Required; reports update</td></tr>\n<tr><td>AT-20</td><td>Rate change effective 01/10/2026</td><td>Open draft recalculates; submitted lines keep v1</td></tr>\n<tr><td>AT-21</td><td>Weekly payment cycle</td><td>Batch reference carries the week</td></tr>\n<tr><td>AT-22</td><td>Delete a branch with receipts</td><td>Refused with linked records listed; logged</td></tr>\n<tr><td>AT-23</td><td>Corporate Finance opens audit logs</td><td>Finance entries only</td></tr></tbody></table></div>\n<h3>Open decisions</h3>\n<ul><li>Sadqa: fixed \u20b9500 or 10% of SRF, which ledger, and who disburses it.</li>\n<li>Pool roles: earn on every admission on a day present, or only when assigned?</li>\n<li>Employee active on the receipt date but resigned before submission: eligible or not? Currently excluded.</li>\n<li>Should Corporate Finance keep level 1 verification rights alongside Accounts?</li>\n<li>Non-General categories: zero incentive or a separate rate table.</li>\n<li>Is HRMS \u201cAccountant\u201d always the SRF Cashier role?</li>\n<li>Monthly cap per employee and level 2 threshold values.</li>\n<li>Recovery by payroll only, or cash collection too.</li>\n<li>Chart of accounts codes and the statutory retention period.</li></ul></section>\n</template>";
const SRF = (() => {

const TODAY='2026-10-19';
const BR={CHM:'MS International School Chamanganj',ABG:'Akbarbagh Girls'};
const BRANCHES=()=>Object.values(BR);
const BMETA={CHM:{zone:'',added:'2026-04-01',by:'ERP master'},ABG:{zone:'',added:'2026-04-01',by:'ERP master'}};
const GEO={regions:[],zones:[],seq:0};
const regById=id=>GEO.regions.find(r=>r.id===id),zoneById=id=>GEO.zones.find(z=>z.id===id);
const bZone=c=>zoneById(BMETA[c]?.zone),bZoneName=c=>bZone(c)?.name||'',bRegionName=c=>regById(bZone(c)?.region)?.name||'';
const CLASSES=['Nursery','LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
const HRMS_DESIG=['Principal','Vice Principal','Counsellor','FOE','Cashier','Accountant','Security Guard','Aya','Aaya','Teacher','Driver'];
const h=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inr=n=>'₹'+Math.round(+n||0).toLocaleString('en-IN');
const dmy=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—';
const sum=a=>a.reduce((x,y)=>x+y,0);
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const clone=o=>JSON.parse(JSON.stringify(o));

/* ================= Policy (one model shared by every view) ================= */
const P1={
  roles:[
    {code:'PRINCIPAL',label:'Principal',desig:['Principal'],mode:'per',slots:1,calc:'pct',value:8,on:true,doc:''},
    {code:'COUNSELLOR',label:'Counsellor',desig:['Counsellor'],mode:'per',slots:2,calc:'pct',value:16,on:true,doc:''},
    {code:'FOE',label:'FOE',desig:['FOE'],mode:'pool',slots:2,calc:'pct',value:1,on:true,doc:''},
    {code:'CASHIER',label:'Cashier',desig:['Cashier','Accountant'],mode:'pool',slots:2,calc:'pct',value:1,on:true,doc:''},
    {code:'SECURITY',label:'Security',desig:['Security Guard'],mode:'pool',slots:3,calc:'pct',value:1,on:true,doc:''},
    {code:'AYA',label:'Aya',desig:['Aya','Aaya'],mode:'pool',slots:6,calc:'pct',value:1,on:true,doc:''}],
  deds:[{code:'SADQA',label:'Sadqa',calc:'fixed',value:500,ledger:'Sadqa Payable',on:true}],
  limits:{maxPct:31,perEmployeeMonth:10000,carry:true,blockOver:true},
  cats:{'General':true,'Staff ward':false,'Concession':false,'RTE':false,'Sibling':false},
  att:{basis:'collection',halfDay:'count',leave:'exclude',weekOff:'exclude'},
  multi:{multiRoleOneAdmission:false,principalAsCounsellor:false},
  rules:[],
  approval:{l2Above:10000,slaDays:7},
  cycle:{freq:'Monthly',cutoff:20,cutoffTime:'17:00',cutoffWeekday:'Friday',method:'Payroll',earning:'SRF_INC',deduction:'SRF_REC',offCycle:true},
  refund:{beforePay:'hold',afterPay:'recover',via:'payroll',months:2,partialRefund:'full'}};

const S={view:'dashboard',users:[],perms:{},uid:'U2',role:'Principal',drafts:[],
  routing:{l1:'Accounts',l2:'Corporate Finance',payment:'HR',reversal:'Corporate Finance'},
  notify:{'Submitted':['Accounts'],'Returned':['Submitting Principal'],'Verified':['HR','Submitting Principal'],'Rejected':['Submitting Principal'],'Batch created':['Corporate Finance'],'Paid':['Submitting Principal'],'Recovery required':['HR','Corporate Finance'],'Policy published':['Accounts','HR'],'Login denied':['System Admin']},
  sa:{sec:'users',edit:null,newU:{login:'',name:'',empId:'',role:'Principal',stype:'branch',ids:[]},roleTab:'Principal',lockReason:{},af:{cat:'All',user:'',q:''},sync:'Every 15 minutes'},seq:{sub:0,bat:0,line:0,ver:0},
  versions:[{v:1,from:'2026-04-01',by:'Corporate Finance Admin',at:'2026-04-01',reason:'Initial rates as used in branch SRF sheets',p:clone(P1)}],
  emps:[],adms:[],subs:[],batches:[],audit:[],revs:[],
  draft:null,acc:{sel:null,remark:'',checked:{}},hr:{tab:'process',checked:{},pd:{date:'2026-10-19',week:'2026-W43',month:'2026-10'},method:'Payroll',ref:{},reason:''},rep:'branch',
  cp:{sec:'roles',draft:clone(P1),from:'2026-10-01',reason:'',confirm:false,
    newRule:{scope:'Branch',value:BRANCHES()[0],role:'COUNSELLOR',calc:'fixed',value2:800,note:''},newUser:{user:'',role:'Principal',branch:BRANCHES()[0]},newBranch:{code:'',name:'',region:'',zone:''},editB:null,delB:null,delMsg:'',sm:{branch:'*',q:'',open:null,form:{kind:'transfer',to:'',from:'2026-10-19',ref:'',reason:'',status:''}},newRegion:'',newZone:{name:'',region:''},editG:null,delG:null,geoMsg:'',
    prev:{srf:5000,cat:'General',counts:{PRINCIPAL:1,COUNSELLOR:1,FOE:0,CASHIER:1,SECURITY:1,AYA:5}},sim:'26IQB0073',simTo:'Refunded'}};
/* ================= Users, roles, permissions (owned by System Admin) ================= */
const ROLES=['Principal','Accounts','HR','Corporate Finance','System Admin','Auditor','Management'];
const SCREENS=[['dashboard','Dashboard'],['submission','SRF request'],['verification','Verification'],['payment','Payments'],['policy','Incentive policy'],['reports','Reports'],['audit','Audit logs'],['sysadmin','System Admin']];
const ACTIONS=['View','Create','Edit','Submit','Verify','Approve','Pay','Reverse','Download','Admin'];
const APPLIES={dashboard:['View'],submission:['View','Create','Edit','Submit','Download'],verification:['View','Verify','Approve','Download'],payment:['View','Create','Pay','Reverse','Approve','Download'],policy:['View','Create','Edit','Approve'],reports:['View','Download'],audit:['View','Download'],sysadmin:['View','Edit','Admin']};
const READ=['View','Download'];
function sodLock(role,scr,act){
  if(!APPLIES[scr].includes(act))return 'Not applicable';
  if(scr==='sysadmin'&&role!=='System Admin')return 'Only System Admin can use the System Admin Control Center';
  if(['Auditor','Management'].includes(role)&&!READ.includes(act))return role+' is a read-only role';
  if(role==='System Admin'&&['submission','verification','payment','policy'].includes(scr)&&!READ.includes(act))return 'System Admin controls access, not financial decisions';
  if(scr==='submission'&&!READ.includes(act)&&role!=='Principal')return 'Only Principals create and submit SRF requests';
  if(scr==='verification'&&!READ.includes(act)&&!['Accounts','Corporate Finance'].includes(role))return 'Only Accounts and Corporate Finance verify';
  if(scr==='verification'&&act==='Approve'&&role!=='Corporate Finance')return 'Level 2 approval belongs to Corporate Finance';
  if(scr==='payment'&&['Create','Pay','Reverse'].includes(act)&&role!=='HR')return 'Only HR processes payments';
  if(scr==='payment'&&act==='Approve'&&role!=='Corporate Finance')return 'Reversal approval belongs to Corporate Finance';
  if(scr==='policy'&&!READ.includes(act)&&role!=='Corporate Finance')return 'Only Corporate Finance sets SRF policy';
  return null;}
const PERM0={
  'Principal':{dashboard:['View'],submission:['View','Create','Edit','Submit','Download'],reports:['View','Download']},
  'Accounts':{dashboard:['View'],verification:['View','Verify','Download'],payment:['View'],reports:['View','Download']},
  'HR':{dashboard:['View'],payment:['View','Create','Pay','Reverse','Download'],verification:['View'],reports:['View','Download']},
  'Corporate Finance':{dashboard:['View'],policy:['View','Create','Edit','Approve'],verification:['View','Verify','Approve','Download'],payment:['View','Approve'],reports:['View','Download'],audit:['View','Download']},
  'System Admin':{dashboard:['View'],sysadmin:['View','Edit','Admin'],audit:['View','Download']},
  'Auditor':{dashboard:['View'],submission:['View'],verification:['View','Download'],payment:['View','Download'],policy:['View'],reports:['View','Download'],audit:['View','Download']},
  'Management':{dashboard:['View'],reports:['View','Download']}};
const mkU=(id,login,name,empId,roles,scope,extra={})=>Object.assign({id,login,name,empId,roles,scope,status:'Active',reset:false,auth:'',last:'—'},extra);
const SEED_USERS=[
  mkU('U1','haneefa.fatima','Haneefa Fatima','2131432',['Principal'],{type:'branch',ids:['ABG']}),
  mkU('U2','principal.chm','Principal','CHM-101',['Principal'],{type:'branch',ids:['CHM']},{generic:true}),
  mkU('U3','accounts.verifier','Accounts Verifier','ACC-01',['Accounts'],{type:'all',ids:[]},{generic:true}),
  mkU('U4','hr.officer','HR Officer','HR-01',['HR'],{type:'all',ids:[]},{generic:true}),
  mkU('U5','finance.head','Finance Head','CF-01',['Corporate Finance'],{type:'all',ids:[]},{generic:true}),
  mkU('U6','sys.admin','System Admin','SA-01',['System Admin'],{type:'all',ids:[]},{generic:true}),
  mkU('U7','internal.auditor','Auditor','AUD-01',['Auditor'],{type:'all',ids:[]},{generic:true}),
  mkU('U8','management','Management','MG-01',['Management'],{type:'all',ids:[]},{generic:true}),
  mkU('U9','finance.controller','Finance Controller','CF-02',['Accounts','Corporate Finance'],{type:'all',ids:[]},{auth:'MGMT/2026/07 (example)',generic:true})];
S.users=clone(SEED_USERS);S.perms=clone(PERM0);SRF_BRIDGE.masters({S,BR,BMETA,GEO,CLASSES,clone});
const cu=()=>S.users.find(u=>u.id===S.uid);
const can=(scr,act)=>{const u=cu();return !!u&&u.status==='Active'&&!u.reset&&u.roles.includes(S.role)&&(S.perms[S.role]?.[scr]||[]).includes(act)&&!sodLock(S.role,scr,act)};
function userBranches(u){u=u||cu();if(!u)return [];const sc=u.scope,all=Object.keys(BR);
  if(sc.type==='all')return all;if(sc.type==='branch')return all.filter(c=>sc.ids.includes(c));
  if(sc.type==='region')return all.filter(c=>sc.ids.includes(bZone(c)?.region));if(sc.type==='zone')return all.filter(c=>sc.ids.includes(BMETA[c].zone));return []}
const scopeText=u=>u.scope.type==='all'?'All branches (corporate-wide)':u.scope.type==='branch'?u.scope.ids.map(c=>BR[c]||c).join(', ')||'None':(u.scope.type==='region'?'Region: ':'Zone: ')+(u.scope.ids.map(i=>(u.scope.type==='region'?regById(i):zoneById(i))?.name||i).join(', ')||'None');
const NOTIFY_EVENTS=['Submitted','Returned','Verified','Rejected','Batch created','Paid','Recovery required','Policy published','Login denied'];
function notify(ev,ctx){const r=S.notify[ev]||[];if(!r.length)return;log('Notification sent',ev,'To '+r.join(', ')+(ctx?' · '+ctx:''),'','System')}
const capOf=(p,srf)=>Math.round(srf*(+p.limits.maxPct||0)/100);
const curV=()=>S.versions[S.versions.length-1];
const verFor=d=>[...S.versions].filter(v=>v.from<=d).sort((a,b)=>b.v-a.v)[0];
const verNo=n=>S.versions.find(v=>v.v===n);
const vRole=(v,c)=>v.p.roles.find(r=>r.code===c);
const onRoles=v=>v.p.roles.filter(r=>r.on);
function rateFor(v,r,a){
  for(const [sc,val] of [['Class',a.cls],['Admission category',a.category],['Branch',BR[a.branch]]]){
    const ru=v.p.rules.find(x=>x.scope===sc&&x.value===val&&x.role===r.code);
    if(ru)return {amt:ru.calc==='pct'?Math.round(a.amount*ru.value2/100):+ru.value2,src:sc+' rule'}}
  return {amt:r.calc==='pct'?Math.round(a.amount*r.value/100):+r.value,src:'default'};}
const dedFor=(v,a)=>sum(v.p.deds.filter(d=>d.on).map(d=>d.calc==='pct'?Math.round(a.amount*d.value/100):+d.value));
const catOk=(v,c)=>!!v&&v.p.cats[c]===true;

/* ================= HRMS (Akbarbagh from the 07/10/2026 sheet; Chamanganj staff are examples) ================= */
const DEPT={Principal:'Administration',Counsellor:'Admissions',FOE:'Front Office',Accountant:'Accounts',Cashier:'Accounts','Security Guard':'Security',Aya:'Housekeeping',Aaya:'Housekeeping'};
const mkEmp=(bio,name,desig,branch,att='Present')=>({bio,name,desig,dept:DEPT[desig]||'General',status:'Active',att,postings:[{branch,from:'2025-04-01',to:null,ref:'HRMS opening'}]});
S.emps=[
  mkEmp('2131432','Haneefa Fatima','Principal','ABG'),mkEmp('503095','Rubeena Khatoon','Counsellor','ABG'),mkEmp('503086','Alishan Saba','FOE','ABG'),
  mkEmp('508542','Rafia Osman','Accountant','ABG'),mkEmp('2132484','Rani','Aaya','ABG'),mkEmp('500780','Rani','Aaya','ABG'),
  mkEmp('508185','Mohammed Mujeeb','Security Guard','ABG'),mkEmp('507483','Mohd Sattar','Security Guard','ABG'),mkEmp('508810','Ishrath Begum','Security Guard','ABG'),
  mkEmp('CHM-101','Principal','Principal','CHM'),mkEmp('CHM-102','Counsellor','Counsellor','CHM'),mkEmp('CHM-103','Cashier','Cashier','CHM'),
  mkEmp('CHM-104','Guard','Security Guard','CHM'),mkEmp('CHM-111','Aya 1','Aya','CHM'),mkEmp('CHM-112','Aya 2','Aya','CHM'),
  mkEmp('CHM-113','Aya 3','Aya','CHM'),mkEmp('CHM-114','Aya 4','Aya','CHM'),mkEmp('CHM-115','Aya 5','Aya','CHM'),mkEmp('CHM-116','Aya 6','Aya','CHM','Absent')];
S.emps.push(Object.assign(mkEmp('ABG-301','FOE (resigned)','FOE','ABG'),{status:'Resigned'}));
(()=>{const e=mkEmp('ABG-302','Guard (transferred)','Security Guard','ABG');e.postings=[{branch:'ABG',from:'2025-04-01',to:'2026-09-30',ref:'HRMS opening'},{branch:'CHM',from:'2026-10-01',to:null,ref:'TR/2026/014 (example)'}];S.emps.push(e)})();
const EMP_GONE={};
const emp=id=>S.emps.find(e=>e.bio===id)||(EMP_GONE[id]=EMP_GONE[id]||{bio:id,name:'Staff '+id+' (not in HRMS feed)',desig:'—',dept:'—',status:'Inactive',att:'Present',postings:[],gone:true});
const STATUSES=['Active','Inactive','Resigned','Relieved','Suspended','Unauthorised'];
const NOT_MAPPED='This employee is not mapped to the selected branch and cannot be assigned for SRF incentive.';
const postOn=(e,d)=>(e&&e.postings||[]).find(p=>p.from<=d&&(!p.to||p.to>=d));
const branchOn=(e,d)=>e?postOn(e,d)?.branch||null:null;
const curPosting=e=>(e&&e.postings||[]).find(p=>!p.to)||(e&&e.postings||[]).at(-1)||{branch:null};
const curBranch=e=>curPosting(e).branch;
const dayBefore=d=>new Date(Date.parse(d)-864e5).toISOString().slice(0,10);
function staffCheck(e,branch,date,v){
  if(!e||branchOn(e,date)!==branch)return NOT_MAPPED;
  if(e.status!=='Active')return 'This employee is '+e.status.toLowerCase()+' in HRMS and cannot be assigned for SRF incentive.';
  if(!onRoles(v).some(r=>r.desig.includes(e.desig)))return 'Designation “'+e.desig+'” is not eligible for SRF incentive in the Control Panel.';
  return null;}
const snapOf=(id,a)=>{const e=emp(id);return {branch:branchOn(e,a.collDate),desig:e.desig,dept:e.dept,status:e.status,name:e.name,date:a.collDate}};

/* ================= Admissions + SRF receipts ================= */
const mkAdm=(enrol,name,cls,branch,date,amount,extra={})=>Object.assign({enrol,name,cls,branch,admDate:date,collDate:date,amount,receipt:'SRF/'+branch+'/'+enrol.slice(-4),mode:'Cash',category:'General',rstatus:'Active',astatus:'Confirmed',isNew:true,claimedBy:null},extra);
S.adms=[
  mkAdm('26IQB0072','Dua Shahbaaz','—','CHM','2026-08-11',5000),mkAdm('26IQB0073','Mohammad Affan','—','CHM','2026-08-11',5000),
  mkAdm('26ABG0083','Amatul Affu Hanaan','Class 9','ABG','2026-10-07',5000),mkAdm('26ABG0082','Amatul Salam','Class 7','ABG','2026-10-07',5000),
  mkAdm('26ABG0084','Student a','Class 5','ABG','2026-10-07',5000,{rstatus:'Cancelled'}),
  mkAdm('26ABG0085','Student b','Class 3','ABG','2026-10-07',5000,{category:'Staff ward'})];
const adm=e=>S.adms.find(a=>a.enrol===e);
/* ================= Fee Collection feed (read-only source) ================= */
// S.fc = receipts as Fee Collection holds them now. SRF pulls from it on sync and never writes back.
const fcRow=(enrol,name,cls,branch,date,amount,x={})=>Object.assign({receipt:'SRF/'+branch+'/'+enrol.slice(-4),enrol,name,cls,branch,date,amount,head:'SRF',mode:'Cash',category:'General',rstatus:'Active',astatus:'Confirmed',isNew:true},x);
S.fc=S.adms.map(a=>fcRow(a.enrol,a.name,a.cls,a.branch,a.collDate,a.amount,{receipt:a.receipt,mode:a.mode,category:a.category,rstatus:a.rstatus,astatus:a.astatus,isNew:a.isNew}));
S.adms.forEach(a=>{a.src='Fee Collection';a.synced=a.collDate});
// Changes made in Fee Collection since the last sync (prototype examples)
S.fc.push(fcRow('26IQB0074','Student c','Class 1','CHM','2026-10-18',5000,{mode:'UPI'}),
  fcRow('26ABG0086','Student d','Class 6','ABG','2026-10-16',5000),
  fcRow('26ABG0086','Student d','Class 6','ABG','2026-10-16',12000,{head:'Tuition',receipt:'TUI/ABG/0086'}),
  fcRow('26KDW0011','Student e','Class 2','KDW','2026-10-14',5000),
  fcRow('25ABG0050','Student f','Class 4','ABG','2026-03-20',5000));
Object.assign(S.fc.find(f=>f.enrol==='26ABG0085'),{rstatus:'Refunded'});
Object.assign(S.fc.find(f=>f.enrol==='26IQB0073'),{amount:4500});
S.fcs={freq:'Every 15 minutes',last:'2026-10-07 18:00',lastBy:'Scheduler',runs:[]};
const subOf=id=>S.subs.find(s=>s.id===id);
const SHEET_B={'26ABG0083':{PRINCIPAL:['2131432']},'26ABG0082':{COUNSELLOR:['503095']}};

const SYSRE=/Login|Logout|Password|User|Role|Permission|branch|Branch|Region|Zone|HRMS|Lock|Unlock|Routing|Notification|Integration|Receipt status|Sync|Blocked assignment/;
function log(action,entity,detail,reason='',cat){const u=cu();S.audit.unshift({at:new Date(Date.parse(TODAY+'T09:00:00')+S.audit.length*61000).toISOString(),user:u?u.name:'System',login:u?u.login:'system',role:u?S.role:'System',action,entity,detail,reason,device:u?'Chrome on Windows · 10.0.4.'+(20+Number(u.id.slice(1)))+' (example)':'Server',cat:cat||(SYSRE.test(action)?'System':'Finance')})}
function deny(msg,what){toast(msg);log('Blocked action',what||'Permission',msg,'','System')}
function toast(t){const el=SRF_ROOT.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2800)}

/* ================= Eligibility + calculation ================= */
/* ================= Academic years ================= */
S.ays=[{id:'AY2025',name:'2025–26',from:'2025-04-01',to:'2026-03-31',status:'Locked',current:false,lockInfo:{by:'System Admin',at:'2026-04-30',reason:'Year closed after final SRF payments'}},
       {id:'AY2026',name:'2026–27',from:'2026-04-01',to:'2027-03-31',status:'Open',current:true,lockInfo:null}];
const ayOf=d=>S.ays.find(y=>y.from<=d&&d<=y.to);
const ayCur=()=>S.ays.find(y=>y.current)||S.ays.at(-1);
const ayBlock=d=>{const y=ayOf(d);return !y?'No academic year is set up for '+dmy(d):y.status==='Locked'?'Academic year '+y.name+' is locked':null};
function elig(a){
  {const ab=ayBlock(a.collDate);if(ab)return ab;}
  if(!verFor(a.collDate))return 'No incentive policy in force on '+dmy(a.collDate);
  if(a.astatus!=='Confirmed')return 'Admission '+a.astatus.toLowerCase();
  if(!a.isNew)return 'Not a new admission';
  if(a.rstatus!=='Active')return 'Receipt '+a.rstatus.toLowerCase();
  if(!catOk(verFor(a.collDate),a.category))return a.category+' category not eligible';
  if(a.claimedBy)return 'Claimed in '+subOf(a.claimedBy).ref;
  {const d=dupClaim(a);if(d)return 'Claimed in '+d.ref;}
  {const r=rejectedClaim(a);if(r)return 'Rejected in '+r.ref+' – cannot be claimed again';}
  {const e=erpDupReceipt(a);if(e)return 'Receipt '+a.receipt+' is also on '+e.enrol+' in ERP – resolve in Fee Collection first';}
  return null;}
const mapped=(r,branch,date)=>S.emps.filter(e=>e.status==='Active'&&branchOn(e,date)===branch&&r.desig.includes(e.desig));
function defaultAssign(a){
  const v=verFor(a.collDate),out={},ov=SHEET_B[a.enrol];
  v.p.roles.forEach(r=>{const m=mapped(r,a.branch,a.collDate).filter(e=>e.att==='Present');
    out[r.code]=r.mode==='pool'?m.slice(0,r.slots).map(e=>e.bio):(ov?(ov[r.code]||[]):m.slice(0,1).map(e=>e.bio));});
  return out;}
function calc(a,assign){
  const v=verFor(a.collDate),lines=[],exc=[],bad=[];
  onRoles(v).forEach(r=>{const rt=rateFor(v,r,a);
    (assign[r.code]||[]).filter(Boolean).slice(0,r.slots).forEach((id,i)=>{const e=emp(id);
      const why=staffCheck(e,a.branch,a.collDate,v);if(why){bad.push({id,role:r.code,why});return}
      if(e.att!=='Present'){exc.push(e.name+' ('+e.bio+') absent: excluded');return}
      lines.push({role:r.code,slot:i+1,empId:id,amount:rt.amt,src:rt.src});});
    if(r.mode==='pool')mapped(r,a.branch,a.collDate).filter(e=>e.att!=='Present').forEach(e=>exc.push(e.name+' ('+e.bio+') absent on '+dmy(a.collDate)+': excluded'));});
  const total=sum(lines.map(l=>l.amount)),ded=dedFor(v,a);
  return {v,lines,exc,bad,total,ded,bal:a.amount-total-ded,cap:capOf(v.p,a.amount),over:total>capOf(v.p,a.amount)};}

function newDraft(branch){
  const d={branch,from:S.role==='Principal'&&branch?awStart(branch):'2026-08-01',to:S.role==='Principal'?TODAY:'2026-10-31',include:{},assign:{},remark:'',revOf:null,doc:''};
  S.adms.filter(a=>a.branch===branch&&pVisA(a)).forEach(a=>{if(!elig(a)){d.include[a.enrol]=true;d.assign[a.enrol]=defaultAssign(a)}});
  return d;}
function draftAdms(d){return S.adms.filter(a=>a.branch===d.branch&&a.collDate>=d.from&&a.collDate<=d.to&&pVisA(a))}
const fingerprint=(branch,receipts)=>branch+'|'+[...receipts].sort().join(',');
function dupOf(branch,receipts){if(!receipts.length)return null;const f=fingerprint(branch,receipts);
  return S.subs.find(x=>!['Rejected','Returned to Principal'].includes(x.status)&&x.fp===f)||null}
function draftSummary(d,skipDoc){
  const inc=draftAdms(d).filter(a=>d.include[a.enrol]&&!elig(a));
  inc.forEach(a=>{if(!d.assign[a.enrol])d.assign[a.enrol]=defaultAssign(a)});
  const cs=inc.map(a=>({a,c:calc(a,d.assign[a.enrol])}));
  const people=new Set(cs.flatMap(x=>x.c.lines.map(l=>l.empId)));
  const blocks=[],warns=[];
  if(!inc.length)blocks.push('Include at least one eligible admission.');
  cs.filter(x=>x.c.over).forEach(x=>(x.c.v.p.limits.blockOver?blocks:warns).push(x.a.enrol+': incentive '+inr(x.c.total)+' is above the '+inr(x.c.cap)+' limit ('+x.c.v.p.limits.maxPct+'% of SRF).'));
  cs.filter(x=>!x.c.lines.length).forEach(x=>blocks.push(x.a.enrol+': no staff assigned.'));
  const docs=[...new Set(cs.flatMap(x=>x.c.lines.map(l=>vRole(x.c.v,l.role)).filter(r=>r.doc).map(r=>r.doc+' ('+r.label+')')))];
  draftAdms(d).filter(a=>d.include[a.enrol]&&ayBlock(a.collDate)).forEach(a=>blocks.push(a.name+': '+ayBlock(a.collDate)+', so it can’t be submitted. Please ask System Admin.'));
  cs.forEach(x=>x.c.bad.forEach(b=>blocks.push(x.a.enrol+' · '+(vRole(x.c.v,b.role)?.label||b.role)+' · ID '+b.id+': '+b.why)));
  if(docs.length&&!d.doc&&!skipDoc)blocks.push('Upload the required document: '+docs.join(', ')+'.');
  cs.forEach(({a,c})=>{const seen={};c.lines.forEach(l=>(seen[l.empId]=seen[l.empId]||[]).push(l.role));
    Object.entries(seen).forEach(([id,rs])=>{if(rs.length<2)return;const same=new Set(rs).size<rs.length;
      if(same||!c.v.p.multi.multiRoleOneAdmission)blocks.push(a.enrol+': '+emp(id).name+' ('+id+') is assigned twice ('+rs.map(r=>vRole(c.v,r).label).join(', ')+'). One person, one line per admission.')})});
  draftAdms(d).filter(a=>d.include[a.enrol]&&a.claimedBy).forEach(a=>warns.push(a.enrol+' was claimed in '+subOf(a.claimedBy).ref+' and has been left out.'));
  if(d.revOf&&S.subs.some(y=>y.revOf===d.revOf))blocks.push(subOf(d.revOf).ref+' has already been resubmitted. Open the newer revision instead.');
  const fp=dupOf(d.branch,cs.map(x=>x.a.receipt));if(fp)blocks.push('Duplicate of '+fp.ref+': the same receipts were already submitted.');
  S.subs.filter(x=>x.branch===d.branch&&QUEUE.includes(x.status)&&x.from<=d.to&&x.to>=d.from).forEach(x=>warns.push('Open submission '+x.ref+' already covers '+dmy(x.from)+' to '+dmy(x.to)+'. Only receipts not in it can be added here.'));
  return {cs,docs,srf:sum(cs.map(x=>x.a.amount)),inc:sum(cs.map(x=>x.c.total)),ded:sum(cs.map(x=>x.c.ded)),bal:sum(cs.map(x=>x.c.bal)),people:people.size,exc:cs.flatMap(x=>x.c.exc.map(e=>x.a.enrol+': '+e)),blocks,warns};}

function submit(d,silent){
  if(S.submitLock&&!silent){toast('Already submitting. Please wait.');return}
  const s=draftSummary(d,silent);if(s.blocks.length){if(!silent)toast(s.blocks[0]);return}
  if(!silent&&!can('submission','Submit')){deny('Your role cannot submit SRF requests.','Submit');return}
  if(!silent&&!principalBranches().includes(d.branch)){deny('You can submit only for your own branch.','Submit');return}
  if(!silent){const out=s.cs.filter(x=>!pVisA(x.a));if(out.length){deny(out.map(x=>x.a.name).join(', ')+': outside your SRF access period. '+awMsg(d.branch),'Submit');return}}
  const stale=s.cs.filter(x=>x.a.claimedBy||x.a.rstatus!=='Active'||dupClaim(x.a)||erpDupReceipt(x.a));
  if(stale.length){toast(stale.map(x=>x.a.enrol).join(', ')+' can no longer be claimed. Review the list and submit again.');return}
  if(!silent){S.submitLock=true;setTimeout(()=>S.submitLock=false,1500)}
  const id='S'+(++S.seq.sub),ref='SRF-SUB-2026-'+String(S.seq.sub).padStart(4,'0');
  const rev=d.revOf?subOf(d.revOf).rev+1:0;
  const sub={id,ref,branch:d.branch,from:d.from,to:d.to,status:'Pending Accounts Verification',level:1,submittedBy:S.uid,submittedRole:S.role,locked:null,rev,revOf:d.revOf,remark:d.remark,doc:d.doc,
    fp:fingerprint(d.branch,s.cs.map(x=>x.a.receipt)),submittedAt:silent?'2026-08-12':TODAY,verRef:null,verifier:null,verRemark:'',
    adms:s.cs.map(x=>({enrol:x.a.enrol,amountSnap:x.a.amount,version:x.c.v.v,total:x.c.total,ded:x.c.ded,bal:x.c.bal,
      lines:x.c.lines.map(l=>Object.assign(l,{id:'L'+(++S.seq.line),sub:id,enrol:x.a.enrol,snap:snapOf(l.empId,x.a),vstatus:'Pending',pstatus:null,batch:null,payRef:'',paidOn:null,note:''}))}))};
  S.subs.push(sub);sub.adms.forEach(x=>adm(x.enrol).claimedBy=id);
  log('Submit','Submission '+ref,sub.adms.length+' admissions, '+inr(s.inc)+' incentive; staff branch mapping captured'+(rev?' (revision R'+rev+' of '+subOf(d.revOf).ref+')':''));
  S.drafts=S.drafts.filter(x=>!(x.by===S.uid&&x.id===d.draftId));notify('Submitted',ref+' · '+BR[d.branch]);
  if(!silent){const u=cu(),w=awWin(u,d.branch);awGrants(u,d.branch).forEach(g=>{const used=s.cs.filter(x=>x.a.collDate<w.start&&g.from<=x.a.collDate&&x.a.collDate<=g.to);if(used.length){g.used.push(ref);log('Special access used','Grant '+g.id,u.name+' submitted '+ref+' with '+used.length+' reopened SRF record'+(used.length>1?'s':'')+' ('+used.map(x=>x.a.enrol).join(', ')+')','','System')}})}
  if(!silent)toast('Sent! '+ref+' is now with Accounts.');}


/* ================= Principal SRF submission access window + special reopening ================= */
// Rules: scope all | branch | user. Latest effective rule wins at the most specific level (user > branch > all).
S.awRules=[
  {id:'AW-001',scope:'all',target:'',days:3,preset:'3 Days',from:'2026-10-01',status:'Active',by:'System Admin',at:'2026-09-30',reason:'Default: Principals submit within the latest 3 days'},
  {id:'AW-002',scope:'branch',target:'ABG',days:7,preset:'7 Days',from:'2026-10-10',status:'Active',by:'System Admin',at:'2026-10-09',reason:'Weekly batching approved for Akbarbagh Girls'},
  {id:'AW-003',scope:'user',target:'U2',days:30,preset:'1 Month',from:'2026-11-01',status:'Active',by:'System Admin',at:'2026-10-15',reason:'Month-end submission trial'}];
S.grants=[];
S.aw={edit:null,del:null,rmsg:'',scope:'all',target:'',preset:'3 Days',custom:10,from:TODAY,reason:'',msg:'',open:false,g:{uid:'',branch:'',from:'',to:'',n:2,unit:'Days',reason:'',ref:'',remarks:'',doc:''},gmsg:''};
const AW_PRESETS=[['3 Days',3],['7 Days',7],['15 Days',15],['1 Month',30],['Custom',0]];
const isoAdd=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const p2=n=>String(n).padStart(2,'0');
const stampAdd=(st,hours)=>{const x=new Date(st.replace(' ','T')+':00');x.setTime(x.getTime()+hours*3600e3);return x.getFullYear()+'-'+p2(x.getMonth()+1)+'-'+p2(x.getDate())+' '+p2(x.getHours())+':'+p2(x.getMinutes())};
const awLabel=r=>r.preset==='Custom'?r.days+' days':r.preset;
const awStatus=r=>r.status!=='Active'?'Inactive':r.from>TODAY?'Scheduled':'Active';
const awTarget=r=>r.scope==='all'?'All Principals':r.scope==='branch'?(BR[r.target]||r.target)+' (branch)':(()=>{const u=S.users.find(x=>x.id===r.target);return u?u.name+' · '+userBranches(u).map(c=>BR[c]).join(', ')+' (Principal-wise)':r.target})();
function awRule(u,b){const on=S.awRules.filter(r=>r.status==='Active'&&r.from<=TODAY),pick=k=>on.filter(k).sort((x,y)=>y.from.localeCompare(x.from)||y.id.localeCompare(x.id))[0];
  return pick(r=>r.scope==='user'&&r.target===u.id)||pick(r=>r.scope==='branch'&&r.target===b)||pick(r=>r.scope==='all')||{id:'—',scope:'all',days:3,preset:'3 Days',from:'',reason:'System default'}}
function awWin(u,b){const r=awRule(u,b);return {rule:r,days:r.days,start:isoAdd(TODAY,-(r.days-1))}}
function awGrants(u,b){awTick();return S.grants.filter(g=>g.uid===u.id&&g.branch===b&&g.status==='Active')}
// Can the signed-in Principal see an SRF record of branch b collected on date d? Other roles are not limited by the window.
function pVis(b,d){if(S.role!=='Principal')return true;const u=cu();if(!u||!principalBranches().includes(b)||d>TODAY)return false;
  return d>=awWin(u,b).start||awGrants(u,b).some(g=>g.from<=d&&d<=g.to)}
const pVisA=a=>pVis(a.branch,a.collDate);
function awStart(b){const u=cu();if(!u)return TODAY;return [awWin(u,b).start,...awGrants(u,b).map(g=>g.from)].sort()[0]}
// Close special access automatically at its approved expiry time.
const awNow=()=>{const t=new Date();return TODAY+' '+p2(t.getHours())+':'+p2(t.getMinutes())};
function awTick(){const now=awNow();S.grants.forEach(g=>{if(g.status==='Active'&&g.expires<=now){g.status='Expired';g.closedAt=g.expires;
  log('Special access expired','Grant '+g.id,(S.users.find(u=>u.id===g.uid)?.name||g.uid)+' · '+BR[g.branch]+' · SRF '+dmy(g.from)+' to '+dmy(g.to)+' · closed automatically at '+fcWhen(g.expires)+' · submitted during access: '+(g.used.length?'Yes ('+g.used.join(', ')+')':'No'),'','System');S.audit[0].user='System';S.audit[0].login='system';S.audit[0].role='System';S.audit[0].device='Server'}})}
const awMsg=b=>{const u=cu(),w=awWin(u,b);return 'Only SRF records from the last '+w.days+' days are available for submission. For older records, please contact Corporate Finance.'};
const grantMsg=g=>'Special access has been granted for SRF submission from '+dmy(g.from)+' to '+dmy(g.to)+'. Please complete the submission before '+fcWhen(g.expires)+'.';
function awBanner(bs){if(S.role!=='Principal')return '';bs=bs||principalBranches();
  return bs.map(b=>'<div class="msg info">'+(bs.length>1?'<b>'+h(BR[b])+':</b> ':'')+h(awMsg(b))+'</div>'+awGrants(cu(),b).map(g=>'<div class="msg good"><b>Special access.</b> '+h(grantMsg(g))+'</div>').join('')).join('');}

SRF_BRIDGE.feed({S,mkEmp,mkAdm,fcRow});
/* seed replaced by the Fee Desk bridge */
/* demo data is seeded by the Fee Desk bridge once every declaration below is in place (see end of module) */

const allLines=()=>S.subs.flatMap(s=>s.adms.flatMap(a=>a.lines));
const lineById=id=>allLines().find(l=>l.id===id);
/* ================= Duplicate controls: one receipt, one claim; one employee, one payment per receipt ================= */
const LIVE_SUB=s=>!['Rejected','Returned to Principal'].includes(s.status);
const sameRcpt=(a,b)=>!!a&&!!b&&(a.enrol===b.enrol||(!!a.receipt&&a.receipt===b.receipt));
// another live submission that already carries this student or receipt number (checked against the submissions themselves, not just the claim flag)
function dupClaim(a,exceptSub){if(!a)return null;return S.subs.find(s=>s.id!==exceptSub&&LIVE_SUB(s)&&s.adms.some(y=>sameRcpt(a,adm(y.enrol)||{enrol:y.enrol})))||null}
// a claim for this receipt that Accounts rejected: it cannot be raised again (Accounts returns a request when a corrected resubmission is wanted)
function rejectedClaim(a){return S.subs.find(s=>s.status==='Rejected'&&s.adms.some(y=>y.enrol===a.enrol))||null}
// the same receipt number on another active admission in the ERP feed
function erpDupReceipt(a){return a.receipt?S.adms.find(x=>x!==a&&x.receipt===a.receipt&&x.rstatus==='Active')||null:null}
// a line that already pays (or is on its way to paying) this employee for the same receipt; the earlier line wins
const PAY_LIVE=l=>l.vstatus==='Approved'&&!!l.pstatus&&!['Cancelled','Reversed','Written off'].includes(l.pstatus);
const payRank=l=>['Pending HR Processing','On Hold'].includes(l.pstatus)?0:1;
function dupPay(l){const a=adm(l.enrol);return allLines().find(o=>o.id!==l.id&&o.empId===l.empId&&PAY_LIVE(o)&&sameRcpt(a,adm(o.enrol))&&(payRank(o)>payRank(l)||payRank(o)===payRank(l)&&+o.id.slice(1)<+l.id.slice(1)))||null}
const batchOfLine=id=>S.batches.find(b=>b.status!=='Cancelled'&&b.lines.includes(id))||null;
const PAY_DONE=['Paid','Recovered','Reversed','Cancelled','Written off'];
const WEEKDAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ptype=()=>({Daily:'date',Weekly:'week'})[curV().p.cycle.freq]||'month';
const periodKey=()=>S.hr.pd[ptype()];
function weekMonday(k){const [y,w]=k.split('-W').map(Number),j4=new Date(Date.UTC(y,0,4)),d=(j4.getUTCDay()+6)%7;return new Date(Date.UTC(y,0,4-d+(w-1)*7))}
function periodMonth(k){if(!k)return '';if(k.includes('-W'))return weekMonday(k).toISOString().slice(0,7);return k.slice(0,7)}
function periodLabel(k){if(!k)return '—';if(k.includes('-W')){const m=weekMonday(k),e=new Date(m.getTime()+6*864e5);return 'Week '+Number(k.split('-W')[1])+' ('+dmy(m.toISOString().slice(0,10))+' to '+dmy(e.toISOString().slice(0,10))+')'}
  if(k.length===10)return dmy(k);return MONTHS.at(Number(k.slice(5,7))-1)+' '+k.slice(0,4)}
function cutoffText(c){return c.freq==='Daily'?'daily cut-off '+c.cutoffTime:c.freq==='Weekly'?'weekly cut-off '+c.cutoffWeekday:c.freq==='Fortnightly'?'cut-off days '+Math.min(c.cutoff,14)+' and '+(Math.min(c.cutoff,14)+14):c.freq==='Quarterly'?'cut-off day '+c.cutoff+' of the quarter’s last month':'cut-off day '+c.cutoff}
const QUEUE=['Pending Accounts Verification','Pending L2 Verification','On Hold'];

/* ================= Accounts ================= */
function admChecks(sub,x){const a=adm(x.enrol);return [
  ['Confirmed',a.astatus==='Confirmed'],['New admission',a.isNew],['Receipt active',a.rstatus==='Active'],
  ['Amount matches',x.amountSnap===a.amount],['Claimed only here',!dupClaim(a,sub.id)],['Receipt unique in ERP',!erpDupReceipt(a)],['Not paid before',!x.lines.some(l=>allLines().some(o=>o.sub!==sub.id&&o.empId===l.empId&&PAY_LIVE(o)&&sameRcpt(a,adm(o.enrol))))],['Category eligible',catOk(verNo(x.version),a.category)]];}
function lineChecks(x,l){const e=emp(l.empId),v=verNo(x.version),r=vRole(v,l.role),rt=rateFor(v,r,adm(x.enrol));return [
  ['Mapped to branch',(!!e&&!e.gone&&branchOn(e,adm(x.enrol).collDate)===subOf(l.sub).branch)||(!!l.snap&&l.snap.branch===subOf(l.sub).branch)],['Active',e&&e.status==='Active'],['Present',e&&e.att==='Present'],['Rule '+inr(rt.amt),l.amount===rt.amt]];}
function decide(type){
  const sub=subOf(S.acc.sel);if(!sub)return;const rm=S.acc.remark.trim(),ap=curV().p.approval,R=S.routing;
  if(sub.locked){deny(sub.ref+' is locked by System Admin: '+sub.locked.reason,'Submission '+sub.ref);return}
  {const lk=sub.adms.map(x=>ayBlock(adm(x.enrol).collDate)).find(Boolean);if(lk){deny(lk+'. Verification is paused until System Admin unlocks it.','Submission '+sub.ref);return}}
  if(!userBranches().includes(sub.branch)){deny('This branch is outside your data scope.','Submission '+sub.ref);return}
  if(sub.submittedBy===S.uid){deny('You submitted '+sub.ref+'. No user can verify or approve their own submission.','Submission '+sub.ref);return}
  if(sub.level===1&&!(can('verification','Verify')&&(S.role===R.l1||S.role===R.l2))){deny('Level 1 verification is routed to '+R.l1+'.','Submission '+sub.ref);return}
  if(sub.level===2&&!(can('verification','Approve')&&S.role===R.l2)){deny('Level 2 approval is routed to '+R.l2+'.','Submission '+sub.ref);return}
  const lines=sub.adms.flatMap(a=>a.lines),chk=lines.filter(l=>S.acc.checked[l.id]);
  const partial=type==='approve'&&chk.length<lines.length;
  if((type!=='approve'||partial)&&!rm){toast('Please write a comment first. It is needed to return, reject or hold, or to verify only some staff.');return}
  if(type==='approve'&&!chk.length){toast('Select at least one line to approve');return}
  if(type==='approve'){const dd=sub.adms.filter(x=>x.lines.some(l=>S.acc.checked[l.id])).map(x=>({x,o:dupClaim(adm(x.enrol),sub.id)})).filter(p=>p.o&&(+p.o.id.slice(1)<+sub.id.slice(1)||p.o.verRef));
    if(dd.length){deny('Duplicate claim: '+dd.map(p=>p.x.enrol+' is already in '+p.o.ref).join('; ')+'. Untick those lines and reject them with a comment.','Submission '+sub.ref);return}
    const dp=chk.filter(l=>dupPay(l)&&dupPay(l).sub!==sub.id);if(dp.length){deny('Already paid: '+dp.map(l=>emp(l.empId).name+' for '+l.enrol+' ('+subOf(dupPay(l).sub).ref+')').join('; ')+'. Untick those lines.','Submission '+sub.ref);return}}
  const own=chk.filter(l=>l.empId===cu().empId);if(type==='approve'&&own.length){deny('You cannot approve your own SRF incentive line. Untick it; another verifier must decide it.','Submission '+sub.ref);return}
  const old=sub.status,amt=sum(chk.map(l=>l.amount));
  if(type==='approve'&&sub.level===1&&amt>ap.l2Above){
    sub.level=2;sub.status='Pending L2 Verification';sub.l1=cu().name+' ('+S.role+')';
    log('L1 approve','Submission '+sub.ref,old+' → '+sub.status+' ('+inr(amt)+' is above '+inr(ap.l2Above)+')',rm);
    toast('Level 1 done. '+sub.ref+' has gone to '+R.l2+' for final approval.');S.acc.remark='';render();return}
  if(type==='approve'){
    S.seq.ver++;sub.verRef='SRF-VER-2026-'+String(S.seq.ver).padStart(6,'0');sub.verifier=cu().name+' ('+S.role+')';
    lines.forEach(l=>{if(S.acc.checked[l.id]){l.vstatus='Approved';l.pstatus='Pending HR Processing'}else{l.vstatus='Rejected';l.note=rm}});
    sub.status=partial?'Partially Verified – Pending HR Payment':'Verified – Pending HR Payment';
    sub.adms.forEach(x=>{if(!x.lines.some(l=>l.vstatus==='Approved'))adm(x.enrol).claimedBy=null});
  }else if(type==='return'){sub.status='Returned to Principal';sub.adms.forEach(x=>adm(x.enrol).claimedBy=null)}
  else if(type==='reject'){sub.status='Rejected';lines.forEach(l=>l.vstatus='Rejected');sub.adms.forEach(x=>adm(x.enrol).claimedBy=null)}
  else if(type==='hold'){sub.status='On Hold'}
  else if(type==='release'){sub.status=sub.level===2?'Pending L2 Verification':'Pending Accounts Verification'}
  sub.verRemark=rm;log({approve:partial?'Partial approve':'Approve',return:'Return',reject:'Reject',hold:'Hold',release:'Release hold'}[type],'Submission '+sub.ref,old+' → '+sub.status+(sub.verRef&&type==='approve'?' ('+sub.verRef+', '+chk.length+'/'+lines.length+' lines)':''),rm);
  if(type==='approve')notify('Verified',sub.ref);else if(type==='return')notify('Returned',sub.ref);else if(type==='reject')notify('Rejected',sub.ref);
  toast({approve:'Verified. '+sub.ref+' is on its way to HR for payment.',return:'Sent back to the Principal with your comment.',reject:'Rejected. The Principal will see your comment.',hold:'On hold. It stays in your queue until you release it.',release:'Released. It’s back in the queue.'}[type]||sub.ref+': '+sub.status);S.acc.remark='';render();}

/* ================= HR ================= */
function createBatch(){
  if(!can('payment','Create')){deny('Your role cannot create payment batches.','Payment batch');return}
  const p=curV().p,cap=p.limits.perEmployeeMonth;
  const ids=Object.keys(S.hr.checked).filter(k=>S.hr.checked[k]&&lineById(k)?.pstatus==='Pending HR Processing'&&!subOf(lineById(k).sub).locked&&userBranches().includes(subOf(lineById(k).sub).branch));
  if(!ids.length){toast('Select approved lines to include');return}
  const pk=periodKey(),pm=periodMonth(pk);
  const monthTotal=id=>sum(S.batches.filter(b=>b.month===pm).flatMap(b=>b.lines).map(lineById).filter(l=>l.empId===id&&l.pstatus!=='Reversed').map(l=>l.amount));
  const take=[],skip=[],dup=[],run={};
  [...new Set(ids)].forEach(k=>{const l=lineById(k);const ib=batchOfLine(k),dp=dupPay(l);
    if(ib){dup.push(l);l.note='Duplicate: already in batch '+ib.ref;return}
    if(dp){const ob=dp.batch?' in '+dp.batch:'';dup.push(l);l.pstatus='On Hold';l.note='Duplicate: '+emp(l.empId).name+' is already being paid for '+l.enrol+' on line '+dp.id+' ('+subOf(dp.sub).ref+ob+')';log('Duplicate payment blocked','Line '+l.id,l.note,'','Finance');return}
    const t=(run[l.empId]??monthTotal(l.empId))+l.amount;if(t>cap){skip.push(l);l.note=p.limits.carry?'Over '+inr(cap)+' monthly cap: carried to next month':'Over monthly cap: not payable'}else{run[l.empId]=t;take.push(k)}});
  if(!take.length){toast(dup.length?'Nothing to pay: the selected lines are duplicates of payments already made or batched.':'All selected lines exceed the monthly cap per employee');render();return}
  const n=++S.seq.bat,ref='SRF-PAY-'+pk.replace(/-/g,'')+'-'+String(n).padStart(3,'0');
  const st='In Batch';
  S.batches.push({ref,createdBy:S.uid,period:pk,month:pm,method:S.hr.method,code:p.cycle.earning,lines:take,status:'Open',payRef:''});
  take.forEach(k=>{const l=lineById(k);l.pstatus=st;l.batch=ref;l.note=''});S.hr.checked={};
  log('Create batch','Batch '+ref,take.length+' lines, '+inr(sum(take.map(k=>lineById(k).amount)))+', '+S.hr.method+(skip.length?'; '+skip.length+' over monthly cap':'')+(dup.length?'; '+dup.length+' duplicate'+(dup.length>1?'s':'')+' held':''));
  notify('Batch created',ref);
  toast('Batch '+ref+' is ready'+(skip.length?' ('+skip.length+' held back by the monthly cap)':'')+(dup.length?' ('+dup.length+' duplicate line'+(dup.length>1?'s':'')+' put on hold)':'')+'. Next, include it in payroll.');render();}
function markPaid(ref){
  if(!can('payment','Pay')){deny('Your role cannot mark payments as paid.','Batch '+ref);return}
  const b=S.batches.find(x=>x.ref===ref),r=(S.hr.ref[ref]||'').trim();
  if(b.status==='Paid'){toast(ref+' is already marked as paid ('+b.payRef+'). Nothing was changed.');return}
  if(b.lines.some(k=>lineById(k).empId===cu().empId)){deny('This batch includes your own SRF incentive. Another HR user must release it.','Batch '+ref);return}
  if(!r){toast(b.method==='Payroll'?'Enter the payroll run reference':'Enter the bank UTR');return}
  if(b.method!=='Payroll'&&!SRF_ROOT.getElementById('proof-'+ref)?.files?.length){toast('Upload payment proof for a payment outside payroll');return}
  const dupRef=S.batches.find(x=>x.ref!==ref&&x.payRef&&x.payRef.toLowerCase()===r.toLowerCase()&&!(x.method==='Payroll'&&b.method==='Payroll'&&x.period===b.period));
  if(dupRef){toast((b.method==='Payroll'?'Payroll reference ':'UTR ')+r+' is already recorded on '+dupRef.ref+(b.method==='Payroll'?' for '+periodLabel(dupRef.period)+'. A payroll run pays one period only.':'. Check the bank statement: one UTR pays one batch.'));return}
  b.status='Paid';b.payRef=r;b.lines.forEach(k=>{const l=lineById(k);if(['In Batch','Included in Payroll','Payment Released'].includes(l.pstatus)){l.pstatus='Paid';l.payRef=r;l.paidOn=TODAY}});
  log('Mark paid','Batch '+ref,'Reference '+r);notify('Paid',ref);toast('Paid. Staff will now see these incentives as paid.');render();}
function includePayroll(ref){if(!can('payment','Pay')){deny('Your role cannot include payments in payroll.','Batch '+ref);return}const b=S.batches.find(x=>x.ref===ref);
  if(b.method!=='Payroll'){toast('This batch is paid by bank transfer. Use Mark as Paid with the bank reference.');return}
  if(b.status!=='Open'){toast(ref+' is already '+b.status.toLowerCase()+'. Nothing was changed.');return}
  let n=0;b.lines.forEach(k=>{const l=lineById(k);if(l.pstatus==='In Batch'){l.pstatus='Included in Payroll';n++}});b.status='In Payroll';
  log('Include in payroll','Batch '+ref,n+' lines → Included in Payroll ('+b.code+', '+periodLabel(b.period)+')');toast('Added to the '+periodLabel(b.period)+' payroll. Mark it as paid once payroll is posted.');render();}
function holdLine(id){if(!can('payment','Pay')){deny('Your role cannot hold payments.','Line '+id);return}const r=S.hr.reason.trim();if(!r){toast('Type a hold reason in the box above the table');return}
  const l=lineById(id),o=l.pstatus;l.pstatus='On Hold';l.note=r;log('Hold payment','Line '+id,o+' → On Hold',r);render();}
function releaseLine(id){const l=lineById(id);if(adm(l.enrol).rstatus!=='Active'){toast('Receipt is '+adm(l.enrol).rstatus.toLowerCase()+': this line cannot be released');return}
  {const dp=dupPay(l);if(dp){toast('Duplicate: '+emp(l.empId).name+' is already paid or batched for '+l.enrol+' on line '+dp.id+'. This line stays on hold.');return}}
  l.pstatus='Pending HR Processing';l.batch=null;l.note='';log('Release hold','Line '+id,'On Hold → Pending HR Processing');render();}
function requestReversal(id){if(!can('payment','Reverse')){deny('Your role cannot request reversals.','Line '+id);return}const r=S.hr.reason.trim();if(!r){toast('Type a reversal reason in the box above the table');return}
  S.revs.push({id:'R'+(S.revs.length+1),line:id,reason:r,status:'Pending',by:S.uid});log('Request reversal','Line '+id,'Awaiting Corporate Finance approval',r);toast('Reversal sent to Corporate Finance');render();}
function recovered(id){const l=lineById(id);l.pstatus='Recovered';const pm=periodLabel(periodMonth(periodKey()));l.note='Deducted in payroll '+pm+' ('+curV().p.cycle.deduction+')';log('Recovery settled','Line '+id,'Recovery Required → Recovered ('+pm+')');render();}

/* ================= Corporate Finance: actions ================= */
function approveRev(id){const r=S.revs.find(x=>x.id===id),l=lineById(r.line);
  if(!can('payment','Approve')||S.role!==S.routing.reversal){deny('Reversal approval is routed to '+S.routing.reversal+'.','Line '+l.id);return}
  if(r.by===S.uid||l.empId===cu().empId){deny('You cannot approve a reversal you requested or one on your own payment.','Line '+l.id);return}
  r.status='Approved';l.pstatus='Reversed';
  log('Approve reversal','Line '+l.id,'Paid → Reversed',r.reason);toast('Reversal approved: reports updated');render();}
function applyRcpt(a,to){const rf=curV().p.refund,fx=[];a.rstatus=to;
  if(a.claimedBy&&to!=='Active'){subOf(a.claimedBy).adms.filter(x=>x.enrol===a.enrol).forEach(x=>x.lines.forEach(l=>{
    if(l.vstatus!=='Approved')return;
    if(l.pstatus==='Paid'){l.pstatus=rf.afterPay==='recover'?'Recovery Required':'Written off';if(rf.afterPay==='recover')notify('Recovery required',l.id);l.note='Receipt '+to.toLowerCase()+' after payment';fx.push(l.id)}
    else if(!PAY_DONE.includes(l.pstatus)&&l.pstatus!=='Recovery Required'){l.pstatus=rf.beforePay==='hold'?'On Hold':'Cancelled';l.note='Receipt '+to.toLowerCase()+' before payment';fx.push(l.id)}}))}
  return fx;}
function simulate(){if(!can('sysadmin','Admin')){deny('Only System Admin can run integration tests.','Integration');return}
  const a=adm(S.cp.sim),to=S.cp.simTo,o=a.rstatus;if(o===to){toast('Receipt is already '+to.toLowerCase());return}
  const fx=applyRcpt(a,to);const f=S.fc.find(x=>x.receipt===a.receipt);if(f)f.rstatus=to;
  log('Receipt status event','Receipt '+a.receipt,o+' → '+to+(fx.length?'; '+fx.length+' SRF lines flagged':''),'Fee Collection event');
  toast(a.receipt+' '+to.toLowerCase()+(fx.length?': '+fx.length+' incentive lines flagged':''));render();}

/* ================= Fee Collection sync ================= */
const FC_FIELDS=[['amount','Amount'],['rstatus','Receipt status'],['astatus','Admission status'],['category','Category'],['isNew','New admission'],['cls','Class'],['name','Name'],['mode','Payment mode']];
const fcFmt=(k,v)=>k==='amount'?inr(v):k==='isNew'?(v?'Yes':'No'):String(v);
const fcNow=()=>{const t=new Date();return TODAY+' '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')};
const fcWhen=x=>x?dmy(x.slice(0,10))+' '+x.slice(11):'never';
function fcScope(){const u=cu();if(S.role==='Principal')return principalBranches();return u&&u.scope.type==='all'?null:userBranches()}
function fcMay(){return can('sysadmin','Admin')||(S.role==='Principal'&&can('submission','Create'))||can('verification','Verify')}
// Rows in Fee Collection that differ from SRF (new or changed). Read-only preview.
function fcPending(br){return S.fc.filter(f=>f.head==='SRF'&&(!br||br.includes(f.branch))).filter(f=>{const a=S.adms.find(x=>x.receipt===f.receipt);return !a||FC_FIELDS.some(([k])=>a[k]!==f[k])})}
// Why a pending row cannot be applied (null = it will import on the next sync)
function fcBlock(f){if(!BR[f.branch])return 'Branch code '+f.branch+' is not in the branch master. System Admin must add the branch, then sync again.';
  const ab=ayBlock(f.date),a=S.adms.find(x=>x.receipt===f.receipt);if(ab)return ab+(a?'. Change not applied.':'. Receipt not imported.');
  if(!a){const dup=S.adms.find(x=>x.enrol===f.enrol);if(dup)return 'Student already has SRF receipt '+dup.receipt+'. Second receipt not imported; check with Fee Collection.'}return null}
const fcWaiting=br=>fcPending(br).filter(f=>!fcBlock(f)&&pVis(f.branch,f.date));
const fcStuck=br=>fcPending(br).filter(f=>fcBlock(f)&&pVis(f.branch,f.date));
function fcSync(trigger){
  if(!fcMay()){deny('Your role cannot sync receipts from Fee Collection.','Fee Collection sync');return null}
  const br=fcScope(),run={id:'FS-'+String(S.fcs.runs.length+1).padStart(3,'0'),at:fcNow(),by:cu().name,trigger,scope:br?br.map(b=>BR[b]||b).join(', '):'All branches',read:0,added:0,updated:0,unchanged:0,ignored:0,issues:[],changes:[]};
  const issue=(f,msg)=>run.issues.push({receipt:f.receipt,student:f.name+' ('+f.enrol+')',msg,branch:f.branch,date:f.date});
  S.fc.forEach(f=>{if(br&&!br.includes(f.branch))return;
    if(f.head!=='SRF'){run.ignored++;return}
    run.read++;
    const a=S.adms.find(x=>x.receipt===f.receipt),diffs=a?FC_FIELDS.filter(([k])=>a[k]!==f[k]):null;
    if(a&&!diffs.length){run.unchanged++;return}
    {const why=fcBlock(f);if(why){issue(f,why);return}}
    if(!a){
      const n={enrol:f.enrol,name:f.name,cls:f.cls,branch:f.branch,admDate:f.date,collDate:f.date,amount:f.amount,receipt:f.receipt,mode:f.mode,category:f.category,rstatus:f.rstatus,astatus:f.astatus,isNew:f.isNew,claimedBy:null,src:'Fee Collection',synced:TODAY};
      S.adms.push(n);run.added++;run.changes.push({receipt:f.receipt,student:n.name+' ('+n.enrol+')',branch:n.branch,date:n.collDate,what:'New SRF receipt '+inr(n.amount)+' collected '+dmy(n.collDate)+(elig(n)?' · not claimable: '+elig(n):'')});
      if(S.draft&&S.draft.branch===n.branch&&!elig(n)){S.draft.include[n.enrol]=true;S.draft.assign[n.enrol]=defaultAssign(n)}
      return}
    const txt=diffs.map(([k,l])=>l+' '+fcFmt(k,a[k])+' → '+fcFmt(k,f[k])).join('; ');
    diffs.forEach(([k])=>{if(k!=='rstatus')a[k]=f[k]});
    const fx=a.rstatus!==f.rstatus?applyRcpt(a,f.rstatus):[];
    a.synced=TODAY;run.updated++;
    run.changes.push({receipt:f.receipt,student:a.name+' ('+a.enrol+')',branch:a.branch,date:a.collDate,what:txt+(fx.length?' · '+fx.length+' incentive line'+(fx.length>1?'s':'')+' put on hold or recovery':'')});
    if(a.claimedBy&&diffs.some(([k])=>k!=='cls'&&k!=='name'&&k!=='mode'))issue(f,'Changed after it was claimed in '+subOf(a.claimedBy).ref+'. Accounts will see this when verifying.');});
  S.fcs.last=run.at;S.fcs.lastBy=run.by;S.fcs.runs.unshift(run);
  log('Fee Collection sync','Fee Collection',run.scope+': '+run.read+' SRF receipts read, '+run.added+' new, '+run.updated+' updated, '+run.unchanged+' unchanged, '+run.issues.length+' need attention','','System');
  if(S.role==='Principal'){const vis=run.changes.filter(c=>pVis(c.branch,c.date)).length,iss=run.issues.filter(c=>pVis(c.branch,c.date)).length;toast(vis?'Synced: '+vis+' change'+(vis>1?'s':'')+' in your access period':'Already up to date'+(iss?' · '+iss+' need attention':''));return run}
  toast(run.added+run.updated?'Synced: '+run.added+' new, '+run.updated+' updated'+(run.issues.length?', '+run.issues.length+' need attention':''):'Already up to date'+(run.issues.length?' · '+run.issues.length+' need attention':''));
  return run;}
// Compact bar for Principal and Accounts screens
const fcState=br=>{const w=fcWaiting(br).length,k=fcStuck(br).length;return (w?'<span class="sp sp-orange">'+w+' receipt change'+(w>1?'s':'')+' waiting</span>':'<span class="sp sp-green">Up to date</span>')+(k?' <span class="sp sp-red" title="'+h(fcStuck(br).map(f=>f.receipt+': '+fcBlock(f)).join('\n'))+'">'+k+' need'+(k>1?'':'s')+' attention</span>':'')};
function fcBar(){if(!fcMay())return '';
  return '<div class="fcbar"><span><b>Fee Collection</b> · last synced '+fcWhen(S.fcs.last)+' · '+fcState(fcScope())+'</span><button class="btn sm" data-act="fcsync">Sync now</button></div>';}
function fcRunView(r){if(!r)return '<div class="empty">No sync has been run in this session yet. Click “Sync now”.</div>';
  return '<div class="row" style="gap:8px">'+[['Read',r.read,'grey'],['New',r.added,'blue'],['Updated',r.updated,'blue'],['Unchanged',r.unchanged,'green'],['Need attention',r.issues.length,r.issues.length?'red':'green']].map(([l,n,c])=>'<span class="sp sp-'+c+'">'+l+' '+n+'</span>').join('')+(r.ignored?'<span class="id">'+r.ignored+' non-SRF receipt'+(r.ignored>1?'s':'')+' ignored</span>':'')+'</div>'+
  (r.changes.length?'<div class="tw"><table><thead><tr><th>Receipt</th><th>Student</th><th>What changed</th></tr></thead><tbody>'+r.changes.map(c=>'<tr><td class="num">'+h(c.receipt)+'</td><td>'+h(c.student)+'</td><td style="white-space:normal;min-width:220px">'+h(c.what)+'</td></tr>').join('')+'</tbody></table></div>':'')+
  (r.issues.length?'<h3>Need attention</h3><div class="tw"><table><thead><tr><th>Receipt</th><th>Student</th><th>Why</th></tr></thead><tbody>'+r.issues.map(c=>'<tr><td class="num">'+h(c.receipt)+'</td><td>'+h(c.student)+'</td><td style="white-space:normal;min-width:220px">'+h(c.msg)+'</td></tr>').join('')+'</tbody></table></div>':'');}

/* ================= Shared view helpers ================= */
const st=s=>{const m={'Pending Accounts Verification':'warn','Pending L2 Verification':'warn','On Hold':'warn','Returned to Principal':'warn','Rejected':'bad',
  'Verified – Pending HR Payment':'good','Partially Verified – Pending HR Payment':'good','Pending':'warn','Approved':'good',
  'Pending HR Processing':'acc','Included in Payroll':'acc','Payment Released':'acc','Paid':'good','Reversed':'bad','Recovery Required':'bad','Cancelled':'bad','Written off':'bad','Recovered':''};
  return '<span class="pill '+(m[s]??'')+'">'+h(s)+'</span>'};
// A Principal sees only their own branches; any other branch is shown without its name.
const brShow=c=>S.role==='Principal'&&!principalBranches().includes(c)?'Another branch':(BR[c]||c);
const curCell=(e,l)=>{const cb=curBranch(e);return cb!==l.snap?.branch?'<span class="pill warn" title="Transferred after submission">'+h(BR[cb]||cb)+'</span>':h(BR[cb]||cb)};
const tick=([t,ok])=>'<span class="pill '+(ok?'good':'bad')+'">'+(ok?'✓ ':'✕ ')+h(t)+'</span>';

/* ================= Principal ================= */
function principalBranches(){return S.role==='Principal'?userBranches():[]}
function asOnDate(d,s){return s.cs.length?s.cs.map(x=>x.a.collDate).sort().at(-1):(d.to<TODAY?d.to:TODAY)}
function pTop(d){const own=principalBranches();
  return '<div class="row">'+
    '<label class="f">Branch<select id="p-branch" data-chg="branch"><option value="">Select branch</option>'+own.map(k=>'<option value="'+k+'"'+(k===d.branch?' selected':'')+'>'+h(BR[k])+'</option>').join('')+'</select></label>'+
    '<label class="f">Academic year<select id="p-ay" disabled><option>2026–27</option></select></label>'+
    '<label class="f">From<input type="date" id="p-from" data-chg="from" value="'+d.from+'"'+(d.branch?'':' disabled')+'></label>'+
    '<label class="f">To<input type="date" id="p-to" data-chg="to" value="'+d.to+'"'+(d.branch?'':' disabled')+'></label></div>'+
    (own.length?'':'<div class="msg bad">No branch is mapped to your login. Ask System Admin to map your authorised branch.</div>');}
function staffPanel(d,s){const asOn=asOnDate(d,s),v=verFor(asOn),L=S.lookup;
  const all=S.emps.filter(e=>e.postings.some(p=>p.branch===d.branch));
  const shown=all.filter(e=>!staffCheck(e,d.branch,asOn,v));
  const ex={inactive:0,transferred:0,desig:0};all.forEach(e=>{if(shown.includes(e))return;if(branchOn(e,asOn)!==d.branch)ex.transferred++;else if(e.status!=='Active')ex.inactive++;else ex.desig++});
  const roleOf=e=>onRoles(v).find(r=>r.desig.includes(e.desig))?.label||'—';
  const res=L.res?(L.res.ok?'<div class="msg good">'+h(L.res.e.name)+' · '+L.res.e.bio+' · '+h(L.res.e.desig)+' · '+h(L.res.e.dept)+' · '+h(L.res.e.status)+' · '+h(BR[d.branch])+': can be assigned.</div>':'<div class="msg bad">'+h(L.res.msg)+'</div>'):'';
  return '<section class="panel"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><h3>Eligible staff from HRMS</h3><p class="sub">'+h(BR[d.branch])+' · branch mapping as on '+dmy(asOn)+'. Each admission is checked against its own receipt date.</p></div>'+
    '<div class="row" style="gap:8px"><label class="f">Check an employee ID<input id="lk-id" data-lk="1" value="'+h(L.id)+'" placeholder="Biometric ID" style="width:150px"></label><button class="btn" data-act="lookup">Check</button></div></div>'+res+
    '<div class="tw"><table><thead><tr><th>Biometric ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Status</th><th>Branch</th><th>SRF role</th><th>Attendance</th></tr></thead><tbody>'+
    (shown.length?shown.map(e=>'<tr><td class="num">'+e.bio+'</td><td>'+h(e.name)+'</td><td>'+h(e.desig)+'</td><td>'+h(e.dept)+'</td><td><span class="pill good">'+e.status+'</span></td><td>'+h(BR[branchOn(e,asOn)])+'</td><td>'+h(roleOf(e))+'</td><td>'+(e.att==='Present'?'Present':'<span class="pill bad">'+h(e.att)+'</span>')+'</td></tr>').join(''):'<tr><td colspan="8" class="empty">No active eligible staff are mapped to this branch in HRMS.</td></tr>')+'</tbody></table></div>'+
    ((ex.inactive+ex.transferred+ex.desig)?'<p class="foot">Not shown: '+[ex.inactive&&ex.inactive+' not active in HRMS',ex.transferred&&ex.transferred+' mapped to another branch on '+dmy(asOn),ex.desig&&ex.desig+' with a designation not eligible for SRF'].filter(Boolean).join(' · ')+'. Branch mapping changes only through HRMS transfer controls.</p>':'')+'</section>';}
function vPrincipal(){
  if(S.role!=='Principal')return vSubsReadOnly();
  const own=principalBranches();
  if(!own.includes(S.draft.branch))S.draft=newDraft(own[0]||'');
  const d=S.draft;
  if(!d.branch)return '<div><h1>New SRF submission</h1></div><section class="panel">'+pTop(d)+'</section>';
  const s=draftSummary(d),list=draftAdms(d);
  const returned=S.subs.filter(x=>x.branch===d.branch&&x.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===x.id));
  const mine=S.subs.filter(x=>x.branch===d.branch);
  const roleBox=(a,c,r)=>{const asg=d.assign[a.enrol][r.code]||[],m=mapped(r,a.branch,a.collDate),rt=rateFor(c.v,r,a);
    let body;
    if(!m.length)body='<div class="id">No '+h(r.desig.join(' / '))+' in HRMS for this branch</div>';
    else if(r.mode==='pool')body=m.map(e=>{const on=asg.includes(e.bio),abs=e.att!=='Present',full=!on&&asg.length>=r.slots;
      return '<label class="chk'+(abs||full?' dis':'')+'"><input type="checkbox" data-pool="'+a.enrol+'|'+r.code+'|'+e.bio+'"'+(on?' checked':'')+(abs||full?' disabled':'')+'><span>'+h(e.name)+' <span class="id">'+h(e.bio)+' · '+h(e.desig)+' · '+h(e.dept)+'</span>'+(abs?' <span class="pill bad">Absent</span>':'')+'</span></label>'}).join('');
    else body=Array.from({length:r.slots},(_,i)=>'<select data-per="'+a.enrol+'|'+r.code+'|'+i+'" aria-label="'+h(r.label)+' slot '+(i+1)+'"><option value="">— '+h(r.label)+' '+(i+1)+': none —</option>'+
      m.map(e=>{const used=asg[i]!==e.bio&&Object.entries(d.assign[a.enrol]).some(([rc,ids])=>(ids||[]).some((x,j)=>x===e.bio&&!(rc===r.code&&j===i)));
        return '<option value="'+e.bio+'"'+(asg[i]===e.bio?' selected':'')+(e.att!=='Present'||used?' disabled':'')+'>'+h(e.name)+' · '+e.bio+(e.att!=='Present'?' (Absent)':used?' (already assigned)':'')+'</option>'}).join('')+'</select>').join('');
    const paid=sum(c.lines.filter(l=>l.role===r.code).map(l=>l.amount));
    return '<div class="role"><div class="role-h"><strong>'+h(r.label)+'</strong><span>'+inr(rt.amt)+' × up to '+r.slots+' · '+(r.mode==='pool'?'pool':'per admission')+(rt.src!=='default'?' · <span class="pill acc">'+h(rt.src)+'</span>':'')+'</span></div>'+body+c.bad.filter(b=>b.role===r.code).map(b=>'<div class="msg bad">ID '+h(b.id)+': '+h(b.why)+' <button class="btn sm" data-act="unassign" data-id="'+a.enrol+'|'+r.code+'|'+h(b.id)+'">Remove</button></div>').join('')+(r.doc?'<div class="id">Needs: '+h(r.doc)+'</div>':'')+'<div class="role-h"><span>Line total</span><span class="num">'+inr(paid)+'</span></div></div>'};
  const admCards=s.cs.map(({a,c})=>'<div class="adm"><div class="adm-h"><div><b>'+a.enrol+'</b> · '+h(a.name)+' · '+h(a.cls)+' · '+h(a.category)+'</div><div class="row" style="gap:10px;align-items:center"><span class="id">SRF '+inr(a.amount)+' · '+h(a.receipt)+' · '+dmy(a.collDate)+'</span><span class="num">Incentive '+inr(c.total)+' / '+inr(c.cap)+'</span></div></div>'+
    '<div style="padding:0 12px"><div class="bar" title="Share of maximum incentive used"><i class="'+(c.over?'over':'')+'" style="width:'+Math.min(100,c.total/Math.max(1,c.cap)*100)+'%"></i></div></div>'+
    '<div class="roles-g">'+onRoles(c.v).map(r=>roleBox(a,c,r)).join('')+'</div>'+
    '<div class="adm-h" style="background:none;border-top:1px solid var(--line)"><span class="id">Policy v'+c.v.v+' (from '+dmy(c.v.from)+') · '+h(c.v.p.deds.filter(x=>x.on).map(x=>x.label+' '+(x.calc==='pct'?x.value+'%':inr(x.value))).join(', ')||'no deductions')+'</span><span class="num">Balance '+inr(c.bal)+'</span></div></div>').join('');
  return '<div><h1>New SRF submission</h1><p class="sub">Admissions, receipts and staff come from the ERP. Pick who earned the incentive; amounts come from the policy published in Corporate Finance.</p></div>'+
  (returned.length?'<div class="msg">'+returned.map(x=>'<div><b>'+x.ref+'</b> was returned: '+h(x.verRemark)+' <button class="btn sm" data-act="revise" data-id="'+x.id+'">Revise and resubmit</button></div>').join('')+'</div>':'')+
  (d.revOf?'<div class="msg info">Revising '+subOf(d.revOf).ref+' as revision R'+(subOf(d.revOf).rev+1)+'.</div>':'')+
  '<div class="grid"><div style="display:flex;flex-direction:column;gap:16px;min-width:0">'+
  '<section class="panel">'+pTop(d)+
    '<h3>SRF receipts in period</h3><div class="tw"><table><thead><tr><th>Include</th><th>Enrolment</th><th>Student</th><th>Class</th><th>Receipt</th><th class="n">SRF</th><th>Collected</th><th>Mode</th><th>Eligibility</th></tr></thead><tbody>'+
    (list.length?list.map(a=>{const e=elig(a);return '<tr class="'+(e?'off':'')+'"><td><input type="checkbox" aria-label="Include '+a.enrol+'" data-inc="'+a.enrol+'"'+(d.include[a.enrol]&&!e?' checked':'')+(e?' disabled':'')+'></td><td class="num">'+a.enrol+'</td><td>'+h(a.name)+'</td><td>'+h(a.cls)+'</td><td class="num">'+h(a.receipt)+'</td><td class="n">'+inr(a.amount)+'</td><td>'+dmy(a.collDate)+'</td><td>'+a.mode+'</td><td>'+(e?'<span class="pill bad">'+h(e)+'</span>':'<span class="pill good">Eligible</span>')+'</td></tr>'}).join(''):'<tr><td colspan="9" class="empty">No SRF receipts in this period</td></tr>')+
    '</tbody></table></div></section>'+
  staffPanel(d,s)+
  (admCards?'<section class="panel"><h3>Staff assignment</h3>'+admCards+'</section>':'')+
  trackerPanel(d.branch,true)+
  '</div><aside class="panel rail"><h2>Before you submit</h2><dl class="kv">'+
    '<dt>Admissions included</dt><dd>'+s.cs.length+'</dd><dt>Staff beneficiaries</dt><dd>'+s.people+'</dd>'+
    '<dt>Total SRF collected</dt><dd>'+inr(s.srf)+'</dd><dt>Staff incentive</dt><dd>'+inr(s.inc)+'</dd><dt>Deductions (Sadqa)</dt><dd>'+inr(s.ded)+'</dd>'+
    '<dt class="big">SRF balance</dt><dd class="big">'+inr(s.bal)+'</dd></dl>'+
    (s.exc.length?'<div><h3>Exceptions</h3><ul class="plain">'+s.exc.map(x=>'<li>'+h(x)+'</li>').join('')+'</ul></div>':'')+
    (s.warns.length?'<div class="msg">'+s.warns.map(h).join('<br>')+'</div>':'')+
    (s.blocks.length?'<div class="msg bad">'+s.blocks.map(h).join('<br>')+'</div>':'')+
    '<label class="f">Remarks (optional)<textarea id="p-remark" data-in="remark">'+h(d.remark)+'</textarea></label>'+
    '<label class="f">Supporting document'+(s.docs.length?' (required: '+h(s.docs.join(', '))+')':' (optional)')+'<input type="file" id="p-doc" data-doc="1" accept=".pdf,.jpg,.png"></label>'+(d.doc?'<span class="id">Attached: '+h(d.doc)+'</span>':'')+
    '<div class="row"><button class="btn pri" data-act="submit"'+(s.blocks.length||!can('submission','Submit')?' disabled':'')+'>Submit for Accounts verification</button><button class="btn" data-act="savedraft"'+(can('submission','Create')?'':' disabled')+'>Save draft</button></div>'+
    '<p class="foot">After you submit, the request is locked. It can be changed only if Accounts returns it for correction.</p></aside></div>';}
const P_ORDER=['Draft','Submitted','Returned','Verified','Rejected','Pending HR Payment','Paid'];
function pStatus(x){if(['Pending Accounts Verification','Pending L2 Verification','On Hold'].includes(x.status))return 'Submitted';
  if(x.status==='Returned to Principal')return 'Returned';if(x.status==='Rejected')return 'Rejected';
  const ap=x.adms.flatMap(a=>a.lines).filter(l=>l.vstatus==='Approved'&&!['Reversed','Cancelled'].includes(l.pstatus));
  if(ap.length&&ap.every(l=>['Paid','Recovered','Written off'].includes(l.pstatus)))return 'Paid';
  if(ap.some(l=>['Pending HR Processing','In Batch','Included in Payroll','Payment Released','On Hold'].includes(l.pstatus)))return 'Pending HR Payment';return 'Verified';}
const pPill=t=>'<span class="pill '+({Draft:'',Submitted:'warn',Returned:'warn',Verified:'good',Rejected:'bad','Pending HR Payment':'acc',Paid:'good'})[t]+'">'+t+'</span>';
function trackerPanel(branch,mine){
  const subs=S.subs.filter(x=>x.branch===branch),drafts=mine?S.drafts.filter(x=>x.by===S.uid&&x.d.branch===branch):[];
  const cnt=P_ORDER.map(k=>[k,k==='Draft'?drafts.length:subs.filter(x=>pStatus(x)===k).length]);
  return '<section class="panel"><h3>Submission status · '+h(BR[branch])+'</h3><div class="row" style="gap:6px">'+cnt.map(([k,n])=>'<span class="pill '+(n?'acc':'')+'">'+k+': <b class="num">'+n+'</b></span>').join('')+'</div>'+
  ((subs.length||drafts.length)?'<div class="tw"><table><thead><tr><th>Reference</th><th>Date</th><th class="n">Admissions</th><th class="n">Incentive</th><th>Status</th><th>Detail</th><th>Accounts remark</th><th>Changes</th></tr></thead><tbody>'+
    drafts.map(x=>'<tr><td class="num">Draft '+x.id+'</td><td>'+dmy(x.at)+'</td><td class="n">'+Object.values(x.d.include).filter(Boolean).length+'</td><td class="n">—</td><td>'+pPill('Draft')+'</td><td>Saved, not submitted</td><td>—</td><td>'+(mine?'<button class="btn sm" data-act="opendraft" data-id="'+x.id+'">Open</button>':'')+'</td></tr>').join('')+
    subs.map(x=>{const p=pStatus(x),returned=x.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===x.id);
      return '<tr><td class="num">'+x.ref+(x.rev?' R'+x.rev:'')+'</td><td>'+dmy(x.submittedAt)+'</td><td class="n">'+x.adms.length+'</td><td class="n">'+inr(sum(x.adms.map(a=>a.total)))+'</td><td>'+pPill(p)+'</td><td>'+st(x.status)+(x.locked?' <span class="pill bad">Locked</span>':'')+'</td><td style="white-space:normal;min-width:160px">'+h(x.verRemark||'—')+'</td><td>'+
        (x.locked?'Locked by System Admin':returned&&mine?'<button class="btn sm" data-act="revise" data-id="'+x.id+'"'+(can('submission','Edit')?'':' disabled')+'>Revise</button>':returned?'Returned':'Locked')+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty">Nothing saved or submitted yet for this branch</div>')+'</section>';}
function vSubsReadOnly(){const br=userBranches();
  return '<div><h1>SRF submissions</h1><p class="sub">Read-only for '+h(S.role)+'. Only Principals create and submit SRF requests.</p></div>'+(br.length?br.map(b=>trackerPanel(b,false)).join(''):'<div class="empty">No branches in your data scope</div>');}

/* ================= Accounts view ================= */
function vAccounts(){
  const ap=curV().p.approval,R=S.routing,inScope=x=>userBranches().includes(x.branch);
  const q=S.subs.filter(x=>QUEUE.includes(x.status)&&inScope(x)),done=S.subs.filter(x=>!QUEUE.includes(x.status)&&inScope(x));
  if(!S.acc.sel||!q.some(x=>x.id===S.acc.sel))S.acc.sel=q[0]?.id||null;
  const sub=subOf(S.acc.sel);
  if(sub)sub.adms.forEach(x=>x.lines.forEach(l=>{if(!(l.id in S.acc.checked)||l.empId===cu().empId){S.acc.checked[l.id]=l.empId!==cu().empId&&admChecks(sub,x).every(c=>c[1])&&lineChecks(x,l).every(c=>c[1])}}));
  const detail=sub?(()=>{const lines=sub.adms.flatMap(a=>a.lines),chk=lines.filter(l=>S.acc.checked[l.id]),amt=sum(chk.map(l=>l.amount));
    const needL2=sub.level===1&&amt>ap.l2Above;
    const actOK=!sub.locked&&sub.submittedBy!==S.uid&&(sub.level===1?can('verification','Verify')&&(S.role===R.l1||S.role===R.l2):can('verification','Approve')&&S.role===R.l2),dis=actOK?'':' disabled';
    return '<section class="panel"><div class="row" style="justify-content:space-between;align-items:center"><div><h2>'+sub.ref+(sub.rev?' R'+sub.rev:'')+' · '+h(BR[sub.branch])+'</h2><p class="sub">Submitted '+dmy(sub.submittedAt)+' · '+days(sub.submittedAt,TODAY)+' days waiting (target '+ap.slaDays+') · period '+dmy(sub.from)+' to '+dmy(sub.to)+(sub.remark?' · “'+h(sub.remark)+'”':'')+(sub.doc?' · document: '+h(sub.doc):'')+'</p></div>'+st(sub.status)+'</div>'+
    (sub.level===2?'<div class="msg info">Level 1 approved by '+h(sub.l1)+'. Waiting for '+h(R.l2)+'.</div>':'')+
    (sub.locked?'<div class="msg bad">Locked by System Admin: '+h(sub.locked.reason)+'</div>':'')+
    (sub.submittedBy===S.uid?'<div class="msg bad">You submitted this request. Another user must verify it.</div>':'')+
    (!actOK&&!sub.locked&&sub.submittedBy!==S.uid?'<div class="msg info">Read-only for '+h(S.role)+'. '+(sub.level===1?'Level 1 is routed to '+h(R.l1):'Level 2 is routed to '+h(R.l2))+'.</div>':'')+
    sub.adms.map(x=>{const a=adm(x.enrol);return '<div class="adm"><div class="adm-h"><div><b>'+x.enrol+'</b> · '+h(a.name)+' · '+h(a.receipt)+' · SRF '+inr(x.amountSnap)+'</div><div class="checks">'+admChecks(sub,x).map(tick).join('')+'</div></div>'+
      '<div class="tw" style="border:0;border-radius:0"><table><thead><tr><th>Approve</th><th>Role</th><th>Employee</th><th>Biometric ID</th><th>Department</th><th>Branch at submission</th><th>Current branch</th><th class="n">Amount</th><th>Checks</th></tr></thead><tbody>'+
      x.lines.map(l=>{const e=emp(l.empId),r=vRole(verNo(x.version),l.role);return '<tr><td><input type="checkbox" aria-label="Approve line '+l.id+'" data-acc="'+l.id+'"'+(S.acc.checked[l.id]?' checked':'')+(l.empId===cu().empId||!actOK?' disabled':'')+'></td><td>'+h(r.label)+' '+l.slot+'</td><td>'+h(e.name)+(l.empId===cu().empId?' <span class="pill bad">Your own line</span>':'')+'</td><td class="num">'+e.bio+'</td><td>'+h(l.snap?.dept||e.dept)+'</td><td>'+h(BR[l.snap?.branch]||'—')+'</td><td>'+curCell(e,l)+'</td><td class="n">'+inr(l.amount)+'</td><td><div class="checks">'+lineChecks(x,l).map(tick).join('')+'</div></td></tr>'}).join('')+
      '<tr class="tot"><td colspan="7">Incentive '+inr(x.total)+' · Sadqa '+inr(x.ded)+' · Balance '+inr(x.bal)+'</td><td class="n">'+inr(x.total)+'</td><td>Policy v'+x.version+'</td></tr></tbody></table></div></div>'}).join('')+
    '<label class="f">Verification remarks (required to return, reject, hold or approve only some lines)<textarea id="acc-remark" data-in="accRemark">'+h(S.acc.remark)+'</textarea></label>'+
    '<div class="row"><button class="btn pri"'+dis+' data-act="decide" data-t="approve">'+(needL2?'Approve L1 and send to '+h(R.l2):(chk.length===lines.length?'Approve all '+lines.length+' lines':'Approve '+chk.length+' of '+lines.length+' lines'))+'</button>'+
    '<button class="btn"'+dis+' data-act="decide" data-t="return">Return to Principal</button>'+
    (sub.status==='On Hold'?'<button class="btn"'+dis+' data-act="decide" data-t="release">Release hold</button>':'<button class="btn"'+dis+' data-act="decide" data-t="hold">Hold for clarification</button>')+
    '<button class="btn bad"'+dis+' data-act="decide" data-t="reject">Reject submission</button></div><p class="foot">Approvals above '+inr(ap.l2Above)+' need '+h(R.l2)+' as a second level (threshold set by Corporate Finance; routing set by System Admin). Accounts cannot edit amounts or staff.</p></section>'})():'<div class="empty">No submissions waiting for verification</div>';
  return '<div><h1>Verification</h1><p class="sub">Every line is checked against Admissions, Fee Collection, HRMS, Biometric and the policy version it was calculated on. Lines that fail a check start unticked.</p></div>'+
  '<div class="grid"><div style="min-width:0;display:flex;flex-direction:column;gap:16px">'+detail+
  '<section class="panel"><h3>Decided</h3>'+(done.length?'<div class="tw"><table><thead><tr><th>Reference</th><th>Branch</th><th>Status</th><th>Verification ref</th><th>Verifier</th><th>Remark</th></tr></thead><tbody>'+done.map(x=>'<tr><td class="num">'+x.ref+(x.rev?' R'+x.rev:'')+'</td><td>'+h(BR[x.branch])+'</td><td>'+st(x.status)+'</td><td class="num">'+(x.verRef||'—')+'</td><td>'+h(x.verifier||'—')+'</td><td>'+h(x.verRemark||'—')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">Nothing decided yet</div>')+'</section></div>'+
  '<aside class="panel rail"><h2>Queue</h2><div class="queue">'+(q.length?q.map(x=>'<button class="qi" data-act="sel" data-id="'+x.id+'" aria-current="'+(x.id===S.acc.sel)+'"><span><b class="num">'+x.ref+'</b><br><span class="id">'+h(BR[x.branch])+' · '+days(x.submittedAt,TODAY)+' days</span></span>'+(days(x.submittedAt,TODAY)>ap.slaDays?'<span class="pill bad">Overdue</span>':st(x.status==='On Hold'?'On Hold':x.level===2?'Pending L2 Verification':'Pending'))+'</button>').join(''):'<div class="empty">Queue is clear</div>')+'</div></aside></div>';}

/* ================= HR view ================= */
function vHR(){
  const p=curV().p,L=allLines().filter(l=>l.vstatus==='Approved'&&userBranches().includes(subOf(l.sub).branch));
  if(!p.cycle.offCycle&&S.hr.method!=='Payroll')S.hr.method='Payroll';
  const tabs=[['process','To process',L.filter(l=>['Pending HR Processing','On Hold'].includes(l.pstatus))],['batches','Batches',null],['paid','Paid',L.filter(l=>['Paid','Reversed','Written off'].includes(l.pstatus))],['recovery','Recovery',L.filter(l=>['Recovery Required','Recovered','Cancelled'].includes(l.pstatus))]];
  const t=S.hr.tab;
  const lineTable=(rows,actions)=>{if(!rows.length)return '<div class="empty">No lines here</div>';
    const byEmp={};rows.forEach(l=>(byEmp[l.empId]=byEmp[l.empId]||[]).push(l));
    return '<div class="tw"><table><thead><tr>'+(t==='process'?'<th></th>':'')+'<th>Employee</th><th>Designation</th><th>Branch at submission</th><th>Current branch</th><th>Student</th><th>Role</th><th class="n">Amount</th><th>Verification ref</th><th>Status</th><th>Note</th><th></th></tr></thead><tbody>'+
    Object.entries(byEmp).map(([id,ls])=>{const e=emp(id),prev=sum(allLines().filter(x=>x.empId===id&&x.vstatus==='Approved'&&!PAY_DONE.includes(x.pstatus)&&x.pstatus!=='Recovery Required').map(x=>x.amount));
      return ls.map((l,i)=>'<tr>'+(t==='process'?'<td>'+(l.pstatus==='Pending HR Processing'?'<input type="checkbox" aria-label="Select line '+l.id+'" data-hr="'+l.id+'"'+(S.hr.checked[l.id]?' checked':'')+'>':'')+'</td>':'')+
        '<td>'+(i?'':h(e.name)+' <span class="id">'+e.bio+'</span>')+'</td><td>'+(i?'':h(e.desig))+'</td><td>'+h(BR[l.snap?.branch]||'—')+'</td><td>'+curCell(e,l)+'</td><td class="num">'+l.enrol+'</td><td>'+h(vRole(curV(),l.role)?.label||l.role)+'</td><td class="n">'+inr(l.amount)+'</td><td class="num">'+subOf(l.sub).verRef+'</td><td>'+st(l.pstatus)+'</td><td>'+h(l.note||l.payRef||'—')+'</td><td>'+actions(l)+'</td></tr>').join('')+
        '<tr class="tot"><td colspan="'+(t==='process'?7:6)+'">'+h(e.name)+' · total unpaid SRF</td><td class="n">'+inr(prev)+'</td><td colspan="4"></td></tr>'}).join('')+'</tbody></table></div>'};
  let body='';
  if(t==='process'){const rows=tabs[0][2],sel=rows.filter(l=>S.hr.checked[l.id]);
    body='<div class="row"><label class="f">'+({date:'Payment date',week:'Payment week',month:p.cycle.freq==='Monthly'?'Payroll month':'Period month'})[ptype()]+'<input type="'+ptype()+'" id="hr-period" data-chg="period" value="'+periodKey()+'"></label><label class="f">Payment method<select id="hr-method" data-chg="method"><option'+(S.hr.method==='Payroll'?' selected':'')+'>Payroll</option><option'+(S.hr.method==='Bank transfer'?' selected':'')+(p.cycle.offCycle?'':' disabled')+'>Bank transfer</option></select></label>'+
      '<button class="btn pri" data-act="batch"'+(sel.length?'':' disabled')+'>Create batch · '+sel.length+' lines · '+inr(sum(sel.map(l=>l.amount)))+'</button><button class="btn sm" data-act="selall">Select all ready</button></div>'+
      '<p class="foot">'+h(p.cycle.freq)+' cycle, '+h(periodLabel(periodKey()))+' · '+h(cutoffText(p.cycle))+' · payroll earning code '+h(p.cycle.earning)+' · monthly cap '+inr(p.limits.perEmployeeMonth)+' per employee'+(p.cycle.offCycle?'':' · off-cycle bank payments are switched off')+'.</p>'+
      '<label class="f">Reason for hold (required to hold)<input id="hr-reason" data-in="hrReason" value="'+h(S.hr.reason)+'" placeholder="e.g. bank details pending in HRMS"></label>'+
      lineTable(rows,l=>l.pstatus==='On Hold'?'<button class="btn sm" data-act="release" data-id="'+l.id+'">Release</button>':'<button class="btn sm" data-act="hold" data-id="'+l.id+'">Hold</button>');}
  else if(t==='batches'){body=S.batches.length?'<div class="tw"><table><thead><tr><th>Batch</th><th>Period</th><th>Method</th><th>Code</th><th class="n">Lines</th><th class="n">Amount</th><th>Status</th><th>Reference</th><th></th></tr></thead><tbody>'+
    S.batches.map(b=>'<tr><td class="num">'+b.ref+'</td><td>'+h(periodLabel(b.period))+'</td><td>'+b.method+'</td><td class="num">'+h(b.code)+'</td><td class="n">'+b.lines.length+'</td><td class="n">'+inr(sum(b.lines.map(k=>lineById(k).amount)))+'</td><td>'+st(b.status==='Paid'?'Paid':b.method==='Payroll'?'Included in Payroll':'Payment Released')+'</td>'+
      (b.status==='Paid'?'<td class="num">'+h(b.payRef)+'</td><td></td>':'<td><input id="ref-'+b.ref+'" data-ref="'+b.ref+'" value="'+h(S.hr.ref[b.ref]||'')+'" placeholder="'+(b.method==='Payroll'?'Payroll run ref':'Bank UTR')+'" aria-label="Payment reference">'+(b.method==='Payroll'?'':' <input type="file" id="proof-'+b.ref+'" aria-label="Payment proof">')+'</td><td><button class="btn sm pri" data-act="paid" data-id="'+b.ref+'">Mark paid</button></td>')+'</tr>').join('')+'</tbody></table></div>':'<div class="empty">No batches yet. Create one from “To process”.</div>';}
  else if(t==='paid'){body='<label class="f">Reason for reversal (required)<input id="hr-reason2" data-in="hrReason" value="'+h(S.hr.reason)+'" placeholder="e.g. paid to wrong employee"></label>'+lineTable(tabs[2][2],l=>l.pstatus==='Paid'&&!S.revs.some(r=>r.line===l.id&&r.status==='Pending')?'<button class="btn sm bad" data-act="reverse" data-id="'+l.id+'">Request reversal</button>':S.revs.some(r=>r.line===l.id&&r.status==='Pending')?'<span class="pill warn">Reversal pending</span>':'');}
  else body='<p class="foot">Recovery lines come from receipts refunded or cancelled after payment. Policy: recover through '+h({payroll:'payroll deduction',collection:'cash collection',either:'payroll or cash'}[p.refund.via])+' over up to '+p.refund.months+' months, code '+h(p.cycle.deduction)+'.</p>'+lineTable(tabs[3][2],l=>l.pstatus==='Recovery Required'?'<button class="btn sm" data-act="recover" data-id="'+l.id+'">Deducted in '+h(periodLabel(periodMonth(periodKey())))+'</button>':'');
  return '<div><h1>HR payment processing</h1><p class="sub">Only lines approved by Accounts appear here. HR cannot change amounts, staff or the verification decision.</p></div>'+(can('payment','Create')?'':'<div class="msg info">Read-only for '+h(S.role)+'. Payments are processed by '+h(S.routing.payment)+'.</div>')+
    '<section class="panel"><div class="tabs" role="tablist">'+tabs.map(([k,lab,rows])=>'<button role="tab" aria-selected="'+(k===t)+'" data-act="hrtab" data-id="'+k+'">'+lab+' ('+(rows?rows.length:S.batches.length)+')</button>').join('')+'</div>'+body+'</section>';}

/* ================= Corporate Finance: control panel ================= */
const CA=()=>curV().p, CD=()=>S.cp.draft;
function flat(o,p='',out={}){if(o&&typeof o==='object'&&!Array.isArray(o)){Object.keys(o).forEach(k=>flat(o[k],p?p+'.'+k:k,out))}
  else if(Array.isArray(o)&&o.length&&typeof o[0]==='object'&&o[0]&&('code' in o[0]||'user' in o[0])){o.forEach(x=>flat(x,p+'['+(x.code||x.user)+']',out))}
  else out[p]=Array.isArray(o)?o.map(x=>typeof x==='object'?JSON.stringify(x):x).join(', '):o;return out}
const NAMES={roles:'Role',deds:'Deduction',limits:'Limit',cats:'Category',att:'Attendance',multi:'Multiple roles',rules:'Scope rules',approval:'Approval',cycle:'Payment cycle',refund:'Refund & recovery',access:'Access',ess:'Staff self-service'};
function diffs(){const a=flat(CA()),b=flat(CD()),keys=[...new Set([...Object.keys(a),...Object.keys(b)])];
  return keys.filter(k=>String(a[k])!==String(b[k])).map(k=>({k,sec:k.split(/[.\[]/)[0],old:a[k],nu:b[k]}))}
const secChanged=sec=>diffs().some(d=>sec==='docs'?/\.doc$/.test(d.k):d.sec===sec&&!(sec==='roles'&&/\.doc$/.test(d.k)));
const isChg=path=>String(flat(CA())[path])!==String(flat(CD())[path]);
const fmtV=v=>v===undefined||v===''?'—':v===true?'Yes':v===false?'No':String(v);
function preview(p){const out=[];let total=0;const pv=S.cp.prev,eligible=p.cats[pv.cat]===true;
  p.roles.forEach(r=>{if(!r.on){out.push([r.code,r.label,0,'off']);return}
    const n=Math.min(pv.counts[r.code]||0,r.slots);let unit=r.calc==='pct'?Math.round(pv.srf*r.value/100):+r.value;
    const rule=p.rules.find(x=>x.scope==='Admission category'&&x.value===pv.cat&&x.role===r.code);
    if(rule)unit=rule.calc==='pct'?Math.round(pv.srf*rule.value2/100):+rule.value2;
    const amt=eligible?unit*n:0;total+=amt;out.push([r.code,r.label,amt,rule?'rule':''])});
  const ded=eligible?sum(p.deds.filter(d=>d.on).map(d=>d.calc==='pct'?Math.round(pv.srf*d.value/100):+d.value)):0;
  return {rows:out,total,ded,bal:eligible?pv.srf-total-ded:pv.srf,over:total>capOf(p,pv.srf),eligible}}
const SECS=[['roles','Roles and rates'],['rules','Scope rules'],['deds','Deductions'],['limits','Limits'],['cats','Admission categories'],['att','Attendance'],['multi','Multiple roles'],['docs','Required documents'],['approval','Approval hierarchy'],['cycle','Payment cycle'],['refund','Refund and recovery'],['history','Version history'],['-'],['reversals','Reversal and recovery cases']];
const inp=(path,val,attrs='')=>'<input '+attrs+' data-p="'+path+'" value="'+h(val)+'"'+(isChg(path)?' class="chg"':'')+'>';
const sel=(path,val,opts)=>'<select data-p="'+path+'"'+(isChg(path)?' class="chg"':'')+'>'+opts.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return '<option value="'+h(v)+'"'+(String(v)===String(val)?' selected':'')+'>'+h(l)+'</option>'}).join('')+'</select>';
const sw=(path,val,title,desc)=>'<label class="sw"><input type="checkbox" data-p="'+path+'"'+(val?' checked':'')+'><span><b'+(isChg(path)?' style="color:var(--warn)"':'')+'>'+h(title)+'</b><span>'+h(desc)+'</span></span></label>';
const head=(t,l)=>'<div><h1>'+h(t)+'</h1><p class="lead">'+h(l)+'</p></div>';

function sRoles(){const p=CD();
  return head('Roles and rates','Which HRMS designations earn SRF, how many people per admission, and how much each receives. Pool roles are credited for every admission collected on a day they are present.')+
  '<div class="tw"><table><thead><tr><th>On</th><th>SRF role</th><th>Allocation</th><th class="n">Slots</th><th>Basis</th><th class="n">Rate</th><th class="n">Max per admission</th><th>HRMS designations</th></tr></thead><tbody>'+
  p.roles.map((r,i)=>{const pre='roles['+r.code+'].';const max=r.on?(r.calc==='pct'?Math.round(5000*r.value/100):r.value)*r.slots:0;
    return '<tr><td><input type="checkbox" aria-label="'+h(r.label)+' enabled" data-p="'+pre+'on"'+(r.on?' checked':'')+'></td><td><b>'+h(r.label)+'</b></td><td>'+sel(pre+'mode',r.mode,[['per','Per admission'],['pool','Branch pool']])+'</td><td class="n">'+inp(pre+'slots',r.slots,'type="number" min="0" max="10" step="1" style="width:64px" aria-label="Slots"')+'</td><td>'+sel(pre+'calc',r.calc,[['fixed','Fixed ₹'],['pct','% of SRF']])+'</td><td class="n">'+inp(pre+'value',r.value,'type="number" min="0" step="'+(r.calc==='pct'?'0.5':'10')+'" aria-label="Rate"')+'</td><td class="n">'+inr(max)+(r.calc==='pct'?'<br><span class="pill">on ₹5,000</span>':'')+'</td>'+
    '<td><div class="chips">'+r.desig.map(d=>'<span class="chipx">'+h(d)+'<button aria-label="Remove '+h(d)+'" data-act="rmdesig" data-i="'+i+'" data-v="'+h(d)+'">×</button></span>').join('')+
    '<select aria-label="Add designation" data-act2="adddesig" data-i="'+i+'"><option value="">+ add</option>'+HRMS_DESIG.filter(x=>!r.desig.includes(x)).map(x=>'<option>'+x+'</option>').join('')+'</select></div></td></tr>'}).join('')+
  '<tr class="tot"><td colspan="6">Maximum if every slot is filled</td><td class="n">'+inr(sum(p.roles.filter(r=>r.on).map(r=>(r.calc==='pct'?Math.round(5000*r.value/100):r.value)*r.slots)))+'</td><td>Cap: '+p.limits.maxPct+'% ('+inr(capOf(p,5000))+' on ₹5,000)</td></tr></tbody></table></div>'+
  '<div class="row"><label class="f">New role name<input id="nr-label" placeholder="e.g. Driver"></label><button class="btn" data-act="addrole">Add role</button></div>'+
  '<p class="foot">A designation can map to one SRF role only. “Accountant” is mapped to Cashier, as on the Akbarbagh sheet.</p>';}
function sRules(){const p=CD(),n=S.cp.newRule;const vals=n.scope==='Branch'?BRANCHES():n.scope==='Class'?CLASSES:Object.keys(p.cats);
  return head('Scope rules','Override a role’s rate for one branch, class or admission category. Precedence: class, then category, then branch; anything not covered uses the default rate.')+
  (p.rules.length?'<div class="tw"><table><thead><tr><th>Scope</th><th>Applies to</th><th>Role</th><th class="n">Rate</th><th>Note</th><th></th></tr></thead><tbody>'+p.rules.map((r,i)=>'<tr><td>'+h(r.scope)+'</td><td>'+h(r.value)+'</td><td>'+h(p.roles.find(x=>x.code===r.role)?.label)+'</td><td class="n">'+(r.calc==='pct'?r.value2+'%':inr(r.value2))+'</td><td>'+h(r.note||'—')+'</td><td><button class="btn sm bad" data-act="rmrule" data-i="'+i+'">Remove</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No overrides. Every branch, class and category uses the default rates.</div>')+
  '<div class="card"><h3>Add a rule</h3><div class="row">'+
  '<label class="f">Scope<select id="r-scope" data-n="scope">'+['Branch','Class','Admission category'].map(x=>'<option'+(x===n.scope?' selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<label class="f">Applies to<select id="r-val" data-n="value">'+vals.map(x=>'<option'+(x===n.value?' selected':'')+'>'+h(x)+'</option>').join('')+'</select></label>'+
  '<label class="f">Role<select id="r-role" data-n="role">'+p.roles.map(r=>'<option value="'+r.code+'"'+(r.code===n.role?' selected':'')+'>'+h(r.label)+'</option>').join('')+'</select></label>'+
  '<label class="f">Basis<select id="r-calc" data-n="calc"><option value="fixed"'+(n.calc==='fixed'?' selected':'')+'>Fixed ₹</option><option value="pct"'+(n.calc==='pct'?' selected':'')+'>% of SRF</option></select></label>'+
  '<label class="f">Rate<input id="r-v2" type="number" min="0" data-n="value2" value="'+n.value2+'"></label>'+
  '<label class="f" style="flex:1;min-width:160px">Note<input id="r-note" data-n="note" value="'+h(n.note)+'" placeholder="Why this differs"></label>'+
  '<button class="btn pri" data-act="addrule">Add rule</button></div></div>';}
function sDeds(){const p=CD();
  return head('Non-staff deductions','Amounts taken out of SRF that are not staff incentive, such as Sadqa. They reduce the SRF balance and post to their own ledger, never to staff payments.')+
  '<div class="tw"><table><thead><tr><th>On</th><th>Deduction</th><th>Basis</th><th class="n">Amount</th><th>Ledger</th></tr></thead><tbody>'+p.deds.map(d=>{const pre='deds['+d.code+'].';
    return '<tr><td><input type="checkbox" aria-label="'+h(d.label)+' enabled" data-p="'+pre+'on"'+(d.on?' checked':'')+'></td><td><b>'+h(d.label)+'</b></td><td>'+sel(pre+'calc',d.calc,[['fixed','Fixed ₹'],['pct','% of SRF']])+'</td><td class="n">'+inp(pre+'value',d.value,'type="number" min="0" aria-label="Amount"')+'</td><td>'+inp(pre+'ledger',d.ledger,'aria-label="Ledger" style="width:180px"')+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="msg">Open decision: is Sadqa a fixed ₹500 or 10% of SRF, and who disburses it? Both give ₹500 on a ₹5,000 SRF; they differ when SRF changes.</div>';}
function sLimits(){const p=CD().limits;
  return head('Limits','Caps that stop over-payment. The per-admission cap is checked at submission; the monthly cap per employee is checked when HR creates a batch.')+
  '<div class="opt"><div class="card"><label class="f">Maximum total incentive (% of SRF)'+inp('limits.maxPct',p.maxPct,'type="number" min="0" max="100" step="0.5"')+'</label><span class="foot">'+inr(5000*p.maxPct/100)+' on a ₹5,000 SRF</span></div>'+
  '<div class="card"><label class="f">Max incentive per employee per month (₹)'+inp('limits.perEmployeeMonth',p.perEmployeeMonth,'type="number" min="0" step="100"')+'</label><span class="foot">Example value; set by policy</span></div></div>'+
  sw('limits.blockOver',p.blockOver,'Block submission above the per-admission cap','When off, the Principal sees a warning instead of a hard stop.')+
  sw('limits.carry',p.carry,'Carry monthly excess forward','When off, anything above the monthly cap is marked not payable.');}
function sCats(){const c=CD().cats;
  return head('Admission categories','Only eligible categories create SRF incentive. Your Chamanganj sheet covers “General” students only.')+
  Object.keys(c).map(k=>sw('cats.'+k,c[k],k,c[k]?'Eligible for SRF incentive':'No incentive; shown to the Principal as ineligible')).join('')+
  '<div class="row"><label class="f">New category<input id="nc" placeholder="e.g. Transfer"></label><button class="btn" data-act="addcat">Add category</button></div>';}
function sAtt(){const a=CD().att;
  return head('Attendance eligibility','Read from biometric attendance. Staff who fail the rule are excluded from the line automatically and listed as exceptions.')+
  '<div class="opt"><label class="f">Attendance is checked on'+sel('att.basis',a.basis,[['collection','SRF collection date'],['admission','Admission date'],['either','Either date']])+'</label>'+
  '<label class="f">Half day'+sel('att.halfDay',a.halfDay,[['count','Counts as present'],['exclude','Excluded']])+'</label>'+
  '<label class="f">Approved leave'+sel('att.leave',a.leave,[['exclude','Excluded'],['count','Counts as present']])+'</label>'+
  '<label class="f">Weekly off / holiday'+sel('att.weekOff',a.weekOff,[['exclude','Excluded'],['count','Counts as present']])+'</label></div>';}
function sMulti(){const m=CD().multi;
  return head('Multiple roles','Whether one person can be paid for more than one role on the same admission.')+
  sw('multi.multiRoleOneAdmission',m.multiRoleOneAdmission,'Allow one employee in two roles on one admission','Example: a Cashier who also covers FOE that day.')+
  sw('multi.principalAsCounsellor',m.principalAsCounsellor,'Allow the Principal to also take the Counsellor role','Only applies if the option above is on.');}
function sDocs(){const p=CD();
  return head('Required documents','A document listed here must be uploaded before the Principal can submit lines for that role.')+
  '<div class="tw"><table><thead><tr><th>Role</th><th>Required document</th></tr></thead><tbody>'+p.roles.map(r=>'<tr><td>'+h(r.label)+'</td><td>'+inp('roles['+r.code+'].doc',r.doc,'placeholder="None" style="width:260px" aria-label="Document for '+h(r.label)+'"')+'</td></tr>').join('')+'</tbody></table></div>';}
function sApproval(){const a=CD().approval,R=S.routing;
  return head('Approval hierarchy','Who verifies a submission and when a second level is needed.')+
  '<div class="opt"><label class="f">Level 2 needed above (₹ approved per submission)'+inp('approval.l2Above',a.l2Above,'type="number" min="0" step="500"')+'</label>'+
  '<label class="f">Verification target (days)'+inp('approval.slaDays',a.slaDays,'type="number" min="1" max="60"')+'</label></div>'+
  '<div class="msg info">Routing: level 1 → '+h(R.l1)+', level 2 → '+h(R.l2)+'. Who receives each step is set by System Admin; Corporate Finance sets the threshold and target.</div>'+
  '<p class="foot">Maker–checker is always on: no user can verify, approve or pay their own submission or incentive.</p>';}
function sCycle(){const c=CD().cycle;
  return head('Payment cycle','When HR pays approved SRF lines and how they reach payroll.')+
  '<div class="opt"><label class="f">Frequency'+sel('cycle.freq',c.freq,['Daily','Weekly','Fortnightly','Monthly','Quarterly'])+'</label>'+
  (c.freq==='Daily'?'<label class="f">Cut-off time (lines approved by this time are paid that day)'+inp('cycle.cutoffTime',c.cutoffTime,'type="time"')+'</label>':
   c.freq==='Weekly'?'<label class="f">Cut-off weekday (lines approved by this day join that week)'+sel('cycle.cutoffWeekday',c.cutoffWeekday,WEEKDAYS)+'</label>':
   '<label class="f">'+(c.freq==='Fortnightly'?'First cut-off day (second is 14 days later)':c.freq==='Quarterly'?'Cut-off day in the quarter’s last month':'Cut-off day (lines approved by this day join this month)')+inp('cycle.cutoff',c.cutoff,'type="number" min="1" max="'+(c.freq==='Fortnightly'?14:28)+'"')+'</label>')+
  '<label class="f">Default method'+sel('cycle.method',c.method,['Payroll','Bank transfer'])+'</label>'+
  '<label class="f">Payroll earning code'+inp('cycle.earning',c.earning)+'</label>'+
  '<label class="f">Payroll deduction code (recovery)'+inp('cycle.deduction',c.deduction)+'</label></div>'+
  sw('cycle.offCycle',c.offCycle,'Allow off-cycle bank payments','HR must upload payment proof and a bank UTR.')+
  (['Daily','Weekly'].includes(c.freq)&&c.method==='Payroll'?'<div class="msg">Payroll usually runs monthly. With a '+c.freq.toLowerCase()+' cycle, set the default method to Bank transfer, or lines will wait for the next payroll run.</div>':'')+
  (['Daily','Weekly'].includes(c.freq)&&!c.offCycle?'<div class="msg bad">A '+c.freq.toLowerCase()+' cycle needs off-cycle bank payments switched on.</div>':'')+
  '<p class="foot">The monthly cap per employee still applies across all daily or weekly batches in the same calendar month.</p>';}
function sRefund(){const r=CD().refund;
  return head('Refund and recovery','What happens to incentive when a receipt is refunded, cancelled or adjusted after the claim.')+
  '<div class="opt"><label class="f">Refund before payment'+sel('refund.beforePay',r.beforePay,[['hold','Hold the lines'],['cancel','Cancel the lines']])+'</label>'+
  '<label class="f">Refund after payment'+sel('refund.afterPay',r.afterPay,[['recover','Recover from staff'],['writeoff','Write off (Finance approval)']])+'</label>'+
  '<label class="f">Recover through'+sel('refund.via',r.via,[['payroll','Payroll deduction'],['collection','Cash collection'],['either','Either']])+'</label>'+
  '<label class="f">Spread recovery over (months)'+inp('refund.months',r.months,'type="number" min="1" max="12"')+'</label>'+
  '<label class="f">Partial refund'+sel('refund.partialRefund',r.partialRefund,[['full','Recover the full incentive'],['prorata','Recover pro rata']])+'</label></div>';}
function sAccess(){const p=CD(),n=S.cp.newUser;
  return head('User access','Each user sees only the branches assigned here, and only the actions of their role.')+
  '<div class="tw"><table><thead><tr><th>User</th><th>Role</th><th>Branches</th><th></th></tr></thead><tbody>'+p.access.map((u,i)=>'<tr><td>'+h(u.user)+'</td><td>'+h(u.role)+'</td><td>'+(u.branches.includes('*')?'<span class="pill acc">All branches</span>':u.branches.map(h).join(', '))+'</td><td><button class="btn sm bad" data-act="rmuser" data-i="'+i+'">Remove</button></td></tr>').join('')+'</tbody></table></div>'+
  '<div class="card"><h3>Add access</h3><div class="row"><label class="f" style="flex:1;min-width:160px">User (from ERP directory)<input id="u-name" data-u="user" value="'+h(n.user)+'" placeholder="Name"></label>'+
  '<label class="f">Role<select id="u-role" data-u="role">'+['Principal','Accounts','HR','Corporate Finance Admin','Viewer'].map(x=>'<option'+(x===n.role?' selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<label class="f">Branch<select id="u-br" data-u="branch"><option value="*"'+(n.branch==='*'?' selected':'')+'>All branches</option>'+BRANCHES().map(x=>'<option'+(x===n.branch?' selected':'')+'>'+h(x)+'</option>').join('')+'</select></label><button class="btn pri" data-act="adduser">Add</button></div>'+
  (n.role==='Principal'&&n.branch==='*'?'<div class="msg bad">A Principal can only have their own branch.</div>':'')+'</div>'+
  sw('ess',p.ess,'Staff self-service','Staff can see their own approved, paid, held and recovery lines.');}
const regSel=(id,attr,val,lbl)=>'<select id="'+id+'" '+attr+' aria-label="'+lbl+'"><option value="">'+(GEO.regions.length?'Choose region':'No regions yet')+'</option>'+GEO.regions.map(r=>'<option value="'+r.id+'"'+(r.id===val?' selected':'')+'>'+h(r.name)+'</option>').join('')+'</select>';
const zoneSel=(id,attr,reg,val,lbl)=>{const zs=GEO.zones.filter(z=>z.region===reg);return '<select id="'+id+'" '+attr+' aria-label="'+lbl+'"'+(reg?'':' disabled')+'><option value="">'+(!reg?'Choose region first':zs.length?'Choose zone':'No zones in this region')+'</option>'+zs.map(z=>'<option value="'+z.id+'"'+(z.id===val?' selected':'')+'>'+h(z.name)+'</option>').join('')+'</select>'};
function sGeo(){const E=S.cp.editG,D0=S.cp.delG,nz=S.cp.newZone;
  const zc=r=>GEO.zones.filter(z=>z.region===r).length,bcZ=z=>Object.keys(BR).filter(c=>BMETA[c].zone===z).length,bcR=r=>Object.keys(BR).filter(c=>bZone(c)?.region===r).length;
  const acts=(kind,id)=>D0&&D0.kind===kind&&D0.id===id?'<div class="row" style="gap:6px;flex-wrap:nowrap"><span class="pill bad">Delete?</span><button class="btn sm bad" data-act="delgeo" data-id="'+id+'" data-kind="'+kind+'">Delete</button><button class="btn sm" data-act="canceldelgeo">Keep</button></div>':
    '<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm" data-act="editgeo" data-id="'+id+'" data-kind="'+kind+'">Edit</button><button class="btn sm bad" data-act="askdelgeo" data-id="'+id+'" data-kind="'+kind+'">Delete</button></div>';
  const save='<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm pri" data-act="savegeo">Save</button><button class="btn sm" data-act="canceleditgeo">Cancel</button></div>';
  return head('Regions and zones','The fixed lists branches are grouped by, for regional and zonal reports and dashboards. Each zone belongs to one region; a branch belongs to one zone, so its region follows from the zone.')+
  (S.cp.geoMsg?'<div class="msg bad">'+h(S.cp.geoMsg)+'</div>':'')+
  '<div class="card"><h3>Regions</h3>'+(GEO.regions.length?'<div class="tw"><table><thead><tr><th>Region</th><th class="n">Zones</th><th class="n">Branches</th><th></th></tr></thead><tbody>'+
    GEO.regions.map(r=>E&&E.kind==='region'&&E.id===r.id?'<tr><td><input id="eg-name" data-eg="name" value="'+h(E.name)+'" aria-label="Region name" style="width:220px"></td><td class="n">'+zc(r.id)+'</td><td class="n">'+bcR(r.id)+'</td><td>'+save+'</td></tr>':
      '<tr><td>'+h(r.name)+'</td><td class="n">'+zc(r.id)+'</td><td class="n">'+bcR(r.id)+'</td><td>'+acts('region',r.id)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No regions yet. Add the first one below.</div>')+
  '<div class="row"><label class="f" style="flex:1;min-width:200px">New region<input id="g-region" data-g="region" value="'+h(S.cp.newRegion)+'" placeholder="Region name"></label><button class="btn pri" data-act="addregion">Add region</button></div></div>'+
  '<div class="card"><h3>Zones</h3>'+(GEO.zones.length?'<div class="tw"><table><thead><tr><th>Zone</th><th>Region</th><th class="n">Branches</th><th></th></tr></thead><tbody>'+
    GEO.regions.flatMap(r=>GEO.zones.filter(z=>z.region===r.id)).map(z=>E&&E.kind==='zone'&&E.id===z.id?'<tr><td><input id="eg-zname" data-eg="name" value="'+h(E.name)+'" aria-label="Zone name" style="width:200px"></td><td>'+regSel('eg-zreg','data-egs="region"',E.region,'Region')+'</td><td class="n">'+bcZ(z.id)+'</td><td>'+save+'</td></tr>':
      '<tr><td>'+h(z.name)+'</td><td>'+h(regById(z.region)?.name)+'</td><td class="n">'+bcZ(z.id)+'</td><td>'+acts('zone',z.id)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No zones yet.'+(GEO.regions.length?' Add one below.':' Add a region first.')+'</div>')+
  '<div class="row"><label class="f" style="flex:1;min-width:180px">New zone<input id="g-zone" data-gz="name" value="'+h(nz.name)+'" placeholder="Zone name"></label><label class="f">In region'+regSel('g-zreg','data-gzs="region"',nz.region,'Region for new zone')+'</label><button class="btn pri" data-act="addzone"'+(GEO.regions.length?'':' disabled')+'>Add zone</button></div></div>'+
  '<p class="foot">Moving a zone to another region moves its branches with it. A region with zones, or a zone with branches, cannot be deleted. Every change is in the audit trail.</p>';}
function sStaffmap(){const m=S.cp.sm,q=m.q.trim().toLowerCase(),f=m.form;
  const list=S.emps.filter(e=>(m.branch==='*'||curBranch(e)===m.branch)&&(!q||e.bio.toLowerCase().includes(q)||e.name.toLowerCase().includes(q)));
  return head('Staff branch mapping','Authorised HRMS transfer and branch-mapping control. An admission uses each employee’s posting effective on its receipt date, and submitted lines keep the mapping captured at submission.')+
  '<div class="msg info">This stands in for the HRMS transfer screen. Every change needs an HRMS order or reference number and a reason, and is written to the audit trail. In the ERP the change is made in HRMS and SRF reads it.</div>'+
  '<div class="row"><label class="f">Current branch<select id="sm-br" data-smf="1"><option value="*">All branches</option>'+Object.keys(BR).map(c=>'<option value="'+c+'"'+(c===m.branch?' selected':'')+'>'+h(BR[c])+'</option>').join('')+'</select></label><label class="f" style="flex:1;min-width:180px">Search ID or name<input id="sm-q" data-smq="1" value="'+h(m.q)+'" placeholder="e.g. 503095"></label><button class="btn" data-act="smsearch">Search</button></div>'+
  '<div class="tw"><table><thead><tr><th>Biometric ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Status</th><th>Current branch</th><th>Posting history</th><th></th></tr></thead><tbody>'+
  (list.length?list.map(e=>{const open=m.open===e.bio,cp=curPosting(e),cb=cp.branch;
    let row='<tr><td class="num">'+e.bio+'</td><td>'+h(e.name)+'</td><td>'+h(e.desig)+'</td><td>'+h(e.dept)+'</td><td><span class="pill '+(e.status==='Active'?'good':'bad')+'">'+h(e.status)+'</span></td><td>'+h(BR[cb]||cb)+'</td><td style="white-space:normal;min-width:220px"><span class="id">'+e.postings.map(p=>h(BR[p.branch]||p.branch)+': '+dmy(p.from)+' → '+(p.to?dmy(p.to):'now')+' · '+h(p.ref)).join('<br>')+'</span></td><td><button class="btn sm" data-act="smopen" data-id="'+e.bio+'">'+(open?'Close':'Transfer / status')+'</button></td></tr>';
    if(open)row+='<tr><td colspan="8" style="white-space:normal;background:var(--sunk)"><div class="row">'+
      '<label class="f">Change<select id="sm-kind" data-sm="kind"><option value="transfer"'+(f.kind==='transfer'?' selected':'')+'>Transfer to another branch</option><option value="correct"'+(f.kind==='correct'?' selected':'')+'>Correct current mapping</option><option value="status"'+(f.kind==='status'?' selected':'')+'>Change employment status</option></select></label>'+
      (f.kind==='status'?'<label class="f">New status<select id="sm-status" data-sm="status">'+STATUSES.filter(x=>x!==e.status).map(x=>'<option'+(x===f.status?' selected':'')+'>'+x+'</option>').join('')+'</select></label>':
        '<label class="f">'+(f.kind==='transfer'?'To branch':'Correct branch')+'<select id="sm-to" data-sm="to"><option value="">Choose</option>'+Object.keys(BR).filter(c=>c!==cb).map(c=>'<option value="'+c+'"'+(c===f.to?' selected':'')+'>'+h(BR[c])+'</option>').join('')+'</select></label>')+
      (f.kind==='correct'?'<span class="foot">Replaces the branch for the current posting, from '+dmy(cp.from)+'.</span>':'<label class="f">Effective from<input type="date" id="sm-from" data-sm="from" value="'+f.from+'"></label>')+
      '<label class="f">HRMS order / reference<input id="sm-ref" data-sm="ref" value="'+h(f.ref)+'" placeholder="e.g. TR/2026/021"></label>'+
      '<label class="f" style="flex:1;min-width:200px">Reason<input id="sm-reason" data-sm="reason" value="'+h(f.reason)+'" placeholder="Why this change is made"></label>'+
      '<button class="btn pri" data-act="smsave" data-id="'+e.bio+'">Save</button></div>'+
      '<p class="foot">Submitted SRF lines keep the branch captured at submission; Accounts and HR see any later difference as the current branch.</p></td></tr>';
    return row}).join(''):'<tr><td colspan="8" class="empty">No employees match</td></tr>')+'</tbody></table></div>';}
function branchUses(c){const name=BR[c],u=[];
  const nr=S.adms.filter(a=>a.branch===c).length,ne=S.emps.filter(e=>curBranch(e)===c).length,ns=S.subs.filter(x=>x.branch===c).length;
  if(nr)u.push(nr+' SRF receipt'+(nr>1?'s':''));if(ne)u.push(ne+' staff in HRMS');if(ns)u.push(ns+' submission'+(ns>1?'s':''));
  if(S.versions.some(v=>v.p.rules.some(r=>r.scope==='Branch'&&r.value===name)))u.push('scope rules in a published policy version');
  const nu=S.users.filter(x=>x.scope.type==='branch'&&x.scope.ids.includes(c)).length;if(nu)u.push(nu+' user login'+(nu>1?'s':'')+' mapped to it');
  return u;}
function sBranches(){const n=S.cp.newBranch,codes=Object.keys(BR);
  const users=c=>S.users.filter(u=>u.status==='Active'&&userBranches(u).includes(c)).length;
  return head('Branches','Branches that can collect SRF. A new branch is available at once to Principals, scope rules, user access and reports. Branches are master data, so changes do not create a policy version; every add, edit and delete is recorded in the audit trail. A branch with receipts, staff, submissions or published rules cannot be deleted.')+
  '<div class="tw"><table><thead><tr><th>Code</th><th>Branch</th><th>Region</th><th>Zone</th><th class="n">SRF receipts</th><th class="n">Staff in HRMS</th><th class="n">Users with access</th><th>Updated</th><th></th></tr></thead><tbody>'+
  codes.map(c=>{const m=BMETA[c],E=S.cp.editB;
    if(E&&E.code===c)return '<tr><td class="num">'+c+'</td><td><input id="eb-name" data-eb="name" value="'+h(E.name)+'" aria-label="Branch name" style="width:240px"></td><td>'+regSel('eb-region','data-ebs="region"',E.region,'Region')+'</td><td>'+zoneSel('eb-zone','data-ebs="zone"',E.region,E.zone,'Zone')+'</td><td class="n">'+S.adms.filter(a=>a.branch===c).length+'</td><td class="n">'+S.emps.filter(e=>curBranch(e)===c).length+'</td><td class="n">'+users(c)+'</td><td>'+dmy(m.added)+'</td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm pri" data-act="savebranch">Save</button><button class="btn sm" data-act="canceledit">Cancel</button></div></td></tr>';
    const conf=S.cp.delB===c,uses=branchUses(c);
    return '<tr><td class="num">'+c+'</td><td>'+h(BR[c])+'</td><td>'+(bRegionName(c)?h(bRegionName(c)):'<span class="pill warn">Not set</span>')+'</td><td>'+(bZoneName(c)?h(bZoneName(c)):'<span class="pill warn">Not set</span>')+'</td><td class="n">'+S.adms.filter(a=>a.branch===c).length+'</td><td class="n">'+S.emps.filter(e=>curBranch(e)===c).length+'</td><td class="n">'+users(c)+'</td><td>'+dmy(m.updated||m.added)+' · '+h(m.by)+'</td><td>'+
      (conf?'<div class="row" style="gap:6px;flex-wrap:nowrap"><span class="pill bad">Delete '+c+'?</span><button class="btn sm bad" data-act="delbranch" data-id="'+c+'">Delete</button><button class="btn sm" data-act="canceldel">Keep</button></div>':
      '<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm" data-act="editbranch" data-id="'+c+'">Edit</button><button class="btn sm bad" data-act="askdel" data-id="'+c+'"'+(uses.length?' title="'+h('Cannot delete: '+uses.join('; '))+'"':'')+'>Delete</button></div>')+'</td></tr>'}).join('')+'</tbody></table></div>'+
  (S.cp.delMsg?'<div class="msg bad">'+h(S.cp.delMsg)+'</div>':'')+
  '<div class="card"><h3>Add a branch</h3><div class="row">'+
  '<label class="f">Branch code<input id="b-code" data-b="code" value="'+h(n.code)+'" placeholder="e.g. TLC" maxlength="5" style="width:110px;text-transform:uppercase"></label>'+
  '<label class="f" style="flex:1;min-width:200px">Branch name<input id="b-name" data-b="name" value="'+h(n.name)+'" placeholder="Full branch name"></label>'+
  '<label class="f">Region'+regSel('b-region','data-bs="region"',n.region,'Region')+'</label>'+
  '<label class="f">Zone'+zoneSel('b-zone','data-bs="zone"',n.region,n.zone,'Zone')+'</label>'+
  '<button class="btn pri" data-act="addbranch">Add branch</button></div>'+
  (GEO.zones.length?'':'<div class="msg info">Region and zone come from a fixed list. <button class="btn sm" data-act="sasec" data-id="geo">Set up regions and zones</button></div>')+
  '<p class="foot">Code: 2 to 5 letters or digits, used in receipt numbers. In the ERP, the branch\'s students, receipts and staff then flow in from Admissions, Fee Collection and HRMS; in this prototype a new branch starts empty.</p></div>';}
function sHistory(){
  return head('Version history','Every published change is a new dated version. Lines keep the version that was effective on their collection date; old versions are read-only.')+
  '<div class="tw"><table><thead><tr><th>Version</th><th>Effective from</th><th>Published by</th><th>On</th><th>Reason</th><th></th></tr></thead><tbody>'+[...S.versions].reverse().map((x,i)=>'<tr><td><b>v'+x.v+'</b> '+(i===0?'<span class="pill good">Latest</span>':'')+'</td><td>'+dmy(x.from)+'</td><td>'+h(x.by)+'</td><td>'+dmy(x.at)+'</td><td style="white-space:normal;min-width:200px">'+h(x.reason)+'</td><td>'+(i?'<button class="btn sm" data-act="restore" data-v="'+x.v+'">Load into draft</button>':'')+'</td></tr>').join('')+'</tbody></table></div>';}
function sReversals(){const ok=can('payment','Approve')&&S.role===S.routing.reversal;const pend=S.revs.filter(r=>r.status==='Pending'),done=S.revs.filter(r=>r.status!=='Pending');
  return head('Reversal requests','HR can request a reversal of a paid line; only Corporate Finance can approve it. Approval updates every report at once.')+
  (pend.length?'<div class="tw"><table><thead><tr><th>Employee</th><th>Student</th><th class="n">Amount</th><th>Paid ref</th><th>Reason</th><th></th></tr></thead><tbody>'+pend.map(r=>{const l=lineById(r.line);return '<tr><td>'+h(emp(l.empId).name)+' <span class="id">'+l.empId+'</span></td><td class="num">'+l.enrol+'</td><td class="n">'+inr(l.amount)+'</td><td class="num">'+h(l.payRef)+'</td><td>'+h(r.reason)+'</td><td><button class="btn sm pri" data-act="approverev" data-id="'+r.id+'"'+(ok?'':' disabled')+'>Approve reversal</button></td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty">No reversal requests waiting</div>')+
  (done.length?'<h3>Approved</h3><ul class="plain">'+done.map(r=>'<li>'+h(r.line)+' · '+h(r.reason)+'</li>').join('')+'</ul>':'');}
function sSimulate(){const rf=curV().p.refund;
  return head('Fee Collection test','Send a receipt status event as Fee Collection would, and see how SRF reacts under the published refund rules.')+
  '<div class="msg info">Published rule: before payment → '+(rf.beforePay==='hold'?'hold the lines':'cancel the lines')+'; after payment → '+(rf.afterPay==='recover'?'recover from staff':'write off')+'.</div>'+
  '<div class="row"><label class="f">Receipt<select id="sim-r" data-chg="sim">'+S.adms.map(a=>'<option value="'+a.enrol+'"'+(a.enrol===S.cp.sim?' selected':'')+'>'+a.receipt+' · '+h(a.name)+' ('+a.rstatus+')</option>').join('')+'</select></label>'+
  '<label class="f">New status<select id="sim-s" data-chg="simTo">'+['Refunded','Cancelled','Adjusted','Active'].map(x=>'<option'+(x===S.cp.simTo?' selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<button class="btn pri" data-act="simulate">Send receipt event</button></div>';}
const CPV={roles:sRoles,rules:sRules,deds:sDeds,limits:sLimits,cats:sCats,att:sAtt,multi:sMulti,docs:sDocs,approval:sApproval,cycle:sCycle,refund:sRefund,access:sAccess,geo:sGeo,branches:sBranches,staffmap:sStaffmap,history:sHistory,reversals:sReversals,simulate:sSimulate};
function cpSide(){const ds=diffs(),pa=preview(CA()),pd=preview(CD()),last=curV(),pv=S.cp.prev;
  const err=[];if(S.cp.from<=last.from)err.push('Effective date must be after '+dmy(last.from)+'.');
  if(pd.over&&CD().limits.blockOver)err.push('Preview admission exceeds the per-admission cap ('+inr(pd.total)+' > '+inr(capOf(CD(),S.cp.prev.srf))+').');
  if(!S.cp.reason.trim())err.push('Give a reason for the change.');
  return '<h2>Draft changes</h2>'+(ds.length?'<ul class="diff">'+ds.map(d=>'<li><b>'+h(NAMES[d.sec]||d.sec)+'</b> '+h(d.k.replace(/^[a-z]+\.?/,'').replace(/[\[\]]/g,' ').trim())+': <s>'+h(fmtV(d.old))+'</s> → '+h(fmtV(d.nu))+'</li>').join('')+'</ul>':'<div class="empty">No changes. Edit any section to start version '+(last.v+1)+'.</div>')+
  '<h3>Impact on one admission</h3><div class="row"><label class="f">SRF (₹)<input type="number" id="pv-srf" data-pv="srf" value="'+pv.srf+'" min="0" step="500"></label><label class="f">Category<select id="pv-cat" data-pv="cat">'+Object.keys(CD().cats).map(k=>'<option'+(k===pv.cat?' selected':'')+'>'+h(k)+'</option>').join('')+'</select></label></div>'+
  '<div class="tw"><table><thead><tr><th>Role</th><th class="n">Staff</th><th class="n">Now</th><th class="n">Draft</th></tr></thead><tbody>'+
  pd.rows.map(r=>{const was=pa.rows.find(x=>x[0]===r[0])?.[2]||0;return '<tr><td>'+h(r[1])+(r[3]==='off'?' <span class="pill">off</span>':'')+'</td><td class="n"><input type="number" aria-label="'+h(r[1])+' staff count" style="width:52px" min="0" max="10" data-pc="'+r[0]+'" value="'+(pv.counts[r[0]]||0)+'"></td><td class="n">'+inr(was)+'</td><td class="n"'+(was!==r[2]?' style="color:var(--warn);font-weight:600"':'')+'>'+inr(r[2])+'</td></tr>'}).join('')+
  '<tr class="tot"><td colspan="2">Staff incentive</td><td class="n">'+inr(pa.total)+'</td><td class="n">'+inr(pd.total)+'</td></tr><tr><td colspan="2">Deductions</td><td class="n">'+inr(pa.ded)+'</td><td class="n">'+inr(pd.ded)+'</td></tr><tr class="tot"><td colspan="2">SRF balance</td><td class="n">'+inr(pa.bal)+'</td><td class="n">'+inr(pd.bal)+'</td></tr></tbody></table></div>'+
  '<div class="bar" title="Draft incentive against cap"><i class="'+(pd.over?'over':'')+'" style="width:'+Math.min(100,pd.total/Math.max(1,capOf(CD(),S.cp.prev.srf))*100)+'%"></i></div>'+
  (pd.eligible?'':'<div class="msg">'+h(pv.cat)+' is not an eligible category: no incentive.</div>')+
  '<p class="foot">Staff counts default to the Chamanganj 11/08/2026 sheet.</p>'+
  (ds.length&&can('policy','Approve')?'<h3>Publish</h3><label class="f">Effective from<input type="date" id="pub-from" data-s="from" value="'+S.cp.from+'"></label>'+
  '<p class="foot">Admissions in this demo were collected on 11/08/2026 (Chamanganj) and 07/10/2026 (Akbarbagh). Unsubmitted admissions collected on or after the effective date recalculate at once; submitted lines keep their version.</p>'+
  '<label class="f">Reason (saved in the audit trail)<textarea id="pub-reason" data-s="reason" placeholder="e.g. Board approved new Counsellor rate">'+h(S.cp.reason)+'</textarea></label>'+
  (err.length?'<div class="msg bad" id="pub-err">'+err.map(h).join('<br>')+'</div>':'')+
  (S.cp.confirm?'<div class="msg info">Publish version '+(last.v+1)+' with '+ds.length+' change'+(ds.length>1?'s':'')+', effective '+dmy(S.cp.from)+'? Admissions collected before that date keep v'+last.v+'.</div><div class="row"><button class="btn pri" data-act="publish">Confirm publish</button><button class="btn" data-act="noconfirm">Back</button></div>':
  '<div class="row"><button class="btn pri" data-act="askpub"'+(err.length?' disabled':'')+'>Publish version '+(last.v+1)+'</button><button class="btn" data-act="discard">Discard draft</button></div>'):'');}
function vAdmin(){const ds=diffs(),last=curV();
  return '<div class="row" style="justify-content:space-between;align-items:center"><div><h1>Corporate Finance control panel</h1><p class="sub">One central SRF policy. What you publish here is what the Principal, Accounts and HR screens calculate with.</p></div><div class="row" style="gap:6px"><span class="pill good">Latest: v'+last.v+' from '+dmy(last.from)+'</span>'+(ds.length?'<span class="pill warn">Draft v'+(last.v+1)+': '+ds.length+' change'+(ds.length>1?'s':'')+'</span>':'')+'</div></div>'+
  '<div class="cp"><nav class="cpnav" aria-label="Control panel sections">'+SECS.map(([k,l])=>k==='-'?'<hr>':'<button data-act="sec" data-id="'+k+'" aria-current="'+(k===S.cp.sec)+'">'+h(l)+(k==='reversals'&&S.revs.some(r=>r.status==='Pending')?'<span class="cnt">'+S.revs.filter(r=>r.status==='Pending').length+'</span>':(!['history','reversals','simulate'].includes(k)&&secChanged(k)?'<span class="dot" title="Changed in draft"></span>':''))+'</button>').join('')+'</nav>'+
  (can('policy','Edit')?'':'<div class="msg info" style="grid-column:1/-1">Read-only for '+h(S.role)+'. Only Corporate Finance edits SRF policy.</div>')+
  '<section class="panel"><fieldset style="border:0;padding:0;margin:0;min-width:0;display:flex;flex-direction:column;gap:12px"'+(can('policy','Edit')||S.cp.sec==='reversals'?'':' disabled')+'>'+CPV[S.cp.sec]()+'</fieldset></section><aside class="panel rail">'+cpSide()+'</aside></div>';}
function setPath(path,val){const m=path.match(/^(\w+)\[([^\]]+)\]\.(\w+)$/);
  if(m){const o=CD()[m[1]].find(x=>(x.code||x.user)===m[2]);o[m[3]]=val;return}
  const ps=path.split('.');let o=CD();ps.slice(0,-1).forEach(k=>o=o[k]);o[ps[ps.length-1]]=val;}
function publishVersion(){if(!can('policy','Approve')){deny('Your role cannot publish SRF policy.','Policy');return}const v=curV().v+1,ds=diffs();
  S.versions.push({v,from:S.cp.from,by:cu().name+' (Corporate Finance)',at:TODAY,reason:S.cp.reason.trim(),p:clone(CD())});
  log('Policy change','Policy v'+v,ds.map(d=>d.k+': '+fmtV(d.old)+' → '+fmtV(d.nu)).join('; ')+' (from '+dmy(S.cp.from)+')',S.cp.reason.trim());
  S.cp.reason='';S.cp.confirm=false;S.cp.draft=clone(curV().p);
  const nx=new Date(Date.parse(S.cp.from)+32*864e5).toISOString().slice(0,8)+'01';S.cp.from=nx;
  const d=S.draft;draftAdms(d).forEach(a=>{if(!d.assign[a.enrol])return;const def=defaultAssign(a);curV().p.roles.forEach(r=>{if(!(r.code in d.assign[a.enrol]))d.assign[a.enrol][r.code]=def[r.code]})});
  notify('Policy published','v'+v);
  toast('Saved. From '+dmy(S.versions[S.versions.length-1].from)+', every SRF request uses these rates (version '+v+').');}

/* ================= Reports ================= */
function reportData(){
  const F=S.rf||{},inR=a=>(!F.from||a.collDate>=F.from)&&(!F.to||a.collDate<=F.to);
  const SC=userBranches().filter(b=>!F.branch||b===F.branch),L=allLines().filter(l=>SC.includes(subOf(l.sub).branch)&&inR(adm(l.enrol))),cur=curV();
  const latest=en=>[...S.subs].reverse().find(x=>x.adms.some(y=>y.enrol===en));
  const branch=SC.map(b=>{const ad=S.adms.filter(a=>a.branch===b&&a.isNew&&inR(a)&&(pVisA(a)||a.claimedBy||S.subs.some(x=>x.adms.some(y=>y.enrol===a.enrol)))),ls=L.filter(l=>adm(l.enrol).branch===b&&l.vstatus==='Approved');
    const appr=sum(ls.filter(l=>!['Reversed','Cancelled'].includes(l.pstatus)).map(l=>l.amount)),paid=sum(ls.filter(l=>l.pstatus==='Paid').map(l=>l.amount)),hold=sum(ls.filter(l=>['On Hold','Recovery Required'].includes(l.pstatus)).map(l=>l.amount)),rec=sum(ls.filter(l=>['Recovered','Written off'].includes(l.pstatus)).map(l=>l.amount));
    const net=sum(ad.filter(a=>a.rstatus==='Active'&&a.astatus==='Confirmed'&&catOk(verFor(a.collDate),a.category)).map(a=>a.amount));
    const ded=sum(S.subs.filter(s=>s.branch===b&&/Verified/.test(s.status)).flatMap(s=>s.adms.filter(x=>x.lines.some(l=>l.vstatus==='Approved')).map(x=>x.ded)));
    const subs=S.subs.filter(s=>s.branch===b);
    return [BR[b],bRegionName(b)||'—',bZoneName(b)||'—',ad.length,inr(sum(ad.map(a=>a.amount))),inr(sum(ad.filter(a=>a.rstatus!=='Active').map(a=>a.amount))),inr(net),inr(appr),inr(paid),inr(Math.max(0,appr-paid-hold-rec)),inr(ded),inr(net-appr-ded),subs.filter(s=>QUEUE.includes(s.status)).length,subs.filter(s=>['Rejected','Returned to Principal'].includes(s.status)).length]});
  const ids=[...new Set(L.filter(l=>l.vstatus==='Approved').map(l=>l.empId))];
  const staff=ids.map(id=>{const e=emp(id),ls=L.filter(l=>l.empId===id&&l.vstatus==='Approved'),paidL=ls.filter(l=>l.pstatus==='Paid');
    const appr=sum(ls.filter(l=>!['Reversed','Cancelled'].includes(l.pstatus)).map(l=>l.amount)),paid=sum(paidL.map(l=>l.amount)),hold=sum(ls.filter(l=>['On Hold','Recovery Required'].includes(l.pstatus)).map(l=>l.amount)),rec=sum(ls.filter(l=>['Recovered','Written off'].includes(l.pstatus)).map(l=>l.amount));
    return [e.bio,e.name,e.desig,[...new Set(ls.map(l=>l.snap?.branch?brShow(l.snap.branch):'—'))].join(', '),brShow(curBranch(e)),new Set(ls.map(l=>l.enrol)).size,inr(appr),inr(paid),inr(Math.max(0,appr-paid-hold-rec)),inr(hold),paidL.length?dmy(paidL[0].paidOn):'—',paidL[0]?.payRef||'—',[...new Set(ls.map(l=>l.pstatus))].join(', ')]});
  const student=S.adms.filter(a=>SC.includes(a.branch)&&inR(a)&&(!F.status||(latest(a.enrol)&&reqStatus(latest(a.enrol))===F.status))&&S.subs.some(s=>s.adms.some(x=>x.enrol===a.enrol))).map(a=>{const s=[...S.subs].reverse().find(s=>s.adms.some(x=>x.enrol===a.enrol)),x=s.adms.find(y=>y.enrol===a.enrol);
    return [a.enrol,a.name,BR[a.branch],a.cls,a.receipt,inr(a.amount),dmy(a.collDate),x.lines.map(l=>(vRole(verNo(x.version),l.role)?.label||l.role)+': '+emp(l.empId).name).join('; '),inr(x.total),'v'+x.version,s.ref,s.status+(s.verifier?' ('+s.verifier+')':''),[...new Set(x.lines.map(l=>l.pstatus||'—'))].join(', ')+' '+([...new Set(x.lines.map(l=>l.batch).filter(Boolean))].join(', ')),a.rstatus]});
  const audit=S.audit.map(a=>[a.at.slice(0,16).replace('T',' '),a.user,a.action,a.entity,a.detail,a.reason||'—']);
  const ACC_ROLES=['Management','Corporate Finance','System Admin','Auditor'];
  const access=ACC_ROLES.includes(S.role)?S.grants.filter(g=>SC.includes(g.branch)&&(!F.pr||g.uid===F.pr)&&(!F.gs||g.status===F.gs)&&(!F.from||g.at.slice(0,10)>=F.from)&&(!F.to||g.at.slice(0,10)<=F.to)).map(g=>[g.id,S.users.find(u=>u.id===g.uid)?.name||g.uid,BR[g.branch],g.normal+' days',dmy(g.from)+' to '+dmy(g.to),g.n+' '+g.unit.toLowerCase(),fcWhen(g.at),g.by,g.status==='Active'?fcWhen(g.expires):fcWhen(g.closedAt),g.status,g.reason,g.ref,g.remarks,g.doc||'—',g.used.length?'Yes ('+g.used.join(', ')+')':'No']):null;
  const out={branch:{title:'Branch-wise SRF collection',cols:['Branch','Region','Zone','New admissions','Gross SRF','Cancelled/refunded','Net eligible SRF','Approved incentive','Paid incentive','Pending incentive','Sadqa','SRF balance','Pending verification','Rejected/returned'],rows:branch,num:[3,4,5,6,7,8,9,10,11,12,13]},
    staff:{title:'Staff-wise SRF payment',cols:['Biometric ID','Employee','Designation','Branch at submission','Current branch','Admissions','Approved','Paid','Pending','Hold/recovery','Payment date','Payroll/bank ref','Status'],rows:staff,num:[5,6,7,8,9]},
    student:{title:'Student-wise SRF audit',cols:['Enrolment','Student','Branch','Class','Receipt','SRF','Receipt date','Staff and roles','Incentive','Policy','Submission','Accounts status','Payment status / batch','Receipt status'],rows:student,num:[5,8]}};
  if(access)out.access={title:'Special access / reopening',cols:['ID','Principal','Branch','Normal access','Reopened SRF dates','Duration','Granted','Granted by','Expires / closed','Status','Reason','Approval ref','Approval remarks','Document','Submitted during access'],rows:access,num:[]};
  return out;}
function vReports(){
  if(!['branch','staff','student'].includes(S.rep))S.rep='branch';
  const R=reportData(),r=R[S.rep],L=allLines().filter(l=>userBranches().includes(subOf(l.sub).branch));
  const SS=S.subs.filter(x=>userBranches().includes(x.branch));
  const pend=[['Pending verification',SS.filter(s=>QUEUE.includes(s.status)).length],['Returned to Principal',SS.filter(s=>s.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===s.id)).length],['Pending HR payment',L.filter(l=>l.pstatus==='Pending HR Processing').length],['Payment on hold',L.filter(l=>l.pstatus==='On Hold').length],['Recovery required',L.filter(l=>l.pstatus==='Recovery Required').length],['Reversals awaiting Finance',S.revs.filter(x=>x.status==='Pending').length]];
  return '<div><h1>Reports</h1><p class="sub">Your data scope: '+h(scopeText(cu()))+'. Every figure is summed live from incentive lines.</p></div>'+
  '<section class="panel"><h3>Pending actions</h3><div class="row">'+pend.map(([k,n])=>'<span class="pill '+(n?'warn':'')+'">'+h(k)+': <b class="num">'+n+'</b></span>').join('')+'</div></section>'+
  '<section class="panel"><div class="tabs" role="tablist">'+Object.entries(R).map(([k,x])=>'<button role="tab" aria-selected="'+(k===S.rep)+'" data-act="rep" data-id="'+k+'">'+h(x.title)+'</button>').join('')+'</div>'+
  '<div class="row" style="justify-content:space-between;align-items:center"><h2>'+h(r.title)+'</h2><button class="btn sm" data-act="csv"'+(can('reports','Download')?'':' disabled')+'>Copy as CSV</button></div>'+
  (r.rows.length?'<div class="tw"><table><thead><tr>'+r.cols.map((c,i)=>'<th class="'+(r.num.includes(i)?'n':'')+'">'+h(c)+'</th>').join('')+'</tr></thead><tbody>'+r.rows.map(row=>'<tr>'+row.map((c,i)=>'<td class="'+(r.num.includes(i)?'n':'')+'">'+h(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<div class="empty">No rows yet. Approve a submission in Accounts to populate this report.</div>')+
  '<p class="foot">In the ERP each report also exports to Excel and PDF with the filters on screen.</p></section>';}

/* ================= System Admin Control Center ================= */
const SA_SECS=[['users','Users and logins'],['perms','Role permissions'],['routing','Workflow and notifications'],['locks','Submission locks'],['-'],['branches','Branches'],['geo','Regions and zones'],['staffmap','HRMS staff mapping'],['integration','Integrations'],['-'],['activity','User activity']];
const ROUTE_OPTS={l1:['Accounts','Corporate Finance'],l2:['Corporate Finance'],payment:['HR'],reversal:['Corporate Finance']};
const ROUTE_NAMES={l1:'Verification level 1',l2:'Verification level 2 (above threshold)',payment:'Payment processing',reversal:'Reversal approval'};
function scopeIdsList(type,ids,attr){
  const opts=type==='branch'?Object.keys(BR).map(c=>[c,BR[c]]):type==='region'?GEO.regions.map(r=>[r.id,r.name]):type==='zone'?GEO.zones.map(z=>[z.id,z.name+' ('+(regById(z.region)?.name||'')+')']):[];
  if(type==='all')return '<span class="id">Corporate-wide: every branch</span>';
  if(!opts.length)return '<span class="id">No '+type+'s defined yet</span>';
  return '<div class="chips">'+opts.map(([v,l])=>'<label class="chk"><input type="checkbox" '+attr+'="'+v+'"'+(ids.includes(v)?' checked':'')+'><span>'+h(l)+'</span></label>').join('')+'</div>';}
const scopeTypeSel=(attr,val,principal)=>'<select '+attr+' aria-label="Data scope">'+(principal?[['branch','Specific branches']]:[['branch','Specific branches'],['zone','Zones'],['region','Regions'],['all','Corporate-wide']]).map(([v,l])=>'<option value="'+v+'"'+(v===val?' selected':'')+'>'+l+'</option>').join('')+'</select>';
function validateUser(x){
  if(!/^[a-z0-9.]{3,30}$/.test(x.login))return 'Login must be 3 to 30 lowercase letters, digits or dots.';
  if(S.users.some(u=>u.login===x.login&&u.id!==x.id))return 'Login '+x.login+' already exists.';
  if(!x.name.trim())return 'Enter the user’s name.';
  if(!x.empId.trim())return 'Enter the HRMS employee ID.';
  if(!x.roles.length)return 'Give the user at least one role.';
  if(x.roles.length>1&&!x.auth.trim())return 'Holding more than one role needs a management authorisation reference.';
  if(x.roles.includes('Principal')){const e=emp(x.empId.trim());
    if(!e)return 'Employee ID '+x.empId+' is not in HRMS.';if(e.status!=='Active')return 'Employee '+x.empId+' is '+e.status.toLowerCase()+' in HRMS.';
    if(!['Principal','Vice Principal'].includes(e.desig))return 'Employee '+x.empId+' is a '+e.desig+' in HRMS, not a Principal.';
    if(x.scope.type!=='branch'||!x.scope.ids.length)return 'A Principal login must be mapped to one or more specific branches.';}
  if(x.scope.type!=='all'&&!x.scope.ids.length)return 'Choose at least one '+x.scope.type+' for the data scope.';
  return null;}
function sUsers(){const A=S.sa,E=A.edit,n=A.newU;
  const geo=u=>{const b=userBranches(u);return [[...new Set(b.map(bRegionName).filter(Boolean))].join(', ')||'—',[...new Set(b.map(bZoneName).filter(Boolean))].join(', ')||'—']};
  return head('Users and logins','Every login is personal and mapped to an HRMS employee ID. A Principal sees only the branches mapped here; other roles see the branches, zones or regions in their data scope. Deactivation takes effect at once; history stays in the audit log.')+
  (A.msg?'<div class="msg bad">'+h(A.msg)+'</div>':'')+
  '<div class="tw"><table><thead><tr><th>Login</th><th>Name</th><th>Employee ID</th><th>Roles</th><th>Data scope</th><th>Region</th><th>Zone</th><th>Status</th><th>Last login</th><th></th></tr></thead><tbody>'+
  S.users.map(u=>{if(E&&E.id===u.id)return '<tr><td class="num">'+h(u.login)+'</td><td><input id="eu-name" data-eu="name" value="'+h(E.name)+'" aria-label="Name" style="width:170px"></td><td><input id="eu-emp" data-eu="empId" value="'+h(E.empId)+'" aria-label="Employee ID" style="width:100px"></td>'+
      '<td style="white-space:normal;min-width:200px"><div class="chips">'+ROLES.map(r=>'<label class="chk"><input type="checkbox" data-eur="'+r+'"'+(E.roles.includes(r)?' checked':'')+'><span>'+r+'</span></label>').join('')+'</div>'+(E.roles.length>1?'<label class="f">Management authorisation ref<input id="eu-auth" data-eu="auth" value="'+h(E.auth)+'" placeholder="e.g. MGMT/2026/09"></label>':'')+'</td>'+
      '<td colspan="3" style="white-space:normal;min-width:240px">'+scopeTypeSel('data-eus="1"',E.scope.type,E.roles.includes('Principal'))+scopeIdsList(E.scope.type,E.scope.ids,'data-eui')+'</td><td>'+st2(u.status)+'</td><td>'+h(u.last)+'</td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm pri" data-act="usave">Save</button><button class="btn sm" data-act="ucancel">Cancel</button></div></td></tr>';
    const [rg,zn]=geo(u);
    return '<tr><td class="num">'+h(u.login)+(u.reset?' <span class="pill warn">Reset pending</span>':'')+'</td><td>'+h(u.name)+'</td><td class="num">'+h(u.empId)+'</td><td style="white-space:normal">'+u.roles.map(r=>'<span class="pill acc">'+h(r)+'</span>').join(' ')+(u.roles.length>1?'<br><span class="id">Authorised: '+h(u.auth)+'</span>':'')+'</td><td style="white-space:normal;min-width:160px">'+h(scopeText(u))+'</td><td>'+h(rg)+'</td><td>'+h(zn)+'</td><td>'+st2(u.status)+'</td><td>'+h(u.last)+'</td>'+
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm" data-act="uedit" data-id="'+u.id+'">Edit</button><button class="btn sm'+(u.status==='Active'?' bad':'')+'" data-act="utoggle" data-id="'+u.id+'">'+(u.status==='Active'?'Deactivate':'Activate')+'</button><button class="btn sm" data-act="ureset" data-id="'+u.id+'">Reset login</button></div></td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="card"><h3>Create a login</h3><div class="row">'+
  '<label class="f">Login<input id="nu-login" data-nu="login" value="'+h(n.login)+'" placeholder="e.g. principal.tlc" style="width:160px"></label>'+
  '<label class="f">Name<input id="nu-name" data-nu="name" value="'+h(n.name)+'" placeholder="As in HRMS" style="width:180px"></label>'+
  '<label class="f">HRMS employee ID<input id="nu-emp" data-nu="empId" value="'+h(n.empId)+'" placeholder="Biometric ID" style="width:120px"></label>'+
  '<label class="f">Role<select id="nu-role" data-nur="1">'+ROLES.map(r=>'<option'+(r===n.role?' selected':'')+'>'+r+'</option>').join('')+'</select></label>'+
  '<label class="f">Data scope'+scopeTypeSel('data-nus="1"',n.stype,n.role==='Principal')+'</label></div>'+scopeIdsList(n.stype,n.ids,'data-nui')+
  '<div class="row"><button class="btn pri" data-act="uadd">Create login</button><span class="foot">A new login starts with a temporary password; the user must set their own at first sign-in. A second role is added afterwards with Edit and needs management authorisation.</span></div></div>'+
  sw2('ess',S.sa.ess!==false,'Staff self-service','Staff can see their own approved, paid, held and recovery SRF lines.');}
const st2=x=>'<span class="pill '+(x==='Active'?'good':'bad')+'">'+h(x)+'</span>';
const sw2=(k,val,title,desc)=>'<label class="sw"><input type="checkbox" data-sys="'+k+'"'+(val?' checked':'')+'><span><b>'+h(title)+'</b><span>'+h(desc)+'</span></span></label>';
function sPerms(){const r=S.sa.roleTab,n=S.users.filter(u=>u.roles.includes(r)).length;
  return head('Role permissions','Screen-wise rights for each role. Cells marked SoD are blocked by separation of duties and cannot be granted to that role. A person who needs both kinds of right must hold two separately authorised roles, and every action records the active role used.')+
  '<div class="tabs" role="tablist">'+ROLES.map(x=>'<button role="tab" aria-selected="'+(x===r)+'" data-act="permtab" data-id="'+x+'">'+x+'</button>').join('')+'</div>'+
  '<p class="foot">'+n+' user'+(n===1?'':'s')+' hold the '+h(r)+' role.</p>'+
  '<div class="tw"><table><thead><tr><th>Screen</th>'+ACTIONS.map(a=>'<th style="text-align:center">'+a+'</th>').join('')+'</tr></thead><tbody>'+
  SCREENS.map(([k,l])=>'<tr><td>'+h(l)+'</td>'+ACTIONS.map(a=>{if(!APPLIES[k].includes(a))return '<td class="na">·</td>';const lk=sodLock(r,k,a);
    if(lk)return '<td class="na" title="'+h(lk)+'"><span class="pill">SoD</span></td>';
    return '<td style="text-align:center"><input type="checkbox" aria-label="'+h(r+' '+l+' '+a)+'" data-perm="'+r+'|'+k+'|'+a+'"'+((S.perms[r]?.[k]||[]).includes(a)?' checked':'')+'></td>'}).join('')+'</tr>').join('')+'</tbody></table></div>'+
  '<p class="foot">· = action does not exist on that screen. Hover an SoD cell to see the rule. System Admin can never be granted SRF rates, verification or payment approval here.</p>';}
function sRouting(){const R=S.routing;
  return head('Workflow and notifications','Who receives each workflow step, and who is notified of each event. Routing can only point to a role that holds the matching right.')+
  '<div class="opt">'+Object.keys(ROUTE_NAMES).map(k=>'<label class="f">'+ROUTE_NAMES[k]+'<select id="rt-'+k+'" data-route="'+k+'"'+(ROUTE_OPTS[k].length<2?' title="Fixed by separation of duties"':'')+'>'+ROUTE_OPTS[k].map(r=>'<option'+(r===R[k]?' selected':'')+'>'+r+'</option>').join('')+'</select></label>').join('')+'</div>'+
  '<p class="foot">Level 2, payment and reversal approval each have one eligible role under separation of duties, so they are fixed. Corporate Finance sets the level 2 amount threshold.</p>'+
  '<h3>Notification recipients</h3><div class="tw"><table><thead><tr><th>Event</th>'+[...ROLES,'Submitting Principal'].map(r=>'<th style="text-align:center">'+h(r)+'</th>').join('')+'</tr></thead><tbody>'+
  NOTIFY_EVENTS.map(ev=>'<tr><td>'+h(ev)+'</td>'+[...ROLES,'Submitting Principal'].map(r=>'<td style="text-align:center"><input type="checkbox" aria-label="'+h(ev+' to '+r)+'" data-notif="'+ev+'|'+r+'"'+((S.notify[ev]||[]).includes(r)?' checked':'')+'></td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function sLocks(){const L=S.sa.lockReason;
  return head('Submission locks','Lock a submission to stop every action on it, for example during an audit query. Locking never changes amounts or decisions. Lock and unlock both need a reason.')+
  (S.subs.length?'<div class="tw"><table><thead><tr><th>Submission</th><th>Branch</th><th>Status</th><th>Lock</th><th>Reason</th><th></th></tr></thead><tbody>'+S.subs.map(x=>'<tr><td class="num">'+x.ref+'</td><td>'+h(BR[x.branch])+'</td><td>'+st(x.status)+'</td><td>'+(x.locked?'<span class="pill bad">Locked '+dmy(x.locked.at)+'</span><br><span class="id">'+h(x.locked.reason)+'</span>':'<span class="pill">Open</span>')+'</td><td><input id="lk-'+x.id+'" data-lockr="'+x.id+'" value="'+h(L[x.id]||'')+'" placeholder="Reason" style="width:200px" aria-label="Reason"></td><td>'+(x.locked?'<button class="btn sm" data-act="unlock" data-id="'+x.id+'">Unlock</button>':'<button class="btn sm bad" data-act="lock" data-id="'+x.id+'">Lock</button>')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No submissions yet</div>');}
function sIntegration(){
  return head('Integrations','HRMS supplies employees, designations, status and branch postings; Fee Collection supplies receipts and refunds. SRF reads these feeds and never writes back to them.')+
  '<div class="card"><h3>HRMS employee and branch-mapping sync</h3><div class="row"><label class="f">Sync frequency<select id="sync-f" data-sync="1">'+['Every 15 minutes','Hourly','Nightly'].map(x=>'<option'+(x===S.sa.sync?' selected':'')+'>'+x+'</option>').join('')+'</select></label><button class="btn" data-act="sync">Sync now</button></div><p class="foot">'+S.emps.length+' employees · '+S.emps.filter(e=>e.status==='Active').length+' active · '+S.emps.filter(e=>e.postings.length>1).length+' with transfers on record.</p></div>'+
  '<div class="card"><h3>Fee Collection receipt sync</h3><p class="foot">Pulls SRF receipts, refunds, cancellations and amount corrections from Fee Collection. Only the SRF fee head is read; other fee heads are ignored. Receipts in a locked academic year or an unknown branch are not imported and are listed under “Need attention”. Running it again changes nothing if Fee Collection has not changed.</p>'+
  '<div class="row"><label class="f">Sync frequency<select id="fc-f" data-fcf="1">'+['Real time (each receipt)','Every 15 minutes','Hourly','Nightly'].map(x=>'<option'+(x===S.fcs.freq?' selected':'')+'>'+x+'</option>').join('')+'</select></label><button class="btn pri" data-act="fcsync">Sync now</button></div>'+
  '<p class="foot">Last synced '+fcWhen(S.fcs.last)+' by '+h(S.fcs.lastBy)+' · '+fcState(null)+'</p>'+
  '<h3>Last run</h3>'+fcRunView(S.fcs.runs[0])+
  (S.fcs.runs.length?'<h3>Sync history</h3><div class="tw"><table><thead><tr><th>Run</th><th>When</th><th>By</th><th>Scope</th><th class="n">Read</th><th class="n">New</th><th class="n">Updated</th><th class="n">Need attention</th></tr></thead><tbody>'+S.fcs.runs.map(r=>'<tr><td class="num">'+r.id+'</td><td>'+fcWhen(r.at)+'</td><td>'+h(r.by)+'</td><td style="white-space:normal">'+h(r.scope)+'</td><td class="n">'+r.read+'</td><td class="n">'+r.added+'</td><td class="n">'+r.updated+'</td><td class="n">'+r.issues.length+'</td></tr>').join('')+'</tbody></table></div>':'')+'</div>'+
  '<div class="card">'+sSimulate()+'</div>';}
function sActivity(){
  const rows=S.users.map(u=>{const ev=S.audit.filter(a=>a.login===u.login);return [u,ev.filter(a=>a.action==='Login').length,S.audit.filter(a=>a.action==='Login denied'&&a.entity==='User '+u.login).length,ev.length]});
  return head('User activity','Sign-ins and actions per user. The full system and finance logs are on the Audit logs screen.')+
  '<div class="tw"><table><thead><tr><th>User</th><th>Roles</th><th>Status</th><th class="n">Sign-ins</th><th class="n">Denied sign-ins</th><th class="n">Logged actions</th><th>Last login</th></tr></thead><tbody>'+rows.map(([u,a,b,c])=>'<tr><td>'+h(u.name)+' <span class="id">'+h(u.login)+'</span></td><td>'+h(u.roles.join(', '))+'</td><td>'+st2(u.status)+'</td><td class="n">'+a+'</td><td class="n">'+b+'</td><td class="n">'+c+'</td><td>'+h(u.last)+'</td></tr>').join('')+'</tbody></table></div>'+
  (can('audit','View')?'<div><button class="btn" data-act="view" data-id="audit">Open audit logs</button></div>':'');}
const SAV={users:sUsers,perms:sPerms,routing:sRouting,locks:sLocks,branches:sBranches,geo:sGeo,staffmap:sStaffmap,integration:sIntegration,activity:sActivity};
function vSysAdmin(){
  return '<div><h1>System Admin Control Center</h1><p class="sub">Owner of logins, user mapping, permissions, workflow routing and technical controls. System Admin does not set SRF rates, verify claims or approve payments.</p></div>'+
  '<div class="cp2"><nav class="cpnav" aria-label="System Admin sections">'+SA_SECS.map(([k,l])=>k==='-'?'<hr>':'<button data-act="sasec" data-id="'+k+'" aria-current="'+(k===S.sa.sec)+'">'+h(l)+'</button>').join('')+'</nav>'+
  '<section class="panel"><fieldset style="border:0;padding:0;margin:0;min-width:0;display:flex;flex-direction:column;gap:12px"'+(can('sysadmin','Edit')?'':' disabled')+'>'+SAV[S.sa.sec]()+'</fieldset></section></div>';}
/* ================= Audit logs ================= */
function vAudit(){const A=S.sa.af,fin=S.role==='Corporate Finance';
  const rows=S.audit.filter(a=>(fin?a.cat==='Finance':A.cat==='All'||a.cat===A.cat)&&(!A.user||a.login===A.user)&&(!A.q||(a.action+' '+a.entity+' '+a.detail+' '+a.reason).toLowerCase().includes(A.q.toLowerCase())));
  return '<div><h1>Audit logs</h1><p class="sub">'+(fin?'Finance audit trail: submissions, verification, payments, reversals and policy changes.':'Every sign-in, mapping, permission change, policy change, submission, verification, payment, reversal and blocked attempt.')+' Records cannot be edited or deleted.</p></div>'+
  '<section class="panel"><div class="row"><label class="f">Category<select id="af-cat" data-af="cat"'+(fin?' disabled':'')+'>'+['All','Finance','System'].map(x=>'<option'+((fin?'Finance':A.cat)===x?' selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<label class="f">User<select id="af-user" data-af="user"><option value="">All users</option>'+S.users.map(u=>'<option value="'+h(u.login)+'"'+(u.login===A.user?' selected':'')+'>'+h(u.name)+'</option>').join('')+'</select></label>'+
  '<label class="f" style="flex:1;min-width:180px">Search<input id="af-q" data-afq="1" value="'+h(A.q)+'" placeholder="Action, record or text"></label><button class="btn" data-act="afsearch">Search</button><button class="btn sm" data-act="xls" data-id="audit"'+(can('audit','Download')?'':' disabled')+'>Download Excel</button><button class="btn sm" data-act="pdf" data-id="audit"'+(can('audit','Download')?'':' disabled')+'>Download PDF</button></div>'+
  '<div class="tw"><table><thead><tr><th>When (UTC)</th><th>User</th><th>Active role</th><th>Category</th><th>Action</th><th>Record</th><th>Change (old → new)</th><th>Reason</th><th>IP / device</th></tr></thead><tbody>'+
  (rows.length?rows.map(a=>'<tr><td class="num">'+a.at.slice(0,16).replace('T',' ')+'</td><td>'+h(a.user)+' <span class="id">'+h(a.login)+'</span></td><td>'+h(a.role)+'</td><td><span class="pill '+(a.cat==='System'?'acc':'')+'">'+a.cat+'</span></td><td>'+h(a.action)+'</td><td>'+h(a.entity)+'</td><td style="white-space:normal;min-width:240px">'+h(a.detail)+'</td><td style="white-space:normal">'+h(a.reason||'—')+'</td><td class="id">'+h(a.device)+'</td></tr>').join(''):'<tr><td colspan="9" class="empty">No entries match</td></tr>')+'</tbody></table></div></section>';}

/* ================= Specification tab ================= */
const SPEC_TOC=[['sp1','1. Purpose and scope'],['sp2','2. Roles and separation of duties'],['sp3','3. Logins and data scope'],['sp4','4. Workflow and statuses'],['sp5','5. Principal submission'],['sp6','6. Verification'],['sp7','7. HR payment'],['sp8','8. Corporate Finance policy'],['sp9','9. System Admin Control Center'],['sp10','10. Reports and dashboards'],['sp11','11. Audit and security'],['sp12','12. Technical design'],['sp13','13. Accounting and rollout'],['sp14','14. Tests and open decisions']];
const SV={line:'var(--muted)',ink:'var(--ink)',q:'var(--muted)',acc:'var(--accent)',accS:'var(--accent-soft)',bad:'var(--bad)',badS:'var(--bad-soft)',grid:'var(--line)'};
const svgArrow=id=>'<defs><marker id="'+id+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+SV.line+'"/></marker></defs>';
const sT=(x,y,t,o='')=>'<text x="'+x+'" y="'+y+'" '+o+'>'+h(t)+'</text>';
function wfSvg(){const W=164,H=56,c1=200,c2=420,c3=630,rP=108,rA=204,rB=284,rH=380,rX=460,mk='url(#wf-a)';
  const box=(cx,cy,a,b,kind,bb)=>'<rect x="'+(cx-W/2)+'" y="'+(cy-H/2)+'" width="'+W+'" height="'+H+'" rx="8" fill="'+(kind===1?SV.accS:kind===2?SV.badS:'none')+'" stroke="'+(kind===1?SV.acc:kind===2?SV.bad:SV.line)+'" stroke-width="'+(kind?2:1.25)+'"/>'+sT(cx,cy-4,a,'text-anchor="middle" font-weight="600" fill="'+SV.ink+'"')+sT(cx,cy+14,b,'text-anchor="middle" '+(bb?'font-weight="600" fill="'+SV.ink+'"':'font-size="11.5" fill="'+SV.q+'"'));
  const P=(d,both)=>'<path d="'+d+'" fill="none" stroke="'+SV.line+'" stroke-width="1.25" marker-end="'+mk+'"'+(both?' marker-start="'+mk+'"':'')+'/>';
  const L=(x,y,t,o='')=>sT(x,y,t,'font-size="11.5" fill="'+SV.q+'" '+o);
  return '<svg viewBox="0 0 760 512" role="img" aria-label="SRF workflow" font-size="13" font-family="IBM Plex Sans, system-ui, sans-serif">'+svgArrow('wf-a')+
  sT(24,30,'Every incentive line is verified before HR can pay it','font-size="15" font-weight="600" fill="'+SV.ink+'"')+
  '<line x1="24" x2="736" y1="160" y2="160" stroke="'+SV.grid+'"/><line x1="24" x2="736" y1="332" y2="332" stroke="'+SV.grid+'"/>'+
  sT(24,112,'Principal','font-weight="600" fill="'+SV.q+'"')+sT(24,248,'Verification','font-weight="600" fill="'+SV.q+'"')+sT(24,424,'HR','font-weight="600" fill="'+SV.q+'"')+
  P('M'+c1+' '+(rP+H/2)+'V'+(rA-H/2))+P('M'+(c2-W/2)+' '+rP+'H'+(c1+W/2))+P('M'+(c1+W/2)+' '+(rA-12)+'H'+c2+'V'+(rP+H/2))+P('M'+(c1+W/2)+' '+(rA+4)+'H'+(c3-W/2),1)+
  P('M'+(c1+W/2)+' '+(rA+20)+'H'+c2+'V'+(rB-H/2))+P('M'+c1+' '+(rA+H/2)+'V'+(rB-H/2))+P('M'+c1+' '+(rB+H/2)+'V'+(rH-H/2))+P('M'+(c1+W/2)+' '+rH+'H'+(c2-W/2))+
  P('M'+(c2+W/2)+' '+rH+'H'+(c3-W/2))+P('M'+c1+' '+(rH+H/2)+'V'+(rX-H/2),1)+P('M'+c3+' '+(rH+H/2)+'V'+(rX-H/2))+
  box(c1,rP,'Draft','own branch only')+box(c2,rP,'Returned to','Principal',0,1)+box(c1,rA,'Pending L1 / L2','Verification',0,1)+box(c3,rA,'On Hold','clarification sought')+
  box(c1,rB,'Verified','full or partial')+box(c2,rB,'Rejected','closed, reason logged',2)+box(c1,rH,'Pending HR','Processing',0,1)+box(c2,rH,'Payroll / Released','payment batch')+
  box(c3,rH,'Paid','reference recorded',1)+box(c1,rX,'Payment On Hold','reason mandatory')+box(c3,rX,'Recovery Required','deduct or collect back',2)+
  L(c1+8,152,'submit')+L(310,100,'revise','text-anchor="middle"')+L(c2+8,168,'return')+L(490,202,'hold / release','text-anchor="middle"')+L(c2+8,246,'reject')+L(c1+8,248,'approve')+
  L(c1+8,344,'approved lines only')+L(310,372,'batch','text-anchor="middle"')+L(525,372,'confirm','text-anchor="middle"')+L(c1+8,424,'hold / release')+L(c3-8,424,'refund, cancellation or reversal','text-anchor="end"')+'</svg>';}
function archSvg(){const mk='url(#ar-a)';
  const R=(x,y,w,hh,main)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="8" fill="'+(main?SV.accS:'none')+'" stroke="'+(main?SV.acc:SV.line)+'" stroke-width="'+(main?2:1.25)+'"/>';
  const B=(x,y,w,hh,a,b,main)=>R(x,y,w,hh,main)+(b?sT(x+w/2,y+hh/2-4,a,'text-anchor="middle" font-weight="600" fill="'+SV.ink+'"')+sT(x+w/2,y+hh/2+14,b,'text-anchor="middle" font-size="11.5" fill="'+SV.q+'"'):sT(x+w/2,y+hh/2+4,a,'text-anchor="middle" fill="'+SV.ink+'"'));
  const P=(d,both)=>'<path d="'+d+'" fill="none" stroke="'+SV.line+'" stroke-width="1.25" marker-end="'+mk+'"'+(both?' marker-start="'+mk+'"':'')+'/>';
  return '<svg viewBox="0 0 760 396" role="img" aria-label="SRF architecture" font-size="13" font-family="IBM Plex Sans, system-ui, sans-serif">'+svgArrow('ar-a')+
  sT(24,28,'One SRF service is the only route from receipt to payment','font-size="15" font-weight="600" fill="'+SV.ink+'"')+
  P('M184 138H240')+P('M184 182H240')+P('M184 226H240')+P('M184 270H240')+P('M520 162H576',1)+P('M520 246H576')+P('M380 100V120',1)+P('M380 288V320')+
  B(240,44,280,56,'Web and mobile UI','personal login · active role · data scope')+B(24,120,160,36,'Admissions')+B(24,164,160,36,'Fee Collection')+B(24,208,160,36,'HRMS postings')+B(24,252,160,36,'Biometric attendance')+
  sT(212,112,'events','text-anchor="middle" font-size="11.5" fill="'+SV.q+'"')+R(240,120,280,168)+sT(256,144,'SRF service','font-weight="600" fill="'+SV.ink+'"')+
  B(256,160,116,48,'Access + SoD','roles, scope')+B(388,160,116,48,'Rules engine','dated versions')+B(256,224,116,48,'Line ledger','source of truth',1)+B(388,224,116,48,'Audit log','append-only')+
  sT(548,128,'outputs','text-anchor="middle" font-size="11.5" fill="'+SV.q+'"')+B(576,136,160,52,'Payroll','SRF_INC, SRF_REC')+B(576,220,160,52,'Finance GL','journal entries')+
  B(240,320,280,52,'Reports and audit screens','read the ledger within data scope')+'</svg>';}
function vSpec(){const raw=SRF_ROOT.getElementById('spec-tpl')?.innerHTML||'';
  return '<div><h1>SRF Module – Consolidated Specification</h1><p class="sub">As of 19/10/2026. Combines the original requirement, functional specification, technical design and every control added since. Available to every signed-in user; nothing here changes data.</p></div>'+
  '<div class="cp2"><nav class="cpnav" aria-label="Specification contents">'+SPEC_TOC.map(([k,l])=>'<button data-act="specgo" data-id="'+k+'">'+h(l)+'</button>').join('')+'</nav>'+
  '<article class="panel spec">'+raw.replace('{{WF}}',wfSvg()).replace('{{ARCH}}',archSvg())+'</article></div>';}

/* ================= Simple screens (UX layer) ================= */
const SC_COLOR={Draft:'grey',Submitted:'blue','Pending Verification':'orange','On Hold':'orange',Returned:'orange',Verified:'green','Pending Payment':'orange','In Batch':'blue','In Payroll':'blue',Paid:'green',Rejected:'red',Cancelled:'red','Recovery Required':'red',Reversed:'red','Written off':'red',Recovered:'grey',Locked:'grey'};
const greet=()=>{const hr=new Date().getHours();return hr<12?'Good morning':hr<17?'Good afternoon':'Good evening'};
const ago=d=>{if(!d)return '';const n=days(d,TODAY);return n<=0?'today':n===1?'yesterday':n<7?n+' days ago':n<14?'last week':n<60?Math.round(n/7)+' weeks ago':Math.round(n/30)+' months ago'};
const firstName=n=>{const u=S.users.find(x=>x.name===n);return u&&u.generic?n:String(n).split(' ')[0]};
const av=n=>'<span class="av" aria-hidden="true">'+h(String(n||'?').split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase())+'</span>';
function dashLine(){const R=S.routing,subs=scopeSubs(),u=cu();
  if(S.role==='Principal'){const ret=subs.filter(x=>x.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===x.id)).length,pend=subs.filter(x=>QUEUE.includes(x.status)).length,dr=S.drafts.filter(d=>d.by===S.uid).length;
    return ret?ret+' request'+(ret>1?'s need':' needs')+' a quick correction from you.':dr?'You have '+dr+' draft'+(dr>1?'s':'')+' saved. Pick up where you left off whenever you’re ready.':pend?pend+' request'+(pend>1?'s are':' is')+' with Accounts right now. You’ll see the result here once '+(pend>1?'they’re':'it’s')+' checked.':'Nothing is waiting on you. Start a new SRF request whenever you’re ready.'}
  if(['Accounts','Corporate Finance'].includes(S.role)){const mine=subs.filter(x=>QUEUE.includes(x.status)&&x.submittedBy!==S.uid&&(x.level===1?(S.role===R.l1||S.role===R.l2):S.role===R.l2));
    const old=mine.map(x=>x.submittedAt).sort()[0];return (mine.length?mine.length+' request'+(mine.length>1?'s are':' is')+' waiting for you'+(old?'; the oldest arrived '+ago(old)+'.':'.'):'You’re all caught up on verification.')+(S.role==='Corporate Finance'?' Policy version '+curV().v+' is live.':'')}
  if(S.role==='HR'){const L=scopeLines().filter(l=>l.vstatus==='Approved'&&l.pstatus==='Pending HR Processing');const n=new Set(L.map(l=>l.empId)).size;return n?n+' staff member'+(n>1?'s are':' is')+' waiting to be paid '+inr(sum(L.map(l=>l.amount)))+'.':'Nothing to pay right now. New verified incentives will appear here.'}
  if(S.role==='System Admin'){const act=S.users.filter(x=>x.status==='Active').length,rs=S.users.filter(x=>x.reset).length;return act+' people can sign in'+(rs?'; '+rs+' login'+(rs>1?'s are':' is')+' waiting for a new password.':'.')}
  return 'Here’s SRF across '+scopeText(u).replace(/^All/,'all')+'.'}
const sp=t=>'<span class="sp sp-'+(SC_COLOR[t]||'grey')+'">'+h(t)+'</span>';
const tip=t=>'<span class="tip" tabindex="0" role="note" aria-label="'+h(t)+'" data-tip="'+h(t)+'">?</span>';
function reqStatus(x){
  if(['Pending Accounts Verification','Pending L2 Verification'].includes(x.status))return S.role==='Principal'?'Submitted':'Pending Verification';
  if(x.status==='On Hold')return 'On Hold';
  const p=pStatus(x);return p==='Pending HR Payment'?'Pending Payment':p;}
const LINE_LABEL={'Pending HR Processing':'Pending Payment','In Batch':'In Batch','Included in Payroll':'In Payroll','Payment Released':'In Batch'};
const lineLabel=l=>LINE_LABEL[l.pstatus]||l.pstatus||'Pending Verification';
const scopeSubs=()=>{const b=userBranches();return S.subs.filter(x=>b.includes(x.branch))};
const scopeLines=()=>{const b=userBranches();return allLines().filter(l=>b.includes(subOf(l.sub).branch))};
const subTotal=x=>sum(x.adms.map(a=>a.total));
const PENDPAY=['Pending HR Processing','In Batch','Included in Payroll','Payment Released','On Hold'];
const PLAIN={'Confirmed':'Admission is not confirmed','New admission':'Not a new admission','Receipt active':'Receipt is refunded, cancelled or adjusted','Amount matches':'SRF amount differs from the fee receipt','Claimed only here':'This student is already claimed in another request','Category eligible':'Admission category is not eligible','Mapped to branch':'Staff member was not mapped to this branch on the receipt date','Active':'Staff member is no longer active in HRMS','Present':'Staff member was absent on the receipt date'};
const plain=t=>PLAIN[t]||(t.startsWith('Rule')?'Incentive differs from the approved policy':t);

/* ---------- Dashboard ---------- */
S.dash={f:'',q:'',open:null};
function dashData(){const subs=scopeSubs(),L=scopeLines().filter(l=>l.vstatus==='Approved');
  const drafts=S.role==='Principal'?S.drafts.filter(d=>d.by===S.uid):S.drafts.filter(d=>userBranches().includes(d.d.branch));
  const pp=L.filter(l=>PENDPAY.includes(l.pstatus)),paid=L.filter(l=>l.pstatus==='Paid');
  return {drafts,subs,cards:[
    ['Draft','Draft',drafts.length,'Saved, not yet submitted'],
    ['pend','Pending Verification',subs.filter(x=>QUEUE.includes(x.status)).length,inr(sum(subs.filter(x=>QUEUE.includes(x.status)).map(subTotal)))+' incentive'],
    ['Returned','Returned',subs.filter(x=>x.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===x.id)).length,'Need correction'],
    ['Verified','Verified',subs.filter(x=>/Verified/.test(x.status)).length,inr(sum(L.filter(l=>l.pstatus!=='Reversed').map(l=>l.amount)))+' approved'],
    ['pp','Pending Payment',new Set(pp.map(l=>l.empId)).size,inr(sum(pp.map(l=>l.amount)))+' to pay'],
    ['Paid','Paid',new Set(paid.map(l=>l.empId)).size,inr(sum(paid.map(l=>l.amount)))+' paid']]};}
function subMatches(x,q){if(!q)return true;q=q.toLowerCase().trim();
  const hay=[x.ref,BR[x.branch],x.branch,dmy(x.submittedAt),x.submittedAt,...x.adms.flatMap(a=>{const ad=adm(a.enrol);return [ad.name,ad.enrol,dmy(ad.collDate),ad.collDate,ad.receipt,...a.lines.flatMap(l=>[emp(l.empId)?.name,l.empId])]})].filter(Boolean).join(' | ').toLowerCase();
  return q.split(/\s+/).every(w=>hay.includes(w));}
function dashFilter(x){const f=S.dash.f;if(!f)return true;
  if(f==='pend')return QUEUE.includes(x.status);if(f==='Returned')return x.status==='Returned to Principal';if(f==='Verified')return /Verified/.test(x.status);
  const ls=x.adms.flatMap(a=>a.lines).filter(l=>l.vstatus==='Approved');
  if(f==='pp')return ls.some(l=>PENDPAY.includes(l.pstatus));if(f==='Paid')return ls.some(l=>l.pstatus==='Paid');return false;}
function vDash(){const D=dashData(),u=cu();
  const list=S.dash.f==='Draft'?[]:D.subs.filter(dashFilter).filter(x=>subMatches(x,S.dash.q)).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)||b.id.localeCompare(a.id));
  const drafts=(S.dash.f===''||S.dash.f==='Draft')?D.drafts.filter(d=>!S.dash.q||(BR[d.d.branch]||'').toLowerCase().includes(S.dash.q.toLowerCase())):[];
  const act=x=>{const st=reqStatus(x);
    if(S.role==='Principal')return x.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===x.id)&&x.adms.every(a=>pVisA(adm(a.enrol)))?'<button class="btn sm pri" data-act="revise" data-id="'+x.id+'">Correct &amp; Resubmit</button>':'<button class="btn sm" data-act="dopen" data-id="'+x.id+'">View status</button>';
    if(can('verification','View')&&QUEUE.includes(x.status))return '<button class="btn sm pri" data-act="qopen" data-id="'+x.id+'">Open</button>';
    return '<button class="btn sm" data-act="dopen" data-id="'+x.id+'">View</button>'};
  return awBanner()+'<div class="actions"><div><h1 class="hello">'+greet()+', '+h(firstName(u.name))+'</h1><p class="sub">'+h(dashLine())+'</p><p class="id">'+h(S.role)+' · '+h(scopeText(u))+'</p></div>'+
    (S.role==='Principal'&&can('submission','Create')?'<button class="btn pri lg" data-act="newsrf">+ New SRF request</button>':'')+'</div>'+
  '<div class="cards" role="group" aria-label="Status summary">'+D.cards.map(([k,l,n,sub])=>'<button class="card2" data-act="dcard" data-id="'+k+'" aria-pressed="'+(S.dash.f===k)+'">'+sp(l)+'<span class="big">'+n+'</span><span class="id">'+h(sub)+'</span></button>').join('')+'</div>'+
  '<section class="panel"><div class="actions"><label class="f" style="flex:1;min-width:220px">Search '+tip('Type a student name, enrolment number, employee name or ID, branch, or a date like 07/10/2026.')+'<input id="dash-q" type="search" data-dq="1" value="'+h(S.dash.q)+'" placeholder="Student, enrolment, employee, ID, branch or date"></label>'+
    '<div class="row" style="gap:8px"><button class="btn" data-act="dsearch">Search</button>'+(S.dash.f||S.dash.q?'<button class="btn" data-act="dclear">Clear</button>':'')+'</div></div>'+
  ((list.length||drafts.length)?'<div class="tw"><table><thead><tr><th>Request</th><th>Branch</th><th>Date</th><th>Students</th><th class="n">Incentive</th><th>Status</th><th></th></tr></thead><tbody>'+
    drafts.map(d=>'<tr><td class="num">Draft '+h(d.id)+'</td><td>'+h(BR[d.d.branch])+'</td><td>'+dmy(d.at)+'</td><td>'+Object.values(d.d.include).filter(Boolean).length+'</td><td class="n">—</td><td>'+sp('Draft')+'</td><td>'+(d.by===S.uid?'<button class="btn sm" data-act="opendraft2" data-id="'+d.id+'">Continue</button>':'')+'</td></tr>').join('')+
    list.map(x=>{const open=S.dash.open===x.id;return '<tr><td class="num">'+x.ref+(x.rev?' R'+x.rev:'')+'</td><td>'+h(BR[x.branch])+'</td><td>'+dmy(x.submittedAt)+'<div class="id">'+ago(x.submittedAt)+'</div></td><td style="white-space:normal;min-width:160px">'+x.adms.map(a=>h(adm(a.enrol).name)).join(', ')+'</td><td class="n">'+inr(subTotal(x))+'</td><td>'+sp(reqStatus(x))+(x.locked?' '+sp('Locked'):'')+'</td><td>'+act(x)+'</td></tr>'+
      (open?'<tr><td colspan="7" style="white-space:normal;background:var(--sunk)">'+reqDetail(x,false)+'</td></tr>':'')}).join('')+'</tbody></table></div>':'<div class="empty">'+(S.dash.q||S.dash.f?'We couldn’t find anything for that. Try a student name, enrolment number or date, or clear the filter.':S.role==='Principal'?'No requests yet. Tap “New SRF request” to start your first one.':'No SRF requests to show yet.')+'</div>')+'</section>';}
function reqDetail(x,withChecks){
  return (x.verRemark?'<div class="msg'+(x.status==='Rejected'?' bad':'')+'"><b>Comment from verification:</b> '+h(x.verRemark)+'</div>':'')+
  x.adms.map(a=>{const ad=adm(a.enrol);const issues=withChecks?admChecks(x,a).filter(c=>!c[1]).map(c=>plain(c[0])):[];
    return '<div class="stu"><div class="actions"><div><b>'+h(ad.name)+'</b> <span class="id">'+ad.enrol+' · '+h(ad.cls)+' · Receipt '+h(ad.receipt)+' · '+dmy(ad.collDate)+'</span></div><div class="row" style="gap:8px;align-items:center"><span class="num">SRF '+inr(a.amountSnap)+'</span>'+(withChecks?(issues.length?sp('Rejected').replace('Rejected',issues.length+' issue'+(issues.length>1?'s':'')):'<span class="sp sp-green">All checks passed</span>'):'')+'</div></div>'+
      (issues.length?'<ul class="plain bad">'+issues.map(i=>'<li>'+h(i)+'</li>').join('')+'</ul>':'')+
      '<div class="tw"><table><thead><tr><th>Role</th><th>Staff name</th><th>Employee ID</th><th class="n">Incentive</th><th>Status</th></tr></thead><tbody>'+
      a.lines.map(l=>{const e=emp(l.empId),r=vRole(verNo(a.version),l.role);return '<tr><td>'+h(r?.label||l.role)+'</td><td>'+h(e.name)+(curBranch(e)!==l.snap?.branch?(S.role==='Principal'&&!principalBranches().includes(curBranch(e))?' <span class="sp sp-orange" title="Moved out of your branch after this request was submitted">Transferred out</span>':' <span class="sp sp-orange" title="Branch at submission: '+h(BR[l.snap?.branch]||'')+'">Now at '+h(BR[curBranch(e)]||curBranch(e))+'</span>'):'')+'</td><td class="num">'+e.bio+'</td><td class="n">'+inr(l.amount)+'</td><td>'+sp(l.vstatus==='Rejected'?'Rejected':l.vstatus==='Pending'?(S.role==='Principal'?'Submitted':'Pending Verification'):lineLabel(l))+'</td></tr>'}).join('')+
      '<tr class="tot"><td colspan="3">Total incentive</td><td class="n">'+inr(a.total)+'</td><td></td></tr></tbody></table></div></div>'}).join('');}

/* ---------- Principal: 5 steps ---------- */
S.wz={step:1,tab:'new',done:null};
const WZ=['Branch','Period','Students','Assign staff','Review & submit'];
function wzEligible(d){return draftAdms(d).filter(a=>!elig(a))}
function vPrincipal2(){
  if(S.role!=='Principal')return vSubsReadOnly();
  const own=principalBranches();if(!own.includes(S.draft.branch))S.draft=newDraft(own[0]||'');
  const d=S.draft,tabs='<div class="tabs" role="tablist"><button role="tab" aria-selected="'+(S.wz.tab==='new')+'" data-act="wztab" data-id="new">'+(d.revOf?'Correct &amp; resubmit':'New SRF request')+'</button><button role="tab" aria-selected="'+(S.wz.tab==='my')+'" data-act="wztab" data-id="my">View status</button></div>';
  if(!own.length)return '<h1>SRF request</h1><div class="msg bad">No branch is assigned to your login yet. Please ask System Admin to map your branch.</div>';
  if(S.wz.tab==='my')return '<h1>SRF request</h1>'+tabs+myRequests(own);
  if(S.wz.done)return '<h1>SRF request</h1>'+tabs+'<section class="panel"><div class="msg good"><b>Thank you, '+h(firstName(cu().name))+'!</b> '+h(S.wz.done)+' has gone to Accounts for verification. You’ll see their decision under View status.</div><div class="row"><button class="btn pri" data-act="wztab" data-id="my">View status</button><button class="btn" data-act="newsrf">Start another request</button></div></section>';
  const st=S.wz.step,s=draftSummary(d),el=wzEligible(d),sel=el.filter(a=>d.include[a.enrol]);
  const stepper='<ol class="steps" aria-label="Steps">'+WZ.map((l,i)=>'<li><button data-act="wzgo" data-id="'+(i+1)+'"'+(i+1===st?' aria-current="step"':'')+' class="'+(i+1<st?'done':'')+'"><span class="n">'+(i+1<st?'✓':i+1)+'</span>'+l+'</button></li>').join('')+'</ol>';
  let body='';
  if(st===1){body='<h2>1. Your branch</h2><p class="sub">We’ve filled this in for you.</p>'+(own.length===1?'<div class="pick sel"><div><b>'+h(BR[d.branch])+'</b><div class="id">'+[bRegionName(d.branch),bZoneName(d.branch)].filter(Boolean).join(' · ')+'</div></div>'+tip('Assigned to your login by System Admin. You can only submit SRF for this branch.')+'</div>':
    own.map(k=>'<label class="pick'+(k===d.branch?' sel':'')+'"><input type="radio" name="wzb" data-chg="branch" value="'+k+'"'+(k===d.branch?' checked':'')+'><div><b>'+h(BR[k])+'</b><div class="id">'+[bRegionName(k),bZoneName(k)].filter(Boolean).join(' · ')+'</div></div></label>').join(''))+
    '<p class="foot">Only your branch’s students and staff appear in the next steps, so you can’t pick the wrong ones.</p>';}
  else if(st===2){const n=draftAdms(d).length;const ayNow=ayOf(d.from)||ayCur();body='<h2>2. Which dates are you claiming for?</h2>'+awBanner([d.branch])+
    '<label class="f" style="max-width:260px">Academic year '+tip('Only open academic years can be claimed. A locked year is closed by System Admin.')+'<select id="wz-ay" data-wzay="1">'+[...S.ays].sort((x,y)=>y.from.localeCompare(x.from)).map(y=>'<option value="'+y.id+'"'+(y.id===ayNow.id?' selected':'')+(y.status==='Locked'?' disabled':'')+'>'+h(y.name)+(y.status==='Locked'?' · locked':y.current?' · current':'')+'</option>').join('')+'</select></label>'+
    '<div class="row"><button class="btn" data-act="wzperiod" data-id="month">This month</button><button class="btn" data-act="wzperiod" data-id="last">Last month</button><button class="btn" data-act="wzperiod" data-id="ay">Whole academic year</button></div>'+
    '<div class="row"><label class="f">From '+tip('SRF receipts collected from this date are listed.')+'<input type="date" id="wz-from" data-chg="from" value="'+d.from+'"></label><label class="f">To<input type="date" id="wz-to" data-chg="to" value="'+d.to+'"></label></div>'+
    '<p class="foot">We found '+n+' SRF receipt'+(n===1?'':'s')+' in these dates. '+(el.length?el.length+' can be claimed.':'None can be claimed yet.')+'</p>';}
  else if(st===3){const inel=draftAdms(d).filter(a=>elig(a));
    body=awBanner([d.branch])+fcBar()+'<div class="actions"><h2>3. Which students are you claiming for? '+tip('New admissions with SRF collected in your period. Students already claimed, refunded or not eligible are listed separately.')+'</h2>'+(el.length?'<div class="row" style="gap:8px"><button class="btn sm" data-act="wzall">Select all</button><button class="btn sm" data-act="wznone">Clear</button></div>':'')+'</div>'+
    (el.length?el.map(a=>'<label class="pick'+(d.include[a.enrol]?' sel':'')+'"><input type="checkbox" data-inc="'+a.enrol+'"'+(d.include[a.enrol]?' checked':'')+'><div style="flex:1;min-width:0"><b>'+h(a.name)+'</b><div class="id">'+a.enrol+' · '+h(a.cls)+' · Receipt '+h(a.receipt)+' · '+dmy(a.collDate)+'</div></div><span class="num">'+inr(a.amount)+'</span></label>').join(''):'<div class="empty">'+(S.role==='Principal'?'No SRF receipts can be claimed in your access period right now. Click “Sync now” to fetch new receipts from Fee Collection.':'No students can be claimed in these dates. Try going back and choosing a wider period.')+'</div>')+
    (inel.length?'<details><summary>'+inel.length+' receipt'+(inel.length>1?'s':'')+' can’t be claimed</summary><ul class="plain">'+inel.map(a=>'<li>'+h(a.name)+' ('+a.enrol+'): '+h(elig(a))+'</li>').join('')+'</ul></details>':'');}
  else if(st===4){body='<div class="actions"><h2>4. Who helped with each admission? '+tip('Pick the staff who worked on each admission. Only active staff mapped to your branch on the receipt date, and present that day, are listed.')+'</h2>'+(sel.length>1?'<button class="btn sm" data-act="wzcopy">Use first student’s staff for all</button>':'')+'</div>'+
    (sel.length?sel.map(a=>{const c=calc(a,d.assign[a.enrol]||{}),asg=d.assign[a.enrol];
      return '<div class="stu"><div class="actions"><div><b>'+h(a.name)+'</b> <span class="id">'+a.enrol+' · '+dmy(a.collDate)+'</span></div><span class="id">'+c.lines.length+' staff</span></div>'+
      onRoles(c.v).map(r=>{const m=mapped(r,a.branch,a.collDate),cur=(asg[r.code]||[]).filter(Boolean),used=new Set(Object.values(asg).flat().filter(Boolean)),opts=m.filter(e=>e.att==='Present'&&!used.has(e.bio)),abs=m.filter(e=>e.att!=='Present');
        return '<div class="rolerow"><div><b>'+h(r.label)+'</b><div class="id">up to '+r.slots+'</div></div><div class="chips">'+
          cur.map(id=>{const e=emp(id),bad=c.bad.find(b=>b.id===id);return '<span class="chip2'+(bad?' badc':'')+'" title="'+h(bad?bad.why:'')+'">'+av(e?e.name:id)+h(e?e.name:id)+' <span class="id">'+h(id)+'</span><button aria-label="Remove '+h(e?e.name:id)+'" data-act="wzrm" data-id="'+a.enrol+'|'+r.code+'|'+h(id)+'">×</button></span>'}).join('')+
          (cur.length<r.slots&&opts.length?'<select aria-label="Add '+h(r.label)+'" data-wzadd="'+a.enrol+'|'+r.code+'"><option value="">+ Add '+h(r.label)+'</option>'+opts.map(e=>'<option value="'+e.bio+'">'+h(e.name)+' · '+e.bio+'</option>').join('')+'</select>':'')+
          (!m.length?'<span class="id">No '+h(r.label)+' at this branch</span>':'')+(abs.length?'<span class="id">Absent that day: '+abs.map(e=>h(e.name)).join(', ')+'</span>':'')+'</div></div>'}).join('')+
      (c.bad.length?'<div class="msg bad">'+c.bad.map(b=>h(b.why)+' (ID '+h(b.id)+')').join('<br>')+'</div>':'')+'</div>'}).join(''):'<div class="empty">Go back one step and choose at least one student.</div>')+
    '<details'+(S.lookup.res?' open':'')+'><summary>Can’t find someone? Check an employee ID</summary><div class="row"><input id="lk-id2" data-lk="1" value="'+h(S.lookup.id)+'" placeholder="Biometric ID" style="width:160px" aria-label="Employee ID"><button class="btn" data-act="lookup">Check</button></div>'+
      (S.lookup.res?(S.lookup.res.ok?'<div class="msg good">'+h(S.lookup.res.e.name)+' can be assigned.</div>':'<div class="msg bad">'+h(S.lookup.res.msg)+'</div>'):'')+'</details>';}
  else {body='<h2>5. Check and send</h2><p class="sub">Here’s what Accounts will see.</p>'+
    (s.cs.length?'<div class="tw"><table><thead><tr><th>Student</th><th>Enrolment</th><th class="n">SRF</th><th class="n">Staff</th><th class="n">Incentive</th></tr></thead><tbody>'+s.cs.map(({a,c})=>'<tr><td>'+h(a.name)+'</td><td class="num">'+a.enrol+'</td><td class="n">'+inr(a.amount)+'</td><td class="n">'+c.lines.length+'</td><td class="n">'+inr(c.total)+'</td></tr>').join('')+
      '<tr class="tot"><td colspan="2">Total · '+s.cs.length+' student'+(s.cs.length>1?'s':'')+' · '+s.people+' staff</td><td class="n">'+inr(s.srf)+'</td><td></td><td class="n">'+inr(s.inc)+'</td></tr></tbody></table></div><p class="foot">The system works out every incentive from the approved policy, so there’s nothing to type in.</p>':'')+
    (s.blocks.length?'<div class="msg bad"><b>Almost there. Please fix these first:</b><ul class="plain">'+s.blocks.map(b=>'<li>'+h(b)+'</li>').join('')+'</ul></div>':'<div class="msg good">All set. Everything looks right, so you can send it to Accounts.</div>')+
    (s.warns.length?'<div class="msg">'+s.warns.map(h).join('<br>')+'</div>':'')+
    (s.docs.length?'<label class="f">Required document: '+h(s.docs.join(', '))+'<input type="file" id="p-doc2" data-doc="1" accept=".pdf,.jpg,.png"></label>'+(d.doc?'<span class="id">Attached: '+h(d.doc)+'</span>':''):'')+
    '<label class="f">Anything Accounts should know? (optional)<textarea id="p-remark2" data-in="remark">'+h(d.remark)+'</textarea></label>';}
  const nav='<div class="actions wznav"><div class="row" style="gap:8px">'+(st>1?'<button class="btn" data-act="wzgo" data-id="'+(st-1)+'">Back</button>':'')+'<button class="btn" data-act="savedraft">Save Draft</button></div>'+
    (st<5?'<button class="btn pri lg" data-act="wznext">Next: '+WZ[st]+'</button>':'<button class="btn pri lg" data-act="submit"'+(s.blocks.length||!can('submission','Submit')?' disabled':'')+'>Submit for Verification</button>')+'</div>';
  return '<h1>SRF request</h1>'+tabs+(d.revOf?'<div class="msg"><b>You’re correcting '+h(subOf(d.revOf).ref)+'.</b> Accounts asked: “'+h(subOf(d.revOf).verRemark)+'”</div>':'')+
    '<section class="panel wz">'+stepper+body+nav+'</section>';}
function myRequests(own){const subs=S.subs.filter(x=>own.includes(x.branch)).sort((a,b)=>b.id.localeCompare(a.id)),drafts=S.drafts.filter(x=>x.by===S.uid);
  if(!subs.length&&!drafts.length)return '<div class="empty">You haven’t sent any requests yet. Your first one will show up here.</div>';
  const note='<p class="foot">Submitted requests stay here after your access period ends. They are read-only; a returned request outside your access period needs special access from System Admin with management approval.</p>';
  return '<section class="panel"><div class="tw"><table><thead><tr><th>Request</th><th>Date</th><th>Students</th><th class="n">Incentive</th><th>Status</th><th></th></tr></thead><tbody>'+
    drafts.map(d=>'<tr><td class="num">Draft '+h(d.id)+'</td><td>'+dmy(d.at)+'</td><td>'+Object.values(d.d.include).filter(Boolean).length+'</td><td class="n">—</td><td>'+sp('Draft')+'</td><td><button class="btn sm" data-act="opendraft2" data-id="'+d.id+'">Continue</button></td></tr>').join('')+
    subs.map(x=>{const ret=x.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===x.id),open=S.dash.open===x.id;
      return '<tr><td class="num">'+x.ref+(x.rev?' R'+x.rev:'')+'</td><td>'+dmy(x.submittedAt)+'<div class="id">'+ago(x.submittedAt)+'</div></td><td style="white-space:normal;min-width:150px">'+x.adms.map(a=>h(adm(a.enrol).name)).join(', ')+'</td><td class="n">'+inr(subTotal(x))+'</td><td>'+sp(reqStatus(x))+'</td><td>'+(ret&&!x.locked&&x.adms.every(a=>pVisA(adm(a.enrol)))?'<button class="btn sm pri" data-act="revise" data-id="'+x.id+'">Correct &amp; Resubmit</button>':(ret?'<span class="sp sp-grey" title="Outside your SRF access period. Contact Corporate Finance.">Read-only</span> ':'')+'<button class="btn sm" data-act="dopen" data-id="'+x.id+'">'+(open?'Hide':'Details')+'</button>')+'</td></tr>'+
      (open?'<tr><td colspan="6" style="white-space:normal;background:var(--sunk)">'+reqDetail(x,false)+'</td></tr>':'')}).join('')+'</tbody></table></div>'+note+'</section>';}

/* ---------- Accounts: simple queue ---------- */
S.vq={tab:'pending'};
function vVerify(){const R=S.routing,subs=scopeSubs();
  const mine=x=>x.level===1?(S.role===R.l1||S.role===R.l2):S.role===R.l2;
  const T={pending:subs.filter(x=>QUEUE.includes(x.status)&&(!can('verification','Verify')||mine(x))),returned:subs.filter(x=>x.status==='Returned to Principal'),verified:subs.filter(x=>/Verified/.test(x.status)),rejected:subs.filter(x=>x.status==='Rejected')};
  const NAMES2={pending:'Pending Verification',returned:'Returned',verified:'Verified',rejected:'Rejected'};
  const list=T[S.vq.tab];if(!list.some(x=>x.id===S.acc.sel))S.acc.sel=list[0]?.id||null;const x=subOf(S.acc.sel);
  let det='<div class="empty">Pick a request on the left to see the details.</div>';
  if(x){const lines=x.adms.flatMap(a=>a.lines);
    x.adms.forEach(a=>a.lines.forEach(l=>{if(!(l.id in S.acc.checked)||l.empId===cu().empId)S.acc.checked[l.id]=l.empId!==cu().empId&&admChecks(x,a).every(c=>c[1])&&lineChecks(a,l).every(c=>c[1])}));
    const live=S.vq.tab==='pending',actOK=live&&!x.locked&&x.submittedBy!==S.uid&&(x.level===1?can('verification','Verify')&&(S.role===R.l1||S.role===R.l2):can('verification','Approve')&&S.role===R.l2),dis=actOK?'':' disabled';
    const chk=lines.filter(l=>S.acc.checked[l.id]);
    det='<div class="actions"><div><h2>'+x.ref+(x.rev?' R'+x.rev:'')+'</h2><p class="sub">'+h(BR[x.branch])+' · sent by '+h(S.users.find(u=>u.id===x.submittedBy)?.name||'the Principal')+' '+ago(x.submittedAt)+' ('+dmy(x.submittedAt)+')'+(x.remark?' · “'+h(x.remark)+'”':'')+'</p></div>'+sp(x.status==='On Hold'?'On Hold':NAMES2[S.vq.tab])+'</div>'+
      (x.level===2&&live?'<div class="msg info">Level 1 verified by '+h(x.l1)+'. Needs final approval by '+h(R.l2)+' (above '+inr(curV().p.approval.l2Above)+').</div>':'')+
      (x.locked?'<div class="msg bad">Locked by System Admin: '+h(x.locked.reason)+'</div>':'')+(x.submittedBy===S.uid?'<div class="msg bad">You sent this request yourself, so a colleague needs to verify it.</div>':'')+
      x.adms.map(a=>{const ad=adm(a.enrol),issues=admChecks(x,a).filter(c=>!c[1]).map(c=>plain(c[0]));
        return '<div class="stu"><div class="actions"><div><b>'+h(ad.name)+'</b> <span class="id">'+ad.enrol+' · '+h(ad.cls)+' · Receipt '+h(ad.receipt)+' · '+dmy(ad.collDate)+'</span></div><div class="row" style="gap:8px;align-items:center"><span class="num">SRF receipt '+inr(a.amountSnap)+'</span>'+(issues.length?'<span class="sp sp-red">Needs a look ('+issues.length+')</span>':'<span class="sp sp-green">Looks good</span>')+'</div></div>'+
          (issues.length?'<ul class="plain bad">'+issues.map(i=>'<li>'+h(i)+'</li>').join('')+'</ul>':'')+
          '<div class="tw"><table><thead><tr>'+(live?'<th>Include '+'</th>':'')+'<th>Role</th><th>Staff name</th><th>Employee ID</th><th class="n">Incentive</th><th>Check</th></tr></thead><tbody>'+
          a.lines.map(l=>{const e=emp(l.empId),r=vRole(verNo(a.version),l.role),bad=lineChecks(a,l).filter(c=>!c[1]).map(c=>plain(c[0])),own=l.empId===cu().empId;
            return '<tr>'+(live?'<td><input type="checkbox" aria-label="Include '+h(e.name)+'" data-acc="'+l.id+'"'+(S.acc.checked[l.id]?' checked':'')+(own||!actOK?' disabled':'')+'></td>':'')+'<td>'+h(r?.label||l.role)+'</td><td>'+av(e.name)+h(e.name)+(own?' <span class="sp sp-red">You</span>':'')+(curBranch(e)!==l.snap?.branch?' <span class="sp sp-orange">Now at '+h(BR[curBranch(e)]||'')+'</span>':'')+'</td><td class="num">'+e.bio+'</td><td class="n">'+inr(l.amount)+'</td><td>'+(bad.length?'<span class="sp sp-red" title="'+h(bad.join('; '))+'">'+h(bad[0])+'</span>':'<span class="sp sp-green">OK</span>')+'</td></tr>'}).join('')+
          '<tr class="tot"><td colspan="'+(live?4:3)+'">System-calculated incentive</td><td class="n">'+inr(a.total)+'</td><td></td></tr></tbody></table></div></div>'}).join('')+
      (x.verRemark&&!live?'<div class="msg"><b>Comment:</b> '+h(x.verRemark)+'</div>':'')+
      (live?'<label class="f">Comment '+tip('Needed to return, reject or hold a request, or to verify only some staff. The Principal sees this comment.')+'<textarea id="acc-remark2" data-in="accRemark" placeholder="e.g. Counsellor was on leave that day; please correct">'+h(S.acc.remark)+'</textarea></label>'+
      '<div class="row"><button class="btn pri lg"'+dis+' data-act="decide" data-t="approve">Verify'+(chk.length<lines.length?' '+chk.length+' of '+lines.length+' staff':'')+'</button><button class="btn"'+dis+' data-act="decide" data-t="return">Return for Correction</button><button class="btn bad"'+dis+' data-act="decide" data-t="reject">Reject</button>'+
        (x.status==='On Hold'?'<button class="btn"'+dis+' data-act="decide" data-t="release">Release Hold</button>':'<button class="btn"'+dis+' data-act="decide" data-t="hold">Hold</button>')+'</div>'+
      '<p class="foot">Amounts are calculated by the system from the approved policy and cannot be edited.</p>':'');}
  return '<h1>Verification</h1>'+fcBar()+'<div class="tabs" role="tablist">'+Object.keys(T).map(k=>'<button role="tab" aria-selected="'+(k===S.vq.tab)+'" data-act="vtab" data-id="'+k+'">'+NAMES2[k]+' ('+T[k].length+')</button>').join('')+'</div>'+
  '<div class="two"><div class="queue">'+(list.length?list.map(y=>'<button class="qi" data-act="sel" data-id="'+y.id+'" aria-current="'+(y.id===S.acc.sel)+'"><span><b class="num">'+y.ref+'</b><br><span class="id">'+h(BR[y.branch])+' · '+y.adms.length+' student'+(y.adms.length>1?'s':'')+' · '+ago(y.submittedAt)+'</span></span><span class="num">'+inr(subTotal(y))+'</span></button>').join(''):'<div class="empty">You’re all caught up. Nothing is waiting here.</div>')+'</div>'+
  '<section class="panel">'+det+'</section></div>';}

/* ---------- HR: payments ---------- */
S.pay={tab:'topay',sel:{},reason:''};
function vPay(){const p=curV().p,L=scopeLines().filter(l=>l.vstatus==='Approved'&&!subOf(l.sub).locked);
  if(!p.cycle.offCycle&&S.hr.method!=='Payroll')S.hr.method='Payroll';
  const topay=L.filter(l=>['Pending HR Processing','On Hold'].includes(l.pstatus)),open=S.batches.filter(b=>b.status!=='Paid'&&b.lines.some(k=>userBranches().includes(subOf(lineById(k).sub).branch))),paid=L.filter(l=>['Paid','Reversed'].includes(l.pstatus)),exc=L.filter(l=>['Recovery Required','Recovered','Cancelled','Written off'].includes(l.pstatus));
  const T=[['topay','To pay',new Set(topay.map(l=>l.empId)).size],['batches','Payment batches',open.length],['paid','Paid',new Set(paid.map(l=>l.empId)).size],['exc','Recovery',exc.length]];
  const ro=!can('payment','Create');
  const byStaff=ls=>{const m={};ls.forEach(l=>(m[l.empId]=m[l.empId]||[]).push(l));return Object.entries(m)};
  const brOf=ls=>[...new Set(ls.map(l=>BR[l.snap?.branch]||'—'))].join(', ');
  let body='';
  if(S.pay.tab==='topay'){const rows=byStaff(topay),selN=Object.keys(S.pay.sel).filter(k=>S.pay.sel[k]&&rows.some(([id])=>id===k));
    const selAmt=sum(rows.filter(([id])=>S.pay.sel[id]).flatMap(([,ls])=>ls.filter(l=>l.pstatus==='Pending HR Processing').map(l=>l.amount)));
    body=(ro?'<div class="msg info">Read-only. Payments are processed by '+h(S.routing.payment)+'.</div>':'')+
    '<div class="row"><label class="f">Payment '+({date:'date',week:'week',month:'month'})[ptype()]+' '+tip('The payroll month (or payment date/week for daily or weekly cycles) these incentives will be paid in.')+'<input type="'+ptype()+'" id="pay-period" data-chg="period" value="'+periodKey()+'"></label>'+
      (p.cycle.offCycle?'<label class="f">Pay through<select id="pay-method" data-chg="method"><option'+(S.hr.method==='Payroll'?' selected':'')+'>Payroll</option><option'+(S.hr.method==='Bank transfer'?' selected':'')+'>Bank transfer</option></select></label>':'')+
      '<button class="btn pri lg" data-act="pbatch"'+(selN.length&&!ro?'':' disabled')+'>Create Payment Batch'+(selN.length?' · '+selN.length+' staff · '+inr(selAmt):'')+'</button></div>'+
    (rows.length?'<div class="tw"><table><thead><tr><th><input type="checkbox" aria-label="Select all" data-paysel="*"'+(rows.length&&rows.every(([id])=>S.pay.sel[id])?' checked':'')+'></th><th>Staff name</th><th>Employee ID</th><th>Branch</th><th class="n">Approved incentive</th><th>Payment month</th><th>Payment status</th><th></th></tr></thead><tbody>'+
      rows.map(([id,ls])=>{const e=emp(id),hold=ls.every(l=>l.pstatus==='On Hold'),dups=ls.filter(l=>l.pstatus==='Pending HR Processing'&&dupPay(l)),amt=sum(ls.filter(l=>!dups.includes(l)).map(l=>l.amount));
        return '<tr><td><input type="checkbox" aria-label="Select '+h(e.name)+'" data-paysel="'+id+'"'+(S.pay.sel[id]?' checked':'')+(hold?' disabled':'')+'></td><td>'+av(e.name)+h(e.name)+'<div class="id">'+ls.length+' student'+(ls.length>1?'s':'')+'</div></td><td class="num">'+id+'</td><td>'+h(brOf(ls))+'</td><td class="n">'+inr(amt)+'</td><td>'+h(periodLabel(periodKey()))+'</td><td>'+sp(hold?'On Hold':'Pending Payment')+(hold?'<div class="id">'+h(ls[0].note)+'</div>':'')+(dups.length?' <span class="sp sp-bad">Duplicate</span><div class="id">'+h(dups.map(l=>l.enrol+' already on line '+dupPay(l).id).join('; '))+' – left out of the batch</div>':'')+'</td><td>'+(hold?'<button class="btn sm" data-act="prelease" data-id="'+id+'"'+(ro?' disabled':'')+'>Release</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>'+
      '<div class="row"><label class="f" style="flex:1;min-width:200px">Reason to hold '+tip('Needed to put a payment on hold, e.g. bank details missing in HRMS.')+'<input id="pay-reason" data-in="hrReason" value="'+h(S.hr.reason)+'" placeholder="e.g. Bank details pending in HRMS"></label><button class="btn" data-act="phold"'+(selN.length&&!ro?'':' disabled')+'>Put on Hold</button></div>':'<div class="empty">Nothing to pay right now. New verified incentives will appear here.</div>');}
  else if(S.pay.tab==='batches'){body=open.length?open.map(b=>{const ls=b.lines.map(lineById),amt=sum(ls.filter(l=>!['On Hold','Reversed'].includes(l.pstatus)).map(l=>l.amount)),stl=b.status==='In Payroll'?'In Payroll':'In Batch';
      return '<div class="stu"><div class="actions"><div><b class="num">'+b.ref+'</b><div class="id">'+h(periodLabel(b.period))+' · '+h(b.method)+' · '+new Set(ls.map(l=>l.empId)).size+' staff</div></div><div class="row" style="gap:8px;align-items:center"><span class="num">'+inr(amt)+'</span>'+sp(stl)+'</div></div>'+
        '<div class="row">'+(b.method==='Payroll'&&b.status!=='In Payroll'?'<button class="btn pri" data-act="pinclude" data-id="'+b.ref+'"'+(ro?' disabled':'')+'>Include in Payroll</button>':'')+
        '<label class="f">'+(b.method==='Payroll'?'Payroll run reference':'Bank UTR')+' '+tip(b.method==='Payroll'?'The payroll run number once payroll is posted.':'The bank transaction reference. One UTR can be used for one batch only.')+'<input id="ref-'+b.ref+'" data-ref="'+b.ref+'" value="'+h(S.hr.ref[b.ref]||'')+'" placeholder="'+(b.method==='Payroll'?'e.g. PR-2026-10':'e.g. UTR123456')+'"></label>'+
        (b.method==='Payroll'?'':'<label class="f">Payment proof<input type="file" id="proof-'+b.ref+'"></label>')+
        '<button class="btn" data-act="paid" data-id="'+b.ref+'"'+(ro||(b.method==='Payroll'&&b.status!=='In Payroll')?' disabled':'')+'>Mark as Paid</button></div>'+
        (b.method==='Payroll'&&b.status!=='In Payroll'?'<p class="foot">Include in Payroll first, then mark as paid once payroll is posted.</p>':'')+'</div>'}).join(''):'<div class="empty">No batches in progress. Create one from the To pay tab.</div>';}
  else if(S.pay.tab==='paid'){const rows=byStaff(paid);body=rows.length?'<div class="tw"><table><thead><tr><th>Staff name</th><th>Employee ID</th><th>Branch</th><th class="n">Amount</th><th>Payment month</th><th>Reference</th><th>Status</th><th></th></tr></thead><tbody>'+
      rows.map(([id,ls])=>{const e=emp(id),rev=ls.some(l=>l.pstatus==='Reversed'),pend=ls.some(l=>S.revs.some(r=>r.line===l.id&&r.status==='Pending'));
        return '<tr><td>'+h(e.name)+'</td><td class="num">'+id+'</td><td>'+h(brOf(ls))+'</td><td class="n">'+inr(sum(ls.filter(l=>l.pstatus==='Paid').map(l=>l.amount)))+'</td><td>'+h([...new Set(ls.map(l=>periodLabel(S.batches.find(b=>b.ref===l.batch)?.period)))].join(', '))+'</td><td class="num">'+h([...new Set(ls.map(l=>l.payRef))].join(', '))+'</td><td>'+sp(rev?'Reversed':'Paid')+(pend?' <span class="sp sp-orange">Reversal requested</span>':'')+'</td><td>'+(!pend&&!rev?'<button class="btn sm" data-act="prev" data-id="'+id+'"'+(ro?' disabled':'')+'>Request reversal</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>'+
      '<label class="f">Reason for reversal '+tip('Corporate Finance must approve every reversal.')+'<input id="pay-reason2" data-in="hrReason" value="'+h(S.hr.reason)+'" placeholder="e.g. Paid to the wrong employee"></label>':'<div class="empty">No payments made yet.</div>';}
  else {body=exc.length?'<p class="foot">Refunds or cancellations after payment. Recover through '+h({payroll:'payroll deduction',collection:'cash collection',either:'payroll or cash'}[p.refund.via])+'.</p><div class="tw"><table><thead><tr><th>Staff name</th><th>Employee ID</th><th>Student</th><th class="n">Amount</th><th>Status</th><th></th></tr></thead><tbody>'+
      exc.map(l=>{const e=emp(l.empId);return '<tr><td>'+h(e.name)+'</td><td class="num">'+l.empId+'</td><td>'+h(adm(l.enrol).name)+'</td><td class="n">'+inr(l.amount)+'</td><td>'+sp(l.pstatus)+'</td><td>'+(l.pstatus==='Recovery Required'?'<button class="btn sm" data-act="recover" data-id="'+l.id+'"'+(ro?' disabled':'')+'>Mark recovered</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty">No recoveries needed.</div>';}
  return '<h1>Payments</h1><p class="sub">Only verified SRF incentives appear here. Amounts come from verification and cannot be changed.</p><div class="tabs" role="tablist">'+T.map(([k,l,n])=>'<button role="tab" aria-selected="'+(k===S.pay.tab)+'" data-act="ptab" data-id="'+k+'">'+l+' ('+n+')</button>').join('')+'</div><section class="panel">'+body+'</section>';}
function staffPendingLines(id,st){return scopeLines().filter(l=>l.empId===id&&l.vstatus==='Approved'&&l.pstatus===st&&!subOf(l.sub).locked)}

/* ---------- Corporate Finance: one-table policy ---------- */
S.fin={more:false};
function vPolicy2(){
  if(S.fin.more)return '<button class="btn" data-act="finmore" data-id="0">← Back to incentive policy</button>'+vAdmin();
  const p=CD(),last=curV(),ds=diffs(),ed=can('policy','Edit'),pv=preview(p),full=sum(p.roles.filter(r=>r.on).map(r=>(r.calc==='pct'?+r.value:(+r.value/50))*r.slots)),capPct=+p.limits.maxPct;
  const typical=sum(p.roles.filter(r=>r.on).map(r=>(r.calc==='pct'?+r.value:+r.value/50)*Math.min(S.cp.prev.counts[r.code]||0,r.slots)));
  return '<div class="actions"><div><h1>Incentive policy</h1><p class="sub">Set each role’s share of the SRF. When you save, every SRF request from the effective date is calculated with these rates.</p></div><div class="row" style="gap:6px">'+sp('Verified').replace('Verified','Live: version '+last.v+' from '+dmy(last.from))+(ds.length?' <span class="sp sp-orange">'+ds.length+' unsaved change'+(ds.length>1?'s':'')+'</span>':'')+'</div></div>'+
  (ed?'':'<div class="msg info">Read-only. Only Corporate Finance can change the policy.</div>')+
  '<section class="panel"><fieldset class="fs"'+(ed?'':' disabled')+'>'+
  '<div class="tw"><table><thead><tr><th>Role</th><th>Eligible designations '+'</th><th>Incentive (basis and rate)</th><th class="n">Staff per student</th><th class="n hide-m">Each on ₹5,000</th></tr></thead><tbody>'+
  p.roles.map((r,i)=>{const pre='roles['+r.code+'].';return '<tr><td><label class="chk"><input type="checkbox" aria-label="'+h(r.label)+' on" data-p="'+pre+'on"'+(r.on?' checked':'')+'> <b>'+h(r.label)+'</b></label>'+(r.on?'':'<div class="id">off</div>')+'</td>'+
    '<td><div class="chips">'+r.desig.map(dg=>'<span class="chip2">'+h(dg)+'<button aria-label="Remove '+h(dg)+'" data-act="rmdesig" data-i="'+i+'" data-v="'+h(dg)+'">×</button></span>').join('')+'<select aria-label="Add designation" data-act2="adddesig" data-i="'+i+'"><option value="">+ add</option>'+HRMS_DESIG.filter(x=>!r.desig.includes(x)).map(x=>'<option>'+x+'</option>').join('')+'</select></div></td>'+
    '<td><div class="ratebox">'+sel(pre+'calc',r.calc,[['pct','% of SRF'],['fixed','Fixed ₹']])+(r.calc==='pct'?inp(pre+'value',r.value,'type="number" min="0" max="100" step="0.5" style="width:72px" aria-label="'+h(r.label)+' percent"')+'<span>%</span>':'<span>₹</span>'+inp(pre+'value',r.value,'type="number" min="0" step="10" style="width:84px" aria-label="'+h(r.label)+' amount"'))+'</div><div class="id">'+(r.calc==='pct'?'= '+inr(Math.round(5000*r.value/100))+' per admission on ₹5,000':'= '+(Math.round(r.value/5000*1000)/10)+'% of a ₹5,000 SRF')+'</div></td>'+
    '<td class="n">'+inp(pre+'slots',r.slots,'type="number" min="0" max="10" step="1" style="width:64px" aria-label="'+h(r.label)+' staff per student"')+'</td><td class="n hide-m">'+inr(r.calc==='pct'?Math.round(5000*r.value/100):r.value)+'<br><span class="id">'+(r.calc==='pct'?r.value+'%':'fixed')+'</span></td></tr>'}).join('')+
  '</tbody></table></div>'+
  '<div class="opt"><label class="f">Maximum total incentive (% of SRF) '+tip('The most that can be paid out for one student, across all staff. Requests above it are blocked.')+inp('limits.maxPct',p.limits.maxPct,'type="number" min="0" max="100" step="0.5"')+'</label>'+
  '<label class="f">Effective from '+tip('New rates apply to SRF receipts collected on or after this date. Earlier receipts keep the old rates.')+'<input type="date" id="fin-from" data-s="from" value="'+S.cp.from+'"></label>'+
  '<label class="f">Reason for change '+tip('Saved in the audit log with your name.')+'<input id="fin-reason" data-s="reason" value="'+h(S.cp.reason)+'" placeholder="e.g. Board approved new Counsellor rate"></label></div>'+
  '<div class="msg '+(typical>capPct?'bad':'info')+'">Typical admission (like Chamanganj): '+typical+'% of SRF = '+inr(5000*typical/100)+' on ₹5,000, limit '+capPct+'%. If every staff slot is filled: '+full+'%.</div>'+
  '</fieldset><div class="row"><button class="btn pri lg" data-act="finsave"'+(ed&&ds.length&&can('policy','Approve')?'':' disabled')+'>Save policy</button><button class="btn" data-act="discard"'+(ed&&ds.length?'':' disabled')+'>Discard changes</button><button class="btn" data-act="finmore" data-id="1">More settings</button></div>'+
  '<p class="foot">More settings: Sadqa and other deductions, admission categories, attendance, payment cycle, refund rules, and the full version history.</p></section>'+
  '<section class="panel"><h3>Recent versions</h3><div class="tw"><table><thead><tr><th>Version</th><th>Effective from</th><th>Saved by</th><th>Reason</th></tr></thead><tbody>'+[...S.versions].reverse().slice(0,4).map(v=>'<tr><td>v'+v.v+'</td><td>'+dmy(v.from)+'</td><td>'+h(v.by)+'</td><td style="white-space:normal">'+h(v.reason)+'</td></tr>').join('')+'</tbody></table></div></section>';}

/* ---------- System Admin: focused menu ---------- */
const SA_MAIN=[['users','User logins'],['ay','Academic years'],['pmap','Principal–branch mapping'],['subaccess','Submission access'],['staffmap','Employee branch mapping'],['perms','Role permissions'],['auditlog','System audit logs']];
const SA_MORE=[['branches','Branches'],['geo','Regions and zones'],['routing','Workflow and notifications'],['locks','Submission locks'],['integration','Integrations'],['activity','User activity']];
function sPmap(){const P=S.users.filter(u=>u.roles.includes('Principal'));
  return head('Principal–branch mapping','Tick the branches each Principal may submit for. A Principal sees only these branches and their staff. Changes apply at once and are logged.')+
  '<div class="tw"><table><thead><tr><th>Principal</th><th>Employee ID</th><th>Branches</th><th>Region</th><th>Zone</th><th>Status</th></tr></thead><tbody>'+
  P.map(u=>{const b=userBranches(u);return '<tr><td>'+h(u.name)+'<div class="id">'+h(u.login)+'</div></td><td class="num">'+h(u.empId)+'</td><td style="white-space:normal;min-width:220px"><div class="chips">'+Object.keys(BR).map(c=>'<label class="chk"><input type="checkbox" data-pm="'+u.id+'|'+c+'"'+(u.scope.ids.includes(c)?' checked':'')+'><span>'+h(BR[c])+'</span></label>').join('')+'</div></td><td>'+h([...new Set(b.map(bRegionName).filter(Boolean))].join(', ')||'—')+'</td><td>'+h([...new Set(b.map(bZoneName).filter(Boolean))].join(', ')||'—')+'</td><td>'+sp(u.status==='Active'?'Verified':'Rejected').replace(/>(Verified|Rejected)</,'>'+u.status+'<')+'</td></tr>'}).join('')+'</tbody></table></div>';}
function sAuditIn(){return vAudit().replace('<h1>Audit logs</h1>','<h1>System audit logs</h1>')}
S.aye={edit:null,neu:{name:'',from:'',to:''},reason:{},msg:''};
function ayUse(y){const r=S.adms.filter(a=>a.collDate>=y.from&&a.collDate<=y.to),sb=S.subs.filter(x=>x.adms.some(z=>{const d=adm(z.enrol).collDate;return d>=y.from&&d<=y.to}));
  return {receipts:r.length,subs:sb.length,pending:sb.filter(x=>QUEUE.includes(x.status)||x.status==='Returned to Principal').length}}
function sAY(){const A=S.aye,E=A.edit,n=A.neu;
  return head('Academic years','Each SRF receipt belongs to the academic year of its collection date. Locking a year stops new submissions, corrections and verification for it; payments already verified can still be made.')+
  (A.msg?'<div class="msg bad">'+h(A.msg)+'</div>':'')+
  '<div class="tw"><table><thead><tr><th>Academic year</th><th>Starts</th><th>Ends</th><th class="n">SRF receipts</th><th class="n">Requests</th><th>Status</th><th>Reason</th><th></th></tr></thead><tbody>'+
  [...S.ays].sort((x,y)=>y.from.localeCompare(x.from)).map(y=>{const u=ayUse(y),lk=y.status==='Locked';
    if(E&&E.id===y.id)return '<tr><td><input id="aye-name" data-aye="name" value="'+h(E.name)+'" style="width:100px" aria-label="Name"></td><td><input type="date" id="aye-from" data-aye="from" value="'+E.from+'" aria-label="Start"></td><td><input type="date" id="aye-to" data-aye="to" value="'+E.to+'" aria-label="End"></td><td class="n">'+u.receipts+'</td><td class="n">'+u.subs+'</td><td>'+sp(lk?'Locked':'Verified').replace('>Verified<','>Open<')+'</td><td></td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm pri" data-act="aysave">Save</button><button class="btn sm" data-act="aycancel">Cancel</button></div></td></tr>';
    return '<tr><td><b>'+h(y.name)+'</b></td><td>'+dmy(y.from)+'</td><td>'+dmy(y.to)+'</td><td class="n">'+u.receipts+'</td><td class="n">'+u.subs+(u.pending?'<div class="id">'+u.pending+' open</div>':'')+'</td><td>'+(lk?'<span class="sp sp-red">Locked</span><div class="id">'+dmy(y.lockInfo?.at)+' · '+h(y.lockInfo?.by||'')+'</div>':'<span class="sp sp-green">Open</span>')+(y.current?' <span class="sp sp-blue">Current</span>':'')+'</td>'+
      '<td style="white-space:normal;min-width:130px">'+(lk?'<div class="id">'+h(y.lockInfo?.reason||'')+'</div>':'')+'<input id="ayr-'+y.id+'" data-ayr="'+y.id+'" value="'+h(A.reason[y.id]||'')+'" placeholder="'+(lk?'Reason to unlock':'Reason to lock')+'" style="width:100%" aria-label="Reason"></td>'+
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap">'+(lk?'':'<button class="btn sm" data-act="ayedit" data-id="'+y.id+'">Edit</button>')+(y.current||lk?'':'<button class="btn sm" data-act="aycur" data-id="'+y.id+'">Make current</button>')+(lk?'<button class="btn sm" data-act="ayunlock" data-id="'+y.id+'">Unlock</button>':'<button class="btn sm bad" data-act="aylock" data-id="'+y.id+'">Lock</button>')+'</div></td></tr>'}).join('')+'</tbody></table></div>'+
  '<div class="card"><h3>Add an academic year</h3><div class="row"><label class="f">Starts<input type="date" id="ayn-from" data-ayn="from" value="'+n.from+'"></label><label class="f">Ends<input type="date" id="ayn-to" data-ayn="to" value="'+n.to+'"></label>'+
  '<label class="f">Name '+tip('Filled in from the dates, e.g. 2027–28. You can change it.')+'<input id="ayn-name" data-ayn="name" value="'+h(n.name)+'" placeholder="e.g. 2027–28" style="width:120px"></label><button class="btn pri" data-act="ayadd">Add year</button><button class="btn" data-act="aynext">Next year after '+h([...S.ays].sort((x,y)=>y.to.localeCompare(x.to))[0].name)+'</button></div></div>'+
  '<p class="foot">Years cannot overlap. A locked year can’t be edited; unlock it first. Every add, edit, lock and unlock is recorded in the audit log with the reason.</p>';}
function ayCheck(x){
  if(!x.name.trim())return 'Give the academic year a name, for example 2027–28.';
  if(!x.from||!x.to)return 'Choose both a start date and an end date.';
  if(x.to<=x.from)return 'The end date must be after the start date.';
  if(days(x.from,x.to)>400)return 'An academic year can’t be longer than about 13 months.';
  if(S.ays.some(y=>y.id!==x.id&&y.name.toLowerCase()===x.name.trim().toLowerCase()))return x.name+' already exists.';
  const ov=S.ays.find(y=>y.id!==x.id&&x.from<=y.to&&y.from<=x.to);if(ov)return 'These dates overlap '+ov.name+' ('+dmy(ov.from)+' to '+dmy(ov.to)+').';
  if(x.id){const old=S.ays.find(y=>y.id===x.id),out=S.adms.filter(a=>a.collDate>=old.from&&a.collDate<=old.to&&!(a.collDate>=x.from&&a.collDate<=x.to));if(out.length)return out.length+' SRF receipt'+(out.length>1?'s':'')+' would fall outside this year. Keep the dates wide enough to cover them.';}
  return null}
const ayNameFor=(f,t)=>f&&t?f.slice(0,4)+'–'+t.slice(2,4):'';

/* ---------- System Admin: Principal submission access + management-approved reopening ---------- */
const principalsList=()=>S.users.filter(u=>u.roles.includes('Principal')&&u.status==='Active');
function awRuleSave(){const A=S.aw,u=cu();A.msg='';
  const pr=AW_PRESETS.find(p=>p[0]===A.preset),days=A.preset==='Custom'?Math.round(+A.custom):pr[1];
  const err=(A.scope!=='all'&&!A.target)?'Choose the '+(A.scope==='branch'?'branch':'Principal')+'.':
    (!(days>=1&&days<=365))?'Custom days must be a whole number from 1 to 365.':
    (!A.from||A.from<TODAY)?'Effective from must be today or a future date.':
    (!A.reason.trim())?'Write a reason for this access period.':null;
  if(err){A.msg=err;return}
  const r={id:'AW-'+String(S.awRules.length+1).padStart(3,'0'),scope:A.scope,target:A.scope==='all'?'':A.target,days,preset:A.preset,from:A.from,status:'Active',by:u.name,at:TODAY,reason:A.reason.trim()};
  const prevDays=r.scope==='user'?(()=>{const pu=S.users.find(x=>x.id===r.target);return awWin(pu,userBranches(pu)[0]||'').days})():r.scope==='branch'?(()=>{const pu=principalsList().find(u=>userBranches(u).includes(r.target));return pu?awWin(pu,r.target).days:null})():awRule({id:''},'').days;
  const prev=prevDays?{days:prevDays}:null;
  S.awRules.push(r);
  log('Access period set','Rule '+r.id,awTarget(r)+' · '+awLabel(r)+' · effective '+dmy(r.from)+(prev?' · was '+prev.days+' days':''),r.reason,'System');
  A.reason='';toast('Access period saved: '+awTarget(r)+' · '+awLabel(r)+' from '+dmy(r.from));}
function awGrant(){const G=S.aw.g,me=cu();S.aw.gmsg='';
  const pu=S.users.find(x=>x.id===G.uid),n=Math.round(+G.n),hrs=G.unit==='Hours'?n:n*24;
  const fail=m=>{S.aw.gmsg=m;return false};
  if(!pu)return fail('Choose the Principal.');
  if(pu.id===me.id||(pu.empId&&pu.empId===me.empId))return fail('System Admin can’t reopen SRF data for themselves.');
  if(!userBranches(pu).includes(G.branch))return fail('Choose one of '+pu.name+'’s branches.');
  if(!G.from||!G.to||G.from>G.to)return fail('Enter a valid SRF date range (start on or before end).');
  if(G.to>TODAY)return fail('The SRF date range can’t include future dates.');
  const w=awWin(pu,G.branch);if(G.from>=w.start)return fail('These dates are still inside '+pu.name+'’s normal '+w.days+'-day access period. Nothing needs reopening.');
  {const ys=[ayOf(G.from),ayOf(G.to)];if(ys.some(y=>!y))return fail('No academic year is set up for part of this range.');if(ys.some(y=>y.status==='Locked'))return fail('Part of this range is in a locked academic year. Unlock it first.');}
  if(!(n>=1&&(G.unit==='Hours'?n<=72:n<=30)))return fail(G.unit==='Hours'?'Access duration must be 1 to 72 hours.':'Access duration must be 1 to 30 days.');
  if(!G.reason.trim())return fail('Write the reason for reopening.');
  if(G.ref.trim().length<3)return fail('Enter the management approval reference number. Reopening is not allowed without it.');
  if(!G.remarks.trim())return fail('Enter the management approval remarks.');
  const docReq=days(G.from,G.to)+1>31||hrs>7*24;if(docReq&&!G.doc)return fail('Upload the management approval document. It is required when more than 31 days of SRF data or more than 7 days of access are reopened.');
  if(S.grants.some(g=>g.ref.toLowerCase()===G.ref.trim().toLowerCase()))return fail('Approval reference '+G.ref.trim()+' has already been used. Each approval can be used once.');
  const clash=awGrants(pu,G.branch).find(g=>!(G.to<g.from||G.from>g.to));if(clash)return fail('Special access '+clash.id+' already covers part of these dates. Revoke it first.');
  const at=awNow(),g={id:'SA-'+String(S.grants.length+1).padStart(3,'0'),uid:pu.id,branch:G.branch,from:G.from,to:G.to,n,unit:G.unit,at,expires:stampAdd(at,hrs),reason:G.reason.trim(),ref:G.ref.trim(),remarks:G.remarks.trim(),doc:G.doc||'',by:me.name,status:'Active',used:[],normal:w.days};
  S.grants.unshift(g);
  log('Special access granted','Grant '+g.id,pu.name+' · '+BR[g.branch]+' · normal access '+w.days+' days · reopened SRF '+dmy(g.from)+' to '+dmy(g.to)+' · '+n+' '+G.unit.toLowerCase()+' · expires '+fcWhen(g.expires)+' · approval '+g.ref+': '+g.remarks+(g.doc?' · document '+g.doc:''),g.reason,'System');
  notify('Special access granted',g.id+' for '+pu.login);
  S.aw.g={uid:'',branch:'',from:'',to:'',n:2,unit:'Days',reason:'',ref:'',remarks:'',doc:''};S.aw.open=false;
  toast('Special access '+g.id+' granted to '+pu.name+' until '+fcWhen(g.expires));return true;}

/* access-period rules: list with Edit / Activate-Deactivate / Delete (soft delete kept for audit) */
const awVisible=()=>S.awRules.filter(r=>r.status!=='Deleted');
function awRulesTable(){const A=S.aw,E=A.edit,D=A.del,ord={all:0,branch:1,user:2};
  const rows=[...awVisible()].sort((x,y)=>(ord[x.scope]-ord[y.scope])||x.from.localeCompare(y.from)||x.id.localeCompare(y.id));
  const pill=st=>'<span class="sp sp-'+(st==='Active'?'green':st==='Scheduled'?'blue':'grey')+'">'+st+'</span>';
  return (A.rmsg?'<div class="msg bad">'+h(A.rmsg)+'</div>':'')+
  '<div class="tw"><table class="stack"><thead><tr><th>Principal / Branch</th><th>SRF Submission Access</th><th>Effective From</th><th>Status</th><th>Reason / set by</th><th></th></tr></thead><tbody>'+
  rows.map(r=>{const st=awStatus(r);
    if(E&&E.id===r.id)return '<tr class="editing"><td data-l="Principal / Branch"><b>'+h(awTarget(r))+'</b><div class="id">'+r.id+'</div></td>'+
      '<td data-l="Access"><select id="awe-preset" data-awe="preset" aria-label="Access period">'+AW_PRESETS.map(([l])=>'<option'+(l===E.preset?' selected':'')+'>'+l+'</option>').join('')+'</select>'+(E.preset==='Custom'?' <input type="number" id="awe-custom" data-awet="custom" min="1" max="365" value="'+h(E.custom)+'" aria-label="Number of days" style="width:80px"> days':'')+'</td>'+
      '<td data-l="Effective from"><input type="date" id="awe-from" data-awe="from" value="'+E.from+'" aria-label="Effective from"></td><td data-l="Status">'+pill(st)+'</td>'+
      '<td data-l="Reason for change"><input id="awe-reason" data-awet="reason" value="'+h(E.reason)+'" placeholder="Why are you changing it?" aria-label="Reason for change" style="min-width:160px;width:100%"></td>'+
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm pri" data-act="awesave" data-id="'+r.id+'">Save</button><button class="btn sm" data-act="awecancel">Cancel</button></div></td></tr>';
    if(D&&D.id===r.id)return '<tr class="editing"><td data-l="Principal / Branch"><b>'+h(awTarget(r))+'</b></td><td data-l="Access">'+h(awLabel(r))+'</td><td data-l="Effective from">'+dmy(r.from)+'</td><td data-l="Status">'+pill(st)+'</td>'+
      '<td data-l="Delete?" style="white-space:normal"><div class="msg bad" style="margin-bottom:6px">Delete this access period? '+(st==='Active'?'Principals it covers will fall back to the next setting ('+h(awFallback(r))+') straight away.':'It has not taken effect yet.')+' The record stays in the audit log.</div><input id="awd-reason" data-awdt="reason" value="'+h(D.reason)+'" placeholder="Reason for deleting" aria-label="Reason for deleting" style="width:100%"></td>'+
      '<td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm bad" data-act="awdel" data-id="'+r.id+'">Delete</button><button class="btn sm" data-act="awdcancel">Cancel</button></div></td></tr>';
    return '<tr'+(r.status!=='Active'?' class="off"':'')+'><td data-l="Principal / Branch">'+h(awTarget(r))+'</td><td data-l="Access"><b>'+h(awLabel(r))+'</b></td><td data-l="Effective from">'+dmy(r.from)+'</td><td data-l="Status">'+pill(st)+'</td><td data-l="Reason / set by" style="white-space:normal;min-width:160px">'+h(r.reason)+'<div class="id">'+h(r.by)+' · '+dmy(r.at)+(r.edited?' · edited '+dmy(r.edited):'')+'</div></td>'+
      '<td><div class="awacts"><button class="btn sm" data-act="awedit" data-id="'+r.id+'">Edit</button><button class="btn sm" data-act="awtoggle" data-id="'+r.id+'">'+(r.status==='Active'?'Deactivate':'Activate')+'</button><button class="btn sm bad" data-act="awdelask" data-id="'+r.id+'">Delete</button></div></td></tr>'}).join('')+
  '</tbody></table></div>';}
// What a Principal would fall back to if rule r were gone (for the delete warning)
function awFallback(r){const keep=S.awRules;S.awRules=keep.filter(x=>x!==r);let t;
  if(r.scope==='user'){const u=S.users.find(x=>x.id===r.target);t=u?awWin(u,userBranches(u)[0]||'').days+' days':'system default'}
  else if(r.scope==='branch'){const u=principalsList().find(x=>userBranches(x).includes(r.target));t=u?awWin(u,r.target).days+' days':awRule({id:''},'').days+' days'}
  else{const g=awRule({id:''},'');t=g.id==='—'?'system default 3 days':g.days+' days'}
  S.awRules=keep;return t}
function awEditSave(id){const r=S.awRules.find(x=>x.id===id),E=S.aw.edit,u=cu();S.aw.rmsg='';
  const days=E.preset==='Custom'?Math.round(+E.custom):AW_PRESETS.find(p=>p[0]===E.preset)[1];
  const err=!(days>=1&&days<=365)?'Custom days must be a whole number from 1 to 365.':
    (!E.from||(E.from!==r.from&&E.from<TODAY))?'Effective from can be kept as it is, or moved to today or a later date.':
    !E.reason.trim()?'Write the reason for this change.':
    (days===r.days&&E.from===r.from&&E.preset===r.preset)?'Nothing has changed.':null;
  if(err){S.aw.rmsg=err;return}
  const before=awLabel(r)+' from '+dmy(r.from);Object.assign(r,{days,preset:E.preset,from:E.from,edited:TODAY,editedBy:u.name});
  log('Access period edited','Rule '+r.id,awTarget(r)+' · '+before+' → '+awLabel(r)+' from '+dmy(r.from),E.reason.trim(),'System');
  S.aw.edit=null;toast('Access period '+r.id+' updated: '+awLabel(r)+' from '+dmy(r.from));}
function awDelete(id){const r=S.awRules.find(x=>x.id===id),D=S.aw.del;S.aw.rmsg='';
  if(!D.reason.trim()){S.aw.rmsg='Write the reason for deleting this access period.';return}
  if(r.scope==='all'&&r.status==='Active'&&!S.awRules.some(x=>x!==r&&x.scope==='all'&&x.status==='Active')){S.aw.rmsg='Keep at least one active setting for All Principals. Edit this one instead of deleting it.';return}
  const fb=awFallback(r);r.status='Deleted';r.deleted={at:TODAY,by:cu().name,reason:D.reason.trim()};
  log('Access period deleted','Rule '+r.id,awTarget(r)+' · '+awLabel(r)+' from '+dmy(r.from)+' · covered Principals now get '+fb,D.reason.trim(),'System');
  S.aw.del=null;toast('Access period '+r.id+' deleted');}
function sSubAccess(){const A=S.aw,G=A.g,P=principalsList(),inR=(b,f,t)=>S.adms.filter(a=>a.branch===b&&a.collDate>=f&&a.collDate<=t);
  const targetSel=A.scope==='all'?'':A.scope==='branch'?'<label class="f">Branch<select id="aw-target" data-aw="target"><option value="">Choose…</option>'+Object.keys(BR).map(c=>'<option value="'+c+'"'+(c===A.target?' selected':'')+'>'+h(BR[c])+'</option>').join('')+'</select></label>':
    '<label class="f">Principal<select id="aw-target" data-aw="target"><option value="">Choose…</option>'+P.map(u=>'<option value="'+u.id+'"'+(u.id===A.target?' selected':'')+'>'+h(u.name)+' · '+h(userBranches(u).map(c=>BR[c]).join(', '))+'</option>').join('')+'</select></label>';
  const gp=S.users.find(x=>x.id===G.uid),gbs=gp?userBranches(gp):[],gw=gp&&G.branch?awWin(gp,G.branch):null,cnt=gp&&G.branch&&G.from&&G.to&&G.from<=G.to?inR(G.branch,G.from,G.to):null;
  return head('Principal submission access','How many days of SRF collection data each Principal can see and submit, counted back from today by receipt date. Older records are hidden from Principals in every list, search, report and download. Submitted requests stay visible to them, read-only.')+
  '<div class="card"><h3>Principal SRF Submission Access Period</h3>'+
  awRulesTable()+

  '<h3>Set an access period</h3>'+(A.msg?'<div class="msg bad">'+h(A.msg)+'</div>':'')+
  '<div class="row"><label class="f">Apply to<select id="aw-scope" data-aw="scope">'+[['all','All Principals (global)'],['branch','A branch'],['user','A specific Principal']].map(([k,l])=>'<option value="'+k+'"'+(k===A.scope?' selected':'')+'>'+l+'</option>').join('')+'</select></label>'+targetSel+
  '<label class="f">Access period<select id="aw-preset" data-aw="preset">'+AW_PRESETS.map(([l])=>'<option'+(l===A.preset?' selected':'')+'>'+(l==='Custom'?'Custom':l)+'</option>').join('')+'</select></label>'+
  (A.preset==='Custom'?'<label class="f">Number of days<input type="number" id="aw-custom" data-awt="custom" min="1" max="365" value="'+h(A.custom)+'"></label>':'')+
  '<label class="f">Effective from<input type="date" id="aw-from" data-aw="from" value="'+A.from+'" min="'+TODAY+'"></label></div>'+
  '<label class="f">Reason<input id="aw-reason" data-awt="reason" value="'+h(A.reason)+'" placeholder="Why this period is needed"></label>'+
  '<div><button class="btn pri" data-act="awsave">Save access period</button></div>'+
  '<p class="foot">A Principal-wise setting overrides the branch setting, and a branch setting overrides the global one. “1 Month” means the latest 30 days.</p>'+
  '<h3>In force today</h3><div class="tw"><table><thead><tr><th>Principal</th><th>Branch</th><th>Access</th><th>Can see SRF dated</th><th>From rule</th><th>Special access</th></tr></thead><tbody>'+
  P.flatMap(u=>userBranches(u).map(b=>{const w=awWin(u,b),gs=awGrants(u,b);return '<tr><td>'+h(u.name)+'</td><td>'+h(BR[b])+'</td><td><b>'+w.days+' days</b></td><td>'+dmy(w.start)+' to '+dmy(TODAY)+'</td><td>'+h(w.rule.id==='—'?'System default':awTarget(w.rule))+'</td><td>'+(gs.length?gs.map(g=>'<span class="sp sp-orange">'+h(g.id)+' · '+dmy(g.from)+'–'+dmy(g.to)+'</span>').join(' '):'—')+'</td></tr>'})).join('')+'</tbody></table></div></div>'+
  '<div class="card"><div class="actions"><h3>Management-approved reopening</h3>'+(A.open?'':'<button class="btn pri" data-act="awopen">Reopen SRF Submission Access</button>')+'</div>'+
  '<p class="foot">Reopens expired SRF records for one Principal and one branch only, for a set time. A management approval reference is mandatory, and System Admin can’t reopen data for themselves. Access closes automatically at the expiry time.</p>'+
  (A.open?(A.gmsg?'<div class="msg bad">'+h(A.gmsg)+'</div>':'')+
   '<div class="row"><label class="f">Principal name<select id="awg-uid" data-awg="uid"><option value="">Choose…</option>'+P.filter(u=>u.id!==S.uid).map(u=>'<option value="'+u.id+'"'+(u.id===G.uid?' selected':'')+'>'+h(u.name)+'</option>').join('')+'</select></label>'+
   '<label class="f">Branch<select id="awg-branch" data-awg="branch"><option value="">'+(gp?'Choose…':'Pick the Principal first')+'</option>'+gbs.map(c=>'<option value="'+c+'"'+(c===G.branch?' selected':'')+'>'+h(BR[c])+'</option>').join('')+'</select></label></div>'+
   (gw?'<p class="foot">'+h(gp.name)+' normally sees '+h(BR[G.branch])+' SRF dated '+dmy(gw.start)+' onwards ('+gw.days+' days). Reopen dates before '+dmy(gw.start)+'.</p>':'')+
   '<div class="row"><label class="f">SRF dates from<input type="date" id="awg-from" data-awg="from" value="'+G.from+'" max="'+TODAY+'"></label><label class="f">to<input type="date" id="awg-to" data-awg="to" value="'+G.to+'" max="'+TODAY+'"></label>'+
   '<label class="f">Access duration<input type="number" id="awg-n" data-awgt="n" min="1" value="'+h(G.n)+'"></label><label class="f">&nbsp;<select id="awg-unit" data-awg="unit" aria-label="Duration unit">'+['Days','Hours'].map(x=>'<option'+(x===G.unit?' selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'+
   (cnt?'<p class="foot">'+cnt.length+' SRF receipt'+(cnt.length===1?'':'s')+' in this range, '+cnt.filter(a=>!a.claimedBy).length+' not yet claimed.</p>':'')+
   '<label class="f">Reason for reopening<input id="awg-reason" data-awgt="reason" value="'+h(G.reason)+'"></label>'+
   '<div class="row"><label class="f">Management approval reference no.<input id="awg-ref" data-awgt="ref" value="'+h(G.ref)+'" placeholder="e.g. MGMT/2026/14"></label>'+
   '<label class="f">Supporting approval document '+tip('Required when more than 31 days of SRF data or more than 7 days of access are reopened.')+'<input type="file" id="awg-doc" data-awg="doc" accept=".pdf,.jpg,.jpeg,.png">'+(G.doc?'<span class="id">'+h(G.doc)+'</span>':'')+'</label></div>'+
   '<label class="f">Management approval remarks<textarea id="awg-remarks" data-awgt="remarks">'+h(G.remarks)+'</textarea></label>'+
   '<div class="row"><button class="btn pri" data-act="awgrant">Grant special access</button><button class="btn" data-act="awcancel">Cancel</button></div>':'')+
  '<h3>Special access granted</h3>'+(S.grants.length?'<div class="tw"><table><thead><tr><th>ID</th><th>Principal</th><th>Branch</th><th>Reopened SRF</th><th>Granted</th><th>Expires</th><th>Status</th><th>Approval</th><th>Submitted?</th><th></th></tr></thead><tbody>'+
  S.grants.map(g=>'<tr><td class="num">'+g.id+'</td><td>'+h(S.users.find(u=>u.id===g.uid)?.name||g.uid)+'</td><td>'+h(BR[g.branch])+'</td><td>'+dmy(g.from)+' – '+dmy(g.to)+'</td><td>'+fcWhen(g.at)+'<div class="id">'+h(g.by)+' · '+g.n+' '+g.unit.toLowerCase()+'</div></td><td>'+fcWhen(g.status==='Active'?g.expires:g.closedAt)+'</td><td>'+sp(g.status==='Active'?'Verified':'Draft').replace(/>(Verified|Draft)</,'>'+g.status+'<')+'</td><td style="white-space:normal;min-width:150px"><b>'+h(g.ref)+'</b><div class="id">'+h(g.remarks)+'</div></td><td>'+(g.used.length?'Yes · '+h(g.used.join(', ')):'No')+'</td><td>'+(g.status==='Active'?'<button class="btn sm bad" data-act="awrevoke" data-id="'+g.id+'">Revoke</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No special access has been granted.</div>')+'</div>';}
Object.assign(SAV,{pmap:sPmap,auditlog:sAuditIn,ay:sAY,subaccess:sSubAccess});
function vSysAdmin2(){const more=SA_MORE.some(([k])=>k===S.sa.sec);
  return '<div><h1>System Admin</h1><p class="sub">Logins, branch mapping, permissions and audit logs. No finance or payment settings here.</p></div>'+
  '<div class="cp2"><nav class="cpnav" aria-label="System Admin sections">'+SA_MAIN.map(([k,l])=>'<button data-act="sasec" data-id="'+k+'" aria-current="'+(k===S.sa.sec)+'">'+h(l)+'</button>').join('')+
  '<details'+(more?' open':'')+'><summary class="cpmore">More settings</summary>'+SA_MORE.map(([k,l])=>'<button data-act="sasec" data-id="'+k+'" aria-current="'+(k===S.sa.sec)+'">'+h(l)+'</button>').join('')+'</details></nav>'+
  '<section class="panel"><fieldset class="fs"'+(can('sysadmin','Edit')?'':' disabled')+'>'+SAV[S.sa.sec]()+'</fieldset></section></div>';}

/* ---------- Reports: filters + one-click Excel/PDF ---------- */
S.rf={branch:'',from:'2026-04-01',to:TODAY,status:'',pr:'',gs:''};
function vReports2(){const R=reportData();if(!R[S.rep])S.rep='branch';const r=R[S.rep],br=userBranches();
  return '<h1>Reports</h1><section class="panel"><div class="row">'+
  '<label class="f">Branch<select id="rf-branch" data-rf="branch"><option value="">'+(br.length>1?'All my branches':h(BR[br[0]]||''))+'</option>'+(br.length>1?br.map(c=>'<option value="'+c+'"'+(c===S.rf.branch?' selected':'')+'>'+h(BR[c])+'</option>').join(''):'')+'</select></label>'+
  '<label class="f">From<input type="date" id="rf-from" data-rf="from" value="'+S.rf.from+'"></label><label class="f">To<input type="date" id="rf-to" data-rf="to" value="'+S.rf.to+'"></label>'+
  (S.rep==='access'?'<label class="f">Principal<select id="rf-pr" data-rf="pr"><option value="">All Principals</option>'+S.users.filter(u=>u.roles.includes('Principal')).map(u=>'<option value="'+u.id+'"'+(u.id===S.rf.pr?' selected':'')+'>'+h(u.name)+'</option>').join('')+'</select></label><label class="f">Status<select id="rf-gs" data-rf="gs"><option value="">All</option>'+['Active','Expired','Revoked'].map(x=>'<option'+(x===S.rf.gs?' selected':'')+'>'+x+'</option>').join('')+'</select></label>':
  '<label class="f">Status '+tip('Filters the student-wise report by request status.')+'<select id="rf-status" data-rf="status"><option value="">All</option>'+['Pending Verification','Returned','Verified','Rejected','Pending Payment','Paid'].map(x=>'<option'+(x===S.rf.status?' selected':'')+'>'+x+'</option>').join('')+'</select></label>')+'</div>'+
  (S.rep==='access'?'<p class="foot">Date filter applies to the date access was granted.</p>':'')+
  '<div class="tabs" role="tablist">'+Object.entries(R).map(([k,x])=>'<button role="tab" aria-selected="'+(k===S.rep)+'" data-act="rep" data-id="'+k+'">'+h(x.title)+'</button>').join('')+'</div>'+
  '<div class="actions"><span class="id">'+r.rows.length+' row'+(r.rows.length===1?'':'s')+'</span><div class="row" style="gap:8px"><button class="btn" data-act="xls" data-id="rep"'+(can('reports','Download')?'':' disabled')+'>Download Excel</button><button class="btn" data-act="pdf" data-id="rep"'+(can('reports','Download')?'':' disabled')+'>Download PDF</button></div></div>'+
  (r.rows.length?'<div class="tw"><table><thead><tr>'+r.cols.map((c,i)=>'<th class="'+(r.num.includes(i)?'n':'')+'">'+h(c)+'</th>').join('')+'</tr></thead><tbody>'+r.rows.map(row=>'<tr>'+row.map((c,i)=>'<td class="'+(r.num.includes(i)?'n':'')+'">'+h(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<div class="empty">No data for these filters.</div>')+'</section>';}
const _loaded={};
function loadScript(src){return _loaded[src]||(_loaded[src]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>{delete _loaded[src];no(new Error('load'))};document.head.appendChild(s)}))}
const toNum=v=>{if(typeof v==='number')return v;const m=/^₹([\d,]+)$/.exec(String(v));return m?Number(m[1].replace(/,/g,'')):v};
async function saveFile(name,data){
  let dl=null;try{dl=window.claude?.use?await window.claude.use('downloads'):null}catch(e){dl=null}
  if(!dl){toast('Downloads aren’t available in this view. In the ERP this saves '+name+'.');return}
  try{await dl.save({filename:name,data});toast('Saved '+name)}catch(e){toast(e&&e.code==='declined'?'Download cancelled':'Could not save the file. Please try again.')}}
function exportRows(kind){if(kind==='audit'){const fin=S.role==='Corporate Finance',rows=S.audit.filter(x=>!fin||x.cat==='Finance');return {title:'Audit log',cols:['When (UTC)','User','Login','Active role','Category','Action','Record','Change','Reason','IP / device'],rows:rows.map(x=>[x.at.slice(0,16).replace('T',' '),x.user,x.login,x.role,x.cat,x.action,x.entity,x.detail,x.reason||'',x.device])}}
  const r=reportData()[S.rep]||reportData().branch;return {title:r.title,cols:r.cols,rows:r.rows}}
async function downloadXlsx(kind){const perm=kind==='audit'?'audit':'reports';if(!can(perm,'Download')){deny('Your role cannot download this.','Download');return}
  const r=exportRows(kind);toast('Preparing Excel…');
  try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')}catch(e){toast('Could not load the Excel tool. Check your connection and try again.');return}
  const ws=XLSX.utils.aoa_to_sheet([r.cols,...r.rows.map(row=>row.map(toNum))]);ws['!cols']=r.cols.map(c=>({wch:Math.max(12,Math.min(40,c.length+4))}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,r.title.slice(0,31));const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  log('Download',r.title,r.rows.length+' rows · Excel','',kind==='audit'?'System':'Finance');await saveFile(r.title.replace(/[^A-Za-z0-9]+/g,'-')+'-'+TODAY+'.xlsx',new Blob([buf]));}
async function downloadPdf(kind){const perm=kind==='audit'?'audit':'reports';if(!can(perm,'Download')){deny('Your role cannot download this.','Download');return}
  const r=exportRows(kind);toast('Preparing PDF…');
  try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')}catch(e){toast('Could not load the PDF tool. Check your connection and try again.');return}
  const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'pt',format:'a4'}),fx=v=>String(v).replace(/₹/g,'Rs ').replace(/[–—]/g,'-').replace(/[→]/g,'->').replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/[^\x20-\x7E]/g,'');
  pdfLogo(doc);doc.setFontSize(14);doc.text('MSEA SRF · '+fx(r.title),40,40);doc.setFontSize(9);doc.text(fx('Generated '+dmy(TODAY)+' by '+cu().name+' ('+S.role+') · Scope: '+scopeText(cu())+(S.rf.from?' · '+dmy(S.rf.from)+' to '+dmy(S.rf.to):'')),40,56);
  doc.autoTable({head:[r.cols.map(fx)],body:r.rows.map(row=>row.map(fx)),startY:68,styles:{fontSize:7.5,cellPadding:3},headStyles:{fillColor:[47,74,160]},margin:{left:40,right:40}});
  log('Download',r.title,r.rows.length+' rows · PDF','',kind==='audit'?'System':'Finance');await saveFile(r.title.replace(/[^A-Za-z0-9]+/g,'-')+'-'+TODAY+'.pdf',doc.output('arraybuffer'));}

/* ================= Render + events ================= */
function counts(){const L=allLines().filter(l=>userBranches().includes(subOf(l.sub).branch)),SS=S.subs.filter(x=>userBranches().includes(x.branch));
  return {dashboard:0,submission:S.role==='Principal'?SS.filter(s=>s.status==='Returned to Principal'&&!S.subs.some(y=>y.revOf===s.id)).length:0,
    verification:(can('verification','Verify')||can('verification','Approve'))?SS.filter(x=>QUEUE.includes(x.status)&&x.submittedBy!==S.uid&&(x.level===1?(S.role===S.routing.l1||S.role===S.routing.l2):S.role===S.routing.l2)).length:0,
    payment:can('payment','Create')?L.filter(l=>['Pending HR Processing','On Hold','Recovery Required'].includes(l.pstatus)).length:0,
    policy:can('payment','Approve')?S.revs.filter(r=>r.status==='Pending').length:0,reports:0,audit:0,sysadmin:0}}
function render(){awTick();const u=cu();
  const vis=SCREENS.filter(([k])=>can(k,'View')&&!(k==='audit'&&S.role==='System Admin'));
  if(S.view!=='spec'&&!vis.some(([k])=>k===S.view))S.view=vis[0]?.[0]||'';
  const c=counts();
  SRF_ROOT.getElementById('brandsub').textContent='Seat Reservation Fee · Schools only · AY '+ayCur().name+(ayCur().status==='Locked'?' (locked)':'')+' · policy v'+curV().v;
  SRF_ROOT.getElementById('ghr').innerHTML='<span class="who">'+av(u.name)+'<span class="wl">'+h(u.name)+'</span></span>'+
    (u.roles.length>1?'<label class="who"><span class="wl">Active role</span> <select id="role-sel" data-chg="role" aria-label="Active role">'+u.roles.map(r=>'<option'+(r===S.role?' selected':'')+'>'+r+'</option>').join('')+'</select></label>':'<span class="pill acc">'+h(S.role)+'</span>')+
    '<button class="specbtn" data-act="view" data-id="spec" aria-pressed="'+(S.view==='spec')+'">Help &amp; spec</button>';
  SRF_ROOT.getElementById('roles').innerHTML=vis.map(([k,l])=>'<button data-act="view" data-id="'+k+'" aria-pressed="'+(k===S.view)+'">'+l+(c[k]?'<span class="cnt">'+c[k]+'</span>':'')+'</button>').join('');
  const body=u.reset?'<section class="panel" style="max-width:520px"><h1>Set a new password</h1><p class="sub">System Admin reset this login. Set your own password to continue; nothing else is available until you do.</p><label class="f">New password<input type="password" id="np1" autocomplete="new-password"></label><button class="btn pri" data-act="setpwd">Set password and continue</button></section>':
    S.view==='spec'?vSpec():
    !vis.length?'<div class="empty">Your role has no screens assigned. Ask System Admin.</div>':
    {dashboard:vDash,submission:vPrincipal2,verification:vVerify,payment:vPay,policy:vPolicy2,reports:vReports2,audit:vAudit,sysadmin:vSysAdmin2}[S.view]();
  SRF_ROOT.getElementById('app').innerHTML=body+
    '<p class="foot">Linked to MSEA Dash Board: branches, users, new admissions and SRF receipts come from the same ERP feed as the fee reports. Policy, submissions, verification and payments are saved in this workspace.</p>';}
function landing(){S.wz={step:1,tab:'new',done:null};S.dash={f:'',q:'',open:null};S.vq={tab:'pending'};S.pay={tab:'topay',sel:{},reason:''};S.fin={more:false};S.draft=newDraft(principalBranches()[0]||'');S.acc={sel:null,remark:'',checked:{}};S.hr.checked={};S.lookup={id:'',res:null};S.view='';window.scrollTo(0,0)}
const ADMIN_ACTS=['awedit','awesave','awecancel','awdelask','awdel','awdcancel','awsave','awtoggle','awopen','awcancel','awgrant','awrevoke','ayadd','ayedit','aysave','aylock','ayunlock','aycur','aynext','addbranch','editbranch','savebranch','askdel','delbranch','addregion','addzone','editgeo','savegeo','askdelgeo','delgeo','smopen','smsave','uedit','usave','utoggle','ureset','uadd','lock','unlock','sync','simulate'];
const FIN_ACTS=['rmdesig','addrole','addrule','rmrule','addcat','restore','discard','askpub','publish'];
SRF_ROOT.addEventListener('click',ev=>{const b=ev.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.act,id=b.dataset.id,p=CD();
  if(ADMIN_ACTS.includes(a)&&!can('sysadmin','Edit')){deny('Only System Admin can change access, mapping and technical controls.',a);render();return}
  if(FIN_ACTS.includes(a)&&!can('policy','Edit')){deny('Only Corporate Finance can change SRF policy.',a);render();return}
  if(a==='setpwd'){const v=SRF_ROOT.getElementById('np1')?.value||'';if(v.length<8){toast('Use at least 8 characters');return}cu().reset=false;log('Password changed','User '+cu().login,'Temporary password replaced by user','','System');toast('Password set');render();return}
  if(a==='savedraft'){if(!can('submission','Create')){deny('Your role cannot save SRF drafts.','Draft');return}const d=S.draft,idd=d.draftId||('D'+(S.drafts.length+1+S.subs.length));S.drafts=S.drafts.filter(x=>x.id!==idd);d.draftId=idd;S.drafts.push({id:idd,by:S.uid,at:TODAY,d:clone(d)});log('Save draft','Draft '+idd,BR[d.branch]+', '+Object.values(d.include).filter(Boolean).length+' admissions');toast('Draft saved. You can pick up where you left off from the Dashboard.');render();return}
  if(a==='opendraft'){const x=S.drafts.find(y=>y.id===id&&y.by===S.uid);if(!x)return;S.draft=clone(x.d);render();return}
  if(a==='revise'){const s0=subOf(id);if(!can('submission','Edit')){deny('Your role cannot revise SRF requests.','Submission '+s0.ref);return}if(s0.locked){deny(s0.ref+' is locked by System Admin.','Submission '+s0.ref);return}{const lk=s0.adms.map(x=>ayBlock(adm(x.enrol).collDate)).find(Boolean);if(lk){deny(lk+'. Corrections are paused until it is unlocked.','Submission '+s0.ref);return}}if(s0.status!=='Returned to Principal'){deny('Only a request returned for correction can be changed.','Submission '+s0.ref);return}if(!principalBranches().includes(s0.branch)){deny('You can only correct requests of your own branch.','Submission '+s0.ref);return}
    if(!s0.adms.every(x=>pVisA(adm(x.enrol)))){deny('This request is outside your SRF access period, so it can’t be corrected. Please contact Corporate Finance; System Admin can reopen it only with management approval.','Submission '+s0.ref);return}}
  if(a==='sasec'){S.sa.sec=id;S.sa.msg='';S.sa.edit=null;S.cp.delMsg='';S.cp.delB=null;S.cp.editB=null;S.cp.geoMsg='';S.cp.delG=null;S.cp.editG=null;render();return}
  if(a==='permtab'){S.sa.roleTab=id;render();return}
  if(a==='afsearch'){render();return}
  if(a==='aynext'){const last=[...S.ays].sort((x,y)=>y.to.localeCompare(x.to))[0],f=new Date(Date.parse(last.to)+864e5).toISOString().slice(0,10),t=new Date(Date.UTC(+f.slice(0,4)+1,+f.slice(5,7)-1,+f.slice(8,10))-864e5).toISOString().slice(0,10);S.aye.neu={from:f,to:t,name:ayNameFor(f,t)};S.aye.msg='';render();return}
  if(a==='ayadd'){const n=S.aye.neu,x={id:null,name:(n.name||ayNameFor(n.from,n.to)).trim(),from:n.from,to:n.to},err=ayCheck(x);if(err){S.aye.msg=err;render();return}
    x.id='AY'+x.from.slice(0,4)+(S.ays.some(y=>y.id==='AY'+x.from.slice(0,4))?'b':'');S.ays.push(Object.assign(x,{status:'Open',current:false,lockInfo:null}));log('Academic year added','Academic year '+x.name,dmy(x.from)+' to '+dmy(x.to)+' · Open','','System');S.aye.neu={name:'',from:'',to:''};S.aye.msg='';toast('Academic year '+x.name+' added. It’s open for SRF.');render();return}
  if(a==='ayedit'){const y=S.ays.find(z=>z.id===id);if(y.status==='Locked'){toast('Unlock '+y.name+' before editing it.');return}S.aye.edit={id,name:y.name,from:y.from,to:y.to};S.aye.msg='';render();return}
  if(a==='aycancel'){S.aye.edit=null;S.aye.msg='';render();return}
  if(a==='aysave'){const E=S.aye.edit,y=S.ays.find(z=>z.id===E.id),err=ayCheck(E);if(err){S.aye.msg=err;render();return}
    const ch=[];if(E.name.trim()!==y.name)ch.push('name '+y.name+' → '+E.name.trim());if(E.from!==y.from)ch.push('start '+dmy(y.from)+' → '+dmy(E.from));if(E.to!==y.to)ch.push('end '+dmy(y.to)+' → '+dmy(E.to));
    Object.assign(y,{name:E.name.trim(),from:E.from,to:E.to});if(ch.length)log('Academic year edited','Academic year '+y.name,ch.join('; '),'','System');S.aye.edit=null;S.aye.msg='';toast(ch.length?'Saved '+y.name+'.':'No changes.');render();return}
  if(a==='aylock'||a==='ayunlock'){const y=S.ays.find(z=>z.id===id),r=(S.aye.reason[id]||'').trim();if(!r){toast('Please give a reason to '+(a==='aylock'?'lock':'unlock')+' '+y.name+'.');return}
    if(a==='aylock'){const u=ayUse(y);y.status='Locked';y.lockInfo={by:cu().name,at:TODAY,reason:r};log('Academic year locked','Academic year '+y.name,'Open → Locked'+(u.pending?' ('+u.pending+' open request'+(u.pending>1?'s':'')+' paused)':''),r,'System');toast(y.name+' is locked.'+(u.pending?' '+u.pending+' open request'+(u.pending>1?'s are':' is')+' paused until it’s unlocked.':''))}
    else{y.status='Open';log('Academic year unlocked','Academic year '+y.name,'Locked → Open',r,'System');y.lockInfo=null;toast(y.name+' is open again.')}
    S.aye.reason[id]='';render();return}
  if(a==='aycur'){const y=S.ays.find(z=>z.id===id),o=ayCur();if(y.status==='Locked'){toast('Unlock '+y.name+' before making it current.');return}S.ays.forEach(z=>z.current=z.id===id);log('Current academic year','Academic year',o.name+' → '+y.name,'','System');toast(y.name+' is now the current academic year.');render();return}
  const D0=S.draft;
  if(a==='dcard'){S.dash.f=S.dash.f===id?'':id;S.dash.open=null;render();return}
  if(a==='dsearch'){const q=SRF_ROOT.getElementById('dash-q');if(q&&typeof q.value==='string')S.dash.q=q.value;render();return}
  if(a==='dclear'){S.dash={f:'',q:'',open:null};render();return}
  if(a==='dopen'){S.dash.open=S.dash.open===id?null:id;render();return}
  if(a==='qopen'){const x=subOf(id);S.view='verification';S.vq.tab=QUEUE.includes(x.status)?'pending':'verified';S.acc.sel=id;S.acc.remark='';render();window.scrollTo(0,0);return}
  if(a==='newsrf'){if(!can('submission','Create')){deny('Your role cannot create SRF requests.','SRF request');return}S.view='submission';S.wz={step:1,tab:'new',done:null};S.draft=newDraft(principalBranches()[0]||'');render();window.scrollTo(0,0);return}
  if(a==='opendraft2'){const x=S.drafts.find(y=>y.id===id&&y.by===S.uid);if(!x)return;S.draft=clone(x.d);S.view='submission';S.wz={step:4,tab:'new',done:null};render();return}
  if(a==='wztab'){S.wz.tab=id;if(id==='new')S.wz.done=null;render();return}
  if(a==='wzgo'){const n=+id,d=S.draft;if(n>=4&&!wzEligible(d).some(x=>d.include[x.enrol])){toast('Select at least one student first.');S.wz.step=3;render();return}S.wz.step=n;render();window.scrollTo(0,0);return}
  if(a==='wznext'){const d=S.draft;if(S.wz.step===3&&!wzEligible(d).some(x=>d.include[x.enrol])){toast('Choose at least one student to continue.');return}S.wz.step=Math.min(5,S.wz.step+1);render();window.scrollTo(0,0);return}
  if(a==='wzperiod'){const t=new Date(Date.parse(TODAY)),y=t.getUTCFullYear(),mo=t.getUTCMonth(),iso=d=>d.toISOString().slice(0,10);
    if(id==='month'){D0.from=iso(new Date(Date.UTC(y,mo,1)));D0.to=TODAY}else if(id==='last'){D0.from=iso(new Date(Date.UTC(y,mo-1,1)));D0.to=iso(new Date(Date.UTC(y,mo,0)))}else{const y0=ayOf(D0.from),y=y0&&y0.status!=='Locked'?y0:ayCur();D0.from=y.from;D0.to=y.to<TODAY?y.to:TODAY}render();return}
  if(a==='wzall'){wzEligible(D0).forEach(x=>{D0.include[x.enrol]=true;if(!D0.assign[x.enrol])D0.assign[x.enrol]=defaultAssign(x)});render();return}
  if(a==='wznone'){wzEligible(D0).forEach(x=>D0.include[x.enrol]=false);render();return}
  if(a==='wzcopy'){const sel=wzEligible(D0).filter(x=>D0.include[x.enrol]),f0=sel[0],src=D0.assign[f0.enrol];
    sel.slice(1).forEach(x=>{const v=verFor(x.collDate),nw={};v.p.roles.forEach(r=>{const ok=new Set(mapped(r,x.branch,x.collDate).filter(e=>e.att==='Present').map(e=>e.bio));nw[r.code]=(src[r.code]||[]).filter(id2=>id2&&ok.has(id2)).slice(0,r.slots)});D0.assign[x.enrol]=nw});toast('Staff copied to '+(sel.length-1)+' more student'+(sel.length>2?'s':''));render();return}
  if(a==='wzrm'){const [en,rc,bio]=id.split('|');D0.assign[en][rc]=(D0.assign[en][rc]||[]).filter(x=>x&&x!==bio);render();return}
  if(a==='vtab'){S.vq.tab=id;S.acc.sel=null;S.acc.remark='';render();return}
  if(a==='ptab'){S.pay.tab=id;render();return}
  if(a==='pbatch'){S.hr.checked={};Object.keys(S.pay.sel).filter(k=>S.pay.sel[k]).forEach(k=>staffPendingLines(k,'Pending HR Processing').forEach(l=>S.hr.checked[l.id]=true));S.pay.sel={};createBatch();if(S.batches.length)S.pay.tab='batches';render();return}
  if(a==='phold'){if(!can('payment','Pay')){deny('Your role cannot hold payments.','Payment');return}if(!S.hr.reason.trim()){toast('Please type a reason for the hold.');return}
    Object.keys(S.pay.sel).filter(k=>S.pay.sel[k]).forEach(k=>staffPendingLines(k,'Pending HR Processing').forEach(l=>{l.pstatus='On Hold';l.note=S.hr.reason.trim();log('Hold payment','Line '+l.id,'Pending → On Hold',S.hr.reason.trim())}));S.pay.sel={};toast('Put on hold. You can release it any time.');render();return}
  if(a==='prelease'){staffPendingLines(id,'On Hold').forEach(l=>releaseLine(l.id));return}
  if(a==='prev'){if(!S.hr.reason.trim()){toast('Please type a reason for the reversal below the table.');return}scopeLines().filter(l=>l.empId===id&&l.pstatus==='Paid'&&!S.revs.some(r=>r.line===l.id&&r.status==='Pending')).forEach(l=>requestReversal(l.id));return}
  if(a==='pinclude'){includePayroll(id);return}
  if(a==='finmore'){S.fin.more=id==='1';render();window.scrollTo(0,0);return}
  if(a==='finsave'){const last=curV(),p=CD(),typ=sum(p.roles.filter(r=>r.on).map(r=>(r.calc==='pct'?+r.value:+r.value/50)*Math.min(S.cp.prev.counts[r.code]||0,r.slots)));
    if(!diffs().length){toast('Nothing has changed.');return}
    if(!S.cp.from||S.cp.from<=last.from){toast('Choose an effective date after '+dmy(last.from)+'.');return}
    if(!S.cp.reason.trim()){toast('Please give a reason for the change.');return}
    if(p.limits.blockOver&&typ>+p.limits.maxPct){toast('A typical admission would pay '+typ+'% of SRF, above the '+p.limits.maxPct+'% limit. Lower a rate or raise the limit.');return}
    publishVersion();render();return}
  if(a==='xls'){downloadXlsx(id);return}
  if(a==='pdf'){downloadPdf(id);return}
  if(a==='specgo'){const t=SRF_ROOT.getElementById(id);if(t&&t.scrollIntoView){try{t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}catch(e){t.scrollIntoView()}}return}
  if(a==='auditcsv'){if(!can('audit','Download')){deny('Your role cannot download audit logs.','Audit');return}const fin=S.role==='Corporate Finance',rows=S.audit.filter(x=>!fin||x.cat==='Finance'),q=x=>'"'+String(x).replace(/"/g,'""')+'"';
    const txt=[['When','User','Login','Role','Category','Action','Record','Change','Reason','Device'],...rows.map(x=>[x.at,x.user,x.login,x.role,x.cat,x.action,x.entity,x.detail,x.reason,x.device])].map(r=>r.map(q).join(',')).join('\n');
    const done=()=>toast('Copied '+rows.length+' audit rows'),fb=()=>{const t=SRF_ROOT.getElementById('clip');t.value=txt;t.select();try{document.execCommand('copy');done()}catch(e){toast('Select and copy manually')}};try{navigator.clipboard.writeText(txt).then(done,fb)}catch(e){fb()}log('Download','Audit log',rows.length+' rows copied','','System');return}
  if(a==='uedit'){S.sa.edit=clone(S.users.find(u=>u.id===id));S.sa.msg='';render();return}
  if(a==='ucancel'){S.sa.edit=null;S.sa.msg='';render();return}
  if(a==='usave'){const E=S.sa.edit,u=S.users.find(x=>x.id===E.id),err=validateUser(E);if(err){S.sa.msg=err;render();return}
    if(E.id===S.uid&&!E.roles.includes('System Admin')){S.sa.msg='You cannot remove your own System Admin role.';render();return}
    const ch=[];['name','empId','auth'].forEach(k=>{if(String(u[k])!==String(E[k]))ch.push(k+' '+(u[k]||'—')+' → '+(E[k]||'—'))});
    if(u.roles.join(',')!==E.roles.join(','))ch.push('roles '+u.roles.join(' + ')+' → '+E.roles.join(' + '));
    const os=scopeText(u);Object.assign(u,{name:E.name.trim(),empId:E.empId.trim(),roles:[...E.roles],auth:E.auth.trim(),scope:clone(E.scope)});const ns=scopeText(u);if(os!==ns)ch.push('scope '+os+' → '+ns);
    if(ch.length)log(E.roles.includes('Principal')&&os!==ns?'Principal branch mapping changed':'User changed','User '+u.login,ch.join('; '),'','System');S.sa.edit=null;S.sa.msg='';toast(ch.length?'Saved: '+u.login:'No changes');render();return}
  if(a==='utoggle'){const u=S.users.find(x=>x.id===id);if(u.id===S.uid){deny('You cannot deactivate your own login.','User '+u.login);return}
    u.status=u.status==='Active'?'Inactive':'Active';log(u.status==='Active'?'User activated':'User deactivated','User '+u.login,(u.status==='Active'?'Inactive → Active':'Active → Inactive')+'; '+(u.status==='Active'?'access restored':'access removed immediately; history kept'),'','System');toast(u.login+' '+(u.status==='Active'?'activated':'deactivated'));render();return}
  if(a==='ureset'){const u=S.users.find(x=>x.id===id);u.reset=true;log('Password reset','User '+u.login,'Temporary password issued; must change at next sign-in','','System');toast('Login reset for '+u.login);render();return}
  if(a==='uadd'){const n=S.sa.newU,x={id:'U'+(S.users.length+1),login:n.login.trim(),name:n.name.trim(),empId:n.empId.trim(),roles:[n.role],auth:'',scope:{type:n.role==='Principal'?'branch':n.stype,ids:[...n.ids]}},err=validateUser(x);
    if(err){S.sa.msg=err;render();return}S.users.push(Object.assign(x,{status:'Active',reset:true,last:'—'}));log('User created','User '+x.login,x.name+' · '+x.empId+' · '+n.role+' · '+scopeText(x),'','System');S.sa.newU={login:'',name:'',empId:'',role:'Principal',stype:'branch',ids:[]};S.sa.msg='';toast('Login '+x.login+' created with a temporary password');render();return}
  if(a==='lock'||a==='unlock'){const x=subOf(id),r=(S.sa.lockReason[id]||'').trim();if(!r){toast('Give a reason');return}
    if(a==='lock'){x.locked={by:S.uid,at:TODAY,reason:r};log('Lock submission','Submission '+x.ref,'Open → Locked',r,'System')}else{log('Unlock submission','Submission '+x.ref,'Locked → Open',r,'System');x.locked=null}
    S.sa.lockReason[id]='';toast(x.ref+(a==='lock'?' locked':' unlocked'));render();return}
  if(a==='sync'){log('HRMS sync','HRMS',S.emps.length+' employees read; '+S.emps.filter(e=>e.status!=='Active').length+' not active; postings refreshed','','System');toast('HRMS sync complete');render();return}
  if(a==='view'){S.view=id;window.scrollTo(0,0)}
  else if(a==='submit'){const n0=S.subs.length;submit(S.draft);if(S.subs.length>n0){S.wz.done=S.subs.at(-1).ref;S.draft=newDraft(S.draft.branch);S.lookup={id:'',res:null}}}
  else if(a==='revise'){const s=subOf(id),d=newDraft(s.branch);d.revOf=id;d.remark='Revision: '+s.verRemark;d.include={};s.adms.forEach(x=>{d.include[x.enrol]=true;const as={};x.lines.forEach(l=>(as[l.role]=as[l.role]||[]).push(l.empId));d.assign[x.enrol]=Object.assign(defaultAssign(adm(x.enrol)),as)});S.draft=d;S.view='submission';S.wz={step:4,tab:'new',done:null}}
  else if(a==='sel'){S.acc.sel=id;S.acc.remark=''}
  else if(a==='decide'){decide(b.dataset.t);return}
  else if(a==='hrtab')S.hr.tab=id;
  else if(a==='batch'){createBatch();return}
  else if(a==='selall')allLines().filter(l=>l.pstatus==='Pending HR Processing').forEach(l=>S.hr.checked[l.id]=true);
  else if(a==='paid'){markPaid(id);return}
  else if(a==='hold'){holdLine(id);return}
  else if(a==='release'){releaseLine(id);return}
  else if(a==='reverse'){requestReversal(id);return}
  else if(a==='recover'){recovered(id);return}
  else if(a==='approverev'){approveRev(id);return}
  else if(a==='simulate'){simulate();return}
  else if(a==='fcsync'){fcSync('Manual');render();return}
  else if(a==='awsave'){awRuleSave();render();return}
  else if(a==='awedit'){const r=S.awRules.find(x=>x.id===id);S.aw.del=null;S.aw.rmsg='';S.aw.edit={id,preset:r.preset,custom:r.days,from:r.from,reason:''};render();return}
  else if(a==='awecancel'){S.aw.edit=null;S.aw.rmsg='';render();return}
  else if(a==='awesave'){awEditSave(id);render();return}
  else if(a==='awdelask'){S.aw.edit=null;S.aw.rmsg='';S.aw.del={id,reason:''};render();return}
  else if(a==='awdcancel'){S.aw.del=null;S.aw.rmsg='';render();return}
  else if(a==='awdel'){awDelete(id);render();return}
  else if(a==='awtoggle'){const r=S.awRules.find(x=>x.id===id);if(r.status==='Deleted')return;S.aw.edit=null;S.aw.del=null;r.status=r.status==='Active'?'Inactive':'Active';log('Access period '+(r.status==='Active'?'activated':'deactivated'),'Rule '+r.id,awTarget(r)+' · '+awLabel(r)+' · effective '+dmy(r.from),'','System');toast('Access period '+r.id+' '+r.status.toLowerCase());render();return}
  else if(a==='awopen'){S.aw.open=true;S.aw.gmsg='';render();return}
  else if(a==='awcancel'){S.aw.open=false;S.aw.gmsg='';render();return}
  else if(a==='awgrant'){awGrant();render();return}
  else if(a==='awrevoke'){const g=S.grants.find(x=>x.id===id);if(g.status!=='Active')return;g.status='Revoked';g.closedAt=awNow();log('Special access revoked','Grant '+g.id,(S.users.find(u=>u.id===g.uid)?.name||g.uid)+' · '+BR[g.branch]+' · SRF '+dmy(g.from)+' to '+dmy(g.to)+' · closed '+fcWhen(g.closedAt)+' before expiry '+fcWhen(g.expires)+' · submitted during access: '+(g.used.length?'Yes ('+g.used.join(', ')+')':'No'),'Revoked by System Admin','System');toast('Special access '+g.id+' revoked');render();return}
  else if(a==='rep')S.rep=id;
  else if(a==='csv'){const r=reportData()[S.rep],q=x=>'"'+String(x).replace(/"/g,'""')+'"',txt=[r.cols,...r.rows].map(row=>row.map(q).join(',')).join('\n');
    const done=()=>toast('Copied '+r.rows.length+' rows as CSV'),fb=()=>{const t=SRF_ROOT.getElementById('clip');t.value=txt;t.select();try{document.execCommand('copy');done()}catch(e){toast('Select and copy the CSV manually')}};
    try{navigator.clipboard.writeText(txt).then(done,fb)}catch(e){fb()}return}
  /* control panel */
  else if(a==='sec'){S.cp.sec=id;S.cp.delMsg='';S.cp.delB=null;S.cp.editB=null;S.cp.geoMsg='';S.cp.delG=null;S.cp.editG=null}
  else if(a==='rmdesig'){const r=p.roles[+b.dataset.i];if(r.desig.length===1){toast('A role needs at least one designation; switch the role off instead');return}r.desig=r.desig.filter(x=>x!==b.dataset.v)}
  else if(a==='addrole'){const l=SRF_ROOT.getElementById('nr-label').value.trim();if(!l){toast('Type a role name');return}const code=l.toUpperCase().replace(/[^A-Z0-9]+/g,'_');if(p.roles.some(r=>r.code===code)){toast(l+' already exists');return}
    const free=HRMS_DESIG.filter(x=>!p.roles.some(r=>r.desig.includes(x)));p.roles.push({code,label:l,desig:[free.includes(l)?l:(free[0]||'Driver')],mode:'pool',slots:1,calc:'fixed',value:0,on:true,doc:''});S.cp.prev.counts[code]=0;toast(l+' added with a ₹0 rate: set its rate and designations')}
  else if(a==='addrule'){const n=S.cp.newRule;if(p.rules.some(r=>r.scope===n.scope&&r.value===n.value&&r.role===n.role)){toast('A rule for this scope and role already exists');return}p.rules.push(clone(n));toast('Rule added to draft')}
  else if(a==='rmrule')p.rules.splice(+b.dataset.i,1);
  else if(a==='addcat'){const c=SRF_ROOT.getElementById('nc').value.trim();if(!c||c in p.cats){toast(c?'Category exists':'Type a category');return}p.cats[c]=false}

  else if(a==='addbranch'){const n=S.cp.newBranch,code=n.code.trim().toUpperCase(),name=n.name.trim().replace(/\s+/g,' ');
    if(!/^[A-Z0-9]{2,5}$/.test(code)){toast('Branch code must be 2 to 5 letters or digits');return}
    if(code in BR){toast('Code '+code+' is already used by '+BR[code]);return}
    if(!name){toast('Enter the branch name');return}
    if(BRANCHES().some(x=>x.toLowerCase()===name.toLowerCase())){toast(name+' already exists');return}
    if(GEO.zones.length&&!n.zone){toast('Choose the branch’s region and zone');return}
    BR[code]=name;BMETA[code]={zone:n.zone,added:TODAY,by:'Corporate Finance Admin'};
    log('Add branch','Branch '+code,name+(n.zone?', '+bRegionName(code)+' / '+bZoneName(code):''));
    S.cp.newBranch={code:'',name:'',region:'',zone:''};toast(name+' added. Map a Principal login to it under Users and logins.')}
  else if(a==='editbranch'){S.cp.editB={code:id,name:BR[id],region:bZone(id)?.region||'',zone:BMETA[id].zone};S.cp.delB=null;S.cp.delMsg=''}
  else if(a==='canceledit')S.cp.editB=null;
  else if(a==='savebranch'){const E=S.cp.editB,c=E.code,old=BR[c],nm=E.name.trim().replace(/\s+/g,' '),m=BMETA[c];
    if(!nm){toast('Enter the branch name');return}
    if(Object.entries(BR).some(([k,x])=>k!==c&&x.toLowerCase()===nm.toLowerCase())){toast(nm+' already exists');return}
    const ch=[];if(nm!==old)ch.push('name '+old+' → '+nm);if(GEO.zones.length&&!E.zone){toast('Choose the branch’s region and zone');return}
    if(E.zone!==m.zone)ch.push('zone '+(bZoneName(c)?bRegionName(c)+' / '+bZoneName(c):'not set')+' → '+(E.zone?regById(zoneById(E.zone).region).name+' / '+zoneById(E.zone).name:'not set'));
    if(!ch.length){S.cp.editB=null;toast('No changes');render();return}
    if(nm!==old){const fix=p=>{p.rules.forEach(r=>{if(r.scope==='Branch'&&r.value===old)r.value=nm});0};
      S.versions.forEach(v=>fix(v.p));fix(CD());if(S.cp.newRule.value===old)S.cp.newRule.value=nm;if(S.cp.newUser.branch===old)S.cp.newUser.branch=nm}
    BR[c]=nm;m.zone=E.zone;m.updated=TODAY;m.by='Corporate Finance Admin';
    log('Edit branch','Branch '+c,ch.join('; '));S.cp.editB=null;toast(c+' updated')}
  else if(a==='askdel'){const u=branchUses(id);S.cp.editB=null;if(u.length){S.cp.delB=null;S.cp.delMsg=BR[id]+' cannot be deleted: it has '+u.join(', ')+'. SRF records are never deleted.';log('Blocked deletion attempt','Branch '+id,'Linked: '+u.join(', '),'','System')}else{S.cp.delB=id;S.cp.delMsg=''}}
  else if(a==='canceldel'){S.cp.delB=null}
  else if(a==='lookup'){const d=S.draft,s=draftSummary(d),id=S.lookup.id.trim(),asOn=asOnDate(d,s);
    if(!id){toast('Type an employee or biometric ID');return}
    const e=emp(id),why=staffCheck(e,d.branch,asOn,verFor(asOn));
    S.lookup.res=why?{ok:false,msg:why}:{ok:true,e};if(why&&why===NOT_MAPPED)log('Blocked assignment lookup','Employee ID '+id,'Not mapped to '+BR[d.branch]+' on '+dmy(asOn))}
  else if(a==='unassign'){const [en,rc,bio]=id.split('|'),arr=S.draft.assign[en][rc]||[],r=vRole(curV(),rc);S.draft.assign[en][rc]=r&&r.mode==='per'?arr.map(x=>x===bio?'':x):arr.filter(x=>x!==bio)}
  else if(a==='smsearch'){}
  else if(a==='smopen'){S.cp.sm.open=S.cp.sm.open===id?null:id;S.cp.sm.form={kind:'transfer',to:'',from:TODAY,ref:'',reason:'',status:''}}
  else if(a==='smsave'){const e=emp(id),f=S.cp.sm.form,cp=curPosting(e),ref=f.ref.trim(),why=f.reason.trim();
    if(!ref||!why){toast('HRMS order/reference and reason are both required');return}
    if(f.kind==='status'){const nu=f.status||STATUSES.find(x=>x!==e.status),old=e.status;if(!f.from){toast('Choose the effective date');return}
      e.status=nu;(e.statusHist=e.statusHist||[]).push({from:f.from,old,nu,ref});log('HRMS status change','Employee '+e.bio,e.name+': '+old+' → '+nu+' from '+dmy(f.from)+' ('+ref+')',why)}
    else{if(!f.to){toast('Choose the branch');return}const old=cp.branch;
      if(f.kind==='transfer'){if(!f.from||f.from<=cp.from){toast('Transfer date must be after '+dmy(cp.from)+', when the current posting started');return}
        cp.to=dayBefore(f.from);e.postings.push({branch:f.to,from:f.from,to:null,ref});log('HRMS transfer','Employee '+e.bio,e.name+': '+BR[old]+' → '+BR[f.to]+' from '+dmy(f.from)+' ('+ref+')',why)}
      else{cp.branch=f.to;cp.ref=ref+' (correction)';log('HRMS mapping correction','Employee '+e.bio,e.name+': posting from '+dmy(cp.from)+' corrected '+BR[old]+' → '+BR[f.to]+' ('+ref+')',why)}}
    S.cp.sm.open=null;S.cp.sm.form={kind:'transfer',to:'',from:TODAY,ref:'',reason:'',status:''};toast('Saved and logged: '+e.name)}
  else if(a==='addregion'){const nm=S.cp.newRegion.trim().replace(/\s+/g,' ');S.cp.geoMsg='';if(!nm){toast('Type a region name');return}
    if(GEO.regions.some(r=>r.name.toLowerCase()===nm.toLowerCase())){toast(nm+' already exists');return}
    const id='R'+(++GEO.seq);GEO.regions.push({id,name:nm});if(!S.cp.newZone.region)S.cp.newZone.region=id;S.cp.newRegion='';log('Add region','Region '+nm,'Created');toast('Region '+nm+' added')}
  else if(a==='addzone'){const nz=S.cp.newZone,nm=nz.name.trim().replace(/\s+/g,' ');S.cp.geoMsg='';if(!nm){toast('Type a zone name');return}if(!nz.region){toast('Choose the zone’s region');return}
    if(GEO.zones.some(z=>z.region===nz.region&&z.name.toLowerCase()===nm.toLowerCase())){toast(nm+' already exists in '+regById(nz.region).name);return}
    GEO.zones.push({id:'Z'+(++GEO.seq),name:nm,region:nz.region});nz.name='';log('Add zone','Zone '+nm,'In region '+regById(nz.region).name);toast('Zone '+nm+' added')}
  else if(a==='editgeo'){const k=b.dataset.kind,o=k==='region'?regById(id):zoneById(id);S.cp.editG={kind:k,id,name:o.name,region:o.region||''};S.cp.delG=null;S.cp.geoMsg=''}
  else if(a==='canceleditgeo')S.cp.editG=null;
  else if(a==='savegeo'){const E=S.cp.editG,nm=E.name.trim().replace(/\s+/g,' ');if(!nm){toast('Enter a name');return}
    if(E.kind==='region'){const r=regById(E.id);if(GEO.regions.some(x=>x.id!==E.id&&x.name.toLowerCase()===nm.toLowerCase())){toast(nm+' already exists');return}
      if(nm!==r.name){log('Edit region','Region '+r.name,'name '+r.name+' → '+nm);r.name=nm}}
    else{const z=zoneById(E.id);if(GEO.zones.some(x=>x.id!==E.id&&x.region===E.region&&x.name.toLowerCase()===nm.toLowerCase())){toast(nm+' already exists in that region');return}
      const ch=[];if(nm!==z.name)ch.push('name '+z.name+' → '+nm);if(E.region!==z.region){const nb=Object.keys(BR).filter(c=>BMETA[c].zone===z.id).length;ch.push('region '+regById(z.region).name+' → '+regById(E.region).name+(nb?' ('+nb+' branch'+(nb>1?'es':'')+' moved)':''))}
      if(ch.length)log('Edit zone','Zone '+z.name,ch.join('; '));z.name=nm;z.region=E.region}
    S.cp.editG=null;toast('Saved')}
  else if(a==='askdelgeo'){const k=b.dataset.kind;S.cp.editG=null;
    if(k==='region'){const n=GEO.zones.filter(z=>z.region===id).length;if(n){S.cp.geoMsg=regById(id).name+' cannot be deleted: it has '+n+' zone'+(n>1?'s':'')+'. Move or delete them first.';S.cp.delG=null}else{S.cp.delG={kind:k,id};S.cp.geoMsg=''}}
    else{const n=Object.keys(BR).filter(c=>BMETA[c].zone===id);if(n.length){S.cp.geoMsg=zoneById(id).name+' cannot be deleted: '+n.map(c=>BR[c]).join(', ')+(n.length>1?' are':' is')+' in it. Move '+(n.length>1?'those branches':'that branch')+' to another zone first.';S.cp.delG=null}else{S.cp.delG={kind:k,id};S.cp.geoMsg=''}}}
  else if(a==='canceldelgeo')S.cp.delG=null;
  else if(a==='delgeo'){const k=b.dataset.kind;
    if(k==='region'){const r=regById(id);GEO.regions=GEO.regions.filter(x=>x.id!==id);if(S.cp.newZone.region===id)S.cp.newZone.region=GEO.regions[0]?.id||'';log('Delete region','Region '+r.name,'Removed (no zones)');toast('Region '+r.name+' deleted')}
    else{const z=zoneById(id);GEO.zones=GEO.zones.filter(x=>x.id!==id);log('Delete zone','Zone '+z.name,'Removed (no branches)');toast('Zone '+z.name+' deleted')}
    S.cp.delG=null}
  else if(a==='delbranch'){const name=BR[id];if(branchUses(id).length){toast('This branch now has records and cannot be deleted');S.cp.delB=null;render();return}
    const p0=CD();p0.rules=p0.rules.filter(r=>!(r.scope==='Branch'&&r.value===name));
    delete BR[id];delete BMETA[id];if(S.draft.branch===id)S.draft=newDraft(Object.keys(BR)[0]);
    if(S.cp.newRule.value===name)S.cp.newRule.value=BRANCHES()[0];if(S.cp.newUser.branch===name)S.cp.newUser.branch=BRANCHES()[0];
    log('Delete branch','Branch '+id,name+' removed (no SRF records)');S.cp.delB=null;toast(name+' deleted')}
  else if(a==='restore'){S.cp.draft=clone(S.versions.find(x=>x.v===+b.dataset.v).p);toast('Version '+b.dataset.v+' loaded into draft');S.cp.sec='roles'}
  else if(a==='discard'){S.cp.draft=clone(CA());S.cp.reason='';S.cp.confirm=false;toast('Draft discarded')}
  else if(a==='askpub')S.cp.confirm=true;
  else if(a==='noconfirm')S.cp.confirm=false;
  else if(a==='publish')publishVersion();
  render();});
SRF_ROOT.addEventListener('change',ev=>{const t=ev.target,d=S.draft,p=CD();
  if(t.dataset.inc){d.include[t.dataset.inc]=t.checked;if(t.checked&&!d.assign[t.dataset.inc])d.assign[t.dataset.inc]=defaultAssign(adm(t.dataset.inc))}
  else if(t.dataset.pool){const [e,r,bio]=t.dataset.pool.split('|'),arr=d.assign[e][r]=d.assign[e][r]||[];if(t.checked)arr.push(bio);else arr.splice(arr.indexOf(bio),1)}
  else if(t.dataset.per){const [e,r,i]=t.dataset.per.split('|'),arr=d.assign[e][r]=d.assign[e][r]||[];arr[+i]=t.value}
  else if(t.dataset.doc){d.doc=t.files?.[0]?.name||''}
  else if(t.dataset.acc)S.acc.checked[t.dataset.acc]=t.checked;
  else if(t.dataset.hr)S.hr.checked[t.dataset.hr]=t.checked;
  else if(t.dataset.p){if(!can('policy','Edit')){deny('Only Corporate Finance can change SRF policy.','Policy');render();return}setPath(t.dataset.p,t.type==='checkbox'?t.checked:t.type==='number'?Math.max(0,+t.value||0):t.value);S.cp.confirm=false}
  else if(t.dataset.act2==='adddesig'&&t.value){const v=t.value;if(p.roles.some(r=>r.desig.includes(v))){toast(v+' is already mapped to another role');t.value='';return}p.roles[+t.dataset.i].desig.push(v)}
  else if(t.dataset.n){S.cp.newRule[t.dataset.n]=t.dataset.n==='value2'?Math.max(0,+t.value||0):t.value;if(t.dataset.n==='scope')S.cp.newRule.value=(t.value==='Branch'?BRANCHES():t.value==='Class'?CLASSES:Object.keys(p.cats))[0]}
  else if(t.dataset.u){S.cp.newUser[t.dataset.u]=t.value}
  else if(t.dataset.smf){S.cp.sm.branch=t.value}
  else if(t.dataset.wzadd){const [en,rc]=t.dataset.wzadd.split('|'),r=vRole(verFor(adm(en).collDate),rc),arr=(S.draft.assign[en][rc]||[]).filter(Boolean);if(t.value&&arr.length<r.slots)arr.push(t.value);S.draft.assign[en][rc]=arr}
  else if(t.dataset.paysel){const v=t.dataset.paysel;if(v==='*'){const ids=[...new Set(scopeLines().filter(l=>l.vstatus==='Approved'&&l.pstatus==='Pending HR Processing'&&!subOf(l.sub).locked).map(l=>l.empId))];ids.forEach(k=>S.pay.sel[k]=t.checked)}else S.pay.sel[v]=t.checked}
  else if(t.dataset.pm){if(!can('sysadmin','Edit')){deny('Only System Admin can change branch mapping.','Mapping');render();return}const [uid,c]=t.dataset.pm.split('|'),u=S.users.find(x=>x.id===uid),old=scopeText(u),ids=t.checked?[...new Set([...u.scope.ids,c])]:u.scope.ids.filter(x=>x!==c);
    if(!ids.length){toast('A Principal needs at least one branch. To remove access, deactivate the login.');render();return}u.scope={type:'branch',ids};log('Principal branch mapping changed','User '+u.login,old+' → '+scopeText(u),'','System');toast('Mapping updated for '+u.name)}
  else if(t.dataset.aw){if(!can('sysadmin','Edit'))return;S.aw[t.dataset.aw]=t.value;if(t.dataset.aw==='scope')S.aw.target='';S.aw.msg=''}
  else if(t.dataset.awe){if(!can('sysadmin','Edit'))return;S.aw.edit[t.dataset.awe]=t.value}
  else if(t.dataset.awet){if(!can('sysadmin','Edit'))return;S.aw.edit[t.dataset.awet]=t.value;return}
  else if(t.dataset.awdt){if(!can('sysadmin','Edit'))return;S.aw.del[t.dataset.awdt]=t.value;return}
  else if(t.dataset.awt){if(!can('sysadmin','Edit'))return;S.aw[t.dataset.awt]=t.value;return}
  else if(t.dataset.awg){if(!can('sysadmin','Edit'))return;const k=t.dataset.awg;if(k==='doc'){S.aw.g.doc=t.files&&t.files[0]?t.files[0].name:''}else{S.aw.g[k]=t.value;if(k==='uid'){const pu=S.users.find(x=>x.id===t.value);S.aw.g.branch=pu&&userBranches(pu).length===1?userBranches(pu)[0]:''}}}
  else if(t.dataset.awgt){if(!can('sysadmin','Edit'))return;S.aw.g[t.dataset.awgt]=t.value;return}
  else if(t.dataset.rf){S.rf[t.dataset.rf]=t.value}
  else if(t.dataset.wzay){const y=S.ays.find(z=>z.id===t.value);if(y.status==='Locked'){toast(y.name+' is locked.');render();return}S.draft.from=y.from;S.draft.to=y.to<TODAY?y.to:TODAY}
  else if(t.dataset.aye){S.aye.edit[t.dataset.aye]=t.value}
  else if(t.dataset.ayn){const n=S.aye.neu;n[t.dataset.ayn]=t.value;if(t.dataset.ayn!=='name'&&n.from&&n.to&&(!n.name||n.name===ayNameFor(n.autoF,n.autoT))){n.name=ayNameFor(n.from,n.to)}n.autoF=n.from;n.autoT=n.to}
  else if(t.dataset.dq){S.dash.q=t.value}
  else if(t.dataset.perm){if(!can('sysadmin','Admin')){deny('Only System Admin can change role permissions.','Permissions');render();return}const [r,k,ac]=t.dataset.perm.split('|');if(sodLock(r,k,ac)){deny(sodLock(r,k,ac),'Permissions');render();return}
    const arr=S.perms[r][k]=S.perms[r][k]||[];if(t.checked)arr.push(ac);else S.perms[r][k]=arr.filter(x=>x!==ac);log('Permission change','Role '+r,(SCREENS.find(x=>x[0]===k)[1])+' · '+ac+': '+(t.checked?'not granted → granted':'granted → revoked'),'','System')}
  else if(t.dataset.route){if(!can('sysadmin','Admin')){deny('Only System Admin can change routing.','Routing');render();return}const k=t.dataset.route,o=S.routing[k];S.routing[k]=t.value;log('Routing change',ROUTE_NAMES[k],o+' → '+t.value,'','System')}
  else if(t.dataset.notif){if(!can('sysadmin','Admin')){deny('Only System Admin can change notifications.','Notifications');render();return}const [ev2,r]=t.dataset.notif.split('|'),arr=S.notify[ev2]=S.notify[ev2]||[];if(t.checked)arr.push(r);else S.notify[ev2]=arr.filter(x=>x!==r);log('Notification recipients',ev2,r+': '+(t.checked?'added':'removed'),'','System')}
  else if(t.dataset.eur){const E=S.sa.edit;if(t.checked)E.roles.push(t.dataset.eur);else E.roles=E.roles.filter(x=>x!==t.dataset.eur);E.roles=ROLES.filter(r=>E.roles.includes(r));if(E.roles.includes('Principal')&&E.scope.type!=='branch')E.scope={type:'branch',ids:[]}}
  else if(t.dataset.eus){S.sa.edit.scope={type:t.value,ids:[]}}
  else if(t.dataset.eui){const sc=S.sa.edit.scope;if(t.checked)sc.ids.push(t.dataset.eui);else sc.ids=sc.ids.filter(x=>x!==t.dataset.eui)}
  else if(t.dataset.nur){S.sa.newU.role=t.value;if(t.value==='Principal')S.sa.newU.stype='branch';S.sa.newU.ids=[]}
  else if(t.dataset.nus){S.sa.newU.stype=t.value;S.sa.newU.ids=[]}
  else if(t.dataset.nui){const n=S.sa.newU;if(t.checked)n.ids.push(t.dataset.nui);else n.ids=n.ids.filter(x=>x!==t.dataset.nui)}
  else if(t.dataset.af){S.sa.af[t.dataset.af]=t.value}
  else if(t.dataset.fcf){if(!can('sysadmin','Edit'))return;const o=S.fcs.freq;S.fcs.freq=t.value;log('Fee Collection sync setting','Fee Collection',o+' → '+t.value,'','System')}
  else if(t.dataset.sync){if(!can('sysadmin','Edit'))return;const o=S.sa.sync;S.sa.sync=t.value;log('HRMS sync setting','HRMS',o+' → '+t.value,'','System')}
  else if(t.dataset.sys){if(!can('sysadmin','Edit'))return;S.sa[t.dataset.sys]=t.checked;log('System setting',t.dataset.sys==='ess'?'Staff self-service':t.dataset.sys,(t.checked?'off → on':'on → off'),'','System')}
  else if(t.dataset.sm&&['kind','to','status','from'].includes(t.dataset.sm)){S.cp.sm.form[t.dataset.sm]=t.value}
  else if((t.dataset.bs||t.dataset.ebs||t.dataset.gzs||t.dataset.egs||t.dataset.sm)&&!can('sysadmin','Edit')){render();return}
  else if(t.dataset.bs){S.cp.newBranch[t.dataset.bs]=t.value;if(t.dataset.bs==='region')S.cp.newBranch.zone=''}
  else if(t.dataset.ebs){S.cp.editB[t.dataset.ebs]=t.value;if(t.dataset.ebs==='region')S.cp.editB.zone=''}
  else if(t.dataset.gzs){S.cp.newZone.region=t.value}
  else if(t.dataset.egs){S.cp.editG.region=t.value}
  else if(t.dataset.pv){S.cp.prev[t.dataset.pv]=t.dataset.pv==='srf'?Math.max(0,+t.value||0):t.value}
  else if(t.dataset.pc){S.cp.prev.counts[t.dataset.pc]=Math.max(0,+t.value||0)}
  else if(t.dataset.s==='from'){S.cp.from=t.value;S.cp.confirm=false}
  else if(t.dataset.chg){const k=t.dataset.chg;
    if(k==='branch'){if(t.value&&!principalBranches().includes(t.value)){toast('You can select only your own branch');return}S.draft=newDraft(t.value);S.lookup={id:'',res:null}}
    else if(k==='login'){const nu=S.users.find(x=>x.id===t.value),pu=S.uid,pr=S.role;
      if(nu.status!=='Active'){S.uid=nu.id;S.role=nu.roles[0];log('Login denied','User '+nu.login,'Account deactivated: sign-in refused','','System');S.uid=pu;S.role=pr;notify('Login denied',nu.login);toast('Access denied: '+nu.login+' is deactivated.');render();return}
      S.uid=nu.id;S.role=nu.roles[0];nu.last=dmy(TODAY);log('Login','User '+nu.login,'Signed in'+(nu.reset?' with a temporary password':'')+' · active role '+S.role,'','System');landing()}
    else if(k==='role'){const old=S.role;if(!cu().roles.includes(t.value))return;S.role=t.value;log('Role switch','User '+cu().login,old+' → '+t.value,'','System');landing()}else if(k==='from'||k==='to')d[k]=t.value;
    else if(k==='period'){if(t.value)S.hr.pd[ptype()]=t.value}else if(k==='method')S.hr.method=t.value;
    else if(k==='sim')S.cp.sim=t.value;else if(k==='simTo')S.cp.simTo=t.value;}
  else return;
  render();});
SRF_ROOT.addEventListener('input',ev=>{const t=ev.target;
  if(t.dataset.in==='remark')S.draft.remark=t.value;else if(t.dataset.in==='accRemark')S.acc.remark=t.value;else if(t.dataset.in==='hrReason')S.hr.reason=t.value;
  else if(t.dataset.ref)S.hr.ref[t.dataset.ref]=t.value;
  else if(t.dataset.u==='user')S.cp.newUser.user=t.value;
  else if(t.dataset.b)S.cp.newBranch[t.dataset.b]=t.value;
  else if(t.dataset.lk)S.lookup.id=t.value;
  else if(t.dataset.awt)S.aw[t.dataset.awt]=t.value;
  else if(t.dataset.awet)S.aw.edit[t.dataset.awet]=t.value;
  else if(t.dataset.awdt)S.aw.del[t.dataset.awdt]=t.value;
  else if(t.dataset.awgt)S.aw.g[t.dataset.awgt]=t.value;
  else if(t.dataset.ayr)S.aye.reason[t.dataset.ayr]=t.value;
  else if(t.dataset.aye&&t.dataset.aye==='name')S.aye.edit.name=t.value;
  else if(t.dataset.ayn&&t.dataset.ayn==='name')S.aye.neu.name=t.value;
  else if(t.dataset.dq)S.dash.q=t.value;
  else if(t.dataset.eu)S.sa.edit[t.dataset.eu]=t.value;
  else if(t.dataset.nu)S.sa.newU[t.dataset.nu]=t.value;
  else if(t.dataset.lockr)S.sa.lockReason[t.dataset.lockr]=t.value;
  else if(t.dataset.afq)S.sa.af.q=t.value;
  else if(t.dataset.smq)S.cp.sm.q=t.value;
  else if(t.dataset.sm)S.cp.sm.form[t.dataset.sm]=t.value;
  else if(t.dataset.eb)S.cp.editB[t.dataset.eb]=t.value;
  else if(t.dataset.g==='region')S.cp.newRegion=t.value;
  else if(t.dataset.gz)S.cp.newZone[t.dataset.gz]=t.value;
  else if(t.dataset.eg)S.cp.editG[t.dataset.eg]=t.value;
  else if(t.dataset.s==='reason'){const had=!!S.cp.reason.trim();S.cp.reason=t.value;S.cp.confirm=false;
    if(had!==!!t.value.trim()){const pos=t.selectionStart;render();const n=SRF_ROOT.getElementById('pub-reason');if(n){n.focus();n.setSelectionRange(pos,pos)}}}});
S.hr.method=curV().p.cycle.method;

SRF_BRIDGE.seed({S,newDraft,submit,log,userBranches,elig,adm,clone,decide,createBatch,includePayroll,markPaid,holdLine,requestReversal,approveRev,recovered,lineById});

const _render0 = render; render = function () { _render0(); SRF_BRIDGE.afterRender({ S, counts, SCREENS, can }); };
const _log0 = log; log = function (a, e, d, r, c) { _log0(a, e, d, r, c); SRF_BRIDGE.onLog(S.audit[0]); };
const _toast0 = toast; toast = function (t) { if (!SRF_HOST.isConnected && typeof window.toast === 'function') window.toast(t); else _toast0(t); };
const _ub0 = userBranches; userBranches = function (u) { const L = _ub0(u); return (!u || u.id === S.uid) ? SRF_BRIDGE.filterBranches(L) : L; };
return { S, render, landing, log, can, counts, SCREENS, userBranches, cu, newDraft, submit, ayCur, curV, BR, BMETA, GEO, adm, subOf, clone, elig, toast, decide, createBatch, includePayroll, markPaid, holdLine, releaseLine, requestReversal, approveRev, recovered, dupPay, dupClaim, dashData, dashFilter, subMatches, reqStatus, dashLine, scopeSubs, scopeLines, allLines, lineById, admChecks, lineChecks, vRole, verNo, verFor, emp, principalBranches, draftAdms, draftSummary, defaultAssign, calc, mapped, onRoles, rateFor, awMsg, pVisA, ptype, periodKey, periodLabel, reportData, QUEUE, LINE_LABEL, PENDPAY, inr, dmy, TODAY };
})();
