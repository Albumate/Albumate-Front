let emailChecked = false;
let nicknameChecked = false;
let lastCheckedEmail = '';
let lastCheckedNickname = '';

function updateSignupButton() {
  // 버튼은 항상 활성화 (중복확인 여부는 signup 함수에서 체크)
  document.getElementById('signup-btn').disabled = false;
}

async function checkDuplicate(field) {
  const value = document.getElementById(field === 'email' ? 'username' : 'nickname').value.trim();

  if (!value) {
    alert(`${field === 'email' ? '이메일' : '닉네임'}을 입력하세요.`);
    return;
  }

  // 이메일 형식 유효성 검사
  if (field === 'email') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      alert('유효하지 않은 이메일 형식입니다.');
      emailChecked = false;
      updateSignupButton();
      return;
    }
  }

  const url = field === 'email' ? `${API_BASE_URL}/api/auth/email-check` : `${API_BASE_URL}/api/auth/nickname-check`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });

  const result = await response.json();
  alert(result.message);

  if (field === 'email') {
    if (response.status === 200) {
      // 사용 가능한 이메일(중복 아님)
      emailChecked = true;
      lastCheckedEmail = value;
    } else {
      emailChecked = false;
      lastCheckedEmail = '';
    }
  } else {
    if (response.status === 200) {
      // 사용 가능한 닉네임(중복 아님)
      nicknameChecked = true;
      lastCheckedNickname = value;
    } else {
      nicknameChecked = false;
      lastCheckedNickname = '';
    }
  }
  updateSignupButton();
}

// 입력값이 바뀌면 중복 확인 상태 초기화
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('username').addEventListener('input', function() {
    if (this.value.trim() !== lastCheckedEmail) {
      emailChecked = false;
      updateSignupButton();
    }
  });
  document.getElementById('nickname').addEventListener('input', function() {
    if (this.value.trim() !== lastCheckedNickname) {
      nicknameChecked = false;
      updateSignupButton();
    }
  });
});

async function signup() {
  const username = document.getElementById('username').value.trim();
  const nickname = document.getElementById('nickname').value.trim();

  // 중복확인 여부와 입력값 일치 여부 모두 체크
  if (
    !emailChecked || !nicknameChecked ||
    username !== lastCheckedEmail ||
    nickname !== lastCheckedNickname
  ) {
    alert('이메일과 닉네임 중복확인을 모두 완료해 주세요.');
    return;
  }

  const password = document.getElementById('password').value;

  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, nickname })
  });

  const result = await response.json();

  if (response.ok) {
    alert('회원가입 성공! 로그인 페이지로 이동합니다.');
    window.location.href = '/login';
  } else {
    alert(result.message);
  }
}