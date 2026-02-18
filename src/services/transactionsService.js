import * as FileSystem from 'expo-file-system/legacy';
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
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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


export async function deleteTransaction({ token, transactionId }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/transactions/delete/${transactionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Transacción eliminada exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible eliminar la transacción.',
  };
}


export async function addClient({ token, name }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/clients/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Emprendedor agregado exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible agregar el emprendedor.',
  };
}

export async function updateClient({ token, clientId, name, numCliente = null, fechaCobro = null, fechaRetiro = null, notificado = 0 }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/clients/update/${clientId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      num_cliente: numCliente,
      fecha_cobro: fechaCobro,
      fecha_retiro: fechaRetiro,
      notificado,
    }),
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Emprendedor actualizado exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible actualizar el emprendedor.',
  };
}

export async function deleteClient({ token, clientId }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/clients/delete/${clientId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Emprendedor eliminado exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible eliminar el emprendedor.',
  };
}


export async function exportTransactionsReport({ token, startDate, endDate, clientName = '' }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const params = new URLSearchParams({
    fechaIni: startDate,
    fechaFin: endDate,
    clientName: clientName.trim(),
  });

  const fileName = `reporte_${clientName.trim().replace(/[^a-z0-9]+/gi, '_') || 'cliente'}_${startDate}_${endDate}.xlsx`;
  const outputUri = `${FileSystem.cacheDirectory}${fileName}`;

  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}/reports/export?${params.toString()}`,
    outputUri,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    }
  );

  if (isSuccessStatus(result.status)) {
    return {
      ok: true,
      fileUri: result.uri,
      fileName,
      message: 'Reporte generado exitosamente',
    };
  }

  let message = 'No fue posible generar el reporte.';

  try {
    const raw = await FileSystem.readAsStringAsync(result.uri);
    const parsed = JSON.parse(raw);

    if (parsed?.message) {
      message = parsed.message;
    }
  } catch (_parseError) {
    message = 'No fue posible generar el reporte.';
  }

  return {
    ok: false,
    tokenExpired: false,
    message,
  };
}


export async function addBankAccount({ token, idCliente, nameBank, nameClient, numAccount, typeAccount }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/bankaccount/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_cliente: idCliente,
      name_bank: nameBank,
      name_client: nameClient,
      num_account: numAccount,
      type_account: typeAccount,
    }),
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Cuenta bancaria agregada exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible agregar la cuenta bancaria.',
  };
}


export async function getBankAccountsByClient({ token, clientId }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/bankaccount/list/${clientId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      accounts: Array.isArray(data) ? data : [],
      message: '',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No se obtuvieron cuentas bancarias.',
    accounts: [],
  };
}

export async function updateBankAccount({ token, accountId, numAccount, nameClient, typeAccount, nameBank }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/bankaccount/update/${accountId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      num_account: numAccount,
      name_client: nameClient,
      type_account: typeAccount,
      name_bank: nameBank,
    }),
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Cuenta bancaria actualizada exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible actualizar la cuenta bancaria.',
  };
}

export async function deleteBankAccount({ token, accountId }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const response = await fetch(`${API_BASE_URL}/bankaccount/delete/${accountId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      message: data.message ?? 'Cuenta bancaria eliminada exitosamente',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data.message ?? 'No fue posible eliminar la cuenta bancaria.',
  };
}

export async function getTransferNotificationReport({ token, userId, startDate, endDate }) {
  const tokenValidation = await ensureToken(token);

  if (!tokenValidation.ok) {
    return tokenValidation;
  }

  const params = new URLSearchParams({
    user_id: String(userId ?? ''),
    fecha_inicio: startDate,
    fecha_fin: endDate,
  });

  const response = await fetch(`${API_BASE_URL}/transfernoti/transfer/notify?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);

  if (isSuccessStatus(response.status)) {
    return {
      ok: true,
      cantidad: Number(data?.cantidad ?? 0),
      message: data?.mensaje ?? '',
    };
  }

  return {
    ok: false,
    tokenExpired: false,
    message: data?.message ?? 'No fue posible obtener el reporte de notificaciones.',
  };
}
