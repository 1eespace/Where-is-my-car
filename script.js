const KEY = 'parking_spot_v1';
const $ = (id) => document.getElementById(id);
let state = { floor: '', zone: '', memo: '', photo: '', savedAt: null };

function load() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) state = { ...state, ...JSON.parse(r) };
  } catch (e) {}
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {}
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 1800);
}
function fmt(ts) {
  if (!ts) return '—';
  const d = new Date(ts),
    now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `Today ${h}:${mm} ${ampm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${mm} ${ampm}`;
}
function render() {
  $('floor').value = state.floor || '';
  $('zone').value = state.zone || '';
  $('memo').value = state.memo || '';
  autoGrow($('memo'));

  if (state.photo) {
    $('phImg').src = state.photo;
    $('phImg').style.display = 'block';
    $('phEmpty').style.display = 'none';
    $('phRemove').style.display = 'block';
  } else {
    $('phImg').style.display = 'none';
    $('phEmpty').style.display = 'flex';
    $('phRemove').style.display = 'none';
  }

  const parked = !!state.savedAt;
  $('status').classList.toggle('on', parked);
  $('statusText').textContent = parked ? 'Parked' : 'Empty';
  $('when').textContent = parked ? fmt(state.savedAt) : '—';
  $('bPrimary').textContent = parked ? 'Left' : 'I parked here';
  updateClear();
}
function updateClear() {
  const empty = !state.floor && !state.zone && !state.memo && !state.photo;
  $('bClear').disabled = !!state.savedAt || empty;
}
function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.max(46, el.scrollHeight) + 'px';
}

['floor', 'zone'].forEach((id) =>
  $(id).addEventListener('input', (e) => {
    state[id] = e.target.value.toUpperCase();
    e.target.value = state[id];
    persist();
    updateClear();
  }),
);
$('memo').addEventListener('input', (e) => {
  state.memo = e.target.value;
  autoGrow(e.target);
  persist();
  updateClear();
});

$('bPrimary').addEventListener('click', () => {
  if (state.savedAt) {
    resetAll();
    toast("You're out: drive safe");
    return;
  }
  if (!state.floor && !state.zone && !state.memo && !state.photo) {
    toast('Add a spot or photo first');
    return;
  }
  state.savedAt = Date.now();
  persist();
  render();
  toast('Saved ✓');
});

$('phEmpty').addEventListener('click', () => $('fileInput').click());
$('phImg').addEventListener('click', () => $('fileInput').click());
$('phRemove').addEventListener('click', () => {
  state.photo = '';
  persist();
  render();
});
$('fileInput').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    resizePhoto(ev.target.result, (data) => {
      state.photo = data;
      persist();
      render();
      toast('Photo added ✓');
    });
  };
  reader.readAsDataURL(f);
  e.target.value = '';
});
function resizePhoto(dataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    const max = 1000,
      s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = img.width * s;
    c.height = img.height * s;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    cb(c.toDataURL('image/jpeg', 0.82));
  };
  img.src = dataUrl;
}

function resetAll() {
  state = { floor: '', zone: '', memo: '', photo: '', savedAt: null };
  persist();
  render();
}
$('bClear').addEventListener('click', () => {
  if (!confirm('Clear everything and start a new spot?')) return;
  resetAll();
  toast('Cleared: Ready for a new spot');
});

// Widget hint: show only the user's OS, and stay hidden once dismissed
(function () {
  const hint = $('hint');
  try {
    if (localStorage.getItem('hint_dismissed') === '1') {
      hint.style.display = 'none';
      return;
    }
  } catch (e) {}
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) $('hintAndroid').style.display = 'none';
  else if (/Android/i.test(ua)) $('hintIos').style.display = 'none';
  $('hintClose').addEventListener('click', () => {
    hint.style.display = 'none';
    try {
      localStorage.setItem('hint_dismissed', '1');
    } catch (e) {}
  });
})();

load();
render();
