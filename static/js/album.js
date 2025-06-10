const albumId = window.location.pathname.split('/').pop();

document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadAlbumInfo();
  loadPhotos();
  document.getElementById('add-photo-btn').onclick = openPhotoModal;
  document.getElementById('invite-btn').onclick = openInviteModal;
  document.getElementById('leave-btn').onclick = openLeaveModal;
  document.getElementById('members-btn').onclick = openMembersModal;
});

async function loadAlbumInfo() {
  const albumId = window.location.pathname.split('/').pop();
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(data); // 응답 구조 확인

  let albumData = data.data;
  if (typeof albumData === 'string') {
    try {
      albumData = JSON.parse(albumData);
    } catch (e) {
      albumData = {};
    }
  }
  const title = albumData.title || '';
  document.getElementById('album-title').textContent = title;
}

async function loadPhotos() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/photos/?album_id=${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  (data || []).forEach(photo => {
    const div = document.createElement('div');
    div.className = 'grid-item photo-item';
    div.innerHTML = `<img src="${photo.url}" alt="" class="photo-thumb" />
      <div class="photo-date">${photo.created_at.slice(0, 10)}</div>`;
    div.onclick = () => { window.location.href = `/photo/${photo.photo_id}`; };
    grid.appendChild(div);
  });
}

function openPhotoModal() { document.getElementById('photo-modal').style.display = 'block'; }
function closePhotoModal() { document.getElementById('photo-modal').style.display = 'none'; }
async function uploadPhoto() {
  const file = document.getElementById('photo-file').files[0];
  if (!file) return alert('사진을 선택하세요.');
  const token = localStorage.getItem('access_token');
  const form = new FormData();
  form.append('file', file);
  form.append('album_id', albumId);
  const res = await fetch('/api/photos/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (res.ok) {
    closePhotoModal();
    loadPhotos();
  } else {
    const data = await res.json();
    alert(data.message);
  }
}

function openInviteModal() { document.getElementById('invite-modal').style.display = 'block'; }
function closeInviteModal() { document.getElementById('invite-modal').style.display = 'none'; }
async function inviteMembers() {
  const emails = document.getElementById('invite-emails').value
    .split(',').map(e => e.trim()).filter(e => e);
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${albumId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ invite_emails: emails })
  });
  const data = await res.json();
  if (res.ok) {
    closeInviteModal();
    alert('초대 완료');
  } else {
    alert(data.message);
  }
}

function openLeaveModal() { document.getElementById('leave-modal').style.display = 'block'; }
function closeLeaveModal() { document.getElementById('leave-modal').style.display = 'none'; }
async function leaveAlbum() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${albumId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    window.location.href = '/home';
  } else {
    const data = await res.json();
    alert(data.message);
  }
}

function openMembersModal() {
  loadMembers();
  document.getElementById('members-modal').style.display = 'block';
}
function closeMembersModal() {
  document.getElementById('members-modal').style.display = 'none';
}

async function loadMembers() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let members = data.data || [];
  if (typeof members === 'string') {
    try {
      members = JSON.parse(members);
    } catch (e) {
      members = [];
    }
  }
  const listDiv = document.getElementById('members-list');
  listDiv.innerHTML = members.length
    ? members.map(m => `${m.nickname}`).join('<br>')
    : '구성원이 없습니다.';
}