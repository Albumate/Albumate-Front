document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadAlbums();
  document.getElementById('add-album-btn').onclick = openAlbumModal;
});

async function loadAlbums() {
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/albums/${userId}/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
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

  // 각 앨범의 최근 사진을 비동기로 불러와서 타일에 표시
  for (const album of albums || []) {
    const div = document.createElement('div');
    div.className = 'grid-item album-item album-preview-tile';
    // 최근 사진 불러오기
    let photoUrl = '/static/img/album_placeholder.svg'; // 기본 이미지
    try {
      // API 문서에 따라 album.id 대신 album.id 사용 (AlbumResp의 id 필드)
      const photoRes = await fetch(`${API_BASE_URL}/api/albums/${album.id}/latest-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('photoRes status:', photoRes.status); // 디버깅
      if (photoRes.ok) {
        const photoData = await photoRes.json();
        console.log('photoData:', photoData); // 디버깅
        
        let data = photoData.data;
        // data가 문자열이면 JSON 파싱
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            data = {};
          }
        }
        
        if (data && data.url) {
          photoUrl = data.url;
          console.log('최종 photoUrl:', photoUrl); // 디버깅
        }
      }
    } catch (e) {
      console.error('latest-photo API 에러:', e); // 디버깅
    }
    div.innerHTML = `
      <div class="album-thumb-wrap">
        <img src="${photoUrl}" class="album-thumb" />
        <div class="album-thumb-title">${album.title}</div>
      </div>
    `;
    // API 문서에 따라 album.id 사용
    div.onclick = () => { window.location.href = `/album/${album.id}`; };
    grid.appendChild(div);
  }
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
  console.log(data); // 구조 확인

  let albumData = data.data;
  if (typeof albumData === 'string') {
    try {
      albumData = JSON.parse(albumData);
    } catch (e) {
      albumData = {};
    }
  }
  
  // API 문서에 따라 id 필드 사용
  const albumId = albumData.id;
  
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
    alert('앨범 생성 실패');
  }
}