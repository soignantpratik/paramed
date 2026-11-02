/**
 * PARAMED — moteur Google Sheet (Apps Script)
 * © Léa CAVADASKI — Soignant Pratik
 *
 * 1. Colle ce fichier dans Extensions > Apps Script (remplace tout).
 * 2. Choisis la fonction « setup » en haut, clique Exécuter, autorise l'accès.
 * 3. Déployer > Nouveau déploiement > Application Web
 *    Exécuter en tant que : Moi · Accès : Tout le monde → copie l'URL.
 */

const CONTACT = 'soignant.pratik@gmail.com';
const APP_URL = 'https://soignantpratik.github.io/paramed/';
const SESSION_DAYS = 60;

const SCHEMA = {
  Etablissement: ['cle', 'valeur'],
  Agents: ['id', 'nom', 'prenom', 'grade', 'quotite', 'email', 'hash', 'salt', 'admin', 'compte', 'notifModifs', 'notifEmail', 'tutoVu', 'cycleStart', 'cycleCodes', 'actif'],
  Codes: ['code', 'libelle', 'debut', 'fin', 'duree', 'compte', 'categorie', 'confirme'],
  Planning: ['agentId', 'date', 'code', 'note'],
  Demandes: ['id', 'type', 'from', 'to', 'd1', 'd2', 'code', 'du', 'au', 'status', 'createdAt', 'updatedAt'],
  Notifications: ['id', 'to', 'text', 'at', 'read'],
  Historique: ['at', 'agentId', 'date', 'avant', 'apres', 'prevenu', 'par'],
  Publications: ['mois', 'at', 'par'],
  Sessions: ['token', 'agentId', 'expires'],
  Bugs: ['at', 'agentId', 'message']
};

const DEFAULT_ETAB = {
  nom: 'CH Chartres', service: 'Médecine', uf: '7391',
  acces: 'CHARTRES-MED-7391', accesCadre: 'ADMIN-MED-' + Math.floor(1000 + Math.random() * 9000),
  minIDE: '4', minAS: '0', minRepos: '12', tol: '5'
};

const DEFAULT_CODES = [
  ['M10', 'Matin', '06:30', '16:30', 10, 'oui', 'matin', 'oui'],
  ['S1PO', 'Soir 1', '10:30', '20:30', 10, 'oui', 'soir', 'oui'],
  ['S2PO', 'Soir 2', '11:30', '21:30', 10, 'oui', 'soir', 'oui'],
  ['6J2J', 'Poste jour', '', '', 10, 'oui', 'jour', ''],
  ['2A9G', 'Poste jour', '', '', 10, 'oui', 'jour', ''],
  ['6G6G', 'Poste jour', '', '', 10, 'oui', 'jour', ''],
  ['P', 'Présence cadre', '', '', 7, 'oui', 'journee', ''],
  ['FORM', 'Formation', '', '', 7, 'oui', 'form', 'oui'],
  ['RH', 'Repos hebdomadaire', '', '', 0, '', 'repos', 'oui'],
  ['REC', 'Récupération (journée)', '', '', 0, '', 'recup', 'oui'],
  ['RECF', 'Récupération férié', '', '', 0, '', 'recup', 'oui'],
  ['CA', 'Congé annuel', '', '', 7, 'oui', 'conge', 'oui'],
  ['RTT', 'Réduction du temps de travail', '', '', 7, 'oui', 'conge', 'oui'],
  ['CHOS', 'À préciser', '', '', 7, 'oui', 'conge', ''],
  ['CF', 'À préciser', '', '', 7, 'oui', 'conge', ''],
  ['JS', 'À préciser', '', '', 7, 'oui', 'conge', '']
];

