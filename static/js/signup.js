async function checkDuplicate(field) {
  const value = document.getElementById(field === 'email' ? 'username' : 'nickname').value;

  if (!value) {
    alert(`${field === 'email' ? '이메일' : '닉네임'}을 입력하세요.`);
    return;
  }

  const url = field === 'email' ? '/api/auth/email-check' : '/api/auth/nickname-check';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });

  const result = await response.json();
  alert(result.message);
}

async function signup() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const nickname = document.getElementById('nickname').value;

  const response = await fetch('/api/auth/register', {
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