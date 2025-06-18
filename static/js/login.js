async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();

  if (response.ok) {
    localStorage.setItem('access_token', result.data.access_token);
    localStorage.setItem('refresh_token', result.data.refresh_token);
    localStorage.setItem('user_id', result.data.user_id);      
    localStorage.setItem('nickname', result.data.nickname);    
    localStorage.setItem('username', username);
    window.location.href = '/home';
  } else {
    alert(result.message);
  }
}