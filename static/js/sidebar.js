async function loadSidebar() {
  const sidebar = document.getElementById('sidebar');
  const nickname = localStorage.getItem('nickname') || '';
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('access_token');
  let albums = [];
  if (userId && token) {
    const res = await fetch(`/api/albums/${userId}/my`, {
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
    <div class="sidebar-top">
      <div class="nickname">${nickname}</div>
      <a href="/home" class="sidebar-link">홈페이지</a>
      <div class="sidebar-albums">
        ${albums.map(a => `<a href="/album/${a.album_id}" class="sidebar-link">${a.title}</a>`).join('')}
      </div>
    </div>
    <div class="sidebar-bottom">
      <button id="logout-btn">로그아웃</button>
    </div>
  `;
  document.getElementById('logout-btn').onclick = () => {
    localStorage.clear();
    window.location.href = '/login';
  };
}