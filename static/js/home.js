document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadAlbums();
  document.getElementById('add-album-btn').onclick = openAlbumModal;
});

async function loadAlbums() {
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${userId}/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(data);
  let albums = data.data;
  if (typeof albums === 'string') {
    try {
      albums = JSON.parse(albums);
    } catch (e) {
      albums = [];
    }
  }
  const grid = document.getElementById('album-grid');
  grid.innerHTML = '';
  (albums || []).forEach(album => {
    const div = document.createElement('div');
    div.className = 'grid-item album-item';
    div.innerHTML = `<div class="album-title">${album.title}</div>
      <div class="album-desc">${album.description || ''}</div>`;
    div.onclick = () => { window.location.href = `/album/${album.album_id}`; };
    grid.appendChild(div);
  });
}

function openAlbumModal() {
  document.getElementById('album-modal').style.display = 'block';
}
function closeAlbumModal() {
  document.getElementById('album-modal').style.display = 'none';
}

// 이메일 유효성 체크 함수 (album.js와 동일하게 복사)
async function checkInviteEmailsValid(emails) {
  const invalidEmails = [];
  for (const email of emails) {
    const res = await fetch('/api/auth/email-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: email.trim() })
    });
    // 409: 이미 존재하는 이메일(=유효함), 200: 사용 가능한 이메일(=유효하지 않음)
    if (res.status === 200) {
      invalidEmails.push(email.trim());
    }
    // 409는 이미 가입된 이메일이므로 초대 가능
  }
  return invalidEmails;
}

async function createAlbum() {
  const title = document.getElementById('album-title').value;
  const description = document.getElementById('album-desc').value;
  const invite_emails = document.getElementById('album-invites').value
    .split(',').map(e => e.trim()).filter(e => e);

  // 본인 이메일 체크
  const myEmail = localStorage.getItem('username');
  if (invite_emails.includes(myEmail)) {
    alert('본인 이메일은 초대할 수 없습니다.');
    return;
  }

  // 유효하지 않은 이메일 체크
  const invalidEmails = await checkInviteEmailsValid(invite_emails);
  if (invalidEmails.length > 0) {
    alert(`유효하지 않은 이메일: ${invalidEmails.join(', ')}`);
    return;
  }

  const token = localStorage.getItem('access_token');
  const res = await fetch('/api/albums/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description, invite_emails })
  });
  const data = await res.json();
  console.log(data); // 구조 확인

  let albumData = data.data;
  if (typeof albumData === 'string') {
    try {
      albumData = JSON.parse(albumData);
    } catch (e) {
      albumData = {};
    }
  }
  const albumId = albumData.album_id;
  if (albumId) {
    closeAlbumModal();
    window.location.href = `/album/${albumId}`;
  } else {
    alert(data.message || '앨범 생성 실패');
  }
}