const SEED = {"agents":[{"id":"a0","nom":"ARCHAMBAULT","prenom":"Paul","grade":"IDE","quotite":100},{"id":"a1","nom":"BAZOGE","prenom":"Ilona","grade":"IDE","quotite":100},{"id":"a2","nom":"CHANTRIAUX","prenom":"Lydie","grade":"IDE","quotite":100},{"id":"a3","nom":"COUVERT","prenom":"Camille","grade":"CS","quotite":100},{"id":"a4","nom":"DOS SANTOS CUSTODIO","prenom":"Daniela","grade":"IDE","quotite":100},{"id":"a5","nom":"HAAS","prenom":"Marion","grade":"IDE","quotite":100},{"id":"a6","nom":"HERBE","prenom":"Candice","grade":"IDE","quotite":100},{"id":"a7","nom":"LERET","prenom":"Sandy","grade":"IDE","quotite":100},{"id":"a8","nom":"MAUROY","prenom":"Maelys","grade":"IDE","quotite":100},{"id":"a9","nom":"POIRIER","prenom":"Kimberley","grade":"IDE","quotite":100},{"id":"a10","nom":"CAVADASKI","prenom":"Léa","grade":"IDE","quotite":100}],"plan":{"a0":{"2026-10-01":"S2PO","2026-10-02":"S2PO","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"REC","2026-10-06":"REC","2026-10-07":"M10","2026-10-08":"RH","2026-10-09":"M10","2026-10-10":"S1PO","2026-10-11":"S1PO","2026-10-12":"RH","2026-10-13":"6G6G","2026-10-14":"6G6G","2026-10-15":"M10","2026-10-16":"M10","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"REC","2026-10-20":"REC","2026-10-21":"REC","2026-10-22":"S1PO","2026-10-23":"S2PO","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"REC","2026-10-27":"REC","2026-10-28":"S2PO","2026-10-29":"S2PO","2026-10-30":"S2PO","2026-10-31":"RH"},"a1":{"2026-10-01":"M10","2026-10-02":"M10","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"REC","2026-10-06":"M10","2026-10-07":"M10","2026-10-08":"M10","2026-10-09":"REC","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"S2PO","2026-10-13":"S2PO","2026-10-14":"S2PO","2026-10-15":"REC","2026-10-16":"RH","2026-10-17":"S1PO","2026-10-18":"S1PO","2026-10-19":"REC","2026-10-20":"RH","2026-10-21":"M10","2026-10-22":"M10","2026-10-23":"M10","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"REC","2026-10-27":"M10","2026-10-28":"M10","2026-10-29":"REC","2026-10-30":"RH","2026-10-31":"M10"},"a2":{"2026-10-01":"M10","2026-10-02":"REC","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"S2PO","2026-10-06":"S2PO","2026-10-07":"S2PO","2026-10-08":"REC","2026-10-09":"RH","2026-10-10":"M10","2026-10-11":"M10","2026-10-12":"M10","2026-10-13":"RH","2026-10-14":"REC","2026-10-15":"S2PO","2026-10-16":"S2PO","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"M10","2026-10-20":"M10","2026-10-21":"REC","2026-10-22":"RH","2026-10-23":"RECF","2026-10-24":"S2PO","2026-10-25":"S2PO","2026-10-26":"REC","2026-10-27":"RH","2026-10-28":"S1PO","2026-10-29":"S1PO","2026-10-30":"S1PO","2026-10-31":"RH"},"a3":{"2026-10-01":"P","2026-10-02":"P","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"P","2026-10-06":"P","2026-10-07":"P","2026-10-08":"P","2026-10-09":"P","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"P","2026-10-13":"P","2026-10-14":"P","2026-10-15":"P","2026-10-16":"P","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"RTT","2026-10-20":"RTT","2026-10-21":"CHOS","2026-10-22":"CHOS","2026-10-23":"CF","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"P","2026-10-27":"P","2026-10-28":"P","2026-10-29":"P","2026-10-30":"P","2026-10-31":"RH"},"a4":{"2026-10-01":"S1PO","2026-10-02":"S1PO","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"S1PO","2026-10-06":"M10","2026-10-07":"REC","2026-10-08":"RH","2026-10-09":"REC","2026-10-10":"S2PO","2026-10-11":"S2PO","2026-10-12":"RH","2026-10-13":"M10","2026-10-14":"M10","2026-10-15":"REC","2026-10-16":"M10","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"S1PO","2026-10-20":"FORM","2026-10-21":"REC","2026-10-22":"RECF","2026-10-23":"RH","2026-10-24":"M10","2026-10-25":"M10","2026-10-26":"M10","2026-10-27":"RH","2026-10-28":"REC","2026-10-29":"M10","2026-10-30":"M10","2026-10-31":"RH"},"a5":{"2026-10-01":"REC","2026-10-02":"RH","2026-10-03":"S1PO","2026-10-04":"S1PO","2026-10-05":"M10","2026-10-06":"RH","2026-10-07":"REC","2026-10-08":"S2PO","2026-10-09":"S2PO","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"FORM","2026-10-13":"FORM","2026-10-14":"REC","2026-10-15":"REC","2026-10-16":"RH","2026-10-17":"M10","2026-10-18":"M10","2026-10-19":"RH","2026-10-20":"CA","2026-10-21":"CA","2026-10-22":"CA","2026-10-23":"CA","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"M10","2026-10-27":"S1PO","2026-10-28":"REC","2026-10-29":"RH","2026-10-30":"REC","2026-10-31":"S2PO"},"a6":{"2026-10-01":"REC","2026-10-02":"RH","2026-10-03":"M10","2026-10-04":"M10","2026-10-05":"REC","2026-10-06":"RH","2026-10-07":"S1PO","2026-10-08":"S1PO","2026-10-09":"S1PO","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"REC","2026-10-13":"M10","2026-10-14":"M10","2026-10-15":"M10","2026-10-16":"REC","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"M10","2026-10-20":"M10","2026-10-21":"REC","2026-10-22":"RH","2026-10-23":"S1PO","2026-10-24":"S1PO","2026-10-25":"S1PO","2026-10-26":"RH","2026-10-27":"RECF","2026-10-28":"RECF","2026-10-29":"RECF","2026-10-30":"RECF","2026-10-31":"RH"},"a7":{"2026-10-01":"RH","2026-10-02":"REC","2026-10-03":"S2PO","2026-10-04":"S2PO","2026-10-05":"REC","2026-10-06":"RH","2026-10-07":"FORM","2026-10-08":"FORM","2026-10-09":"FORM","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"S1PO","2026-10-13":"S1PO","2026-10-14":"S1PO","2026-10-15":"REC","2026-10-16":"RH","2026-10-17":"S2PO","2026-10-18":"S2PO","2026-10-19":"REC","2026-10-20":"RH","2026-10-21":"M10","2026-10-22":"M10","2026-10-23":"M10","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"CA","2026-10-27":"CA","2026-10-28":"CA","2026-10-29":"CA","2026-10-30":"CA","2026-10-31":"RH"},"a8":{"2026-10-01":"REC","2026-10-02":"RH","2026-10-03":"M10","2026-10-04":"M10","2026-10-05":"FORM","2026-10-06":"FORM","2026-10-07":"FORM","2026-10-08":"JS","2026-10-09":"JS","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"CA","2026-10-13":"CA","2026-10-14":"CA","2026-10-15":"CA","2026-10-16":"CA","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"S1PO","2026-10-20":"S1PO","2026-10-21":"S1PO","2026-10-22":"REC","2026-10-23":"RH","2026-10-24":"M10","2026-10-25":"M10","2026-10-26":"M10","2026-10-27":"REC","2026-10-28":"RH","2026-10-29":"M10","2026-10-30":"M10","2026-10-31":"RH"},"a9":{"2026-10-01":"REC","2026-10-02":"M10","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"M10","2026-10-06":"S1PO","2026-10-07":"REC","2026-10-08":"M10","2026-10-09":"M10","2026-10-10":"RH","2026-10-11":"RH","2026-10-12":"FORM","2026-10-13":"FORM","2026-10-14":"FORM","2026-10-15":"REC","2026-10-16":"RH","2026-10-17":"M10","2026-10-18":"M10","2026-10-19":"CA","2026-10-20":"RH","2026-10-21":"CA","2026-10-22":"CA","2026-10-23":"CA","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"S2PO","2026-10-27":"S2PO","2026-10-28":"REC","2026-10-29":"RH","2026-10-30":"REC","2026-10-31":"S2PO"},"a10":{"2026-10-01":"M10","2026-10-02":"M10","2026-10-03":"RH","2026-10-04":"RH","2026-10-05":"S1PO","2026-10-06":"S2PO","2026-10-07":"REC","2026-10-08":"REC","2026-10-09":"RH","2026-10-10":"M10","2026-10-11":"M10","2026-10-12":"M10","2026-10-13":"RH","2026-10-14":"REC","2026-10-15":"S1PO","2026-10-16":"S1PO","2026-10-17":"RH","2026-10-18":"RH","2026-10-19":"REC","2026-10-20":"S2PO","2026-10-21":"S2PO","2026-10-22":"S2PO","2026-10-23":"REC","2026-10-24":"RH","2026-10-25":"RH","2026-10-26":"REC","2026-10-27":"M10","2026-10-28":"M10","2026-10-29":"REC","2026-10-30":"RH","2026-10-31":"M10"}}}
;
const SEED_NOTES = { a0: { '2026-10-13': 'Renfort en rhumato', '2026-10-14': 'Renfort en rhumato' },
  a10: { '2026-10-01': 'Doublure avec Lydie', '2026-10-02': 'Doublure avec Kimberley', '2026-10-05': 'Doublure avec Daniela', '2026-10-06': 'Doublure avec Lydie' } };

