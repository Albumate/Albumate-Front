async function loadSidebar() {
  const sidebar = document.getElementById('sidebar');
  const nickname = localStorage.getItem('nickname') || '사용자';
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('access_token');
  let albums = [];
  
  if (userId && token) {
    const res = await fetch(`${API_BASE_URL}/api/albums/${userId}/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('사이드바 앨범 목록 응답:', data);
    
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
    
    console.log('사이드바 파싱된 앨범:', albums);
  }

  // sidebar의 기존 내용을 업데이트
  const sidebarTitle = sidebar.querySelector('.sidebar-title');
  const albumsList = sidebar.querySelector('.albums-list');
  
  if (sidebarTitle) {
    sidebarTitle.textContent = `${nickname}의 Albumate`;
  }
  
  if (albumsList) {
    albumsList.innerHTML = (albums || []).map(a => 
      `<a href="/album/${a.id}" class="album-link">${a.title}</a>`
    ).join('');
  }
  
  // 로그아웃 버튼 이벤트 리스너
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.clear();
      window.location.href = '/login';
    };
  }
}