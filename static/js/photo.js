const photoId = window.location.pathname.split('/').pop();

// Photo interaction state
let zoom = 1;
let rotation = 0;
let position = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let isFullscreen = false;
let albumData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadPhotoDetail();
  initializeControls();
  initializeKeyboardShortcuts();
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

  const photoImg = document.getElementById('photo-img');
  photoImg.src = data.url;
  
  // 사진 날짜 표시
  const uploadDate = new Date(data.uploaded_at).toLocaleString();
  document.getElementById('photo-date').textContent = uploadDate;

  // 앨범 정보 조회 및 표시
  if (data.album_id) {
    const albumRes = await fetch(`${API_BASE_URL}/api/albums/${data.album_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const albumData = await albumRes.json();
    let albumInfo = albumData.data || albumData;
    if (typeof albumInfo === 'string') {
      try {
        albumInfo = JSON.parse(albumInfo);
      } catch (e) {
        albumInfo = {};
      }
    }
    
    const albumTitle = albumInfo.title || '알 수 없는 앨범';
    document.getElementById('album-title').textContent = albumTitle;
    
    // 뒤로가기 링크 설정
    const backLink = document.getElementById('back-link');
    backLink.href = `/album/${data.album_id}`;
    
    // 사이드바에서 현재 앨범 강조
    const albumLinks = document.querySelectorAll('.album-link');
    albumLinks.forEach(link => {
      link.classList.remove('current');
      if (link.href.endsWith(`/album/${data.album_id}`)) {
        link.classList.add('current');
      }
    });
  }

  // 업로더 정보 및 삭제 버튼 처리
  const deleteBtn = document.getElementById('delete-btn');
  const uploaderInfo = document.getElementById('uploader-info');
  
  if (data.uploader_id === userId) {
    deleteBtn.style.display = 'flex';
    uploaderInfo.textContent = '업로드: 나';
  } else {
    deleteBtn.style.display = 'none';
    // 업로더 닉네임 조회
    if (data.uploader_id) {
      try {
        const userRes = await fetch(`${API_BASE_URL}/api/auth/${data.uploader_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          let user = userData.data || userData;
          if (typeof user === 'string') {
            try { user = JSON.parse(user); } catch (e) { user = {}; }
          }
          const nickname = user.nickname || '알 수 없는 사용자';
          uploaderInfo.textContent = `업로드: ${nickname}`;
        }
      } catch (e) {
        uploaderInfo.textContent = '업로드: 알 수 없는 사용자';
      }
    } else {
      uploaderInfo.textContent = '업로드: 알 수 없는 사용자';
    }
  }
}

function initializeControls() {
  const photoImg = document.getElementById('photo-img');
  const photoContainer = document.getElementById('photo-container');
  const zoomIndicator = document.getElementById('zoom-indicator');
  
  // 줌 컨트롤
  document.getElementById('zoom-in-btn').onclick = () => {
    zoom = Math.min(zoom * 1.2, 5);
    updatePhotoTransform();
    updateZoomIndicator();
  };
  
  document.getElementById('zoom-out-btn').onclick = () => {
    zoom = Math.max(zoom / 1.2, 0.1);
    updatePhotoTransform();
    updateZoomIndicator();
  };
  
  // 회전 컨트롤
  document.getElementById('rotate-btn').onclick = () => {
    rotation = (rotation + 90) % 360;
    updatePhotoTransform();
  };
  
  // 리셋 컨트롤
  document.getElementById('reset-btn').onclick = () => {
    zoom = 1;
    rotation = 0;
    position = { x: 0, y: 0 };
    updatePhotoTransform();
    updateZoomIndicator();
    updateDragCursor();
  };
  
  // 전체화면 컨트롤
  document.getElementById('fullscreen-btn').onclick = toggleFullscreen;
  document.getElementById('fullscreen-exit-btn').onclick = toggleFullscreen;
  
  // 다운로드 컨트롤
  document.getElementById('download-btn').onclick = () => {
    const link = document.createElement('a');
    link.href = photoImg.src;
    link.download = `photo-${photoId}.jpg`;
    link.click();
  };
  
  // 삭제 버튼
  document.getElementById('delete-btn').onclick = () => {
    document.getElementById('delete-modal').style.display = 'flex';
  };
  
  // 드래그 이벤트
  photoContainer.addEventListener('mousedown', handleMouseDown);
  photoContainer.addEventListener('mousemove', handleMouseMove);
  photoContainer.addEventListener('mouseup', handleMouseUp);
  photoContainer.addEventListener('mouseleave', handleMouseUp);
  
  // 초기 상태 설정
  updateZoomIndicator();
  updateDragCursor();
}

function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
      case 'escape':
        if (isFullscreen) {
          toggleFullscreen();
        }
        break;
      case 'f':
        toggleFullscreen();
        break;
      case '+':
      case '=':
        document.getElementById('zoom-in-btn').click();
        break;
      case '-':
        document.getElementById('zoom-out-btn').click();
        break;
      case 'r':
        document.getElementById('rotate-btn').click();
        break;
      case '0':
        document.getElementById('reset-btn').click();
        break;
    }
  });
}

function updatePhotoTransform() {
  const photoImg = document.getElementById('photo-img');
  photoImg.style.transform = `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`;
  
  // 줌 버튼 상태 업데이트
  document.getElementById('zoom-in-btn').disabled = zoom >= 5;
  document.getElementById('zoom-out-btn').disabled = zoom <= 0.1;
  
  updateDragCursor();
}

function updateZoomIndicator() {
  const zoomIndicator = document.getElementById('zoom-indicator');
  zoomIndicator.textContent = `${Math.round(zoom * 100)}%`;
}

function updateDragCursor() {
  const photoImg = document.getElementById('photo-img');
  if (zoom > 1) {
    photoImg.classList.add('draggable');
  } else {
    photoImg.classList.remove('draggable');
  }
}

function handleMouseDown(e) {
  if (zoom > 1) {
    isDragging = true;
    dragStart = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.getElementById('photo-img').classList.add('dragging');
  }
}

function handleMouseMove(e) {
  if (isDragging && zoom > 1) {
    position = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    updatePhotoTransform();
  }
}

function handleMouseUp() {
  isDragging = false;
  document.getElementById('photo-img').classList.remove('dragging');
}

function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  const photoMain = document.getElementById('photo-main');
  const keyboardShortcuts = document.getElementById('keyboard-shortcuts');
  const fullscreenExitBtn = document.getElementById('fullscreen-exit-btn');
  
  if (isFullscreen) {
    photoMain.classList.add('fullscreen');
    document.body.classList.add('fullscreen');
    keyboardShortcuts.style.display = 'block';
    fullscreenExitBtn.style.display = 'block';
  } else {
    photoMain.classList.remove('fullscreen');
    document.body.classList.remove('fullscreen');
    keyboardShortcuts.style.display = 'none';
    fullscreenExitBtn.style.display = 'none';
  }
}

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
}

async function confirmDeletePhoto() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/photos/${photoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (res.ok) {
    alert('사진이 삭제되었습니다.');
    // 앨범 페이지로 돌아가기
    const backLink = document.getElementById('back-link');
    window.location.href = backLink.href;
  } else {
    const data = await res.json();
    alert(data.message || '삭제 실패');
  }
  
  closeDeleteModal();
}

// 모달 외부 클릭 시 닫기
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('delete-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeDeleteModal();
    }
  });
});