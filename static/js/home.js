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

async function createAlbum() {
  const title = document.getElementById('album-title').value;
  const description = document.getElementById('album-desc').value;
  const invite_emails = document.getElementById('album-invites').value
    .split(',').map(e => e.trim()).filter(e => e);
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