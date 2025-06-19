document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadInvitations();
});

async function loadInvitations() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/albums/invitations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('초대 목록 응답:', data);
  
  let invites;
  if (Array.isArray(data)) {
    invites = data;
  } else if (data.data) {
    invites = data.data;
  } else {
    invites = [];
  }
  
  if (typeof invites === 'string') {
    try {
      invites = JSON.parse(invites);
    } catch (e) {
      invites = [];
    }
  }
  
  const pendingInvites = (invites || []).filter(invite => invite.status === 'pending');
  console.log('pending 초대 목록:', pendingInvites);
  
  const list = document.getElementById('invite-list');
  const emptyState = document.getElementById('invitations-empty-state');
  const invitationBadge = document.getElementById('invitation-badge');
  const newInvitationsBadge = document.getElementById('new-invitations-badge');
  
  list.innerHTML = '';
  
  if (pendingInvites.length === 0) {
    emptyState.style.display = 'block';
    invitationBadge.style.display = 'none';
    newInvitationsBadge.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  
  // 배지 업데이트
  if (pendingInvites.length > 0) {
    invitationBadge.textContent = pendingInvites.length;
    invitationBadge.style.display = 'inline';
    newInvitationsBadge.textContent = `${pendingInvites.length}개의 새 초대`;
    newInvitationsBadge.style.display = 'inline';
  }

  // 각 초대에 대해 앨범 정보와 초대한 사람 정보를 별도로 조회
  for (const invite of pendingInvites) {
    console.log('개별 초대:', invite);
    
    // 앨범 정보 조회
    let albumTitle = '알 수 없는 앨범';
    let albumDescription = '';
    let albumThumbnail = '';
    if (invite.album_id) {
      try {
        const albumRes = await fetch(`${API_BASE_URL}/api/albums/${invite.album_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (albumRes.ok) {
          const albumData = await albumRes.json();
          let album = albumData.data || albumData;
          if (typeof album === 'string') {
            try { album = JSON.parse(album); } catch (e) { album = {}; }
          }
          albumTitle = album.title || '알 수 없는 앨범';
          albumDescription = album.description || '';
          
          // 최근 사진 조회
          try {
            const photoRes = await fetch(`${API_BASE_URL}/api/albums/${invite.album_id}/latest-photo`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (photoRes.ok) {
              const photoData = await photoRes.json();
              let latestPhoto = photoData.data || photoData;
              if (typeof latestPhoto === 'string') {
                try { latestPhoto = JSON.parse(latestPhoto); } catch (e) { latestPhoto = {}; }
              }
              if (latestPhoto && latestPhoto.url) {
                albumThumbnail = latestPhoto.url;
              }
            }
          } catch (e) {
            console.error('최신 사진 조회 실패:', e);
          }
        }
      } catch (e) {
        console.error('앨범 정보 조회 실패:', e);
      }
    }
    
    // 초대한 사람 정보 조회
    let fromNickname = '알 수 없는 사용자';
    let fromEmail = '';
    if (invite.inviter_id) {
      try {
        const userRes = await fetch(`${API_BASE_URL}/api/auth/${invite.inviter_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          let user = userData.data || userData;
          if (typeof user === 'string') {
            try { user = JSON.parse(user); } catch (e) { user = {}; }
          }
          fromNickname = user.nickname || '알 수 없는 사용자';
          fromEmail = user.username || '';
        }
      } catch (e) {
        console.error('사용자 정보 조회 실패:', e);
      }
    }
    
    const card = document.createElement('div');
    card.className = 'invitation-card new-invitation';
    card.innerHTML = `
      <div class="invitation-content">
        <!-- Album Thumbnail -->
        <div class="invitation-thumbnail">
          ${albumThumbnail ? 
            `<img src="${albumThumbnail}" alt="${albumTitle}" />` : 
            `<div class="invitation-thumbnail-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>`
          }
        </div>

        <!-- Invitation Info -->
        <div class="invitation-info">
          <div class="invitation-header">
            <div class="invitation-title-container">
              <h3 class="invitation-title">
                ${albumTitle}
                <span class="new-badge">NEW</span>
              </h3>
              <p class="invitation-description">${albumDescription}</p>
              <div class="invitation-meta">
                <div class="invitation-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>${fromNickname}</span>
                </div>
                ${fromEmail ? `
                <div class="invitation-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>${fromEmail}</span>
                </div>
                ` : ''}
                <div class="invitation-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>${new Date(invite.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="invitation-actions">
              <button class="invitation-btn accept" onclick="acceptInvite('${invite.invite_token}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                수락
              </button>
              <button class="invitation-btn decline" onclick="rejectInvite('${invite.invite_token}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                거절
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    list.appendChild(card);
  }
}

