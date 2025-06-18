const photoId = window.location.pathname.split('/').pop();

document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadPhotoDetail();
});

async function loadPhotoDetail() {
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  const res = await fetch(`${API_BASE_URL}/api/photos/${photoId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.message || '사진 정보를 불러올 수 없습니다.');
    return;
  }

  document.getElementById('photo-img').src = data.url;
  // API 문서에 따라 uploaded_at 사용
  document.getElementById('photo-date').textContent = new Date(data.uploaded_at).toLocaleString();

  // 앨범 제목 표시
  if (data.album_id) {
    const albumRes = await fetch(`${API_BASE_URL}/api/albums/${data.album_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const albumData = await albumRes.json();
    let albumInfo = albumData.data;
    if (typeof albumInfo === 'string') {
      try {
        albumInfo = JSON.parse(albumInfo);
      } catch (e) {
        albumInfo = {};
      }
    }
    const albumTitle = (albumInfo && albumInfo.title) || albumData.title || '';
    document.getElementById('album-title').textContent = albumTitle;
  }

  // 삭제 버튼 또는 업로더 닉네임 표시
  const deleteBtn = document.getElementById('delete-btn');
  const uploaderSpan = document.getElementById('uploader-nickname');
  
  // uploader_id 사용 (API에서 제공)
  if (data.uploader_id === userId) {
    deleteBtn.style.display = '';
    uploaderSpan.style.display = 'none';
    deleteBtn.onclick = async () => {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      const delRes = await fetch(`${API_BASE_URL}/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (delRes.ok) {
        alert('사진이 삭제되었습니다.');
        window.location.href = `/album/${data.album_id}`;
      } else {
        const delData = await delRes.json();
        alert(delData.message || '삭제 실패');
      }
    };
  } else {
    deleteBtn.style.display = 'none';
    // 업로더 닉네임 표시
    // uploader_id로 닉네임 조회
    if (data.uploader_id) {
      const userRes = await fetch(`${API_BASE_URL}/api/auth/${data.uploader_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      let nickname = (userData.data && userData.data.nickname) || userData.nickname || '알 수 없음';
      uploaderSpan.textContent = `게시자: ${nickname}`;
      uploaderSpan.style.display = '';
    } else {
      uploaderSpan.style.display = 'none';
    }
  }
}