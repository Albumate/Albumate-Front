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
    albums = data.data || [];
    if (typeof albums === 'string') {
      try {
        albums = JSON.parse(albums);
      } catch (e) {
        albums = [];
      }
    }
  }
  sidebar.innerHTML = `
    <div class="sidebar-top-fixed">
      <div class="nickname">${nickname}의 Albumate</div>
      <a href="/home" class="sidebar-link">홈페이지</a>
      <a href="/invitations" class="sidebar-link">초대받은 앨범</a>
    </div>
    <div class="sidebar-albums-scroll">
      ${albums.map(a => `<a href="/album/${a.id}" class="sidebar-link">${a.title}</a>`).join('')}
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