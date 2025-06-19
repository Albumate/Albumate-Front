const albumId = window.location.pathname.split('/').pop();

document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadAlbumInfo();
  loadPhotos();
  document.getElementById('add-photo-btn').onclick = openPhotoModal;
  document.getElementById('invite-btn').onclick = openInviteModal;
  document.getElementById('leave-btn').onclick = openLeaveModal;
  document.getElementById('info-btn').onclick = openInfoModal;
  
  // 모달 외부 클릭 시 닫기
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
});

async function loadAlbumInfo() {
  const albumId = window.location.pathname.split('/').pop();
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  const res = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let albumData = data;
  if (typeof albumData === 'string') {
    try { albumData = JSON.parse(albumData); } catch (e) { albumData = {}; }
  }
  const title = albumData.title || '';
  document.getElementById('album-title').textContent = title;

  // 사이드바에서 현재 앨범 강조
  const albumLinks = document.querySelectorAll('.album-link');
  albumLinks.forEach(link => {
    link.classList.remove('current');
    if (link.href.endsWith(`/album/${albumId}`)) {
      link.classList.add('current');
    }
  });

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
  console.log('사진 목록 응답:', data);
  
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
  
  console.log('파싱된 사진 목록:', photos);
  
  const grid = document.getElementById('photo-grid');
  const emptyState = document.getElementById('photo-empty-state');
  
  // null 체크 추가
  if (!grid) {
    console.error('photo-grid 요소를 찾을 수 없습니다');
    return;
  }
  
  grid.innerHTML = '';
  
  if (!photos || photos.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
    } else {
      // emptyState가 없으면 직접 메시지 표시
      grid.innerHTML = `
        <div class="photo-empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
          <h3 class="empty-title">사진이 없습니다</h3>
          <p class="empty-desc">첫 번째 사진을 업로드해보세요</p>
          <button class="empty-btn" onclick="openPhotoModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            사진 추가
          </button>
        </div>
      `;
    }
    return;
  }
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  // 각 사진에 대해 업로더 정보를 조회하여 카드 생성
  for (const photo of photos) {
    console.log('개별 사진 데이터:', photo);
    
    // 업로더 정보 조회
    let uploaderName = '알 수 없는 사용자';
    if (photo.uploader_id) {
      try {
        const userRes = await fetch(`${API_BASE_URL}/api/auth/${photo.uploader_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          let user = userData.data || userData;
          if (typeof user === 'string') {
            try { user = JSON.parse(user); } catch (e) { user = {}; }
          }
          uploaderName = user.nickname || '알 수 없는 사용자';
        }
      } catch (e) {
        console.error('업로더 정보 조회 실패:', e);
      }
    }
    
    const div = document.createElement('div');
    div.className = 'photo-item';
    div.innerHTML = `
      <div class="photo-card">
        <img src="${photo.url}" alt="Album photo" />
        <div class="photo-overlay">
          <div class="photo-info">
            <div class="photo-uploader">${uploaderName}</div>
            <div class="photo-date">${photo.uploaded_at ? photo.uploaded_at.slice(0, 10) : ''}</div>
          </div>
        </div>
      </div>
    `;
    div.onclick = () => { window.location.href = `/photo/${photo.id}`; };
    grid.appendChild(div);
  }
}

function openPhotoModal() { 
  document.getElementById('photo-modal').style.display = 'flex'; 
}

function closePhotoModal() { 
  document.getElementById('photo-modal').style.display = 'none'; 
  const photoFile = document.getElementById('photo-file');
  if (photoFile) photoFile.value = '';
}

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

function openInviteModal() { 
  document.getElementById('invite-modal').style.display = 'flex'; 
}

function closeInviteModal() { 
  document.getElementById('invite-modal').style.display = 'none'; 
  const inviteEmails = document.getElementById('invite-emails');
  if (inviteEmails) inviteEmails.value = '';
}

function openInfoModal() {
  loadAlbumDetailAndMembers();
  document.getElementById('info-modal').style.display = 'flex';
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
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  
  // 앨범 정보 표시
  const infoCreatedDate = document.getElementById('info-created-date');
  if (infoCreatedDate) {
    infoCreatedDate.textContent = album.created_at ? album.created_at.slice(0,10) : '-';
  }
  
  // 생성자 정보 조회
  let creatorName = '알 수 없는 사용자';
  if (album.owner_id) {
    try {
      const creatorRes = await fetch(`${API_BASE_URL}/api/auth/${album.owner_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (creatorRes.ok) {
        const creatorData = await creatorRes.json();
        let creator = creatorData.data || creatorData;
        if (typeof creator === 'string') {
          try { creator = JSON.parse(creator); } catch (e) { creator = {}; }
        }
        creatorName = creator.nickname || '알 수 없는 사용자';
      }
    } catch (e) {
      console.error('생성자 정보 조회 실패:', e);
    }
  }
  const infoCreator = document.getElementById('info-creator');
  if (infoCreator) {
    infoCreator.textContent = creatorName;
  }

  // 구성원 정보
  const membersRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const membersData = await membersRes.json();
  console.log('구성원 응답:', membersData);
  
  let memberIds;
  if (Array.isArray(membersData)) {
    memberIds = membersData;
  } else if (membersData.data) {
    memberIds = membersData.data;
  } else {
    memberIds = [];
  }
  
  console.log('구성원 ID 배열:', memberIds);
  
  // 구성원 수 업데이트
  const infoMemberCount = document.getElementById('info-member-count');
  if (infoMemberCount) {
    infoMemberCount.textContent = `${memberIds.length}명`;
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
          is_owner: isOwner,
          joined_at: '알 수 없음' // API에서 가입일 정보가 없으므로
        });
      }
    } catch (e) {
      console.error(`사용자 정보 조회 실패 (${userId}):`, e);
      const isOwner = String(userId) === String(album.owner_id);
      members.push({
        id: userId,
        nickname: '알 수 없음',
        email: '',
        is_owner: isOwner,
        joined_at: '알 수 없음'
      });
    }
  }
  
  console.log('파싱된 구성원:', members);
  
  // 구성원 목록 표시
  const membersList = document.getElementById('members-list');
  if (membersList) {
    if (members.length === 0) {
      membersList.innerHTML = '<p style="color: #6b7280; margin: 0;">구성원이 없습니다.</p>';
    } else {
      membersList.innerHTML = members.map(member => `
        <div class="member-item">
          <div class="member-info">
            <div class="member-name">
              ${member.nickname}
              ${member.is_owner ? '<span class="owner-badge">소유자</span>' : ''}
            </div>
            <div class="member-email">${member.email}</div>
          </div>
          <div class="member-joined">가입: ${member.joined_at}</div>
        </div>
      `).join('');
    }
  }
}

