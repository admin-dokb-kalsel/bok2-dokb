const API_URL = "https://script.google.com/macros/s/AKfycbya30OudyZtyH7IJMktsLjvzBM1oSl79ZHOxtkjwSlhOpjnNeaPoigzqV2CwvXzReM7/exec";

let DATA = {
  meta: { totalResponden: 119, respondenValid: 116, tahunSurvei: 2026, wilayah: "Kalimantan Selatan" },
  agregasi: { kmPerBulan: 4340.47, hariKerja: 25, potonganPct: 21.80, bokSurvei: 2596.46, komponen: [
    { nama: "BBM", rpkm: 900.94 }, { nama: "Oli Mesin", rpkm: 110.06 }, { nama: "Servis Rutin", rpkm: 116.87 },
    { nama: "Ban", rpkm: 37.16 }, { nama: "Sparepart", rpkm: 65.35 }, { nama: "Cuci Mobil", rpkm: 60.51 },
    { nama: "Parkir", rpkm: 207.83 }, { nama: "STNK", rpkm: 52.09 }, { nama: "Asuransi", rpkm: 7.98 },
    { nama: "KIR/Uji Berkala", rpkm: 0.00 }, { nama: "Penyusutan", rpkm: 474.80 }, { nama: "Paket Data", rpkm: 33.02 },
    { nama: "Cicilan/Sewa", rpkm: 529.87 },
  ]},
  koreksi: { umkKalsel: 3725000, hargaKendaraan: 175000000, bpjsPengemudi: 504000, asuransiPenumpang: 180000, profitPct: 0.10, totalBokKoreksi: 4207.51 },
  regulasi: { tbb: 4000, tba: 6500, tarifMin: 16000 },
  rekomendasi: { tbbKoreksi: 5912, tbaKoreksi: 9607, t03Koreksi: 19510, tbbSurvei: 4017, tbaSurvei: 6528, t03Survei: 13256 },
};

const FMT = {
  idr: (n, d = 0) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0),
  num: (n, d = 0) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0),
  pct: (n, d = 1) => (n || 0).toFixed(d) + "%",
};

const CALC = {
  hitungKoreksi(umk, harga, bpjs, asnPnp, kmBln, profitPct = 0.10) {
    const pengemudi = umk / kmBln;
    const penyusutan = (harga * 0.8 / 5 / 12) / kmBln;
    const asuransiTlo = (harga * 0.015 / 12) / kmBln;
    const bpjsKm = bpjs / (kmBln * 12);
    const asnPnpKm = asnPnp / (kmBln * 12);
    const ovhMesin = (harga * 0.10) / 200000;
    const ovhBody = (harga * 0.20) / 360000;
    const bodyMaint = (harga * 0.02 / 12) / kmBln;
    const surveyTotal = DATA.agregasi.bokSurvei;
    const delta = (penyusutan - 474.80) + (asuransiTlo - 7.98) + pengemudi + bpjsKm + asnPnpKm + ovhMesin + ovhBody + bodyMaint;
    const subKoreksi = surveyTotal + delta;
    const profit = subKoreksi * profitPct;
    return { pengemudi, penyusutan, asuransiTlo, bpjsKm, asnPnpKm, ovhMesin, ovhBody, bodyMaint, subKoreksi, profit, bokKoreksi: subKoreksi + profit };
  },
  simulasiOrder({ tarifOrder, potonganPct, jarakJemput, jarakAntar }) {
    const bokKoreksiPerKm = DATA.koreksi.totalBokKoreksi;
    const pendapatanBersih = tarifOrder * (1 - potonganPct / 100);
    const totalKm = jarakJemput + jarakAntar;
    const pendapatanPerKm = totalKm > 0 ? pendapatanBersih / totalKm : 0;
    const bokTotal = bokKoreksiPerKm * totalKm;
    const labaRugi = pendapatanBersih - bokTotal;
    return { labaRugi, statusLayak: labaRugi >= 0, pctVsBok: totalKm > 0 ? ((pendapatanPerKm / bokKoreksiPerKm) * 100).toFixed(1) : 0, pendapatanPerKm, bokKoreksiPerKm, pendapatanBersih, bokTotal, totalKm };
  }
};

function accordion(id, title, content) {
  return `<div class="mt-2">
    <button onclick="toggleAcc('${id}')" class="w-full text-left text-xs text-amber-400 flex items-center gap-1 py-1">
      <span id="arr_${id}">▶</span> ${title}
    </button>
    <div id="${id}" class="hidden bg-slate-900 bg-opacity-60 rounded-xl p-3 mt-1 text-xs font-mono text-slate-300 space-y-1">
      ${content}
    </div>
  </div>`;
}

function toggleAcc(id) {
  const el = document.getElementById(id);
  const arr = document.getElementById('arr_' + id);
  if (!el) return;
  el.classList.toggle('hidden');
  arr.textContent = el.classList.contains('hidden') ? '▶' : '▼';
}

function renderPanduan() {
  return `<div class="space-y-6">
    <div class="hero-card p-6 rounded-2xl">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden flex-shrink-0">
          <img src="logo-dokb-bulat.png" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='🚗'">
        </div>
        <div>
          <h2 class="text-xl font-bold text-white mb-1">DOKB BOK 2026 — Advokasi Web</h2>
          <p class="text-slate-300 text-sm">Platform digital resmi DOKB untuk edukasi dan validasi tarif ASK Kalsel.</p>
        </div>
      </div>
    </div>
    <div class="info-box rounded-2xl p-4">
      <p class="text-xs text-amber-300 font-bold uppercase mb-2">⚠ Status Koneksi</p>
      <p class="text-sm text-slate-200">${API_URL === "URL_WEB_APP_BAPAK_DISINI" ? "Mode Offline: Silakan hubungkan API Google Sheets" : "Terhubung ke Cloud DOKB"}</p>
    </div>
    <div class="stat-card rounded-2xl p-4 space-y-2 text-xs text-slate-300">
      <p class="text-white font-bold text-sm mb-2">📌 Panduan Penggunaan</p>
      <p>• <span class="text-blue-400 font-bold">Data Survei</span> — Hasil survei 119 driver Kalsel</p>
      <p>• <span class="text-blue-400 font-bold">Agregasi BOK</span> — Rincian komponen biaya per km</p>
      <p>• <span class="text-green-400 font-bold">Koreksi BOK</span> — Koreksi komponen yang tidak tersurvei</p>
      <p>• <span class="text-green-400 font-bold">Tarif Layak</span> — Rekomendasi tarif berbasis data</p>
      <p>• <span class="text-amber-400 font-bold">Simulasi</span> — Hitung kelayakan order real-time</p>
      <p class="text-slate-500 pt-1">💡 Tap tombol <span class="text-amber-400">▶ Lihat Rumus</span> di setiap angka untuk melihat metodologi perhitungan.</p>
    </div>
  </div>`;
}

