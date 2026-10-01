/* POD SYNC ADDON — sincroniza historial vía Supabase
   No modifica el index. Solo añade un botón  flotante que se puede ocultar.
   Si algo falla: borra este archivo y quita las 2 líneas del </body>. */
(function () {
'use strict';
var CFG_KEY = 'pod_supabase_cfg';
var HIST_PREFIX = 'POD_AD6|';
var _sb = null, _user = null, _btn = null, _panel = null, _mini = null;

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getCfg(){ try{ return JSON.parse(localStorage.getItem(CFG_KEY)||'null'); }catch(e){ return null; } }
function saveCfg(u,k){ localStorage.setItem(CFG_KEY, JSON.stringify({url:u, anonKey:k})); }

async function initSB(){
  var cfg = getCfg();
  if (!cfg || !cfg.url || !cfg.anonKey) return false;
  if (!window.supabase) return false;
  _sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  var r = await _sb.auth.getSession();
  _user = (r.data && r.data.session && r.data.session.user) || null;
  return !!_user;
}

/* Botón flotante (se puede ocultar) */
function buildButton(){
  if (_btn) return;
  _btn = document.createElement('button');
  _btn.textContent = '☁';
  _btn.title = 'Sincronizar (clic para abrir, doble clic para ocultar)';
  _btn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99998;width:40px;height:40px;border-radius:50%;background:#1b1b25;color:#d9a94a;border:1px solid #2a2a38;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;transition:opacity .2s';
  _btn.onclick = openPanel;
  _btn.ondblclick = hideButton;
  document.body.appendChild(_btn);
}
function hideButton(){ if (_btn){ _btn.style.opacity = '0.15'; _btn.title = 'Doble clic para mostrar'; } }
function showButton(){ if (_btn){ _btn.style.opacity = '1'; _btn.title = 'Sincronizar'; } }

/* Panel */
function openPanel(){
  if (_panel){ _panel.style.display = 'block'; return; }
  _panel = document.createElement('div');
  _panel.style.cssText = 'position:fixed;bottom:64px;right:16px;z-index:99998;background:#12151a;border:1px solid #232830;border-radius:10px;padding:14px;width:320px;max-width:90vw;color:#e7e9ec;font:12px/1.5 "Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)';
  _panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
    '<b style="color:#d9a94a;letter-spacing:.05em">☁ Sincronización</b>'+
    '<div><button id="syncMin" style="background:transparent;border:0;color:#98a1ab;cursor:pointer;font-size:14px;margin-right:6px" title="Minimizar">—</button>'+
    '<button id="syncClose" style="background:transparent;border:0;color:#98a1ab;cursor:pointer;font-size:16px" title="Cerrar">✕</button></div></div>'+
    '<div id="syncStatus" style="color:#98a1ab;font-size:11px;margin-bottom:10px">Cargando…</div>'+
    '<div id="syncBody"></div>';
  document.body.appendChild(_panel);
  document.getElementById('syncClose').onclick = function(){ _panel.style.display='none'; };
  document.getElementById('syncMin').onclick = function(){ _panel.style.display='none'; showButton(); };
  refreshPanel();
}

async function refreshPanel(){
  var body = document.getElementById('syncBody'), status = document.getElementById('syncStatus');
  if (!body || !status) return;
  var cfg = getCfg(), connected = await initSB();

  if (!cfg || !cfg.url){
    status.textContent = 'Sin configurar';
    body.innerHTML =
      '<label style="display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#98a1ab;margin:0 0 3px">Project URL</label>'+
      '<input id="syncUrl" type="text" placeholder="https://xxxxx.supabase.co" style="width:100%;box-sizing:border-box;background:#171b21;color:#e7e9ec;border:1px solid #2e3540;border-radius:6px;padding:7px 9px;font:12px/1.4 Segoe UI,sans-serif;margin-bottom:9px">'+
      '<label style="display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#98a1ab;margin:0 0 3px">anon public key</label>'+
      '<input id="syncKey" type="password" placeholder="eyJhbGciOi..." style="width:100%;box-sizing:border-box;background:#171b21;color:#e7e9ec;border:1px solid #2e3540;border-radius:6px;padding:7px 9px;font:12px/1.4 Segoe UI,sans-serif;margin-bottom:9px">'+
      '<button id="syncSave" style="background:#d9a94a;color:#171204;border:0;border-radius:6px;padding:10px 16px;font:700 11px/1 Segoe UI,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;width:100%">Guardar y conectar</button>'+
      '<div style="color:#6b7480;font-size:10px;margin-top:8px">Credenciales solo en este navegador (localStorage). La tabla debe llamarse <code>pod_history</code>.</div>';
    document.getElementById('syncSave').onclick = async function(){
      var u = document.getElementById('syncUrl').value.trim(), k = document.getElementById('syncKey').value.trim();
      if (!u || !k){ alert('Faltan datos'); return; }
      saveCfg(u,k); await refreshPanel();
    };
    return;
  }
  if (!connected){
    status.textContent = 'Configurado · sin sesión';
    body.innerHTML =
      '<input id="syncEmail" type="email" placeholder="correo" style="width:100%;box-sizing:border-box;background:#171b21;color:#e7e9ec;border:1px solid #2e3540;border-radius:6px;padding:7px 9px;font:12px/1.4 Segoe UI,sans-serif;margin-bottom:9px">'+
      '<input id="syncPass" type="password" placeholder="contraseña" style="width:100%;box-sizing:border-box;background:#171b21;color:#e7e9ec;border:1px solid #2e3540;border-radius:6px;padding:7px 9px;font:12px/1.4 Segoe UI,sans-serif;margin-bottom:9px">'+
      '<button id="syncLogin" style="background:#d9a94a;color:#171204;border:0;border-radius:6px;padding:10px 16px;font:700 11px/1 Segoe UI,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;width:100%;margin-bottom:6px">Entrar</button>'+
      '<button id="syncReset" style="background:transparent;color:#d0655f;border:1px solid #5c3330;border-radius:6px;padding:8px 12px;font:600 10px/1 Segoe UI,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;width:100%">Borrar credenciales</button>';
    document.getElementById('syncLogin').onclick = doLogin;
    document.getElementById('syncPass').onkeydown = function(e){ if (e.key==='Enter') doLogin(); };
    document.getElementById('syncReset').onclick = function(){ localStorage.removeItem(CFG_KEY); refreshPanel(); };
    return;
  }
  status.innerHTML = '<span style="color:#4fae7b">● Conectado como '+esc(_user.email)+'</span>';
  body.innerHTML =
    '<button id="syncUp" style="background:#171b21;color:#e7e9ec;border:1px solid #2e3540;border-radius:6px;padding:10px 12px;font:650 11px/1 Segoe UI,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;width:100%;margin-bottom:6px">⬆ Subir historial local a la nube</button>'+
    '<button id="syncDown" style="background:#171b21;color:#e7e9ec;border:1px solid #2e3540;border-radius:6px;padding:10px 12px;font:650 11px/1 Segoe UI,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;width:100%;margin-bottom:6px"> Bajar historial de la nube</button>'+
    '<button id="syncLogout" style="background:transparent;color:#d0655f;border:1px solid #5c3330;border-radius:6px;padding:8px 12px;font:600 10px/1 Segoe UI,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;width:100%">Salir</button>'+
    '<div id="syncMsg" style="color:#98a1ab;font-size:11px;margin-top:10px"></div>';
  document.getElementById('syncUp').onclick = uploadHistory;
  document.getElementById('syncDown').onclick = downloadHistory;
  document.getElementById('syncLogout').onclick = doLogout;
}

async function doLogin(){
  var email = document.getElementById('syncEmail').value.trim(), pass = document.getElementById('syncPass').value;
  if (!email || !pass){ alert('Faltan datos'); return; }
  var msg = document.getElementById('syncStatus'); msg.textContent = 'Entrando…';
  var r = await _sb.auth.signInWithPassword({email:email, password:pass});
  if (r.error){ msg.textContent = 'Error: '+r.error.message; return; }
  _user = r.data.user; await refreshPanel();
}
async function doLogout(){ await _sb.auth.signOut(); _user = null; await refreshPanel(); }

async function uploadHistory(){
  var msg = document.getElementById('syncMsg'); if (!msg) return;
  msg.textContent = 'Subiendo…'; msg.style.color = '#98a1ab';
  var keys = Object.keys(localStorage).filter(function(k){ return k.indexOf(HIST_PREFIX)===0; });
  var ok=0, err=0;
  for (var i=0;i<keys.length;i++){
    var k = keys[i], v = localStorage.getItem(k); if (!v) continue;
    try{
      var parts = k.split('|');
      var row = { user_id:_user.id, storage_key:k, serie:parts[1]||'', concepto:parts[2]||'', producto:parts[3]||'', payload:v, created_at:new Date().toISOString() };
      await _sb.from('pod_history').delete().eq('storage_key',k).eq('user_id',_user.id);
      var ins = await _sb.from('pod_history').insert(row);
      if (ins.error){ err++; } else { ok++; }
    }catch(e){ err++; }
  }
  msg.textContent = '✓ Subidos: '+ok+(err?' · Errores: '+err:'');
  msg.style.color = err ? '#d0655f' : '#4fae7b';
}

async function downloadHistory(){
  var msg = document.getElementById('syncMsg'); if (!msg) return;
  msg.textContent = 'Bajando…'; msg.style.color = '#98a1ab';
  var r = await _sb.from('pod_history').select('*').eq('user_id',_user.id).order('created_at',{ascending:false}).limit(500);
  if (r.error){ msg.textContent = 'Error: '+r.error.message; msg.style.color='#d0655f'; return; }
  var data = r.data||[], ok=0, skip=0;
  for (var i=0;i<data.length;i++){
    var row = data[i];
    if (localStorage.getItem(row.storage_key)){ skip++; continue; }
    localStorage.setItem(row.storage_key, row.payload); ok++;
  }
  msg.textContent = '✓ Bajados: '+ok+(skip?' · Ya existían: '+skip:'');
  msg.style.color = '#4fae7b';
}

/* Init */
function init(){
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(buildButton, 600); });
  else setTimeout(buildButton, 600);
}
init();
})();