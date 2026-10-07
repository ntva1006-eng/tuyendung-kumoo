(() => {
  const form = document.querySelector('#apply-form');
  if (!form) return;
  const cfg = window.TD_CONFIG || {};
  const MAX = (cfg.maxFileMB || 5) * 1024 * 1024;
  const OK_EXT = /\.(pdf|docx?|jpe?g|png|webp)$/i;
  const status = form.querySelector('.status');
  const btn = form.querySelector('button[type=submit]');
  const sel = form.elements.position;
  const pf = form.querySelector('.f-portfolio');
  const pfInput = form.elements.portfolio;
  const drop = form.querySelector('.drop');
  const fileIn = form.elements.cv;
  const fileLbl = form.querySelector('.drop .file');

  const show = (cls, msg) => { status.className = 'status show ' + cls; status.textContent = msg; };

  // điền sẵn vị trí từ ?vi-tri=
  const q = new URLSearchParams(location.search).get('vi-tri');
  if (q && [...sel.options].some(o => o.value === q)) sel.value = q;
  const syncPortfolio = () => {
    const need = sel.selectedOptions[0] && sel.selectedOptions[0].dataset.portfolio === '1';
    pf.querySelector('.req').hidden = !need;
    pfInput.required = need;
  };
  sel.addEventListener('change', syncPortfolio); syncPortfolio();

  // ngày sinh không quá hôm nay
  const d = new Date(); form.elements.dob.max = d.toISOString().slice(0, 10);

  // chọn / kéo thả CV
  const pick = f => {
    if (!f) return;
    if (!OK_EXT.test(f.name)) { show('err', 'CV chỉ nhận PDF, Word (.doc/.docx) hoặc ảnh JPG/PNG/WebP.'); return; }
    if (f.size > MAX) { show('err', `Tệp CV tối đa ${cfg.maxFileMB || 5} MB. Tệp của bạn ${(f.size / 1048576).toFixed(1)} MB.`); return; }
    form._file = f; fileLbl.textContent = '✓ ' + f.name; status.className = 'status';
  };
  drop.addEventListener('click', () => fileIn.click());
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });
  fileIn.addEventListener('change', () => pick(fileIn.files[0]));
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => pick(e.dataTransfer.files[0]));

  form.querySelectorAll('input,select,textarea').forEach(el => el.addEventListener('blur', () => el.classList.add('touched')));

  const toB64 = f => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Không đọc được tệp CV.')); r.readAsDataURL(f);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    form.querySelectorAll('input,select,textarea').forEach(el => el.classList.add('touched'));
    if (!form.reportValidity()) return;
    if (!form._file) { show('err', 'Vui lòng tải CV của bạn lên (PDF, Word hoặc ảnh, tối đa ' + (cfg.maxFileMB || 5) + ' MB).'); drop.focus(); return; }
    if (form.elements.website.value) return; // bẫy bot
    if (!cfg.endpoint) {
      show('err', 'Hệ thống nhận hồ sơ đang được cập nhật. Bạn vui lòng gửi CV qua email hcns@kumooleather.vn hoặc Zalo 0888 209 986 nhé.');
      return;
    }
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { if (k !== 'cv' && k !== 'website') data[k] = String(v).trim(); });
    data.positionTitle = sel.selectedOptions[0].textContent.trim();
    data.consent = form.elements.consent.checked;
    data.page = location.href;
    data.ua = navigator.userAgent.slice(0, 180);
    btn.disabled = true; show('wait', 'Đang gửi hồ sơ của bạn…');
    try {
      data.cv = { name: form._file.name, type: form._file.type || 'application/octet-stream', size: form._file.size, data: await toB64(form._file) };
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 90000);
      const r = await fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), signal: ctl.signal });
      clearTimeout(t);
      const res = await r.json();
      if (!res.ok) throw new Error(res.message || 'Chưa gửi được hồ sơ.');
      show('ok', 'Đã gửi hồ sơ thành công! 🎉\nCảm ơn bạn đã quan tâm Kumoo & Wetrip. Bộ phận nhân sự sẽ xem hồ sơ và liên hệ trong 1–2 ngày làm việc nếu phù hợp. Bạn để ý điện thoại và email giúp mình nhé.');
      btn.textContent = 'Đã gửi ✓';
      form.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
      if (window.fbq) try { fbq('track', 'SubmitApplication'); } catch (_) {}
      if (window.gtag) try { gtag('event', 'submit_application', { position: data.position }); } catch (_) {}
    } catch (err) {
      btn.disabled = false;
      show('err', (err.name === 'AbortError' || err.name === 'TypeError' || err instanceof SyntaxError)
        ? 'Kết nối chậm nên chưa xác nhận được hồ sơ. Thông tin bạn điền vẫn còn trên trang — thử bấm gửi lại, hoặc gửi CV qua email hcns@kumooleather.vn / Zalo 0888 209 986.'
        : err.message);
    }
  });
})();