function renderDataSurvei() {
  const { meta, agregasi } = DATA;
  return `<div class="space-y-5">
    <div class="grid grid-cols-2 gap-3">
      ${[ ["Total Responden", meta.totalResponden, "driver", "text-blue-400"], ["Responden Valid", meta.respondenValid, "driver", "text-green-400"], ["KM/Bulan", FMT.num(agregasi.kmPerBulan,2), "km/bln", "text-amber-400"], ["Potongan", FMT.pct(agregasi.potonganPct), "rata-rata", "text-red-400"] ].map(([l,v,s,c]) => `
        <div class="stat-card rounded-2xl p-4">
          <p class="text-slate-400 text-xs uppercase mb-1">${l}</p>
          <p class="text-2xl font-bold ${c}">${v}</p>
          <p class="text-slate-500 text-xs">${s}</p>
        </div>`).join("")}
    </div>
    <div class="stat-card rounded-2xl p-4">
      <p class="text-slate-400 text-xs uppercase mb-1">BOK Survey Riil per KM</p>
      <p class="text-4xl font-bold text-blue-400">${FMT.idr(agregasi.bokSurvei, 2)}<span class="text-sm text-slate-400 font-normal">/km</span></p>
      ${accordion('acc_boksurvei', 'Lihat Rumus BOK Survey', `
        <p class="text-slate-400">BOK Survey = Σ semua komponen biaya / km</p>
        <p class="text-slate-400">= Total pengeluaran driver ÷ km/bulan</p>
        <p class="text-white">= ${FMT.idr(agregasi.bokSurvei, 2)}/km</p>
        <p class="text-slate-500 mt-1">Sumber: Survei langsung ${meta.respondenValid} driver valid dari ${meta.totalResponden} responden di Kalimantan Selatan tahun 2026.</p>
      `)}
    </div>
    <div class="stat-card rounded-2xl p-4 text-xs text-slate-400 space-y-1">
      <p class="text-white font-bold text-sm mb-2">📋 Metodologi Survei</p>
      <p>• Survei dilakukan terhadap <span class="text-blue-400 font-bold">${meta.totalResponden} driver</span> ASK aktif di Kalsel</p>
      <p>• Responden valid: <span class="text-green-400 font-bold">${meta.respondenValid} driver</span> (data lengkap & konsisten)</p>
      <p>• Rata-rata jarak tempuh: <span class="text-amber-400 font-bold">${FMT.num(agregasi.kmPerBulan,2)} km/bulan</span></p>
      <p>• Rata-rata potongan aplikator: <span class="text-red-400 font-bold">${FMT.pct(agregasi.potonganPct)}</span></p>
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
      ${accordion('acc_total', 'Lihat Rumus Total BOK', `
        <p class="text-slate-400">Total BOK = Σ (Biaya Komponen per km)</p>
        ${komp.map(k => `<p><span class="text-slate-400">${k.nama}:</span> <span class="text-white">${FMT.num(k.rpkm,2)}</span></p>`).join('')}
        <p class="border-t border-slate-700 pt-1 text-green-400">Total = ${FMT.num(total,2)} /km</p>
      `)}
    </div>
    <div class="stat-card rounded-2xl p-4">
      <h3 class="text-white font-bold text-sm mb-3">Rincian Komponen</h3>
      <div class="space-y-2">
        ${komp.map(k => `<div class="flex justify-between py-1 border-b border-slate-800">
          <span class="text-slate-300 text-xs">${k.nama}</span>
          <span class="font-mono text-xs text-white">${FMT.num(k.rpkm, 2)}</span>
        </div>`).join("")}
        <div class="flex justify-between py-1 mt-1">
          <span class="text-blue-400 text-xs font-bold">TOTAL</span>
          <span class="font-mono text-xs text-blue-400 font-bold">${FMT.num(DATA.agregasi.bokSurvei, 2)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderKoreksi() {
  const { koreksi } = DATA;
  return `<div class="space-y-5">
    <div class="stat-card rounded-2xl p-4">
      <p class="text-white font-bold text-sm mb-2">💡 Mengapa Ada Koreksi?</p>
      <p class="text-slate-400 text-xs">Survei driver tidak mencakup semua komponen biaya riil. Koreksi BOK menambahkan komponen yang terlewat agar tarif benar-benar layak.</p>
    </div>
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
  const km = DATA.agregasi.kmPerBulan;
  const r = CALC.hitungKoreksi(umk, harga, DATA.koreksi.bpjsPengemudi, DATA.koreksi.asuransiPenumpang, km);
  const comp = document.getElementById("koreksiKomponen");
  if(comp) comp.innerHTML = `
    <p class="text-white text-sm font-bold mb-3">BOK Koreksi: ${FMT.idr(r.bokKoreksi, 2)}/km</p>
    <div class="space-y-1 text-xs">
      <p class="text-slate-400 font-bold mb-1">Komponen Tambahan (tidak ada di survei):</p>
      <div class="flex justify-between"><span class="text-slate-300">Gaji Pengemudi (UMK ÷ km/bln)</span><span class="text-white font-mono">${FMT.num(r.pengemudi,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">Penyusutan Koreksi</span><span class="text-white font-mono">${FMT.num(r.penyusutan,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">Asuransi TLO Koreksi</span><span class="text-white font-mono">${FMT.num(r.asuransiTlo,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">BPJS Pengemudi</span><span class="text-white font-mono">${FMT.num(r.bpjsKm,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">Asuransi Penumpang</span><span class="text-white font-mono">${FMT.num(r.asnPnpKm,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">Overhaul Mesin</span><span class="text-white font-mono">${FMT.num(r.ovhMesin,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">Overhaul Body</span><span class="text-white font-mono">${FMT.num(r.ovhBody,2)}</span></div>
      <div class="flex justify-between"><span class="text-slate-300">Perawatan Body</span><span class="text-white font-mono">${FMT.num(r.bodyMaint,2)}</span></div>
      <div class="border-t border-slate-700 mt-2 pt-2 flex justify-between"><span class="text-blue-400 font-bold">BOK Survey</span><span class="text-blue-400 font-mono font-bold">${FMT.num(DATA.agregasi.bokSurvei,2)}</span></div>
      <div class="flex justify-between"><span class="text-green-400 font-bold">Sub Total Koreksi</span><span class="text-green-400 font-mono font-bold">${FMT.num(r.subKoreksi,2)}</span></div>
      <div class="flex justify-between"><span class="text-amber-400">+ Profit 10%</span><span class="text-amber-400 font-mono">${FMT.num(r.profit,2)}</span></div>
      <div class="border-t border-slate-600 mt-1 pt-1 flex justify-between"><span class="text-white font-bold">BOK Koreksi Final</span><span class="text-white font-mono font-bold">${FMT.num(r.bokKoreksi,2)}</span></div>
    </div>`;
  const sum = document.getElementById("koreksiSummary");
  if(sum) sum.innerHTML = `
    <div class="stat-card p-3 text-center"><p class="text-xs text-slate-400">Sub Total</p><p class="font-bold text-blue-400 text-xs">${FMT.idr(r.subKoreksi,0)}</p></div>
    <div class="stat-card p-3 text-center"><p class="text-xs text-slate-400">Profit 10%</p><p class="font-bold text-amber-400 text-xs">${FMT.idr(r.profit,0)}</p></div>
    <div class="stat-card p-3 text-center"><p class="text-xs text-slate-400">BOK Koreksi</p><p class="font-bold text-green-400 text-xs">${FMT.idr(r.bokKoreksi,0)}</p></div>`;
}