async function acceptInvite(inviteToken) {
  const token = localStorage.getItem('access_token');
  
  // 버튼 비활성화하여 중복 클릭 방지
  const buttons = document.querySelectorAll(`button[onclick*="${inviteToken}"]`);
  buttons.forEach(btn => btn.disabled = true);
  
  const res = await fetch(`${API_BASE_URL}/api/albums/invitations/${inviteToken}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (res.ok) {
    alert('초대를 수락했습니다.');
    // 해당 초대 항목을 즉시 제거
    const inviteElement = document.querySelector(`button[onclick*="${inviteToken}"]`).closest('.invitation-card');
    if (inviteElement) {
      inviteElement.remove();
    }
    // 목록이 비었는지 확인
    const list = document.getElementById('invite-list');
    if (list.children.length === 0) {
      document.getElementById('invitations-empty-state').style.display = 'block';
      document.getElementById('invitation-badge').style.display = 'none';
      document.getElementById('new-invitations-badge').style.display = 'none';
    } else {
      // 배지 업데이트
      const remainingCount = list.children.length;
      const invitationBadge = document.getElementById('invitation-badge');
      const newInvitationsBadge = document.getElementById('new-invitations-badge');
      invitationBadge.textContent = remainingCount;
      newInvitationsBadge.textContent = `${remainingCount}개의 새 초대`;
    }
  } else {
    const data = await res.json();
    alert(data.message || '수락 실패');
    // 실패 시 버튼 다시 활성화
    buttons.forEach(btn => btn.disabled = false);
  }
}

async function rejectInvite(inviteToken) {
  const token = localStorage.getItem('access_token');
  
  // 버튼 비활성화하여 중복 클릭 방지
  const buttons = document.querySelectorAll(`button[onclick*="${inviteToken}"]`);
  buttons.forEach(btn => btn.disabled = true);
  
  const res = await fetch(`${API_BASE_URL}/api/albums/invitations/${inviteToken}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (res.ok) {
    alert('초대를 거절했습니다.');
    // 해당 초대 항목을 즉시 제거
    const inviteElement = document.querySelector(`button[onclick*="${inviteToken}"]`).closest('.invitation-card');
    if (inviteElement) {
      inviteElement.remove();
    }
    // 목록이 비었는지 확인
    const list = document.getElementById('invite-list');
    if (list.children.length === 0) {
      document.getElementById('invitations-empty-state').style.display = 'block';
      document.getElementById('invitation-badge').style.display = 'none';
      document.getElementById('new-invitations-badge').style.display = 'none';
    } else {
      // 배지 업데이트
      const remainingCount = list.children.length;
      const invitationBadge = document.getElementById('invitation-badge');
      const newInvitationsBadge = document.getElementById('new-invitations-badge');
      invitationBadge.textContent = remainingCount;
      newInvitationsBadge.textContent = `${remainingCount}개의 새 초대`;
    }
  } else {
    const data = await res.json();
    alert(data.message || '거절 실패');
    // 실패 시 버튼 다시 활성화
    buttons.forEach(btn => btn.disabled = false);
  }
}