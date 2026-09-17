const STATUS_META = {
  untouched:{label:'Untouched', color:'var(--untouched)'},
  dataset_only:{label:'Dataset only', color:'var(--dataset)'},
  benchmark_only:{label:'Benchmark only', color:'var(--benchmark)'},
  covered:{label:'Covered', color:'var(--covered)'},
};

let LANGUAGES=[], COUNTRIES=[], TASKS=[], RESOURCES=[], MATRIX=[], COMMUNITY_TAGS=[];

// Every primary/community category works the same way: an empty set means
// "no restriction from this label", a non-empty set means "row must match
// one of these selected values" (OR within a category, AND across categories).
const state = {
  search:'',
  status:new Set(), task:new Set(), country:new Set(), endangerment:new Set(),
  community:new Set(),
  mapVisible:true,
};

// Reads the labels.primary structure from data.json
function buildMatrix(){
  const rows = [];
  for(const lang of LANGUAGES){
    for(const task of TASKS){
      const matches = RESOURCES.filter(r =>
        r.labels.primary.task === task && r.labels.primary.language.includes(lang.id)
      );
      let status = 'untouched';
      if(matches.some(r=>r.labels.primary.status==='covered')) status='covered';
      else if(matches.some(r=>r.labels.primary.status==='benchmark_only')) status='benchmark_only';
      else if(matches.some(r=>r.labels.primary.status==='dataset_only')) status='dataset_only';
      rows.push({lang, task, status, resources: matches});
    }
  }
  return rows;
}

