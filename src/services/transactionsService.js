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

function isSuccessStatus(status) {
  return status === 200 || status === 201 || status === 202;
}

async function ensureToken(token) {
  const tokenCheck = await checkTokenRequest(token);

  if (tokenCheck.isExpired) {
    return {
      ok: false,
      tokenExpired: true,
      message: tokenCheck.message,
    };
  }

  return { ok: true };
}

export async function getTransactionsByDateRange({ token, startDate, endDate, clientName = '' }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  if (clientName.trim().length > 0) {
    params.append('client_name', clientName.trim());
  }

  const response = await fetch(`${API_BASE_URL}/transactions/filter?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
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

export async function getClientsList({ token }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/clients/list`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      clients: Array.isArray(data) ? data : [],
      message: '',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No se obtuvieron resultado.',
    clients: [],
  };
}

export async function addTransaction({ token, clientId, amount, notes, transactionDate, image }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const formData = new FormData();
  formData.append('client_id', String(clientId));
  formData.append('transaction_type', 'income');
  formData.append('amount', String(amount));
  formData.append('notes', notes ?? '');
  formData.append('transaction_date', transactionDate);

  if (image?.uri) {
    formData.append('image', {
      uri: image.uri,
      name: image.fileName ?? `sale_${Date.now()}.jpg`,
      type: image.mimeType ?? 'image/jpeg',
    });
  }

  const response = await fetch(`${API_BASE_URL}/transactions/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Transacción registrada exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible registrar la transacción.',
  };
}


export async function updateTransaction({ token, transactionId, amount, notes, image }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const formData = new FormData();
  formData.append('transaction_type', 'income');
  formData.append('amount', String(amount));
  formData.append('notes', notes ?? '');

  if (image?.uri) {
    formData.append('image', {
      uri: image.uri,
      name: image.fileName ?? `sale_${Date.now()}.jpg`,
      type: image.mimeType ?? 'image/jpeg',
    });
  }

  const response = await fetch(`${API_BASE_URL}/transactions/update/${transactionId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Transacción actualizada exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible actualizar la transacción.',
  };
}
