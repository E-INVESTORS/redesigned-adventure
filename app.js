"use strict";

// Data
const companies = [
  "GreenTech Pvt Ltd","MediCore Pharma","AgroGrow Industries","SteelForge Ltd",
  "SolarNest Energy","UrbanBuild Infra","AquaPure Systems","HealthPlus Labs",
  "EcoPack Solutions","FinEdge Services","CloudNova Tech","AutoSpark Motors",
  "EduPrime Solutions","BioLife Organics","SmartLogix","FreshKart Supply",
  "PowerGridX","NanoSoft AI","BlueWave Shipping","AgriRoots Ltd",
  "MetalCore Works","RetailNova","TextilePro","FoodChain Pvt Ltd",
  "MedAssist","InfraLine","GreenFuel Bio","UrbanFoods","CyberShield","BuildSmart"
];

const investors = [
  "Amit Patel","Priya Verma","Rohit Shah","Neha Kapoor","Suresh Mehta",
  "Vikas Jain","Nitin Kumar","Sunita Malhotra","Rajiv Singhania",
  "Kavita Desai","Anil Agarwal","Pooja Arora","Sanjay Khanna",
  "Mehul Doshi","Rina Banerjee","Aakash Iyer","Deepak Rao",
  "Shweta Nair","Kunal Bansal","Manish Gupta","Varun Chopra",
  "Alok Mishra","Sneha Kulkarni","Harsh Vardhan","Payal Joshi",
  "Arjun Mallick","Ritu Saxena","Mohit Sethi","Preeti Goel","Naveen Pillai"
];

function mask(name){
  const p = name.split(' ');
  return p[0][0] + '*** ' + (p[1] ? p[1][0] + '****' : '');
}

function renderCompanies(){
  const grid = document.getElementById('companiesGrid');
  if(!grid) return;
  grid.innerHTML = '';
  companies.forEach((c,i)=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `<b>${c}</b><div style="margin-top:8px;color:var(--muted)">State: India · Turnover: ₹${((i+3)*1.2).toFixed(1)} Cr · Margin: ${15+i%20}%</div>`;
    grid.appendChild(card);
  });
}

function renderInvestors(){
  const grid = document.getElementById('investorsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  investors.forEach((n,i)=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `<b>${mask(n)}</b><div style="margin-top:8px;color:var(--muted)">Budget: ₹${(i%10+3)}–${(i%10+8)} Cr</div>`;
    grid.appendChild(card);
  });
}

