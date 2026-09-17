const STATUS_META = {
  untouched:{label:'Untouched', color:'var(--untouched)'},
  dataset_only:{label:'Dataset only', color:'var(--dataset)'},
  benchmark_only:{label:'Benchmark only', color:'var(--benchmark)'},
  covered:{label:'Covered', color:'var(--covered)'},
};

let LANGUAGES=[], COUNTRIES=[], TASKS=[], RESOURCES=[], MATRIX=[], COMMUNITY_TAGS=[];
let leafletMap, geoJsonLayer;
let geomapData = null;

const state = {
  search:'',
  status:new Set(), task:new Set(), country:new Set(), endangerment:new Set(),
  community:new Set(),
  viewMode: 'both', // 'both', 'map', or 'list'
};

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
  
  // Wire up the three buttons
  document.getElementById('btnBoth').onclick = ()=>{ state.viewMode='both'; syncToggle(); renderAll(); };
  document.getElementById('btnMap').onclick = ()=>{ state.viewMode='map'; syncToggle(); renderAll(); };
  document.getElementById('btnList').onclick = ()=>{ state.viewMode='list'; syncToggle(); renderAll(); };
}

function syncToggle(){
  const showMap = state.viewMode === 'both' || state.viewMode === 'map';
  const showList = state.viewMode === 'both' || state.viewMode === 'list';

  // Update button active states
  document.getElementById('btnBoth').classList.toggle('active', state.viewMode === 'both');
  document.getElementById('btnMap').classList.toggle('active', state.viewMode === 'map');
  document.getElementById('btnList').classList.toggle('active', state.viewMode === 'list');

  // Toggle map container
  document.getElementById('mapwrap').style.display = showMap ? '' : 'none';
  
  // Toggle the results header and table area
  const resultsHead = document.querySelector('.results-head');
  if (resultsHead) resultsHead.style.display = showList ? '' : 'none';
  document.getElementById('resultsArea').style.display = showList ? '' : 'none';
  
  // Prevent Leaflet from rendering a broken map when un-hidden
  if(showMap && leafletMap) {
    leafletMap.invalidateSize();
  }
}

function initMap() {
  // Define the physical boundaries of the map (Southwest to Northeast corners)
  const worldBounds = L.latLngBounds([-90, -180], [90, 180]);

  leafletMap = L.map('map', {
    center: [0, 20],
    zoom: 3,
    minZoom: 2, // Prevents zooming out so far that the map shrinks into the void
    maxBounds: worldBounds, // Restricts panning to the defined worldBounds
    maxBoundsViscosity: 1.0 // Makes the boundary a hard wall instead of an elastic rubber band
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    noWrap: true // Disables the infinite horizontal repetition of tiles
  }).addTo(leafletMap);
}

function renderMap(){
  if (!geomapData || !leafletMap) return;
  if (geoJsonLayer) leafletMap.removeLayer(geoJsonLayer);

  const rows = filteredRows();

  geoJsonLayer = L.geoJSON(geomapData, {
    style: function(feature) {
      const cName = feature.properties.name; 
      const countryRows = rows.filter(r => r.lang.country === cName);
      const allCountryRows = MATRIX.filter(r => r.lang.country === cName);
      
      // 1. Country has no data in database.json at all
      if (allCountryRows.length === 0) {
        return { fillColor: 'transparent', color: 'var(--line)', weight: 1 };
      }
      
      // 2. Country is in DB, but the user's filters excluded all its data (e.g., 0 "stable" matches)
      if (countryRows.length === 0) {
        return { fillColor: 'var(--panel)', color: 'var(--line)', weight: 1, fillOpacity: 0.8 };
      }
      
      // 3. Country has active matches. Calculate ratio against the FILTERED rows, not all rows.
      const covered = countryRows.filter(r => r.status !== 'untouched').length;
      const ratio = covered / countryRows.length;
      
      let fill = 'var(--untouched)';
      if(ratio >= 0.6) fill = 'var(--covered)';
      else if(ratio >= 0.25) fill = 'var(--dataset)';

      const isSelected = state.country.has(cName);

      return {
        fillColor: fill,
        fillOpacity: 0.8,
        color: isSelected ? 'var(--accent)' : 'var(--panel)', 
        weight: isSelected ? 3 : 1
      };
    },
    onEachFeature: function(feature, layer) {
      const cName = feature.properties.name;
      const countryRows = rows.filter(r => r.lang.country === cName);
      const allCountryRows = MATRIX.filter(r => r.lang.country === cName);

      // Only add labels and click events to countries that actually exist in our dataset
      if (allCountryRows.length > 0) {
        layer.on('click', () => {
          if(state.country.has(cName)) state.country.delete(cName); 
          else state.country.add(cName);
          renderAll();
        });

        // Restore the permanent numeric label from the old SVG map
        layer.bindTooltip(
          `<div style="text-align:center; line-height:1.2;">
             ${cName}<br>
             <span style="font-size:11.5px; color:var(--ink-soft); font-weight:400;">${countryRows.length}</span>
           </div>`, 
          { 
            permanent: true, 
            direction: 'center', 
            className: 'permanent-label' 
          }
        );
      }
    }
  }).addTo(leafletMap);
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
  
  const showMap = state.viewMode === 'both' || state.viewMode === 'map';
  const showList = state.viewMode === 'both' || state.viewMode === 'list';
  
  if (showMap) renderMap();
  if (showList) renderResults();
}

async function init(){
  try{
    // Fetch original tabular database
    const res = await fetch('./data/database.json');
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    
    // Fetch boundaries map
    const geoRes = await fetch('./data/geojson/world.geo.json');
    if(!geoRes.ok) throw new Error('HTTP '+geoRes.status+' fetching africa.geo.json');
    geomapData = await geoRes.json();

    LANGUAGES = data.languages; COUNTRIES = data.countries; TASKS = data.tasks; RESOURCES = data.resources;
    MATRIX = buildMatrix();
    COMMUNITY_TAGS = [...new Set(RESOURCES.flatMap(r=>r.labels.community||[]))].sort();
    
    initMap();
    wireControls();
    syncToggle();
    renderAll();
  }catch(err){
    document.getElementById('resultsArea').innerHTML =
      `<div class="empty">Couldn't load data (${err.message}). Since we are using Leaflet and external tile servers, you must run this locally via a server, e.g. <code>python -m http.server</code>.</div>`;
  }
}
init();