function renderRekomendasiTarif() {
  const { rekomendasi, regulasi, koreksi } = DATA;
  const bok = koreksi.totalBokKoreksi;
  const overhead = 0.2872;

  return `<div class="space-y-5">
    <div class="stat-card rounded-2xl p-4">
      <p class="text-slate-400 text-xs mb-1">📐 Metodologi Tarif</p>
      <p class="text-slate-300 text-xs">Tarif dihitung dari BOK Koreksi dengan memperhitungkan overhead operasional, margin keuntungan, dan faktor beban jarak minimum.</p>
    </div>

    <div class="stat-card rounded-2xl p-4">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-white font-bold text-sm">TBB Layak</p>
          <p class="text-slate-500 text-xs">SK Gubernur: ${FMT.idr(regulasi.tbb,0)}</p>
          <span class="text-xs ${rekomendasi.tbbKoreksi > regulasi.tbb ? 'text-red-400' : 'text-green-400'}">${rekomendasi.tbbKoreksi > regulasi.tbb ? '🔴 Di atas SK' : '✅ Sesuai SK'}</span>
        </div>
        <p class="text-2xl font-bold text-green-400">${FMT.idr(rekomendasi.tbbKoreksi,0)}</p>
      </div>
      ${accordion('acc_tbb', 'Lihat Rumus TBB', `
        <p class="text-slate-400">TBB = BOK Koreksi ÷ (1 - Overhead)</p>
        <p><span class="text-slate-400">BOK Koreksi:</span> <span class="text-white">${FMT.num(bok,2)} /km</span></p>
        <p><span class="text-slate-400">Overhead (potongan + ops):</span> <span class="text-white">28,72%</span></p>
        <p><span class="text-slate-400">= ${FMT.num(bok,2)} ÷ (1 - 0,2872)</span></p>
        <p class="text-green-400 font-bold">= ${FMT.idr(rekomendasi.tbbKoreksi,0)} /km</p>
        <p class="text-slate-500 mt-1">SK Gubernur saat ini: ${FMT.idr(regulasi.tbb,0)} /km → selisih ${FMT.idr(rekomendasi.tbbKoreksi - regulasi.tbb,0)}</p>
      `)}
    </div>

    <div class="stat-card rounded-2xl p-4">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-white font-bold text-sm">TBA Layak</p>
          <p class="text-slate-500 text-xs">SK Gubernur: ${FMT.idr(regulasi.tba,0)}</p>
          <span class="text-xs ${rekomendasi.tbaKoreksi > regulasi.tba ? 'text-red-400' : 'text-green-400'}">${rekomendasi.tbaKoreksi > regulasi.tba ? '🔴 Di atas SK' : '✅ Sesuai SK'}</span>
        </div>
        <p class="text-2xl font-bold text-green-400">${FMT.idr(rekomendasi.tbaKoreksi,0)}</p>
      </div>
      ${accordion('acc_tba', 'Lihat Rumus TBA', `
        <p class="text-slate-400">TBA = TBB × Faktor Batas Atas</p>
        <p><span class="text-slate-400">TBB Layak:</span> <span class="text-white">${FMT.idr(rekomendasi.tbbKoreksi,0)}</span></p>
        <p><span class="text-slate-400">Faktor TBA:</span> <span class="text-white">× 1,625</span></p>
        <p class="text-green-400 font-bold">= ${FMT.idr(rekomendasi.tbaKoreksi,0)} /km</p>
        <p class="text-slate-500 mt-1">SK Gubernur saat ini: ${FMT.idr(regulasi.tba,0)} /km → selisih ${FMT.idr(rekomendasi.tbaKoreksi - regulasi.tba,0)}</p>
      `)}
    </div>

    <div class="stat-card rounded-2xl p-4">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-white font-bold text-sm">Tarif Min 0-3km</p>
          <p class="text-slate-500 text-xs">SK Gubernur: ${FMT.idr(regulasi.tarifMin,0)}</p>
          <span class="text-xs ${rekomendasi.t03Koreksi > regulasi.tarifMin ? 'text-red-400' : 'text-green-400'}">${rekomendasi.t03Koreksi > regulasi.tarifMin ? '🔴 Di atas SK' : '✅ Sesuai SK'}</span>
        </div>
        <p class="text-2xl font-bold text-green-400">${FMT.idr(rekomendasi.t03Koreksi,0)}</p>
      </div>
      ${accordion('acc_t03', 'Lihat Rumus Tarif 0-3km', `
        <p class="text-slate-400">Tarif Min = TBB × Faktor Jarak Minimum</p>
        <p><span class="text-slate-400">TBB Layak:</span> <span class="text-white">${FMT.idr(rekomendasi.tbbKoreksi,0)}</span></p>
        <p><span class="text-slate-400">Faktor jarak minimum:</span> <span class="text-white">× 3,3</span></p>
        <p class="text-green-400 font-bold">= ${FMT.idr(rekomendasi.t03Koreksi,0)} /trip</p>
        <p class="text-slate-500 mt-1">SK Gubernur saat ini: ${FMT.idr(regulasi.tarifMin,0)} → selisih ${FMT.idr(rekomendasi.t03Koreksi - regulasi.tarifMin,0)}</p>
      `)}
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
      <h3 class="text-white font-bold text-sm mb-3">Analisis Validasi Data</h3>
      <div class="space-y-3">
        <div class="p-3 rounded-lg bg-blue-950 bg-opacity-40">
          <p class="text-slate-400 text-xs font-bold mb-1">BOK Survey vs TBB SK</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-300">${FMT.idr(bokS,0)} vs ${FMT.idr(tbb,0)}</span>
            <span class="text-amber-400 text-xs font-bold">${bokS < tbb ? '⚠ Di bawah TBB' : '✅ Sesuai'}</span>
          </div>
          ${accordion('acc_val1', 'Mengapa di bawah TBB?', `
            <p class="text-slate-400">BOK Survey hanya mencatat pengeluaran yang diingat driver saat survei. Komponen seperti gaji, BPJS, asuransi, dan overhaul tidak tersurvei karena tidak dibayar tunai rutin.</p>
            <p class="text-amber-400 mt-1">Ini bukan kesalahan data — ini adalah keterbatasan metode survei yang perlu dikoreksi.</p>
          `)}
        </div>
        <div class="p-3 rounded-lg bg-red-950 bg-opacity-40">
          <p class="text-slate-400 text-xs font-bold mb-1">BOK Koreksi vs TBB SK</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-300">${FMT.idr(bokK,0)} vs ${FMT.idr(tbb,0)}</span>
            <span class="text-red-400 text-xs font-bold">${bokK > tbb ? '🔴 Melampaui TBB +'+FMT.num(bokK-tbb,0) : '✅ Sesuai'}</span>
          </div>
          ${accordion('acc_val2', 'Apa artinya ini?', `
            <p class="text-slate-400">BOK Koreksi ${FMT.idr(bokK,0)}/km lebih tinggi dari TBB SK Gubernur ${FMT.idr(tbb,0)}/km.</p>
            <p class="text-red-400 mt-1">Artinya: dengan tarif SK saat ini, driver sudah RUGI sejak kilometer pertama — belum termasuk jarak jemput tanpa penumpang.</p>
            <p class="text-white mt-1 font-bold">Ini adalah dasar hukum dan ekonomi untuk menuntut revisi tarif.</p>
          `)}
        </div>
        <div class="p-3 rounded-lg bg-slate-800 bg-opacity-40">
          <p class="text-slate-400 text-xs font-bold mb-1">Selisih Tarif</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-300">Rekomendasi vs SK</span>
            <span class="text-green-400 text-xs font-bold">+${FMT.idr(DATA.rekomendasi.tbbKoreksi - tbb, 0)}/km</span>
          </div>
          ${accordion('acc_val3', 'Lihat perbandingan lengkap', `
            <div class="flex justify-between"><span class="text-slate-400">TBB SK saat ini:</span><span class="text-white">${FMT.idr(tbb,0)}/km</span></div>
            <div class="flex justify-between"><span class="text-slate-400">BOK Koreksi:</span><span class="text-white">${FMT.idr(bokK,0)}/km</span></div>
            <div class="flex justify-between"><span class="text-slate-400">TBB Rekomendasi:</span><span class="text-green-400 font-bold">${FMT.idr(DATA.rekomendasi.tbbKoreksi,0)}/km</span></div>
            <div class="flex justify-between mt-1 border-t border-slate-700 pt-1"><span class="text-amber-400">Kenaikan diperlukan:</span><span class="text-amber-400 font-bold">+${FMT.pct((DATA.rekomendasi.tbbKoreksi/tbb-1)*100,1)}</span></div>
          `)}
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
      <p class="text-slate-400 text-xs">Data Real-time Cloud DOKB — ${agregasi.kmPerBulan} km/bln rata-rata</p>
    </div>
    <div class="grid grid-cols-3 gap-2">
      ${[ ["BOK Survey", agregasi.bokSurvei, "text-blue-400"], ["BOK Koreksi", koreksi.totalBokKoreksi, "text-green-400"], ["TBB Layak", rekomendasi.tbbKoreksi, "text-amber-400"] ].map(([l,v,c]) => `
        <div class="stat-card rounded-2xl p-3 text-center">
          <p class="text-slate-400 text-xs mb-1">${l}</p>
          <p class="font-bold ${c} text-sm font-mono">${FMT.idr(v,0)}</p>
        </div>`).join("")}
    </div>
    <div class="stat-card rounded-2xl p-4">
      <p class="text-white font-bold text-sm mb-3">Perbandingan SK vs Rekomendasi</p>
      <div class="space-y-2 text-xs">
        ${[["TBB", regulasi.tbb, rekomendasi.tbbKoreksi], ["TBA", regulasi.tba, rekomendasi.tbaKoreksi], ["Min 0-3km", regulasi.tarifMin, rekomendasi.t03Koreksi]].map(([l,sk,rek]) => `
          <div class="flex justify-between items-center py-1 border-b border-slate-800">
            <span class="text-slate-400 w-16">${l}</span>
            <span class="text-red-400 font-mono">${FMT.idr(sk,0)}</span>
            <span class="text-slate-500">→</span>
            <span class="text-green-400 font-mono font-bold">${FMT.idr(rek,0)}</span>
            <span class="text-amber-400">+${FMT.pct((rek/sk-1)*100,1)}</span>
          </div>`).join("")}
      </div>
    </div>
    <button onclick="window.print()" class="btn-primary w-full py-3 rounded-xl font-bold">🖨 Cetak PDF</button>
  </div>`;
}

