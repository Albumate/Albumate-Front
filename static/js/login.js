async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();

  if (response.ok) {
    localStorage.setItem('access_token', result.data.access_token);
    window.location.href = '/home';
  } else {
    alert(result.message);
  }
}