function filteredRows(){
  const q = state.search.trim().toLowerCase();
  return MATRIX.filter(r=>{
    if(state.status.size && !state.status.has(r.status)) return false;
    if(state.task.size && !state.task.has(r.task)) return false;
    if(state.country.size && !state.country.has(r.lang.country)) return false;
    if(state.endangerment.size && !state.endangerment.has(r.lang.endangerment)) return false;
    if(state.community.size){
      const tags = r.resources.flatMap(res=>res.labels.community||[]);
      if(!tags.some(t=>state.community.has(t))) return false;
    }
    if(q){
      const hay = (r.lang.name+' '+r.lang.country+' '+r.task+' '+r.resources.map(x=>x.name).join(' ')).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---- generic chip group renderer (used for status / task / country / endangerment) ----
function renderChipGroup(containerId, values, selectedSet, opts={}){
  const el = document.getElementById(containerId);
  el.innerHTML='';
  for(const val of values){
    const on = selectedSet.has(val);
    const chip = document.createElement('div');
    chip.className = 'chip'+(on?' on':'');
    const dot = opts.color ? `<span class="dot" style="background:${opts.color(val)}"></span>` : '';
    const label = opts.label ? opts.label(val) : val;
    const count = opts.count ? `<span class="count">${opts.count(val)}</span>` : '';
    chip.innerHTML = `${dot}${label}${count}`;
    chip.onclick = ()=>{
      if(selectedSet.has(val)) selectedSet.delete(val); else selectedSet.add(val);
      renderAll();
    };
    el.appendChild(chip);
  }
}

function renderCommunityCloud(){
  const el = document.getElementById('communityChips');
  el.innerHTML='';
  if(COMMUNITY_TAGS.length===0){
    el.innerHTML = `<div class="tag empty">No community labels yet</div>`;
    return;
  }
  for(const tag of COMMUNITY_TAGS){
    const on = state.community.has(tag);
    const chip = document.createElement('div');
    chip.className = 'tag'+(on?' on':'');
    chip.textContent = tag;
    chip.onclick = ()=>{
      if(state.community.has(tag)) state.community.delete(tag); else state.community.add(tag);
      renderAll();
    };
    el.appendChild(chip);
  }
}

function renderSidebar(){
  const counts = {};
  for(const k in STATUS_META) counts[k]=0;
  for(const r of MATRIX) counts[r.status]++;

  renderChipGroup('statusChips', Object.keys(STATUS_META), state.status, {
    color:key=>STATUS_META[key].color, label:key=>STATUS_META[key].label, count:key=>counts[key],
  });
  renderChipGroup('taskChips', TASKS, state.task, {});
  renderChipGroup('countryChips', COUNTRIES.map(c=>c.name), state.country, {});
  renderChipGroup('endChips', ['stable','vulnerable'], state.endangerment, {
    label:v=>v==='stable'?'Stable':'Vulnerable',
  });
  renderCommunityCloud();
}

function wireControls(){
  document.getElementById('search').oninput = (e)=>{ state.search=e.target.value; renderAll(); };
  document.getElementById('resetBtn').onclick = ()=>{
    state.search='';
    state.status=new Set(); state.task=new Set(); state.country=new Set();
    state.endangerment=new Set(); state.community=new Set();
    document.getElementById('search').value='';
    renderAll();
  };
  document.getElementById('btnMap').onclick = ()=>{ state.mapVisible=true; syncToggle(); renderAll(); };
  document.getElementById('btnList').onclick = ()=>{ state.mapVisible=false; syncToggle(); renderAll(); };
}
function syncToggle(){
  document.getElementById('btnMap').classList.toggle('active', state.mapVisible);
  document.getElementById('btnList').classList.toggle('active', !state.mapVisible);
  document.getElementById('mapwrap').style.display = state.mapVisible ? '' : 'none';
}

const lonMin=-20, lonMax=52, latMin=-35, latMax=40, W=500,H=500,M=30;
function project(lat,lon){
  const x = M + (lon-lonMin)/(lonMax-lonMin) * (W-2*M);
  const y = M + (latMax-lat)/(latMax-latMin) * (H-2*M);
  return [x,y];
}

function renderMap(){
  const svg = document.getElementById('africaMap');
  svg.innerHTML='';
  const rows = filteredRows();
  for(const c of COUNTRIES){
    const [x,y] = project(c.lat, c.lon);
    const countryRows = rows.filter(r=>r.lang.country===c.name);
    const allCountryRows = MATRIX.filter(r=>r.lang.country===c.name);
    const covered = countryRows.filter(r=>r.status!=='untouched').length;
    const ratio = allCountryRows.length ? covered/allCountryRows.length : 0;
    let fill = 'var(--untouched)';
    if(ratio>=0.6) fill='var(--covered)';
    else if(ratio>=0.25) fill='var(--dataset)';
    const langCount = LANGUAGES.filter(l=>l.country===c.name).length;
    const r = 10 + langCount*2;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','marker'+(state.country.has(c.name)?' selected':''));
    g.innerHTML = `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"></circle>
      <text x="${x}" y="${y+r+13}" text-anchor="middle">${c.name}</text>
      <text x="${x}" y="${y+4}" text-anchor="middle" fill="#fff" font-size="10">${countryRows.length}</text>`;
    g.onclick = ()=>{
      if(state.country.has(c.name)) state.country.delete(c.name); else state.country.add(c.name);
      renderAll();
    };
    svg.appendChild(g);
  }
}

function renderResults(){
  const rows = filteredRows();
  document.getElementById('resultCount').textContent = `${rows.length} of ${MATRIX.length} language × task pairs shown`;
  const area = document.getElementById('resultsArea');
  if(rows.length===0){
    area.innerHTML = `<div class="empty">No matches — try widening your filters.</div>`;
    return;
  }
  const rowsHtml = rows.map(r=>{
    const meta = STATUS_META[r.status];
    const links = r.resources.length
      ? r.resources.map(res=>{
          const url = Object.values(res.refer_to)[0];
          return `<a class="rlink" href="${url}" target="_blank" rel="noopener">${res.name} ↗</a>`;
        }).join('<br>')
      : '<span style="color:var(--ink-soft)">—</span>';
    return `<tr>
      <td data-label="Language">${r.lang.name}</td>
      <td data-label="Country">${r.lang.country}</td>
      <td data-label="Task">${r.task}</td>
      <td data-label="Status"><span class="badge status"><span class="dot" style="background:${meta.color}"></span>${meta.label}</span></td>
      <td data-label="Endangerment">${r.lang.endangerment==='vulnerable' ? '<span class="badge" style="background:var(--accent-soft)">Vulnerable</span>' : 'Stable'}</td>
      <td data-label="Resource">${links}</td>
    </tr>`;
  }).join('');
  area.innerHTML = `<table>
    <thead><tr><th>Language</th><th>Country</th><th>Task</th><th>Status</th><th>Endangerment</th><th>Resource</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>`;
}

function renderAll(){
  renderSidebar();
  if(state.mapVisible) renderMap();
  renderResults();
}

async function init(){
  try{
    const res = await fetch('./data/database.json');
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    LANGUAGES = data.languages; COUNTRIES = data.countries; TASKS = data.tasks; RESOURCES = data.resources;
    MATRIX = buildMatrix();
    COMMUNITY_TAGS = [...new Set(RESOURCES.flatMap(r=>r.labels.community||[]))].sort();
    wireControls();
    syncToggle();
    renderAll();
  }catch(err){
    document.getElementById('resultsArea').innerHTML =
      `<div class="empty">Couldn't load data.json (${err.message}). If you're opening this file directly (file://), browsers block local fetch() — run a local server instead, e.g. <code>python -m http.server</code>, or view it once pushed to GitHub Pages.</div>`;
  }
}
init();
