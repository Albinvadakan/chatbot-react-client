const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function loginApi(username, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}
