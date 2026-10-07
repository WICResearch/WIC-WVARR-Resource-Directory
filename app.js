
'use strict';

const $ = id => document.getElementById(id);
const escapeHTML = s => String(s ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;',
    '"':'&quot;', "'":'&#39;'
  }[c])
);

const cityCoords = {
  Rainelle:[37.968,-80.767],
  Alderson:[37.725,-80.643],
  Salem:[39.282,-80.559],
  Clarksburg:[39.281,-80.345],
  Westover:[39.635,-79.971],
  Morgantown:[39.63,-79.956],
  Elkins:[38.926,-79.847],
  Buckhannon:[38.994,-80.232],
  Kearneysville:[39.388,-77.886],
  Keyser:[39.44,-78.974],
  Ravenswood:[38.958,-81.761],
  Parkersburg:[39.266,-81.562],
  Montgomery:[38.18,-81.328],
  Logan:[37.848,-81.993],
  Bluefield:[37.269,-81.223],
  'Mount Hope':[37.895,-81.165],
  Beckley:[37.779,-81.188],
  Madison:[38.067,-81.82],
  Huntington:[38.419,-82.445],
  Charleston:[38.349,-81.632],
  'South Charleston':[38.369,-81.699]
};

const map = L.map('map', {
  scrollWheelZoom:false
}).setView([38.62,-80.65],7);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:'&copy; OpenStreetMap contributors',
    maxZoom:18
  }
).addTo(map);

const layer = L.markerClusterGroup({
  showCoverageOnHover:false,
  spiderfyOnMaxZoom:true,
  zoomToBoundsOnClick:true,
  maxClusterRadius:48,
  disableClusteringAtZoom:17
}).addTo(map);

let programs = [];
let markers = [];

const coordsFromCity = address => {
  const parts = address.split(',').map(s=>s.trim());
  const city = parts.find(p=>cityCoords[p]);
  return city ? cityCoords[city] : [38.62,-80.65];
};

const levelOf = p => {
  const m = p.requirements.match(
    /Level\s*(?:II|IV|III|I|[1-4])/i
  );
  if (!m) return '';
  const token = m[0].replace(/Level\s*/i,'').toUpperCase();
  return {
    I:'1', II:'2', III:'3', IV:'4'
  }[token] || token;
};

const isChildren = p => /children/i.test(p.population);

const directions = p =>
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(p.address);

const phoneHref = p =>
  'tel:' + p.phone.replace(/[^+\d]/g,'');

const emailHref = p =>
  'mailto:' + encodeURIComponent(p.email);

function populate() {
  for (const [id,values] of [
    ['county',new Set(programs.map(p=>p.county))],
    ['region',new Set(programs.map(p=>p.region))]
  ]) {
    const el = $(id);
    [...values]
      .sort((a,b)=>id==='region'
        ? Number(a)-Number(b)
        : a.localeCompare(b))
      .forEach(v=>el.add(
        new Option(id==='region'?'Region '+v:v,v)
      ));
  }
}

function filtered() {
  const q = $('search').value.trim().toLowerCase();

  return programs.filter(p =>
    (!q || [
      p.name,p.address,p.county,
      p.requirements,p.population
    ].join(' ').toLowerCase().includes(q)) &&
    (!$('county').value ||
      p.county===$('county').value) &&
    (!$('region').value ||
      p.region===$('region').value) &&
    (!$('level').value ||
      levelOf(p)===$('level').value) &&
    (!$('population').value ||
      ($('population').value==='children'
        ? isChildren(p)
        : !isChildren(p)))
  );
}

function render() {
  const found = filtered();

  $('resultCount').textContent = found.length+' found';

  $('results').innerHTML = found.map(p=>`
    <article class="item">
      <h4>${escapeHTML(p.name)}</h4>
      <div class="meta">
        ${escapeHTML(p.address)} ·
        ${escapeHTML(p.county)} County
      </div>
      <div class="pills">
        <span class="pill">
          Region ${escapeHTML(p.region)}
        </span>
        <span class="pill">
          ${levelOf(p)
            ? 'Level '+levelOf(p)
            : 'Level unspecified'}
        </span>
        <span class="pill ${isChildren(p)?'children':''}">
          ${escapeHTML(p.population)}
        </span>
        <span class="pill">
          ${p.beds} listed beds
        </span>
      </div>
      <details>
        <summary>Contacts & admission requirements</summary>
        <p><strong>Director:</strong>
          ${escapeHTML(p.director)}</p>
        <p><strong>Requirements:</strong>
          ${escapeHTML(p.requirements)}</p>
        <div class="links">
          <a href="${phoneHref(p)}">
            Call ${escapeHTML(p.phone)}
          </a>
          <a href="${emailHref(p)}">Email</a>
          <a href="${directions(p)}"
             target="_blank"
             rel="noopener noreferrer">
             Directions ↗
          </a>
        </div>
      </details>
      <button class="locate" data-id="${p.id}">
        View on map
      </button>
    </article>
  `).join('') ||
    '<p>No matches. Try clearing some filters.</p>';

  layer.clearLayers();
  markers = [];

  found.forEach(p=>{
    const pos = p.position || coordsFromCity(p.address);

    const marker = L.marker(pos, {
      icon:L.divIcon({
        className:'wvarr-pin',
        html:`<div style="
          width:19px;height:19px;
          background:${isChildren(p)?'#d0006f':'#00657f'};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 1px 6px #555;">
        </div>`,
        iconSize:[19,19],
        iconAnchor:[9,9]
      })
    });

    marker.bindPopup(`
      <strong>${escapeHTML(p.name)}</strong><br>
      ${escapeHTML(p.address)}<br>
      ${escapeHTML(p.population)} ·
      ${p.beds} listed beds<br>
      <small>
        ${p.verified
          ? 'Address geocoded'
          : 'Approximate city location — verify address'}
      </small><br>
      <a href="${directions(p)}"
         target="_blank"
         rel="noopener noreferrer">
         Get directions ↗
      </a>
    `);

    layer.addLayer(marker);
    markers.push({id:p.id,marker});
  });
}

