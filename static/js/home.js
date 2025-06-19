document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadAlbums();
  document.getElementById('add-album-btn').onclick = openAlbumModal;
  
  // 모달 외부 클릭 이벤트 추가
  const modal = document.getElementById('album-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAlbumModal();
    }
  });
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAlbumModal();
    }
  });
});

async function loadAlbums() {
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/albums/${userId}/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('앨범 목록 응답:', data);
  
  let albums;
  if (Array.isArray(data)) {
    albums = data;
  } else if (data.data) {
    albums = data.data;
  } else {
    albums = [];
  }
  
  if (typeof albums === 'string') {
    try {
      albums = JSON.parse(albums);
    } catch (e) {
      albums = [];
    }
  }
  
  console.log('파싱된 앨범:', albums);
  
  const grid = document.getElementById('album-grid');
  const emptyState = document.getElementById('empty-state');
  
  grid.innerHTML = '';

  if (!albums || albums.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // 각 앨범의 최근 사진을 비동기로 불러와서 카드에 표시
  for (const album of albums) {
    const div = document.createElement('div');
    div.className = 'album-card';
    
    // 최근 사진 불러오기
    let photoUrl = '';
    try {
      const photoRes = await fetch(`${API_BASE_URL}/api/albums/${album.id}/latest-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('최신 사진 API 응답 상태:', photoRes.status);
      if (photoRes.ok) {
        const photoData = await photoRes.json();
        console.log('최신 사진 데이터:', photoData);
        
        let latestPhoto;
        if (photoData.data) {
          latestPhoto = photoData.data;
        } else {
          latestPhoto = photoData;
        }
        
        if (typeof latestPhoto === 'string') {
          try {
            latestPhoto = JSON.parse(latestPhoto);
          } catch (e) {
            latestPhoto = {};
          }
        }
        
        if (latestPhoto && latestPhoto.url) {
          photoUrl = latestPhoto.url;
          console.log('최종 photoUrl:', photoUrl);
        }
      }
    } catch (e) {
      console.error('latest-photo API 에러:', e);
    }

    div.innerHTML = `
      <div class="album-thumbnail">
        ${photoUrl ? 
          `<img src="${photoUrl}" alt="${album.title}" />` : 
          `<div class="album-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>`
        }
      </div>
      <div class="album-info">
        <h3 class="album-title-text">${album.title}</h3>
        <p class="album-description">${album.description || ''}</p>
        <div class="album-meta">
          <div class="album-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>${new Date(album.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
    
    div.onclick = () => { window.location.href = `/album/${album.id}`; };
    grid.appendChild(div);
  }
}

function openAlbumModal() {
  const modal = document.getElementById('album-modal');
  modal.style.display = 'flex'; // flex로 설정하여 중앙 정렬
}

function closeAlbumModal() {
  const modal = document.getElementById('album-modal');
  modal.style.display = 'none';
  // 입력 필드 초기화
  document.getElementById('album-title').value = '';
  document.getElementById('album-desc').value = '';
  document.getElementById('album-invites').value = '';
}

// 이메일 유효성 체크 함수 (album.js와 동일하게 복사)
async function checkInviteEmailsValid(emails) {
  const invalidEmails = [];
  for (const email of emails) {
    const res = await fetch(`${API_BASE_URL}/api/auth/email-check`, {
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
  if (invite_emails.length > 0 && invite_emails.includes(myEmail)) {
    alert('본인 이메일은 초대할 수 없습니다.');
    return;
  }

  // 유효하지 않은 이메일 체크
  if (invite_emails.length > 0) {
    const invalidEmails = await checkInviteEmailsValid(invite_emails);
    if (invalidEmails.length > 0) {
      alert(`유효하지 않은 이메일: ${invalidEmails.join(', ')}`);
      return;
    }
  }

  const token = localStorage.getItem('access_token');
  
  // API 문서에 따라 AlbumDTO 구조로 요청 (invite_emails 제거)
  const res = await fetch(`${API_BASE_URL}/api/albums/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    alert(errorData.message || '앨범 생성 실패');
    return;
  }
  
  const data = await res.json();
  console.log('앨범 생성 응답:', data); // 구조 확인

  // API가 앨범 데이터를 직접 반환하므로 data.id를 바로 사용
  const albumId = data.id;
  
  console.log('최종 albumId:', albumId); // 디버깅 추가
  
  if (albumId) {
    closeAlbumModal();
    
    // 초대 이메일이 있다면 개별적으로 초대 API 호출
    if (invite_emails.length > 0) {
      for (const email of invite_emails) {
        try {
          await fetch(`${API_BASE_URL}/api/albums/${albumId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: email.trim() })
          });
        } catch (e) {
          console.error(`초대 실패 (${email}):`, e);
        }
      }
    }
    
    window.location.href = `/album/${albumId}`;
  } else {
    console.error('albumId를 찾을 수 없습니다. 전체 응답:', data);
    alert('앨범 생성은 성공했지만 ID를 가져올 수 없습니다.');
  }
}