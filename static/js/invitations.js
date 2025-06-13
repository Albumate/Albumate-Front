document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadInvitations();
});

async function loadInvitations() {
  const token = localStorage.getItem('access_token');
  const res = await fetch('/api/albums/invitations', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  let invites = data.data || [];
  if (typeof invites === 'string') {
    try {
      invites = JSON.parse(invites);
    } catch (e) {
      invites = [];
    }
  }
  const list = document.getElementById('invite-list');
  list.innerHTML = '';
  (invites || []).forEach(invite => {
    const album = invite.album || {};
    const fromNickname = (invite.from_user && invite.from_user.nickname) ? invite.from_user.nickname : '';
    const div = document.createElement('div');
    div.className = 'invite-item';
    div.innerHTML = `
      <b>${album.title}</b> - ${album.description || ''}<br>
      <span style="color: #888;">초대한 사람: ${fromNickname}</span><br>
      <button onclick="acceptInvite('${invite.invite_token}')">수락</button>
      <button onclick="rejectInvite('${invite.invite_token}')">거절</button>
      <hr>
    `;
    list.appendChild(div);
  });
}

async function acceptInvite(inviteToken) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/invitations/${inviteToken}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    alert('초대를 수락했습니다.');
    loadInvitations();
  } else {
    const data = await res.json();
    alert(data.message || '수락 실패');
  }
}

async function rejectInvite(inviteToken) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/albums/invitations/${inviteToken}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    alert('초대를 거절했습니다.');
    loadInvitations();
  } else {
    const data = await res.json();
    alert(data.message || '거절 실패');
  }
}