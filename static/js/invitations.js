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
  console.log('초대 목록 응답:', data); // 디버깅 추가
  
  // API 응답 구조 확인 후 데이터 추출
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
  
  // pending 상태인 초대만 필터링
  const pendingInvites = (invites || []).filter(invite => invite.status === 'pending');
  console.log('pending 초대 목록:', pendingInvites); // 디버깅 추가
  
  const list = document.getElementById('invite-list');
  list.innerHTML = '';
  
  // 각 초대에 대해 앨범 정보와 초대한 사람 정보를 별도로 조회
  for (const invite of pendingInvites) {
    console.log('개별 초대:', invite); // 디버깅 추가
    
    // 앨범 정보 조회
    let albumTitle = '알 수 없는 앨범';
    let albumDescription = '';
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
        }
      } catch (e) {
        console.error('앨범 정보 조회 실패:', e);
      }
    }
    
    // 초대한 사람 정보 조회
    let fromNickname = '알 수 없는 사용자';
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
        }
      } catch (e) {
        console.error('사용자 정보 조회 실패:', e);
      }
    }
    
    const div = document.createElement('div');
    div.className = 'invite-item';
    div.innerHTML = `
      <b>${albumTitle}</b> - ${albumDescription}<br>
      <span style="color: #888;">초대한 사람: ${fromNickname}</span><br>
      <button onclick="acceptInvite('${invite.invite_token}')">수락</button>
      <button onclick="rejectInvite('${invite.invite_token}')">거절</button>
      <hr>
    `;
    list.appendChild(div);
  }
  
  if (pendingInvites.length === 0) {
    list.innerHTML = '<p>받은 초대가 없습니다.</p>';
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
    const inviteElement = document.querySelector(`button[onclick*="${inviteToken}"]`).closest('.invite-item');
    if (inviteElement) {
      inviteElement.remove();
    }
    // 목록이 비었는지 확인
    const list = document.getElementById('invite-list');
    if (list.children.length === 0) {
      list.innerHTML = '<p>받은 초대가 없습니다.</p>';
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
    const inviteElement = document.querySelector(`button[onclick*="${inviteToken}"]`).closest('.invite-item');
    if (inviteElement) {
      inviteElement.remove();
    }
    // 목록이 비었는지 확인
    const list = document.getElementById('invite-list');
    if (list.children.length === 0) {
      list.innerHTML = '<p>받은 초대가 없습니다.</p>';
    }
  } else {
    const data = await res.json();
    alert(data.message || '거절 실패');
    // 실패 시 버튼 다시 활성화
    buttons.forEach(btn => btn.disabled = false);
  }
}