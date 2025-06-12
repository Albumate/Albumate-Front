const albumId = window.location.pathname.split('/').pop();

document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadAlbumInfo();
  loadPhotos();
  document.getElementById('add-photo-btn').onclick = openPhotoModal;
  document.getElementById('invite-btn').onclick = openInviteModal;
  document.getElementById('leave-btn').onclick = openLeaveModal;
  document.getElementById('info-btn').onclick = openInfoModal; // 변경
});

function openInfoModal() {
  loadAlbumDetailAndMembers();
  document.getElementById('info-modal').style.display = 'block';
}
function closeInfoModal() {
  document.getElementById('info-modal').style.display = 'none';
}

async function loadAlbumDetailAndMembers() {
  const token = localStorage.getItem('access_token');
  // 앨범 정보
  const albumRes = await fetch(`/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  let album = albumData.data;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  document.getElementById('album-info').innerHTML = `
    <b>앨범명:</b> ${album.title || ''}<br>
    <b>설명:</b> ${album.description || ''}<br>
    <b>생성일:</b> ${album.created_at ? album.created_at.slice(0,10) : ''}
  `;

  // 구성원 정보
  const membersRes = await fetch(`/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const membersData = await membersRes.json();
  let members = membersData.data || [];
  if (typeof members === 'string') {
    try { members = JSON.parse(members); } catch (e) { members = []; }
  }
  document.getElementById('members-list').innerHTML = members.length
    ? members.map(m => m.is_owner ? `${m.nickname}(owner)` : m.nickname).join('<br>')
    : '구성원이 없습니다.';
}

async function loadAlbumInfo() {
  const albumId = window.location.pathname.split('/').pop();
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  const res = await fetch(`/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let albumData = data.data;
  if (typeof albumData === 'string') {
    try { albumData = JSON.parse(albumData); } catch (e) { albumData = {}; }
  }
  const title = albumData.title || '';
  document.getElementById('album-title').textContent = title;

  // 버튼 표시 제어
  const leaveBtn = document.getElementById('leave-btn');
  const deleteBtn = document.getElementById('delete-btn');
  if (albumData.is_owner || String(albumData.owner_id) === String(userId)) {
    leaveBtn.style.display = 'none';
    deleteBtn.style.display = '';
    deleteBtn.onclick = openDeleteModal;
  } else {
    leaveBtn.style.display = '';
    deleteBtn.style.display = 'none';
  }
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
async function checkInviteEmailsValid(emails) {
  const invalidEmails = [];
  for (const email of emails) {
    const res = await fetch('/api/auth/email-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: email.trim() })
    });
    // 409: 이미 존재하는 이메일(=유효함), 200: 사용 가능(=유효하지 않음)
    if (res.status === 200) {
      // 사용 가능한 이메일(=가입되지 않은 이메일)이므로 초대 불가
      invalidEmails.push(email.trim());
    }
    // 409는 이미 가입된 이메일이므로 초대 가능 (아무것도 하지 않음)
  }
  return invalidEmails;
}

// 초대 버튼 클릭 시 호출
async function inviteMembers() {
  const input = document.getElementById('invite-emails').value;
  const emails = input.split(',').map(e => e.trim()).filter(e => e);
  if (emails.length === 0) {
    alert('초대할 이메일을 입력하세요.');
    return;
  }

  // 현재 로그인한 사용자 이메일 가져오기
  const myEmail = localStorage.getItem('username');
  if (emails.includes(myEmail)) {
    alert('본인 이메일은 초대할 수 없습니다.');
    return;
  }

  // 이미 앨범에 속한 구성원 이메일 체크
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let members = data.data || [];
  if (typeof members === 'string') {
    try { members = JSON.parse(members); } catch (e) { members = []; }
  }
  const memberEmails = members.map(m => m.email);
  const alreadyMemberEmails = emails.filter(e => memberEmails.includes(e));
  if (alreadyMemberEmails.length > 0) {
    alert(`이미 앨범에 속한 구성원: ${alreadyMemberEmails.join(', ')}`);
    return;
  }

  // 유효하지 않은 이메일 체크
  const invalidEmails = await checkInviteEmailsValid(emails);
  if (invalidEmails.length > 0) {
    alert(`유효하지 않은 이메일: ${invalidEmails.join(', ')}`);
    return;
  }

  // 실제 초대 API 호출
  const inviteRes = await fetch(`/api/albums/${albumId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ invite_emails: emails })
  });
  const inviteData = await inviteRes.json();
  if (inviteRes.ok) {
    closeInviteModal();
    alert('초대 완료');
  } else {
    alert(inviteData.message);
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
    ? members.map(m => m.is_owner ? `${m.nickname}(owner)` : m.nickname).join('<br>')
    : '구성원이 없습니다.';
}

function openDeleteModal() {
  document.getElementById('delete-warning').textContent = '';
  document.getElementById('delete-modal').style.display = 'block';
}
function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
}
async function confirmDeleteAlbum() {
  // 구성원 수 확인
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let members = data.data || [];
  if (typeof members === 'string') {
    try { members = JSON.parse(members); } catch (e) { members = []; }
  }
  // owner 제외 멤버가 1명 이상이면 삭제 불가
  if (members.filter(m => !m.is_owner).length > 0) {
    document.getElementById('delete-warning').textContent = '구성원이 남아있으면 앨범을 삭제할 수 없습니다.';
    return;
  }
  // 삭제 요청
  const delRes = await fetch(`/api/albums/${albumId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (delRes.ok) {
    alert('앨범이 삭제되었습니다.');
    window.location.href = '/home';
  } else {
    const delData = await delRes.json();
    document.getElementById('delete-warning').textContent = delData.message || '삭제 실패';
  }
}