function openLeaveModal() { 
  document.getElementById('leave-modal').style.display = 'flex'; 
}

function closeLeaveModal() { 
  document.getElementById('leave-modal').style.display = 'none'; 
}

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

function openDeleteModal() {
  const deleteWarning = document.getElementById('delete-warning');
  if (deleteWarning) deleteWarning.textContent = '';
  document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
}

// 나머지 함수들은 기존과 동일
async function checkInviteEmailsValid(emails) {
  const invalidEmails = [];
  for (const email of emails) {
    const res = await fetch(`${API_BASE_URL}/api/auth/email-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: email.trim() })
    });
    if (res.status === 200) {
      invalidEmails.push(email.trim());
    }
  }
  return invalidEmails;
}

async function inviteMembers() {
  const input = document.getElementById('invite-emails').value;
  const emails = input.split(',').map(e => e.trim()).filter(e => e);
  if (emails.length === 0) {
    alert('초대할 이메일을 입력하세요.');
    return;
  }

  const myEmail = localStorage.getItem('username');
  if (emails.includes(myEmail)) {
    alert('본인 이메일은 초대할 수 없습니다.');
    return;
  }

  const token = localStorage.getItem('access_token');
  
  const albumRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  
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
  
  console.log('기존 구성원 이메일:', memberEmails);
  
  const alreadyMemberEmails = emails.filter(e => memberEmails.includes(e));
  if (alreadyMemberEmails.length > 0) {
    alert(`이미 앨범에 속한 구성원: ${alreadyMemberEmails.join(', ')}`);
    return;
  }

  const invalidEmails = await checkInviteEmailsValid(emails);
  if (invalidEmails.length > 0) {
    alert(`유효하지 않은 이메일: ${invalidEmails.join(', ')}`);
    return;
  }

  let successCount = 0;
  let failedEmails = [];
  
  for (const email of emails) {
    try {
      console.log(`초대 시도: ${email}`);
      const inviteRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() })
      });
      
      console.log(`초대 응답 (${email}):`, inviteRes.status);
      
      if (inviteRes.ok) {
        successCount++;
      } else {
        const inviteData = await inviteRes.json();
        console.log(`초대 실패 데이터 (${email}):`, inviteData);
        failedEmails.push(`${email} (${inviteData.message})`);
      }
    } catch (e) {
      console.error(`초대 네트워크 오류 (${email}):`, e);
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

async function confirmDeleteAlbum() {
  const token = localStorage.getItem('access_token');
  
  const albumRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const albumData = await albumRes.json();
  let album = albumData;
  if (typeof album === 'string') {
    try { album = JSON.parse(album); } catch (e) { album = {}; }
  }
  
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
  
  console.log('구성원 ID 배열:', memberIds);
  console.log('앨범 소유자 ID:', album.owner_id);
  
  const nonOwnerMembers = memberIds.filter(memberId => String(memberId) !== String(album.owner_id));
  
  console.log('소유자 제외 구성원:', nonOwnerMembers);
  
  if (nonOwnerMembers.length > 0) {
    const deleteWarning = document.getElementById('delete-warning');
    if (deleteWarning) {
      deleteWarning.textContent = '구성원이 남아있으면 앨범을 삭제할 수 없습니다.';
    }
    return;
  }
  
  const delRes = await fetch(`${API_BASE_URL}/api/albums/${albumId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (delRes.ok) {
    alert('앨범이 삭제되었습니다.');
    window.location.href = '/home';
  } else {
    const delData = await delRes.json();
    const deleteWarning = document.getElementById('delete-warning');
    if (deleteWarning) {
      deleteWarning.textContent = delData.message || '삭제 실패';
    }
  }
}