function zoomTo(id) {
  const item = markers.find(m=>m.id===id);
  if (item) {
    layer.zoomToShowLayer(item.marker,()=>{
      item.marker.openPopup();
    });
    $('map').scrollIntoView({
      behavior:'smooth',
      block:'center'
    });
  }
}

$('results').addEventListener('click',e=>{
  const b = e.target.closest('[data-id]');
  if (b) zoomTo(Number(b.dataset.id));
});

['search','county','region','level','population']
  .forEach(id=>$(id).addEventListener(
    id==='search'?'input':'change',render
  ));

function clearFilters() {
  ['search','county','region','level','population']
    .forEach(id=>$(id).value='');
  render();
}

$('reset').addEventListener('click',()=>{
  clearFilters();
  map.setView([38.62,-80.65],7);
});

$('fit').addEventListener('click',()=>{
  clearFilters();
  if (markers.length) {
    map.fitBounds(layer.getBounds().pad(.15));
  } else {
    map.setView([38.62,-80.65],7);
  }
});

$('export').addEventListener('click',()=>{
  const keys = [
    'name','address','director','phone','email',
    'county','region','population','beds','requirements'
  ];

  const csv = [
    keys,
    ...filtered().map(p=>keys.map(k=>p[k]))
  ].map(row=>row.map(v=>
    '"'+String(v??'').replace(/"/g,'""')+'"'
  ).join(',')).join('\r\n');

  const a = document.createElement('a');
  const url = URL.createObjectURL(
    new Blob([csv],{type:'text/csv;charset=utf-8'})
  );

  a.href=url;
  a.download='wv-wic-recovery-housing-filtered.csv';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
});

// Geocode only when the service returns a strong match.
// Otherwise, retain the approximate city position.
async function geocode(p) {
  if (!/^\s*\d+\s/.test(p.address)) return;

  const key='wv-wic-geo-v1:'+p.address;

  try {
    const cached=JSON.parse(localStorage.getItem(key)||'null');
    if (cached) {
      p.position=cached;
      p.verified=true;
      return;
    }
  } catch {}

  try {
    const url =
      'https://geocode-api.arcgis.com/arcgis/rest/services/' +
      'World/GeocodeServer/findAddressCandidates?' +
      new URLSearchParams({
        SingleLine:p.address,
        f:'json',
        outFields:'Match_addr,Addr_type'
      });

    const res=await fetch(url);
    if (!res.ok) return;

    const data=await res.json();
    const c=data.candidates?.[0];

    if (
      c && c.score>=90 &&
      ['PointAddress','StreetAddress','Subaddress']
        .includes(c.attributes?.Addr_type)
    ) {
      p.position=[c.location.y,c.location.x];
      p.verified=true;
      try {
        localStorage.setItem(
          key,JSON.stringify(p.position)
        );
      } catch {}
    }
  } catch {}
}

async function init() {
  try {
    const r=await fetch('programs.json');
    if (!r.ok) throw Error('Could not load programs.json');

    programs=(await r.json()).map((p,i)=>({
      ...p,id:i+1
    }));

    $('statPrograms').textContent=programs.length;
    $('statBeds').textContent=programs
      .reduce((n,p)=>n+p.beds,0).toLocaleString();
    $('statCounties').textContent=
      new Set(programs.map(p=>p.county)).size;
    $('statChildren').textContent=
      programs.filter(isChildren).length;

    populate();
    render();

    for (const p of programs) {
      await geocode(p);
      if (p.verified) render();
    }
  } catch(e) {
    $('results').textContent=
      'Unable to load directory data. ' +
      'Serve all files together through GitHub Pages. ' +
      e.message;
  }
}

init();