function renderSimulasiOrder() {
  return `<div class="space-y-5">
    <div class="stat-card rounded-2xl p-4">
      <h3 class="text-white font-bold text-sm mb-4">🧮 Simulasi Kelayakan Order</h3>
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
  el.innerHTML = `
    <div class="stat-card p-4 rounded-2xl text-center ${r.statusLayak?'border border-green-700':'border border-red-700'}">
      <p class="text-white font-bold text-lg">${r.statusLayak?'✅ ORDER LAYAK':'🔴 ORDER TIDAK LAYAK'}</p>
      <p class="text-3xl font-bold font-mono ${r.statusLayak?'text-green-400':'text-red-400'} mt-1">${FMT.idr(r.labaRugi,0)}</p>
      <p class="text-slate-400 text-xs mt-1">${r.statusLayak?'Keuntungan bersih':'Kerugian driver'} per order ini</p>
    </div>
    <div class="stat-card p-4 rounded-2xl space-y-2 text-xs">
      <p class="text-white font-bold mb-2">📊 Rincian Perhitungan</p>
      <div class="flex justify-between"><span class="text-slate-400">Tarif order</span><span class="text-white font-mono">${FMT.idr(tarif,0)}</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Potongan ${pot}%</span><span class="text-red-400 font-mono">- ${FMT.idr(tarif*(pot/100),0)}</span></div>
      <div class="flex justify-between border-t border-slate-700 pt-1"><span class="text-blue-400">Pendapatan bersih</span><span class="text-blue-400 font-mono">${FMT.idr(r.pendapatanBersih,0)}</span></div>
      <div class="flex justify-between mt-1"><span class="text-slate-400">Total jarak (${jemput}+${antar} km)</span><span class="text-white font-mono">${r.totalKm} km</span></div>
      <div class="flex justify-between"><span class="text-slate-400">BOK Koreksi/km</span><span class="text-white font-mono">${FMT.idr(r.bokKoreksiPerKm,2)}</span></div>
      <div class="flex justify-between"><span class="text-red-400">Total BOK</span><span class="text-red-400 font-mono">- ${FMT.idr(r.bokTotal,0)}</span></div>
      <div class="flex justify-between border-t border-slate-600 pt-1"><span class="${r.statusLayak?'text-green-400':'text-red-400'} font-bold">Laba/Rugi</span><span class="${r.statusLayak?'text-green-400':'text-red-400'} font-mono font-bold">${FMT.idr(r.labaRugi,0)}</span></div>
      ${accordion('acc_sim', 'Lihat Rumus Simulasi', `
        <p class="text-slate-400">Pendapatan Bersih = Tarif × (1 - Potongan%)</p>
        <p class="text-slate-400">= ${FMT.idr(tarif,0)} × (1 - ${pot/100})</p>
        <p class="text-white">= ${FMT.idr(r.pendapatanBersih,0)}</p>
        <p class="text-slate-400 mt-1">Total BOK = BOK Koreksi/km × Total KM</p>
        <p class="text-slate-400">= ${FMT.idr(r.bokKoreksiPerKm,2)} × ${r.totalKm} km</p>
        <p class="text-white">= ${FMT.idr(r.bokTotal,0)}</p>
        <p class="text-slate-400 mt-1">Laba/Rugi = Pendapatan Bersih - Total BOK</p>
        <p class="${r.statusLayak?'text-green-400':'text-red-400'} font-bold">= ${FMT.idr(r.labaRugi,0)}</p>
      `)}
    </div>`;
}

function renderAnalisisAdvokasi() {
  const { koreksi, regulasi, rekomendasi, agregasi } = DATA;
  const selisihTbb = rekomendasi.tbbKoreksi - regulasi.tbb;
  const pctNaik = ((rekomendasi.tbbKoreksi / regulasi.tbb) - 1) * 100;

  const yuridis = [
    {
      num: "1",
      title: "Kewenangan Gubernur Menetapkan Tarif",
      color: "border-blue-500",
      badge: "text-blue-400",
      body: "Berdasarkan Pasal 22 ayat (2) PM 118 Tahun 2018, Gubernur memiliki kewenangan penuh menetapkan TBB dan TBA ASK untuk wilayah operasi dalam 1 provinsi. SK Gubernur Kalsel 2025 adalah pelaksanaan sah dari mandat Menteri ini.",
      dasar: "PM 118/2018 Pasal 22 ayat (2)"
    },
    {
      num: "2",
      title: "Batas Maksimal Potongan & Larangan Menetapkan Tarif Sendiri",
      color: "border-amber-500",
      badge: "text-amber-400",
      body: "Pasal 27 huruf a PM 118/2018 melarang Perusahaan Aplikasi menetapkan tarif sendiri. Dipertegas SK Gubernur Kalsel No. 0991/2025 Diktum KEEMPAT: TBB Rp4.000/km dan minimal Rp16.000 adalah PENDAPATAN BERSIH driver — potongan aplikator tidak boleh mengurangi angka tersebut.",
      dasar: "PM 118/2018 Pasal 27 huruf a + SK Gubernur Diktum KEEMPAT"
    },
    {
      num: "3",
      title: "Sifat Mengikat SK Gubernur",
      color: "border-green-500",
      badge: "text-green-400",
      body: "Tidak ada pasal dalam PM 118/2018 yang menyatakan SK Gubernur tidak mengikat. Pasal 22 memberikan mandat kepada Gubernur sebagai wakil pemerintah pusat di daerah. Mengabaikan SK ini berarti aplikator melakukan pembangkangan terhadap regulasi negara.",
      dasar: "PM 118/2018 Pasal 22"
    },
    {
      num: "4",
      title: "Kewajiban Perusahaan Aplikasi",
      color: "border-purple-500",
      badge: "text-purple-400",
      body: "Pasal 27 huruf b PM 118/2018 melarang aplikator memberikan promosi tarif di bawah TBB yang telah ditetapkan. Pasal 25 mewajibkan aplikator melaporkan tarifnya kepada Gubernur. Layanan 'Hemat' yang di bawah TBB adalah bentuk pelanggaran nyata.",
      dasar: "PM 118/2018 Pasal 25 & Pasal 27 huruf b"
    },
    {
      num: "5",
      title: "Konsekuensi Hukum Pelanggaran Tarif",
      color: "border-red-500",
      badge: "text-red-400",
      body: "Jika aplikator melanggar ketentuan tarif, pemerintah berwenang menjatuhkan sanksi administratif sesuai PM 118/2018 berupa: peringatan tertulis, pembekuan izin, hingga pencabutan izin penyelenggaraan.",
      dasar: "PM 118/2018 — Ketentuan Sanksi"
    },
  ];

  return `<div class="space-y-4">
    <div class="hero-card p-4 rounded-2xl">
      <h2 class="text-lg font-bold text-white">⚖️ Analisa Yuridis Penegakan Tarif ASK</h2>
      <p class="text-slate-400 text-xs">Berdasarkan PM 118/2018, SK Gubernur Kalsel 2025 & Surat Dirjenhubdat PR.301/1/11/DRJD/2022</p>
    </div>

    <div class="stat-card p-4 rounded-2xl border-l-4 border-amber-400">
      <p class="text-amber-400 font-bold text-xs mb-1">⚠️ Catatan Penting</p>
      <p class="text-slate-300 text-xs">Surat Dirjenhubdat PR.301/1/11/DRJD/2022 menyatakan bahwa SE 3244/2017 <span class="text-white font-bold">sudah tidak sesuai nilainya</span> dengan kondisi saat ini. Aplikator tidak dapat lagi menggunakan SE 3244/2017 sebagai acuan tarif yang relevan.</p>
    </div>

    ${yuridis.map(p => `
    <div class="stat-card p-4 rounded-2xl border-l-4 ${p.color}">
      <div class="flex items-start gap-2 mb-2">
        <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 ${p.badge}">${p.num}</span>
        <p class="text-white font-bold text-xs">${p.title}</p>
      </div>
      <p class="text-slate-300 text-xs mb-2">${p.body}</p>
      <p class="text-xs ${p.badge} font-mono">📌 ${p.dasar}</p>
    </div>`).join("")}

    <div class="stat-card p-4 rounded-2xl">
      <p class="text-white font-bold text-sm mb-2">📋 Ringkasan Tuntutan DOKB</p>
      <div class="space-y-2 text-xs">
        ${[["TBB", regulasi.tbb, rekomendasi.tbbKoreksi], ["TBA", regulasi.tba, rekomendasi.tbaKoreksi], ["Min 0-3km", regulasi.tarifMin, rekomendasi.t03Koreksi]].map(([l,sk,rek]) => `
          <div class="flex justify-between items-center py-1 border-b border-slate-800">
            <span class="text-slate-400">${l}</span>
            <span class="text-red-400 line-through">${FMT.idr(sk,0)}</span>
            <span class="text-green-400 font-bold">${FMT.idr(rek,0)}</span>
            <span class="text-amber-400 font-bold">+${FMT.pct((rek/sk-1)*100,1)}</span>
          </div>`).join("")}
      </div>
    </div>

    <div class="stat-card p-4 rounded-2xl border-l-4 border-red-500">
      <p class="text-red-400 font-bold text-sm mb-2">⚠️ Indikasi Predatory Pricing</p>
      <p class="text-slate-300 text-xs mb-2">Predatory pricing terjadi ketika aplikator menetapkan atau membiarkan tarif beroperasi di bawah BOK riil driver — kerugian ditanggung driver, bukan perusahaan.</p>
      <div class="space-y-1 text-xs mt-2">
        ${[
          "Tarif layanan tertentu di bawah TBB SK Gubernur",
          "Formula flagfall tidak konsisten antar aplikator",
          "Potongan efektif melebihi batas PM 118 Pasal 27 karena biaya tambahan dibebankan terpisah ke pelanggan",
          "Aplikator menolak membuka data BOK — tidak ada dasar pembanding setara",
        ].map(t => `<div class="flex gap-2"><span class="text-red-400">🔴</span><span class="text-slate-300">${t}</span></div>`).join("")}
      </div>
      ${accordion('acc_predatory', 'Dasar Hukum Predatory Pricing', `
        <p class="text-slate-400">UU No. 5/1999 tentang Larangan Praktik Monopoli dan Persaingan Usaha Tidak Sehat.</p>
        <p class="text-amber-400 mt-1">Jika pelanggaran SK Gubernur dan PM 118 berlanjut, Pemerintah Provinsi dapat meneruskan ke KPPU atas dugaan praktik persaingan usaha tidak sehat.</p>
      `)}
    </div>

    <div class="stat-card p-4 rounded-2xl border-l-4 border-amber-500">
      <p class="text-amber-400 font-bold text-sm mb-2">⚖️ Formula Jalan Tengah DOKB</p>
      <div class="space-y-2 text-xs">
        <div class="p-3 rounded-lg bg-slate-800 space-y-1">
          <p class="text-white font-bold font-mono text-center text-sm">Flagfall = Rp 20.000/trip (net driver)</p>
          <p class="text-slate-400 text-center">= TBB × 3km + Idle & Risk Buffer</p>
          <p class="text-slate-400 text-center">= (Rp 5.000 × 3) + Rp 5.000</p>
          <p class="text-green-400 text-center font-bold">= Rp 15.000 + Rp 5.000 = Rp 20.000 ✅</p>
        </div>
        <div class="p-2 rounded-lg bg-blue-950 bg-opacity-40 text-xs">
          <p class="text-blue-400 font-bold mb-1">📊 Dasar Data:</p>
          <p class="text-slate-300">116 driver valid dalam survei BOK 2026 menyatakan Rp 20.000 sebagai flagfall yang layak — bukan angka DOKB, ini suara lapangan langsung.</p>
        </div>
        <div class="p-2 rounded-lg bg-slate-800 text-xs">
          <p class="text-slate-400 mb-1">Tarif contoh berdasarkan formula SK Gubernur:</p>
          ${[[3,"20.000","0 km sisa"],[4,"25.000","1 km sisa × Rp 5.000"],[7,"35.000","4 km sisa × Rp 5.000"],[10,"45.000","7 km sisa × Rp 5.000"]].map(([km,total,ket]) => `
          <div class="flex justify-between py-0.5 border-b border-slate-700">
            <span class="text-slate-400">${km} km</span>
            <span class="text-white font-mono font-bold">Rp ${total}</span>
            <span class="text-slate-500">${ket}</span>
          </div>`).join("")}
        </div>
        ${[["TBB", "Rp 4.000/km", "Rp 5.000/km", "+25%"], ["TBA", "Rp 6.500/km", "Rp 8.125/km", "+25%"], ["Flagfall 0-3km", "Rp 16.000", "Rp 20.000", "+25%"], ["Potongan", "Maks 20%", "15-18%", "PM 118 Ps.27"]].map(([l,lama,baru,pct]) => `
          <div class="flex justify-between items-center py-1 border-b border-slate-800">
            <span class="text-slate-400">${l}</span>
            <span class="text-red-400 line-through text-xs">${lama}</span>
            <span class="text-green-400 font-bold">${baru}</span>
            <span class="text-amber-400 font-bold">${pct}</span>
          </div>`).join("")}
      </div>
    </div>

    <div class="stat-card p-4 rounded-2xl border border-green-700">
      <p class="text-green-400 font-bold text-xs mb-1">💬 Posisi DOKB</p>
      <p class="text-slate-300 text-xs italic">"DOKB tidak menetapkan tarif — itu kewenangan Pemerintah. DOKB hanya membuktikan dengan data bahwa tarif saat ini tidak mencerminkan BOK riil driver, dan menuntut kepatuhan aplikator terhadap regulasi yang berlaku."</p>
    </div>
  </div>`;
}


const TABS = [
  { id:"panduan", label:"Panduan", icon:"📋", render: renderPanduan },
  { id:"survei", label:"Data Survei", icon:"📊", render: renderDataSurvei },
  { id:"agregasi", label:"Agregasi BOK", icon:"📈", render: renderAgregasi },
  { id:"koreksi", label:"Koreksi BOK", icon:"⚡", render: renderKoreksi },
  { id:"rekomendasi", label:"Tarif Layak", icon:"🎯", render: renderRekomendasiTarif },
  { id:"validasi", label:"Validasi", icon:"✅", render: renderValidasi },
  { id:"dashboard", label:"Dashboard", icon:"🗂", render: renderDashboard },
  { id:"simulasi", label:"Simulasi", icon:"🧮", render: renderSimulasiOrder },
  { id:"advokasi", label:"Advokasi", icon:"⚖️", render: renderAnalisisAdvokasi },
  { id:"transparansi", label:"Transparansi", icon:"🔍", render: renderTransparansiAplikator },
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
    if (tabId === "transparansi") hitungTransparansi();
  }
}

async function loadData() {
    if(API_URL === "URL_WEB_APP_BAPAK_DISINI") {
        document.getElementById("syncStatus").innerText = "MODE OFFLINE";
        document.getElementById("syncStatus").style.background = "rgba(220,38,38,0.3)";
        return;
    }
    try {
        const response = await fetch(API_URL);
        const cloud = await response.json();
        DATA.meta.totalResponden = cloud.totalResponden || 119;
        DATA.meta.respondenValid = cloud.respondenValid || 116;
        DATA.agregasi.kmPerBulan = parseFloat(cloud.kmPerBulan) || 4340.47;
        DATA.agregasi.potonganPct = parseFloat(cloud.potonganPct) || 21.80;
        DATA.agregasi.bokSurvei = parseFloat(cloud.bokSurvei) || 2596.46;
        DATA.koreksi.umkKalsel = parseFloat(cloud.umkKalsel) || 3725000;
        DATA.koreksi.hargaKendaraan = parseFloat(cloud.hargaKendaraan) || 175000000;
        DATA.koreksi.bpjsPengemudi = parseFloat(cloud.bpjsPengemudi) || 504000;
        DATA.koreksi.asuransiPenumpang = parseFloat(cloud.asuransiPenumpang) || 180000;
        DATA.koreksi.totalBokKoreksi = parseFloat(cloud.bokGabungan) || 4207.51;
        DATA.rekomendasi.tbbKoreksi = parseFloat(cloud.tbbKoreksi) || 5912;
        DATA.rekomendasi.tbaKoreksi = parseFloat(cloud.tbaKoreksi) || 9607;
        DATA.rekomendasi.t03Koreksi = parseFloat(cloud.t03Koreksi) || 19510;
        
        document.getElementById("syncStatus").innerText = "SINKRONISASI BERHASIL";
        document.getElementById("syncStatus").style.background = "rgba(5,150,105,0.3)";
        switchTab(currentTab);
    } catch (e) { 
        console.error("Cloud Sync Failed", e);
        document.getElementById("syncStatus").innerText = "SINKRONISASI GAGAL";
        document.getElementById("syncStatus").style.background = "rgba(220,38,38,0.3)";
        switchTab(currentTab);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
  const nav = document.getElementById("tabNav");
  if (nav) {
    nav.innerHTML = TABS.map(t => `<button class="nav-btn" data-tab="${t.id}" onclick="switchTab('${t.id}')">
      <span class="nav-icon">${t.icon}</span><span class="nav-label">${t.label}</span>
    </button>`).join("");
  }
  await loadData();
  switchTab("panduan");
});

// ═══════════════════════════════════════════════════════════
// TRANSPARANSI APLIKATOR
// ═══════════════════════════════════════════════════════════
function renderTransparansiAplikator() {
  return `<div class="space-y-5">
    <div class="stat-card rounded-2xl p-4">
      <h3 class="text-white font-bold text-sm mb-1">🔍 Simulasi Transparansi Aplikator</h3>
      <p class="text-slate-400 text-xs">Hitung potongan efektif riil aplikator dan bandingkan dengan batas maksimal PM 118/2018 (20%).</p>
    </div>

    <div class="stat-card rounded-2xl p-4">
      <h3 class="text-white font-bold text-sm mb-3">Input Data Perjalanan</h3>
      <div class="space-y-3">
        ${[
          ["Total Dibayar Pelanggan (Rp)", "trxPelanggan", "68500"],
          ["Pendapatan Diterima Driver (Rp)", "trxDriver", "53600"],
          ["Biaya Jasa Aplikasi — dibebankan ke pelanggan (Rp)", "trxJasaApp", "5500"],
          ["Biaya Asuransi Perjalanan — dibebankan ke pelanggan (Rp)", "trxAsuransi", "1000"],
          ["Diskon Voucher — ditanggung aplikator (Rp)", "trxVoucher", "5000"],
        ].map(([l,id,def]) => `
          <div>
            <label class="text-slate-400 text-xs block mb-1">${l}</label>
            <input type="number" id="${id}" value="${def}" class="inp-blue w-full font-mono text-sm" oninput="hitungTransparansi()" />
          </div>`).join("")}
      </div>
    </div>

    <div id="hasilTransparansi" class="space-y-3"></div>
  </div>`;
}

function hitungTransparansi() {
  const pelanggan = +document.getElementById("trxPelanggan")?.value || 0;
  const driver    = +document.getElementById("trxDriver")?.value || 0;
  const jasaApp   = +document.getElementById("trxJasaApp")?.value || 0;
  const asuransi  = +document.getElementById("trxAsuransi")?.value || 0;
  const voucher   = +document.getElementById("trxVoucher")?.value || 0;

  if (!pelanggan || !driver) return;

  // Biaya perjalanan murni (sebelum biaya tambahan)
  const tarifMurni = pelanggan - jasaApp - asuransi + voucher;

  // Potongan nominal dari tarif murni
  const potonganNominal = tarifMurni - driver;

  // Potongan % dari tarif murni (klaim aplikator)
  const potonganKlaim = tarifMurni > 0 ? (potonganNominal / tarifMurni) * 100 : 0;

  // Total masuk ke aplikator (potongan + jasa app + asuransi - voucher)
  const totalAplikator = potonganNominal + jasaApp + asuransi;

  // Potongan efektif riil dari total pelanggan bayar
  const potonganEfektif = pelanggan > 0 ? ((pelanggan - driver) / pelanggan) * 100 : 0;

  // Potongan efektif dari tarif murni
  const potonganEfektifDariTarif = tarifMurni > 0 ? (totalAplikator / tarifMurni) * 100 : 0;

  const BATAS_PM118 = 20;
  const patuh = potonganEfektifDariTarif <= BATAS_PM118;

  const el = document.getElementById("hasilTransparansi");
  if (!el) return;

  el.innerHTML = `
    <div class="stat-card rounded-2xl p-4 space-y-2 text-xs">
      <p class="text-white font-bold text-sm mb-2">📊 Rincian Perhitungan</p>
      <div class="flex justify-between py-1 border-b border-slate-800">
        <span class="text-slate-400">Total dibayar pelanggan</span>
        <span class="text-white font-mono">${FMT.idr(pelanggan)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800">
        <span class="text-slate-400">Biaya jasa aplikasi (terpisah)</span>
        <span class="text-red-400 font-mono">- ${FMT.idr(jasaApp)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800">
        <span class="text-slate-400">Biaya asuransi (terpisah)</span>
        <span class="text-red-400 font-mono">- ${FMT.idr(asuransi)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800">
        <span class="text-slate-400">Diskon voucher (ditanggung aplikator)</span>
        <span class="text-green-400 font-mono">+ ${FMT.idr(voucher)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-700">
        <span class="text-blue-400 font-bold">Tarif perjalanan murni</span>
        <span class="text-blue-400 font-mono font-bold">${FMT.idr(tarifMurni)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800">
        <span class="text-slate-400">Pendapatan driver</span>
        <span class="text-green-400 font-mono">${FMT.idr(driver)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800">
        <span class="text-slate-400">Potongan dari tarif murni (klaim)</span>
        <span class="text-amber-400 font-mono">${FMT.idr(potonganNominal)} (${potonganKlaim.toFixed(1)}%)</span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Total masuk ke aplikator</span>
        <span class="text-red-400 font-mono font-bold">${FMT.idr(totalAplikator)}</span>
      </div>
    </div>

    <div class="stat-card rounded-2xl p-4 border-l-4 ${patuh ? 'border-green-500' : 'border-red-500'}">
      <p class="text-white font-bold text-sm mb-3">⚖️ Analisis Kepatuhan PM 118/2018</p>
      <div class="space-y-2 text-xs">
        <div class="flex justify-between py-1 border-b border-slate-800">
          <span class="text-slate-400">Potongan klaim aplikator</span>
          <span class="text-amber-400 font-mono font-bold">${potonganKlaim.toFixed(1)}%</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-800">
          <span class="text-slate-400">Potongan efektif riil (termasuk biaya tambahan)</span>
          <span class="${patuh ? 'text-green-400' : 'text-red-400'} font-mono font-bold">${potonganEfektifDariTarif.toFixed(1)}%</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-slate-400">Batas maksimal PM 118/2018</span>
          <span class="text-white font-mono font-bold">20,0%</span>
        </div>
      </div>
    </div>

    <div class="rounded-2xl p-4 text-center ${patuh ? 'bg-green-950 bg-opacity-40 border border-green-700' : 'bg-red-950 bg-opacity-40 border border-red-700'}">
      <p class="text-white font-bold text-lg">${patuh ? '✅ PATUH' : '🔴 MELAMPAUI BATAS PM 118/2018'}</p>
      <p class="text-3xl font-bold font-mono ${patuh ? 'text-green-400' : 'text-red-400'} mt-1">${potonganEfektifDariTarif.toFixed(1)}%</p>
      <p class="text-slate-400 text-xs mt-1">Potongan efektif riil aplikator</p>
      ${!patuh ? `<p class="text-red-400 text-xs mt-2 font-bold">Melampaui batas ${(potonganEfektifDariTarif - BATAS_PM118).toFixed(1)}% dari ketentuan</p>` : ''}
    </div>

    ${!patuh ? `
    <div class="stat-card rounded-2xl p-4 border-l-4 border-amber-500">
      <p class="text-amber-400 font-bold text-sm mb-2">📋 Dasar Hukum</p>
      <p class="text-slate-300 text-xs">PM Perhubungan No. 118 Tahun 2018 Pasal 27 menetapkan biaya jasa aplikasi maksimal <span class="text-white font-bold">20%</span> dari tarif perjalanan. Biaya-biaya tambahan yang dibebankan terpisah ke pelanggan di luar potongan resmi perlu dievaluasi kesesuaiannya dengan ketentuan yang berlaku.</p>
    </div>` : ''}
  `;
}