const WORKED = ['matin', 'soir', 'jour', 'nuit', 'journee', 'form'];

/* ================= Installation ================= */
function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const h = SCHEMA[name];
    sh.getRange(1, 1, sh.getMaxRows(), Math.max(h.length, sh.getMaxColumns())).setNumberFormat('@');
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#2F547F').setFontColor('#FBF3EA');
    sh.setFrozenRows(1);
  });
  const def = ss.getSheetByName('Feuille 1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

  const et = T('Etablissement');
  if (!et.rows.length) Object.keys(DEFAULT_ETAB).forEach(k => et.rows.push({ cle: k, valeur: DEFAULT_ETAB[k] }));
  writeAll(et);

  const co = T('Codes');
  if (!co.rows.length) DEFAULT_CODES.forEach(c => co.rows.push(obj(SCHEMA.Codes, c)));
  writeAll(co);

  const ag = T('Agents');
  if (!ag.rows.length) {
    SEED.agents.forEach(a => {
      let cycleCodes = '';
      if (a.grade === 'IDE') {
        const codes = [];
        for (let i = 0; i < 14; i++) codes.push(SEED.plan[a.id][ymd(new Date(2026, 9, 5 + i))] || 'RH');
        cycleCodes = codes.join(' ');
      }
      ag.rows.push({ id: a.id, nom: a.nom, prenom: a.prenom, grade: a.grade, quotite: String(a.quotite), email: '', hash: '', salt: '',
        admin: '', compte: '', notifModifs: 'oui', notifEmail: 'oui', tutoVu: '', cycleStart: cycleCodes ? '2026-10-05' : '', cycleCodes, actif: 'oui' });
    });
    writeAll(ag);
    const pl = T('Planning');
    SEED.agents.forEach(a => Object.keys(SEED.plan[a.id]).forEach(d =>
      pl.rows.push({ agentId: a.id, date: d, code: SEED.plan[a.id][d], note: (SEED_NOTES[a.id] || {})[d] || '' })));
    writeAll(pl);
    const pu = T('Publications'); pu.rows.push({ mois: '2026-10', at: '28/08/2026 à 17:42', par: 'import' }); writeAll(pu);
  }
  const e = etab();
  Logger.log('PARAMED prêt. Code agents : ' + e.acces + ' · Code admin : ' + e.accesCadre);
}