// Simple vanilla line chart (no libs)
function drawLineChart(canvas, data, opts={color:'#1f6f8b', labels:[]}){
  if(!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = (opts.height || 140) * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  const w = rect.width;
  const h = opts.height || 140;
  ctx.clearRect(0,0,w,h);
  // margin
  const mx = 28; const my = 12;
  const innerW = w - mx*2; const innerH = h - my*2;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  // draw grid lines
  ctx.strokeStyle = 'rgba(15,23,36,0.06)'; ctx.lineWidth = 1;
  for(let i=0;i<4;i++){
    const y = my + (innerH * i / 3);
    ctx.beginPath(); ctx.moveTo(mx,y); ctx.lineTo(mx+innerW,y); ctx.stroke();
  }
  // draw line
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x = mx + (innerW * (i/(data.length-1||1)));
    const y = my + innerH - ((v - min)/range) * innerH;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = opts.color; ctx.lineWidth = 2.5; ctx.stroke();
  // fill gradient
  const grad = ctx.createLinearGradient(0,my,0,my+innerH);
  grad.addColorStop(0, opts.color+'22'); grad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.lineTo(mx+innerW, my+innerH); ctx.lineTo(mx, my+innerH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
}

// Page behavior
function show(id){
  document.querySelectorAll('.section').forEach(s=>s.style.display='none');
  const el = document.getElementById(id);
  if(el) el.style.display='block';
}

async function login(){
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password')?.value || '';
  const role = document.getElementById('role').value;
  const method = document.getElementById('authMethod')?.value || 'local';
  if(!name || !email){ alert('Fill all details'); return; }

  if(method === 'local'){
    localStorage.setItem('user', JSON.stringify({name,role,email}));
    show('dashboard'); loadDash();
    return;
  }

  // Firebase flow
  try{
    await ensureFirebase();
  }catch(err){
    alert('Firebase not configured or failed to load. Using local auth instead.');
    localStorage.setItem('user', JSON.stringify({name,role,email}));
    show('dashboard'); loadDash();
    return;
  }

  try{
    // try sign in first
    const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
    const u = userCred.user;
    localStorage.setItem('user', JSON.stringify({name: u.email, role, email: u.email}));
    show('dashboard'); loadDash();
  }catch(signInErr){
    // fallback: create user
    try{
      const newCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const u = newCred.user;
      localStorage.setItem('user', JSON.stringify({name: u.email, role, email: u.email}));
      show('dashboard'); loadDash();
    }catch(signUpErr){
      console.error(signInErr, signUpErr);
      alert('Firebase auth error: '+(signUpErr.message||signInErr.message));
    }
  }
}

function loadDash(){
  const u = JSON.parse(localStorage.getItem('user') || 'null');
  if(!u) return;
  const investorDash = document.getElementById('investorDash');
  const companyDash = document.getElementById('companyDash');
  const adminDash = document.getElementById('adminDash');
  if(investorDash) investorDash.style.display = u.role === 'investor' ? 'block' : 'none';
  if(companyDash) companyDash.style.display = u.role === 'company' ? 'block' : 'none';
  if(adminDash) adminDash.style.display = u.role === 'admin' ? 'block' : 'none';
  if(u.role === 'investor'){
    const invName = document.getElementById('invName'); if(invName) invName.innerText = 'Welcome '+u.name[0]+'***';
  }
  drawCharts();
}

function logout(){ localStorage.removeItem('user'); show('welcome'); }

function drawCharts(){
  drawLineChart(document.getElementById('roiChart'), [10,15,19,26,32], {color:'#2a9d8f'});
  drawLineChart(document.getElementById('turnoverChart'), [4,6,9,12,15], {color:'#457b9d'});
  drawLineChart(document.getElementById('platformChart'), [40,65,90,120,180], {color:'#f4a261'});
}

// Firebase helper: loads SDKs and initializes if FIREBASE_CONFIG is provided
function ensureFirebase(){
  return new Promise((resolve, reject)=>{
    if(window.firebase && firebase.apps && firebase.apps.length) return resolve();
    if(!window.FIREBASE_CONFIG){
      return reject(new Error('FIREBASE_CONFIG not found'));
    }
    // load compat SDKs
    const scripts = [
      'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js'
    ];
    let loaded = 0;
    scripts.forEach(src=>{
      const s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = ()=>{ if(++loaded === scripts.length){ try{ firebase.initializeApp(window.FIREBASE_CONFIG); resolve(); }catch(e){ resolve(); } } };
      s.onerror = ()=>{ reject(new Error('Failed to load firebase SDK')); };
      document.head.appendChild(s);
    });
  });
}

function toggleChat(){
  const cb = document.getElementById('chatbox'); if(!cb) return; cb.style.display = cb.style.display === 'block' ? 'none' : 'block';
}

function chat(e){
  if(e.key !== 'Enter') return;
  const input = document.getElementById('chatInput'); const chatBody = document.getElementById('chatBody');
  if(!input || !chatBody) return;
  chatBody.innerHTML += `<p><b>You:</b> ${input.value}</p><p><b>Investree:</b> Average ROI is around 30%.</p>`;
  input.value=''; chatBody.scrollTop = chatBody.scrollHeight;
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  renderCompanies(); renderInvestors();
  document.getElementById('chatBtn')?.addEventListener('click', toggleChat);
  document.getElementById('chatInput')?.addEventListener('keypress', chat);
  const user = localStorage.getItem('user'); if(user) loadDash();
  show('welcome');
  // ensure charts resize on window resize
  window.addEventListener('resize', ()=>{ drawCharts(); });
});
