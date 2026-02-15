const API_BASE_URL = 'https://apivitrinovapp.clobitech.com';

async function parseResponse(response) {
  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  return data;
}

export async function loginRequest({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseResponse(response);

  if (response.status === 200 || response.status === 201) {
    return {
      ok: true,
      token: data.access_token,
      user: data.user,
      message: data.message ?? 'Autenticación exitosa',
      status: response.status,
    };
  }

  return {
    ok: false,
    message: data.message ?? 'No fue posible iniciar sesión.',
    status: response.status,
  };
}

export async function registerRequest({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await parseResponse(response);

  return {
    ok: response.status >= 200 && response.status < 300,
    message: data.message ?? 'No fue posible registrar el usuario.',
    status: response.status,
  };
}