/* ================= Entrées web ================= */
function doGet() {
  return ContentService.createTextOutput('PARAMED fonctionne.');
}
function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents || '{}');
    out = route(req);
    out.ok = true;
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function route(req) {
  const a = req.action;
  if (a === 'login') return login(req);
  if (a === 'register') return locked(() => register(req));
  if (a === 'etabPublic') { const e = etab(); return { etab: { nom: e.nom, service: e.service } }; }
  const me = auth(req.token);
  switch (a) {
    case 'state': return state(me);
    case 'logout': return locked(() => { const s = T('Sessions'); s.rows = s.rows.filter(r => r.token !== req.token); writeAll(s); return {}; });
    case 'updateMe': return locked(() => updateMe(me, req));
    case 'markRead': return locked(() => markRead(me));
    case 'createRequest': return locked(() => createRequest(me, req));
    case 'answerRequest': return locked(() => answerRequest(me, req));
    case 'reportBug': return reportBug(me, req);
  }
  if (!isAdmin(me)) throw new Error('Action réservée aux admins.');
  switch (a) {
    case 'setCells': return locked(() => setCells(me, req.changes || []));
    case 'publish': return locked(() => publish(me, req.mois));
    case 'decideRequest': return locked(() => decideRequest(me, req));
    case 'saveEtab': return locked(() => saveEtab(req.etab || {}));
    case 'saveCodes': return locked(() => saveCodes(req.codes || []));
    case 'saveAgent': return locked(() => saveAgent(req.agent || {}));
    case 'addAgent': return locked(() => addAgent(req));
  }
  throw new Error('Action inconnue : ' + a);
}

