import { checkTokenRequest } from './authService';

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

export async function getTransactionsByDateRange({ token, startDate, endDate }) {
  const tokenCheck = await checkTokenRequest(token);

  if (tokenCheck.isExpired) {
    return {
      ok: false,
      tokenExpired: true,
      message: tokenCheck.message,
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/transactions/filter?start_date=${startDate}&end_date=${endDate}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await parseResponse(response);

  if (response.status === 200 || response.status === 201 || response.status === 202) {
    return {
      ok: true,
      summary: data.summary ?? { ingresos: '0', egresos: '0', saldo: '0' },
      transactions: data.transactions ?? [],
      message: data.message ?? '',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No se obtuvieron resultado.',
  };
}
