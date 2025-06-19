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
  const albumRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  // API가 앨범 데이터를 직접 반환하므로 albumData를 바로 사용
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  document.getElementById('album-info').innerHTML = `
    <b>앨범명:</b> ${album.title || ''}<br>
    <b>설명:</b> ${album.description || ''}<br>
    <b>생성일:</b> ${album.created_at ? album.created_at.slice(0,10) : ''}
  `;

  // 구성원 정보
  const membersRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const membersData = await membersRes.json();
  console.log('구성원 응답:', membersData); // 디버깅 추가
  
  // API가 사용자 ID 배열을 반환하므로 각 ID로 사용자 정보를 조회
  let memberIds;
  if (Array.isArray(membersData)) {
    memberIds = membersData;
  } else if (membersData.data) {
    memberIds = membersData.data;
  } else {
    memberIds = [];
  }
  
  console.log('구성원 ID 배열:', memberIds); // 디버깅 추가
  
  // 각 구성원 ID로 사용자 정보 조회
  const members = [];
  for (const userId of memberIds) {
    try {
      const userRes = await fetch(`${API_BASE_URL}/api/auth/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        let user = userData.data || userData;
        if (typeof user === 'string') {
          try { user = JSON.parse(user); } catch (e) { user = {}; }
        }
        // 앨범 소유자인지 확인
        const isOwner = String(userId) === String(album.owner_id);
        members.push({
          id: userId,
          nickname: user.nickname || '알 수 없음',
          email: user.email || user.username || '',
          is_owner: isOwner
        });
      }
    } catch (e) {
      console.error(`사용자 정보 조회 실패 (${userId}):`, e);
      // 정보를 가져올 수 없는 경우에도 표시
      const isOwner = String(userId) === String(album.owner_id);
      members.push({
        id: userId,
        nickname: '알 수 없음',
        email: '',
        is_owner: isOwner
      });
    }
  }
  
  console.log('파싱된 구성원:', members); // 디버깅 추가
  
  document.getElementById('members-list').innerHTML = members.length
    ? members.map(m => m.is_owner ? `${m.nickname}(owner)` : m.nickname).join('<br>')
    : '구성원이 없습니다.';
}

async function loadAlbumInfo() {
  const albumId = window.location.pathname.split('/').pop();
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  const res = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  // API가 앨범 데이터를 직접 반환하므로 data를 바로 사용
  let albumData = data;
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
  const res = await fetch(`${API_BASE_URL}/api/photos/?album_id=${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('사진 목록 응답:', data); // 디버깅 추가
  
  // API 응답 구조 확인
  let photos;
  if (Array.isArray(data)) {
    photos = data;
  } else if (data.data) {
    photos = data.data;
  } else {
    photos = [];
  }
  
  if (typeof photos === 'string') {
    try {
      photos = JSON.parse(photos);
    } catch (e) {
      photos = [];
    }
  }
  
  console.log('파싱된 사진 목록:', photos); // 디버깅 추가
  
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  (photos || []).forEach(photo => {
    console.log('개별 사진 데이터:', photo); // 디버깅 추가
    const div = document.createElement('div');
    div.className = 'grid-item photo-item';
    // API 문서에 따라 uploaded_at 사용, id 사용
    div.innerHTML = `<img src="${photo.url}" alt="" class="photo-thumb" />
      <div class="photo-date">${photo.uploaded_at ? photo.uploaded_at.slice(0, 10) : ''}</div>`;
    div.onclick = () => { window.location.href = `/photo/${photo.id}`; };
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
  const res = await fetch(`${API_BASE_URL}/api/photos/`, {
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
    const res = await fetch(`${API_BASE_URL}/api/auth/email-check`, {
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

  // 이미 앨범에 속한 구성원 이메일 체크 - 구성원 정보 수정
  const token = localStorage.getItem('access_token');
  
  // 앨범 정보 조회 (owner_id 확인용)
  const albumRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  
  // 구성원 ID 배열 조회
  const res = await fetch(`${API_BASE_URL}/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let memberIds = Array.isArray(data) ? data : (data.data || []);
  if (typeof memberIds === 'string') {
    try {
      memberIds = JSON.parse(memberIds);
    } catch (e) {
      memberIds = [];
    }
  }
  
  // 각 구성원 ID로 사용자 정보 조회하여 이메일 수집
  const memberEmails = [];
  for (const userId of memberIds) {
    try {
      const userRes = await fetch(`${API_BASE_URL}/api/auth/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        let user = userData.data || userData;
        if (typeof user === 'string') {
          try { user = JSON.parse(user); } catch (e) { user = {}; }
        }
        const userEmail = user.email || user.username || '';
        if (userEmail) {
          memberEmails.push(userEmail);
        }
      }
    } catch (e) {
      console.error(`사용자 정보 조회 실패 (${userId}):`, e);
    }
  }
  
  console.log('기존 구성원 이메일:', memberEmails); // 디버깅 추가
  
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

  // API 문서에 따라 각 이메일을 개별적으로 초대
  let successCount = 0;
  let failedEmails = [];
  
  for (const email of emails) {
    try {
      console.log(`초대 시도: ${email}`); // 디버깅 추가
      const inviteRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() })
      });
      
      console.log(`초대 응답 (${email}):`, inviteRes.status); // 디버깅 추가
      
      if (inviteRes.ok) {
        successCount++;
      } else {
        const inviteData = await inviteRes.json();
        console.log(`초대 실패 데이터 (${email}):`, inviteData); // 디버깅 추가
        failedEmails.push(`${email} (${inviteData.message})`);
      }
    } catch (e) {
      console.error(`초대 네트워크 오류 (${email}):`, e); // 디버깅 추가
      failedEmails.push(`${email} (네트워크 오류)`);
    }
  }
  
  closeInviteModal();
  
  if (successCount > 0 && failedEmails.length === 0) {
    alert('모든 초대가 완료되었습니다.');
  } else if (successCount > 0 && failedEmails.length > 0) {
    alert(`${successCount}명 초대 완료. 실패: ${failedEmails.join(', ')}`);
  } else {
    alert(`모든 초대 실패: ${failedEmails.join(', ')}`);
  }
}

function openLeaveModal() { document.getElementById('leave-modal').style.display = 'block'; }
function closeLeaveModal() { document.getElementById('leave-modal').style.display = 'none'; }
async function leaveAlbum() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/albums/${albumId}/leave`, {
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
  
  // 앨범 정보 조회 (owner_id 확인용)
  const albumRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  
  // 구성원 ID 배열 조회
  const res = await fetch(`${API_BASE_URL}/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let memberIds = Array.isArray(data) ? data : (data.data || []);
  if (typeof memberIds === 'string') {
    try {
      memberIds = JSON.parse(memberIds);
    } catch (e) {
      memberIds = [];
    }
  }
  
  // 각 구성원 ID로 사용자 정보 조회
  const members = [];
  for (const userId of memberIds) {
    try {
      const userRes = await fetch(`${API_BASE_URL}/api/auth/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        let user = userData.data || userData;
        if (typeof user === 'string') {
          try { user = JSON.parse(user); } catch (e) { user = {}; }
        }
        const isOwner = String(userId) === String(album.owner_id);
        members.push({
          id: userId,
          nickname: user.nickname || '알 수 없음',
          email: user.email || user.username || '',
          is_owner: isOwner
        });
      }
    } catch (e) {
      console.error(`사용자 정보 조회 실패 (${userId}):`, e);
      const isOwner = String(userId) === String(album.owner_id);
      members.push({
        id: userId,
        nickname: '알 수 없음',
        email: '',
        is_owner: isOwner
      });
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
  const token = localStorage.getItem('access_token');
  
  // 앨범 정보 조회 (owner_id 확인용)
  const albumRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  
  // 구성원 ID 배열 조회
  const res = await fetch(`${API_BASE_URL}/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  
  // API가 구성원 ID 배열을 반환하므로 올바르게 처리
  let memberIds = Array.isArray(data) ? data : (data.data || []);
  if (typeof memberIds === 'string') {
    try { 
      memberIds = JSON.parse(memberIds); 
    } catch (e) { 
      memberIds = []; 
    }
  }
  
  console.log('구성원 ID 배열:', memberIds); // 디버깅 추가
  console.log('앨범 소유자 ID:', album.owner_id); // 디버깅 추가
  
  // owner를 제외한 다른 구성원이 있는지 확인
  const nonOwnerMembers = memberIds.filter(memberId => String(memberId) !== String(album.owner_id));
  
  console.log('소유자 제외 구성원:', nonOwnerMembers); // 디버깅 추가
  
  if (nonOwnerMembers.length > 0) {
    document.getElementById('delete-warning').textContent = '구성원이 남아있으면 앨범을 삭제할 수 없습니다.';
    return;
  }
  
  // 삭제 요청
  const delRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
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