/* ================= Comptes ================= */
function register(req) {
  const e = etab();
  const code = String(req.code || '').trim().toUpperCase();
  const asAdmin = code === String(e.accesCadre).toUpperCase();
  if (!asAdmin && code !== String(e.acces).toUpperCase()) throw new Error('Code du service incorrect. Demande-le à ta cadre.');
  const email = String(req.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Adresse e-mail invalide.');
  if (String(req.password || '').length < 6) throw new Error('Mot de passe trop court (6 caractères minimum).');
  const ag = T('Agents');
  if (ag.rows.some(r => String(r.email).toLowerCase() === email)) throw new Error('Un compte existe déjà avec cet e-mail.');
  const nom = String(req.nom || '').trim().toUpperCase(), prenom = String(req.prenom || '').trim();
  let a = ag.rows.find(r => norm(r.nom) === norm(nom) && norm(r.prenom) === norm(prenom) && !b(r.compte));
  if (!a) {
    a = { id: nextId(ag.rows, 'a'), nom, prenom, grade: req.grade || 'IDE', quotite: '100', notifModifs: 'oui', notifEmail: 'oui', actif: 'oui' };
    ag.rows.push(a);
  }
  a.salt = Utilities.getUuid();
  a.hash = hash(req.password, a.salt);
  a.email = email; a.compte = 'oui'; a.tutoVu = '';
  if (asAdmin) a.admin = 'oui';
  writeAll(ag);
  notify('cadre', `${a.prenom} ${a.nom} a créé son compte${asAdmin ? ' (admin)' : ''}.`, false);
  return { token: newSession(a.id), ...state(a) };
}

function login(req) {
  const email = String(req.email || '').trim().toLowerCase();
  const a = T('Agents').rows.find(r => String(r.email).toLowerCase() === email && b(r.compte));
  if (!a || hash(req.password, a.salt) !== a.hash) throw new Error('E-mail ou mot de passe incorrect.');
  return locked(() => ({ token: newSession(a.id), ...state(a) }));
}

function newSession(agentId) {
  const s = T('Sessions');
  const now = Date.now();
  s.rows = s.rows.filter(r => Number(r.expires) > now);
  const token = Utilities.getUuid() + Utilities.getUuid();
  s.rows.push({ token, agentId, expires: String(now + SESSION_DAYS * 864e5) });
  writeAll(s);
  return token;
}

function auth(token) {
  if (!token) throw new Error('Connexion requise.');
  const s = T('Sessions').rows.find(r => r.token === token && Number(r.expires) > Date.now());
  if (!s) throw new Error('Session expirée, reconnecte-toi.');
  const a = T('Agents').rows.find(r => r.id === s.agentId);
  if (!a) throw new Error('Compte introuvable.');
  return a;
}

function updateMe(me, req) {
  const ag = T('Agents'); const a = ag.rows.find(r => r.id === me.id);
  if (req.email) {
    const email = String(req.email).trim().toLowerCase();
    if (ag.rows.some(r => r.id !== a.id && String(r.email).toLowerCase() === email)) throw new Error('Cet e-mail est déjà utilisé.');
    a.email = email;
  }
  if (req.password) {
    if (String(req.password).length < 6) throw new Error('Mot de passe trop court.');
    a.salt = Utilities.getUuid(); a.hash = hash(req.password, a.salt);
  }
  ['notifModifs', 'notifEmail', 'tutoVu'].forEach(k => { if (k in req) a[k] = req[k] ? 'oui' : ''; });
  writeAll(ag);
  return state(a);
}

/* ================= État envoyé à l'app ================= */
function state(me) {
  const admin = isAdmin(me);
  const e = etab();
  if (!admin) delete e.accesCadre;
  const agents = T('Agents').rows.filter(r => b(r.actif)).map(r => ({
    id: r.id, nom: r.nom, prenom: r.prenom, grade: r.grade, quotite: Number(r.quotite) || 100,
    admin: b(r.admin), compte: b(r.compte),
    email: (admin || r.id === me.id) ? r.email : '',
    cycle: r.cycleCodes ? { start: r.cycleStart, codes: String(r.cycleCodes).split(/\s+/).filter(String) } : null,
    notif: r.id === me.id ? { modifs: b(r.notifModifs), email: b(r.notifEmail) } : undefined,
    tutoVu: r.id === me.id ? b(r.tutoVu) : undefined
  }));
  const codes = T('Codes').rows.map(c => ({ c: c.code, lib: c.libelle, deb: c.debut, fin: c.fin, dur: Number(c.duree) || 0,
    compte: b(c.compte), cat: c.categorie, conf: b(c.confirme) }));
  const plan = {}, notes = {};
  const from = ymd(new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1));
  T('Planning').rows.forEach(p => {
    if (p.date < from) return;
    (plan[p.agentId] = plan[p.agentId] || {})[p.date] = p.code;
    if (p.note) (notes[p.agentId] = notes[p.agentId] || {})[p.date] = p.note;
  });
  const requests = T('Demandes').rows
    .filter(r => admin || r.from === me.id || r.to === me.id)
    .map(r => ({ id: r.id, type: r.type, from: r.from, to: r.to, d1: r.d1, d2: r.d2, code: r.code, du: r.du, au: r.au, status: r.status, at: r.createdAt }));
  const notifs = T('Notifications').rows
    .filter(n => n.to === me.id || (admin && n.to === 'cadre'))
    .slice(-60).reverse()
    .map(n => ({ id: n.id, to: n.to, text: n.text, at: n.at, read: b(n.read) }));
  const published = {};
  T('Publications').rows.forEach(p => published[p.mois] = p.at);
  const history = admin ? T('Historique').rows.slice(-200).reverse()
    .map(h => ({ at: h.at, aid: h.agentId, k: h.date, from: h.avant || null, to: h.apres || null, notif: b(h.prevenu) })) : [];
  return {
    me: me.id, admin,
    etab: { nom: e.nom, service: e.service, uf: e.uf, acces: e.acces, accesCadre: e.accesCadre },
    mins: { IDE: Number(e.minIDE) || 0, AS: Number(e.minAS) || 0 }, minRepos: Number(e.minRepos) || 12, tol: Number(e.tol) || 5,
    agents, codes, plan, notes, requests, notifs, published, history, contact: CONTACT
  };
}

/* ================= Planning ================= */
function setCells(me, changes) {
  const pl = T('Planning'); const ag = T('Agents').rows;
  const idx = {}; pl.rows.forEach((r, i) => idx[r.agentId + '|' + r.date] = i);
  const pubs = {}; T('Publications').rows.forEach(p => pubs[p.mois] = true);
  const hist = T('Historique');
  const toNotify = {};
  changes.forEach(c => {
    const key = c.aid + '|' + c.date; const i = idx[key];
    const old = i !== undefined ? pl.rows[i].code : '';
    const code = c.code || '';
    if (i !== undefined) { pl.rows[i].code = code; if ('note' in c) pl.rows[i].note = c.note || ''; }
    else if (code || c.note) { pl.rows.push({ agentId: c.aid, date: c.date, code, note: c.note || '' }); idx[key] = pl.rows.length - 1; }
    if (pubs[c.date.slice(0, 7)] && old !== code) {
      const a = ag.find(r => r.id === c.aid); const on = a && b(a.notifModifs);
      hist.rows.push({ at: now(), agentId: c.aid, date: c.date, avant: old, apres: code, prevenu: on ? 'oui' : '', par: me.prenom + ' ' + me.nom });
      if (on) (toNotify[c.aid] = toNotify[c.aid] || []).push(`${fr(c.date)} : ${old || '—'} → ${code || '—'}`);
    }
  });
  pl.rows = pl.rows.filter(r => r.code || r.note);
  writeAll(pl); writeAll(hist);
  Object.keys(toNotify).forEach(aid => notify(aid, 'Ton planning a changé : ' + toNotify[aid].join(' · '), true));
  return state(me);
}

