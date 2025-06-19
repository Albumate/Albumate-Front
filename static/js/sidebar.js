async function loadSidebar() {
  const sidebar = document.getElementById('sidebar');
  const nickname = localStorage.getItem('nickname') || '';
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('access_token');
  let albums = [];
  if (userId && token) {
    const res = await fetch(`${API_BASE_URL}/api/albums/${userId}/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('사이드바 앨범 목록 응답:', data); // 디버깅 추가
    
    // API 응답 구조 확인 - home.js와 동일한 처리
    if (Array.isArray(data)) {
      // 배열을 직접 반환하는 경우
      albums = data;
    } else if (data.data) {
      // data 속성으로 감싸서 반환하는 경우
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
    
    console.log('사이드바 파싱된 앨범:', albums); // 디버깅 추가
  }
  sidebar.innerHTML = `
    <div class="sidebar-top-fixed">
      <div class="nickname">${nickname}의 Albumate</div>
      <a href="/home" class="sidebar-link">홈페이지</a>
      <a href="/invitations" class="sidebar-link">초대받은 앨범</a>
    </div>
    <div class="sidebar-albums-scroll">
      ${(albums || []).map(a => `<a href="/album/${a.id}" class="sidebar-link">${a.title}</a>`).join('')}
    </div>
    <div class="sidebar-bottom-fixed">
      <button id="logout-btn">로그아웃</button>
    </div>
  `;
  document.getElementById('logout-btn').onclick = () => {
    localStorage.clear();
    window.location.href = '/login';
  };
}