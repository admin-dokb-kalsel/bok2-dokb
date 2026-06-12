/**
 * DOKB BOK 2026 — ADVOKASI WEB v2.0 (REAL-TIME)
 * Consolidated from app1, app2, app3.
 * Logic: Google Sheets -> Apps Script API -> Vercel Frontend
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION & DATA STATE
// ═══════════════════════════════════════════════════════════════════════════════
const API_URL = "URL_WEB_APP_BAPAK_DISINI"; // <--- GANTI DENGAN URL WEB APP GOOGLE SCRIPT

let DATA = {
  meta: { totalResponden: 0, respondenValid: 0, tahunSurvei: 2026, wilayah: "Kalimantan Selatan" },
  agregasi: { kmPerBulan: 0, hariKerja: 0, potonganPct: 0, bokSurvei: 0, komponen: [] },
  koreksi: { umkKalsel: 0, hargaKendaraan: 0, bpjsPengemudi: 0, asuransiPenumpang: 0, profitPct: 0.10, totalBokKoreksi: 0 },
  regulasi: { tbb: 4000, tba: 6500, tarifMin: 16000 },
  rekomendasi: { tbbKoreksi: 0, tbaKoreksi: 0, t03Koreksi: 0, tbbSurvei: 0, tbaSurvei: 0, t03Survei: 0 }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SYNCHRONIZATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
async function loadData() {
    try {
        const response = await fetch(API_URL);
        const cloud = await response.json();
        
        // Mapping flat JSON from Sheets to nested DATA object
        DATA.meta.totalResponden = cloud.totalResponden || 119;
        DATA.meta.respondenValid = cloud.respondenValid || 116;
        
        DATA.agregasi.kmPerBulan = parseFloat(cloud.kmPerBulan) || 4340.47;
        DATA.agregasi.potonganPct = parseFloat(cloud.potonganPct) || 21.80;
        DATA.agregasi.bokSurvei = parseFloat(cloud.bokSurvei) || 2596.46;
        
        DATA.koreksi.umkKalsel = parseFloat(cloud.umkKalsel) || 3496194;
        DATA.koreksi.hargaKendaraan = parseFloat(cloud.hargaKendaraan) || 175000000;
        DATA.koreksi.bpjsPengemudi = parseFloat(cloud.bpjsPengemudi) || 504000;
        DATA.koreksi.asuransiPenumpang = parseFloat(cloud.asuransiPenumpang) || 180000;
        DATA.koreksi.totalBokKoreksi = parseFloat(cloud.bokGabungan) || 4149.41;
        
        DATA.rekomendasi.tbbKoreksi = parseFloat(cloud.tbbKoreksi) || 5837;
        DATA.rekomendasi.tbaKoreksi = parseFloat(cloud.tbaKoreksi) || 9485;
        DATA.rekomendasi.t03Koreksi = parseFloat(cloud.t03Koreksi) || 19262;

        // Note: Komponen agregasi tetap hardcoded atau bisa dikembangkan API-nya nanti
        DATA.agregasi.komponen = [
          { nama: "BBM", rpkm: 900.94 }, { nama: "Oli Mesin", rpkm: 110.06 },
          { nama: "Servis Rutin", rpkm: 116.87 }, { nama: "Ban", rpkm: 37.16 },
          { nama: "Sparepart", rpkm: 65.35 }, { nama: "Cuci Mobil", rpkm: 60.51 },
          { nama: "Parkir", rpkm: 207.83 }, { nama: "STNK", rpkm: 52.09 },
          { nama: "Asuransi", rpkm: 7.98 }, { nama: "KIR/Uji Berkala", rpkm: 0.00 },
          { nama: "Penyusutan", rpkm: 474.80 }, { nama: "Paket Data", rpkm: 33.02 },
          { nama: "Cicilan/Sewa", rpkm: 529.87 },
        ];

        console.log("Cloud Sync Success ✅");
        switchTab(currentTab); // Refresh UI with new data
    } catch (error) {
        console.error("Sync Error: ", error);
        alert("Gagal sinkronisasi cloud. Menggunakan data default.");
        switchTab(currentTab);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALC & FORMAT HELPERS (From app1.js)
// ═══════════════════════════════════════════════════════════════════════════════
const FMT = {
  idr: (n, d = 0) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: d, maximumFractionDigits: d }).format(n),
  num: (n, d = 0) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n),
  pct: (n, d = 1) => n.toFixed(d) + "%",
};

const CALC = {
  hitungKoreksi(umk, harga, bpjs, asnPnp, kmBln, profitPct = 0.10) {
    const pengemudi  = umk / kmBln;
    const penyusutan = (harga * 0.8 / 5 / 12) / kmBln;
    const asuransiTlo = (harga * 0.015 / 12) / kmBln;
    const bpjsKm     = bpjs / (kmBln * 12);
    const asnPnpKm   = asnPnp / (kmBln * 12);
    const ovhMesin   = (harga * 0.10) / 200000;
    const ovhBody    = (harga * 0.20) / 360000;
    const bodyMaint  = (harga * 0.02 / 12) / kmBln;
    const surveyTotal = DATA.agregasi.bokSurvei;
    const delta = (penyusutan - 474.80) + (asuransiTlo - 7.98) + pengemudi + bpjsKm + asnPnpKm + ovhMesin + ovhBody + bodyMaint;
    const subKoreksi = surveyTotal + delta;
    const profit = subKoreksi * profitPct;
    return { subKoreksi, profit, bokKoreksi: subKoreksi + profit, pengemudi, penyusutan, asuransiTlo, bpjsKm, asnPnpKm, ovhMesin, ovhBody, bodyMaint };
  },
  simulasiOrder({ tarifOrder, potonganPct, jarakJemput, jarakAntar }) {
    const bokKoreksiPerKm = DATA.koreksi.totalBokKoreksi;
    const pendapatanBersih = tarifOrder * (1 - potonganPct / 100);
    const totalKm = jarakJemput + jarakAntar;
    const pendapatanPerKm = totalKm > 0 ? pendapatanBersih / totalKm : 0;
    const bokTotal = bokKoreksiPerKm * totalKm;
    const labaRugi = pendapatanBersih - bokTotal;
    return {
      pendapatanKotor: tarifOrder,
      potonganNominal: tarifOrder * (potonganPct / 100),
      pendapatanBersih,
      totalKm,
      pendapatanPerKm,
      bokKoreksiPerKm,
      bokTotal,
      labaRugi,
      statusLayak: labaRugi >= 0,
      pctVsBok: totalKm > 0 ? ((pendapatanPerKm / bokKoreksiPerKm) * 100).toFixed(1) : 0,
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB RENDERING (Consolidated from app2 & app3)
// ═══════════════════════════════════════════════════════════════════════════════
function renderPanduan() {
    return `<div class="space-y-6">
        <div class="hero-card p-6 rounded-2xl">
            <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden flex-shrink-0">
                    <img src="logo-dokb-bulat.png" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='🚗'">
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white mb-1">DOKB BOK 2026 — Advokasi Web</h2>
                    <p class="text-slate-300 text-sm leading-relaxed">Platform digital resmi DOKB untuk edukasi dan validasi tarif ASK Kalsel.</p>
                </div>
            </div>
        </div>
        <div class="info-box rounded-2xl p-4">
            <p class="text-xs text-amber-300 font-bold uppercase mb-2">⚠ Cloud Synchronized</p>
            <p class="text-sm text-slate-200">Data pada platform ini tersinkronisasi secara real-time dengan Google Sheets DOKB.</p>
        </div>
        <div>
            <h3 class="section-title">Struktur Analisis</h3>
            <div class="space-y-2">
                ${TABS.map((t, i) => `<div class="panduan-row flex items-start gap-3 p-3 rounded-xl">
                    <span class="badge-blue shrink-0">${i+1}</span>
                    <div><p class="font-bold text-white text-sm">${t.label}</p></div>
                </div>`).join("")}
            </div>
        </div>
    </div>`;
}

function renderDataSurvei() {
    const { meta, agregasi } = DATA;
    return `<div class="space-y-5">
        <div class="grid grid-cols-2 gap-3">
            ${[ ["Total Responden", meta.totalResponden, "driver", "text-blue-400"], ["Responden Valid", meta.respondenValid, "driver", "text-green-400"], ["KM/Bulan", FMT.num(agregasi.kmPerBulan,0), "km/bln", "text-amber-400"], ["Potongan", FMT.pct(agregasi.potonganPct), "rata-rata", "text-red-400"] ].map(([l,v,s,c]) => `
                <div class="stat-card rounded-2xl p-4">
                    <p class="text-slate-400 text-xs uppercase mb-1">${l}</p>
                    <p class="text-2xl font-bold ${c}">${v}</p>
                    <p class="text-slate-500 text-xs">${s}</p>
                </div>`).join("")}
        </div>
        <div class="stat-card rounded-2xl p-4">
            <p class="text-slate-400 text-xs uppercase mb-3">BOK Survey Riil per KM</p>
            <p class="text-4xl font-bold text-blue-400">${FMT.idr(agregasi.bokSurvei, 2)}<span class="text-sm text-slate-400 font-normal">/km</span></p>
        </div>
    </div>`;
}

function renderAgregasi() {
    const komp = DATA.agregasi.komponen;
    const total = komp.reduce((s, k) => s + k.rpkm, 0);
    return `<div class="space-y-5">
        <div class="stat-card rounded-2xl p-4">
            <p class="text-slate-400 text-xs uppercase mb-1">Total BOK Survey / km</p>
            <p class="text-3xl font-bold text-blue-400">${FMT.idr(DATA.agregasi.bokSurvei, 2)}</p>
        </div>
        <div class="stat-card rounded-2xl p-4">
            <h3 class="text-white font-bold text-sm mb-3">Rincian Komponen</h3>
            <div class="space-y-2">
                ${komp.map(k => `<div class="flex justify-between py-1 border-b border-slate-800">
                    <span class="text-slate-300 text-xs">${k.nama}</span>
                    <span class="font-mono text-xs text-white">${FMT.num(k.rpkm, 2)}</span>
                </div>`).join("")}
            </div>
        </div>
    </div>`;
}

function renderKoreksi() {
    const { koreksi } = DATA;
    return `<div class="space-y-5">
        <div class="stat-card rounded-2xl p-4">
            <h3 class="text-white font-bold text-sm mb-3">Asumsi Input (Sesi Simulasi)</h3>
            <div class="space-y-3">
                ${[ ["UMK Kalsel","umk",koreksi.umkKalsel,"Rp/bln"], ["Harga Mobil","harga",koreksi.hargaKendaraan,"Rp"] ].map(([l,id,v,s]) => `
                    <div>
                        <label class="text-slate-400 text-xs block mb-1">${l} (${s})</label>
                        <input type="number" id="inp_${id}" value="${v}" class="inp-blue w-full text-sm font-mono" oninput="updateKoreksi()" />
                    </div>`).join("")}
            </div>
        </div>
        <div class="stat-card rounded-2xl p-4" id="koreksiResult">
            <div id="koreksiKomponen"></div>
        </div>
        <div class="grid grid-cols-3 gap-3" id="koreksiSummary"></div>
    </div>`;
}

function updateKoreksi() {
    const umk = +document.getElementById("inp_umk")?.value || DATA.koreksi.umkKalsel;
    const harga = +document.getElementById("inp_harga")?.value || DATA.koreksi.hargaKendaraan;
    const r = CALC.hitungKoreksi(umk, harga, DATA.koreksi.bpjsPengemudi, DATA.koreksi.asuransiPenumpang, DATA.agregasi.kmPerBulan);
    
    const comp = document.getElementById("koreksiKomponen");
    if(comp) comp.innerHTML = `<p class="text-white text-sm font-bold mb-2">Hasil Simulasi: ${FMT.idr(r.bokKoreksi, 0)}/km</p>`;
    
    const sum = document.getElementById("koreksiSummary");
    if(sum) sum.innerHTML = `<div class="stat-card p-3 text-center"><p class="text-xs">BOK Koreksi</p><p class="font-bold text-green-400">${FMT.idr(r.bokKoreksi, 0)}</p></div>`;
}

function renderRekomendasiTarif() {
    const { rekomendasi, regulasi } = DATA;
    return `<div class="space-y-5">
        <div class="grid gap-3">
            ${[ ["TBB Layak", rekomendasi.tbbKoreksi, regulasi.tbb, "green"], ["TBA Layak", rekomendasi.tbaKoreksi, regulasi.tba, "green"], ["Min 0-3km", rekomendasi.t03Koreksi, regulasi.tarifMin, "green"] ].map(([l,v,s,c]) => `
                <div class="stat-card rounded-2xl p-4 flex justify-between items-center">
                    <div><p class="text-white font-bold text-sm">${l}</p><p class="text-slate-500 text-xs">SK: ${FMT.idr(s,0)}</p></div>
                    <p class="text-2xl font-bold text-${c}-400">${FMT.idr(v,0)}</p>
                </div>`).join("")}
        </div>
    </div>`;
}

function renderValidasi() {
    const { koreksi, regulasi, agregasi } = DATA;
    const bokS = agregasi.bokSurvei;
    const bokK = koreksi.totalBokKoreksi;
    const tbb = regulasi.tbb;
    return `<div class="space-y-5">
        <div class="stat-card rounded-2xl p-4">
            <h3 class="text-white font-bold text-sm mb-3">Analisis Cepat</h3>
            <div class="space-y-2">
                <div class="p-3 rounded-lg bg-blue-950 bg-opacity-40">
                    <p class="text-slate-400 text-xs">BOK Survey vs TBB</p>
                    <p class="text-amber-400 text-xs font-bold">${bokS < tbb ? '⚠ Di bawah TBB (Komponen tidak tersurvei)' : '✅ Sesuai'}</p>
                </div>
                <div class="p-3 rounded-lg bg-green-950 bg-opacity-40">
                    <p class="text-slate-400 text-xs">BOK Koreksi vs TBB</p>
                    <p class="text-red-400 text-xs font-bold">${bokK > tbb ? '🔴 Melampaui TBB (+'+FMT.num(bokK-tbb,0)+')' : '✅ Sesuai'}</p>
                </div>
            </div>
        </div>
    </div>`;
}

function renderDashboard() {
    const { koreksi, rekomendasi, regulasi, agregasi } = DATA;
    return `<div class="space-y-5">
        <div class="hero-card p-4 rounded-2xl text-center">
            <h2 class="text-xl font-bold text-white">Dashboard Advokasi 2026</h2>
            <p class="text-slate-400 text-xs">Data Real-time Cloud DOKB</p>
        </div>
        <div class="grid grid-cols-3 gap-2">
            ${[ ["BOK Survey", agregasi.bokSurvei, "text-blue-400"], ["BOK Koreksi", koreksi.totalBokKoreksi, "text-green-400"], ["TBB Layak", rekomendasi.tbbKoreksi, "text-green-400"] ].map(([l,v,c]) => `
                <div class="stat-card rounded-2xl p-3 text-center">
                    <p class="text-slate-400 text-xs mb-1">${l}</p>
                    <p class="font-bold ${c} text-sm font-mono">${FMT.idr(v,0)}</p>
                </div>`).join("")}
        </div>
        <button onclick="window.print()" class="btn-primary w-full py-3 rounded-xl font-bold">🖨 Cetak PDF</button>
    </div>`;
}

function renderSimulasiOrder() {
    return `<div class="space-y-5">
        <div class="stat-card rounded-2xl p-4">
            <h3 class="text-white font-bold text-sm mb-4">Simulasi Order</h3>
            <div class="space-y-3">
                ${[ ["Tarif (Rp)", "simTarif", "25000"], ["Potongan (%)", "simPotongan", "25"], ["Jarak Jemput (km)", "simJemput", "3"], ["Jarak Antar (km)", "simAntar", "8"] ].map(([l,id,def]) => `
                    <div>
                        <label class="text-slate-400 text-xs block mb-1">${l}</label>
                        <input type="number" id="${id}" value="${def}" class="inp-green w-full font-mono text-sm" oninput="hitungSimulasi()" />
                    </div>`).join("")}
            </div>
        </div>
        <div id="simResult" class="space-y-4"></div>
    </div>`;
}

function hitungSimulasi() {
    const tarif = +document.getElementById("simTarif")?.value || 0;
    const pot = +document.getElementById("simPotongan")?.value || 0;
    const jemput = +document.getElementById("simJemput")?.value || 0;
    const antar = +document.getElementById("simAntar")?.value || 0;
    const r = CALC.simulasiOrder({ tarifOrder: tarif, potonganPct: pot, jarakJemput: jemput, jarakAntar: antar });
    const el = document.getElementById("simResult");
    if(!el) return;
    el.innerHTML = `<div class="stat-card p-4 rounded-2xl text-center ${r.statusLayak?'bg-green-950':'bg-red-950'} bg-opacity-40">
        <p class="text-white font-bold">${r.statusLayak?'✅ LAYAK':'🔴 TIDAK LAYAK'}</p>
        <p class="text-3xl font-bold font-mono">${FMT.idr(r.labaRugi,0)}</p>
    </div>`;
}

function renderAnalisisAdvokasi() {
    return `<div class="space-y-5">
        <div class="hero-card p-4 rounded-2xl">
            <h2 class="text-lg font-bold text-white">Narasi Advokasi</h2>
            <p class="text-slate-400 text-xs">Hasil otomatis berdasarkan sinkronisasi data cloud.</p>
        </div>
        <div class="stat-card p-4 rounded-2xl border-l-4 border-green-500">
            <p class="text-white font-bold text-sm mb-1">Kesimpulan Strategis</p>
            <p class="text-slate-300 text-sm">BOK Koreksi ${FMT.idr(DATA.koreksi.totalBokKoreksi,0)} melampaui TBB ${FMT.idr(DATA.regulasi.tbb,0)}, maka revisi tarif adalah sebuah keharusan hukum dan ekonomi.</p>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONTROLLER & INIT
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:"panduan",    label:"Panduan",       icon:"📋", render: renderPanduan },
  { id:"survei",     label:"Data Survei",   icon:"📊", render: renderDataSurvei },
  { id:"agregasi",   label:"Agregasi BOK",  icon:"📈", render: renderAgregasi },
  { id:"koreksi",    label:"Koreksi BOK",   icon:"⚡", render: renderKoreksi },
  { id:"rekomendasi",label:"Tarif Layak",   icon:"🎯", render: renderRekomendasiTarif },
  { id:"validasi",   label:"Validasi",      icon:"✅", render: renderValidasi },
  { id:"dashboard",  label:"Dashboard",     icon:"🗂", render: renderDashboard },
  { id:"simulasi",   label:"Simulasi",      icon:"🧮", render: renderSimulasiOrder },
  { id:"advokasi",   label:"Advokasi",      icon:"⚖️", render: renderAnalisisAdvokasi },
];

let currentTab = "panduan";

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
  const tab = TABS.find(t => t.id === tabId);
  const content = document.getElementById("tabContent");
  if (tab && content) {
    content.innerHTML = tab.render();
    content.scrollTop = 0;
    if (tabId === "koreksi") updateKoreksi();
    if (tabId === "simulasi") hitungSimulasi();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const nav = document.getElementById("tabNav");
  if (nav) {
    nav.innerHTML = TABS.map(t => `<button class="nav-btn" data-tab="${t.id}" onclick="switchTab('${t.id}')">
      <span class="nav-icon">${t.icon}</span><span class="nav-label">${t.label}</span>
    </button>`).join("");
  }
  
  // FIRST ACTION: Sync with Cloud
  await loadData(); 
  switchTab("panduan");
});