function publish(me, mois) {
  const pu = T('Publications'); const at = nowFr();
  const r = pu.rows.find(p => p.mois === mois);
  if (r) { r.at = at; r.par = me.prenom + ' ' + me.nom; } else pu.rows.push({ mois, at, par: me.prenom + ' ' + me.nom });
  writeAll(pu);
  const [y, m] = mois.split('-').map(Number);
  const label = Utilities.formatDate(new Date(y, m - 1, 1), Session.getScriptTimeZone(), 'MMMM yyyy');
  T('Agents').rows.filter(a => b(a.actif) && b(a.compte)).forEach(a => notify(a.id, `Le planning de ${label} est en ligne.`, true));
  return state(me);
}

/* ================= Demandes ================= */
function createRequest(me, req) {
  const d = T('Demandes');
  const r = { id: nextId(d.rows, 'r'), type: req.type, from: me.id, to: req.to || '', d1: req.d1 || '', d2: req.d2 || '', code: req.code || '',
    du: req.du || '', au: req.au || '', status: req.type === 'echange' ? 'attente-collegue' : 'attente-cadre', createdAt: now(), updatedAt: now() };
  if (r.type === 'echange' && !r.to) throw new Error('Choisis un collègue.');
  if (r.type === 'conge' && (!r.du || !r.au || r.au < r.du)) throw new Error('Dates de congé invalides.');
  d.rows.push(r); writeAll(d);
  if (r.type === 'echange') notify(r.to, `${me.prenom} ${me.nom} te propose un échange : son ${fr(r.d1)} contre ton ${fr(r.d2)}.`, true);
  else notify('cadre', `${me.prenom} ${me.nom} demande un congé (${r.code}) du ${fr(r.du)} au ${fr(r.au)}.`, true);
  return state(me);
}

function answerRequest(me, req) {
  const d = T('Demandes'); const r = d.rows.find(x => x.id === req.id);
  if (!r || r.to !== me.id || r.status !== 'attente-collegue') throw new Error('Demande introuvable.');
  r.status = req.accept ? 'attente-cadre' : 'refusee'; r.updatedAt = now(); writeAll(d);
  const from = agentById(r.from);
  if (req.accept) {
    notify('cadre', `Échange ${from.prenom} ↔ ${me.prenom} accepté par les deux agents, à valider.`, true);
    notify(r.from, `${me.prenom} a accepté ton échange. En attente de la cadre.`, true);
  } else notify(r.from, `${me.prenom} a refusé ton échange du ${fr(r.d1)}.`, true);
  return state(me);
}

function decideRequest(me, req) {
  const d = T('Demandes'); const r = d.rows.find(x => x.id === req.id);
  if (!r || r.status !== 'attente-cadre') throw new Error('Demande introuvable.');
  r.status = req.accept ? 'validee' : 'refusee'; r.updatedAt = now(); writeAll(d);
  if (req.accept) applyRequest(r);
  const kind = r.type === 'echange' ? 'échange' : 'congés';
  notify(r.from, `Ta demande (${kind}) est ${req.accept ? 'validée' : 'refusée'}.`, true);
  if (r.to) notify(r.to, `L'échange avec ${agentById(r.from).prenom} est ${req.accept ? 'validé' : 'refusé'}.`, true);
  return state(me);
}

function applyRequest(r) {
  const cats = {}; T('Codes').rows.forEach(c => cats[c.code] = c.categorie);
  const off = c => !!c && !WORKED.includes(cats[c]);
  const worked = c => !!c && WORKED.includes(cats[c]);
  const pl = T('Planning'); const idx = {}; pl.rows.forEach((x, i) => idx[x.agentId + '|' + x.date] = i);
  const get = (a, k) => { const i = idx[a + '|' + k]; return i === undefined ? '' : pl.rows[i].code; };
  const set = (a, k, c) => { const i = idx[a + '|' + k]; if (i === undefined) { pl.rows.push({ agentId: a, date: k, code: c, note: '' }); idx[a + '|' + k] = pl.rows.length - 1; } else pl.rows[i].code = c; };
  if (r.type === 'echange') {
    const a = get(r.from, r.d1), bb = get(r.to, r.d2);
    if (r.d1 === r.d2) { set(r.from, r.d1, bb); set(r.to, r.d2, a); }
    else {
      const aOther = get(r.from, r.d2), bOther = get(r.to, r.d1);
      set(r.from, r.d2, bb); set(r.from, r.d1, off(bOther) ? bOther : 'RH');
      set(r.to, r.d1, a); set(r.to, r.d2, off(aOther) ? aOther : 'RH');
    }
  } else {
    let dt = parse(r.du); const end = parse(r.au);
    while (dt <= end) { const k = ymd(dt); const cur = get(r.from, k); if (!cur || worked(cur)) set(r.from, k, r.code); dt.setDate(dt.getDate() + 1); }
  }
  writeAll(pl);
}

/* ================= Réglages (cadre) ================= */
function saveEtab(v) {
  const et = T('Etablissement');
  ['nom', 'service', 'uf', 'acces', 'accesCadre', 'minIDE', 'minAS', 'minRepos', 'tol'].forEach(k => {
    if (!(k in v)) return;
    const r = et.rows.find(x => x.cle === k);
    if (r) r.valeur = String(v[k]); else et.rows.push({ cle: k, valeur: String(v[k]) });
  });
  writeAll(et); return {};
}
function saveCodes(codes) {
  const co = T('Codes');
  co.rows = codes.filter(c => c.c).map(c => ({ code: String(c.c).toUpperCase(), libelle: c.lib || '', debut: c.deb || '', fin: c.fin || '',
    duree: String(Number(c.dur) || 0), compte: c.compte ? 'oui' : '', categorie: c.cat || 'repos', confirme: c.conf ? 'oui' : '' }));
  writeAll(co); return {};
}
function saveAgent(v) {
  const ag = T('Agents'); const a = ag.rows.find(r => r.id === v.id);
  if (!a) throw new Error('Agent introuvable.');
  if ('grade' in v) a.grade = v.grade;
  if ('quotite' in v) a.quotite = String(v.quotite);
  if ('admin' in v) a.admin = v.admin ? 'oui' : '';
  if ('actif' in v) a.actif = v.actif ? 'oui' : '';
  if ('cycle' in v) { a.cycleStart = v.cycle ? v.cycle.start : ''; a.cycleCodes = v.cycle ? v.cycle.codes.join(' ') : ''; }
  writeAll(ag); return {};
}
function addAgent(v) {
  const ag = T('Agents');
  ag.rows.push({ id: nextId(ag.rows, 'a'), nom: String(v.nom || '').trim().toUpperCase(), prenom: String(v.prenom || '').trim(), grade: v.grade || 'IDE',
    quotite: '100', notifModifs: 'oui', notifEmail: 'oui', actif: 'oui' });
  writeAll(ag); return {};
}

/* ================= Notifications & bugs ================= */
function notify(to, text, withMail) {
  const n = T('Notifications');
  n.rows.push({ id: 'n' + Date.now() + Math.floor(Math.random() * 1000), to, text, at: now(), read: '' });
  if (n.rows.length > 3000) n.rows = n.rows.slice(-2000);
  writeAll(n);
  if (!withMail) return;
  const targets = to === 'cadre' ? T('Agents').rows.filter(a => b(a.admin)) : T('Agents').rows.filter(a => a.id === to);
  targets.filter(a => a.email && b(a.notifEmail)).forEach(a => {
    try {
      const title = mailTitle(text);
      MailApp.sendEmail({ to: a.email, subject: title + ' · PARAMED', name: 'Soignant Pratik', replyTo: CONTACT,
        body: `Bonjour ${a.prenom},\n\n${text}\n\n${APP_URL ? 'Ouvrir PARAMED : ' + APP_URL + '\n\n' : ''}Tu peux couper ces e-mails dans Réglages.\n— Soignant Pratik`,
        htmlBody: mailHtml(a.prenom, title, text) });
    } catch (e) { /* quota e-mail atteint : la notification reste dans l'app */ }
  });
}
function mailTitle(t) {
  if (/a changé/.test(t)) return 'Ton planning a changé';
  if (/est en ligne/.test(t)) return 'Nouveau planning en ligne';
  if (/te propose un échange/.test(t)) return 'Proposition d’échange';
  if (/accepté par les deux/.test(t)) return 'Échange à valider';
  if (/a accepté ton échange/.test(t)) return 'Échange accepté';
  if (/refusé/.test(t)) return 'Demande refusée';
  if (/validé/.test(t)) return 'Demande validée';
  if (/demande un congé/.test(t)) return 'Nouvelle demande de congé';
  if (/créé son compte/.test(t)) return 'Nouveau compte';
  return 'Nouvelle notification';
}
function htmlEsc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function mailHtml(prenom, title, text) {
  const F = "font-family:Arial,Helvetica,sans-serif;";
  const logo = APP_URL ? `<img src="${APP_URL}icons/icon-192.png" width="44" height="44" alt="" style="display:block;border:0;border-radius:12px">` : '';
  const btn = APP_URL ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:#2F547F;border-radius:999px"><a href="${APP_URL}" style="${F}display:inline-block;padding:13px 28px;color:#FBF3EA;font-size:15px;font-weight:bold;text-decoration:none;border-radius:999px">Ouvrir PARAMED</a></td></tr></table>` : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF3EA">
<div style="display:none;max-height:0;overflow:hidden">${htmlEsc(text)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF3EA"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 6px 18px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px">${logo}</td>
<td style="${F}"><div style="font-size:22px;font-weight:900;letter-spacing:2px;color:#2F547F;line-height:1">PARAMED</div><div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#B8653F;margin-top:3px">by Soignant Pratik</div></td>
</tr></table></td></tr>
<tr><td style="background:#FFFDF9;border:1px solid #EAD9C9;border-radius:20px;padding:30px 28px">
<div style="font-family:Georgia,serif;font-style:italic;font-size:17px;color:#B8653F;margin:0 0 6px">bonjour ${htmlEsc(prenom)},</div>
<div style="${F}font-size:24px;font-weight:900;color:#2F547F;line-height:1.2;margin:0 0 14px">${htmlEsc(title)}</div>
<div style="width:48px;height:4px;border-radius:2px;background:#EBAC8D;margin:0 0 18px"></div>
<div style="${F}font-size:15px;line-height:1.55;color:#22344F">${htmlEsc(text.replace(/^Ton planning a changé : /, 'Modification : '))}</div>
${btn}
</td></tr>
<tr><td style="${F}padding:20px 10px 0;font-size:12px;line-height:1.6;color:#6C778A;text-align:center">
Tu reçois cet e-mail car les notifications sont activées dans PARAMED.<br>Tu peux les couper dans <b>Réglages</b>.<br><br>
Une question ? <a href="mailto:${CONTACT}" style="color:#B8653F">${CONTACT}</a><br>
<span style="color:#9AA3B2">© Léa CAVADASKI — Soignant Pratik</span>
</td></tr></table></td></tr></table></body></html>`;
}
function markRead(me) {
  const n = T('Notifications'); const admin = isAdmin(me);
  n.rows.forEach(x => { if (x.to === me.id || (admin && x.to === 'cadre')) x.read = 'oui'; });
  writeAll(n); return {};
}
function reportBug(me, req) {
  const msg = String(req.message || '').slice(0, 3000);
  if (!msg.trim()) throw new Error('Décris le problème.');
  const bg = T('Bugs'); bg.rows.push({ at: now(), agentId: me.id, message: msg }); writeAll(bg);
  try { MailApp.sendEmail({ to: CONTACT, subject: 'PARAMED · bug signalé par ' + me.prenom + ' ' + me.nom, body: msg + '\n\nE-mail : ' + me.email, name: 'Soignant Pratik', replyTo: me.email || CONTACT }); } catch (e) {}
  return {};
}

/* ================= Outils ================= */
function T(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name + '. Lance « setup ».');
  const h = SCHEMA[name];
  const last = sh.getLastRow();
  const vals = last > 1 ? sh.getRange(2, 1, last - 1, h.length).getDisplayValues() : [];
  return { sh, h, rows: vals.filter(r => r.some(String)).map(r => obj(h, r)) };
}
function writeAll(t) {
  const last = t.sh.getLastRow();
  if (last > 1) t.sh.getRange(2, 1, last - 1, t.h.length).clearContent();
  if (t.rows.length) t.sh.getRange(2, 1, t.rows.length, t.h.length).setValues(t.rows.map(r => t.h.map(k => r[k] === undefined || r[k] === null ? '' : String(r[k]))));
}
function nextId(rows, prefix) {
  const re = new RegExp('^' + prefix + '(\\d{1,6})$');
  const max = rows.reduce((m, r) => { const x = re.exec(r.id); return x ? Math.max(m, Number(x[1])) : m; }, -1);
  return prefix + (max + 1);
}
function obj(h, arr) { const o = {}; h.forEach((k, i) => o[k] = arr[i] === undefined ? '' : String(arr[i])); return o; }
function etab() { const o = {}; T('Etablissement').rows.forEach(r => o[r.cle] = r.valeur); return o; }
function agentById(id) { return T('Agents').rows.find(r => r.id === id) || { prenom: '?', nom: '' }; }
function isAdmin(a) { return b(a.admin); }
function b(x) { return x === true || x === 'oui' || x === 'TRUE' || x === 'true' || x === '1'; }
function norm(s) { return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function hash(pw, salt) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pw, Utilities.Charset.UTF_8)); }
function locked(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }
function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parse(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function fr(k) { if (!k) return ''; const d = parse(k); return ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][d.getDay()] + ' ' + d.getDate() + '/' + pad(d.getMonth() + 1); }
function now() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm"); }
function nowFr() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy 'à' HH:mm"); }
