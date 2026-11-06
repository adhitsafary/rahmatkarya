// =====================================================================
// API CLIENT SERVICE: Connects to PHP / MySQL Backend
// =====================================================================

export function getEndpoint(filename) {
  if (typeof window === 'undefined') return `./${filename}`;
  if (window.location.port === '5173') {
    return `/${filename}`;
  }
  const path = window.location.pathname;
  if (path.includes('/panel') || path.includes('/dist')) {
    return `../${filename}`;
  }
  return `./${filename}`;
}

const API_BASE = getEndpoint('api.php');
const AUTH_BASE = getEndpoint('auth.php');

export async function request(url, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    // Session expired or unauthorized
    return { success: false, unauthorized: true, message: 'Sesi berakhir. Silakan login kembali.' };
  }

  try {
    const data = await response.json();
    return data;
  } catch (err) {
    return { success: false, message: 'Gagal memproses data server: ' + err.message };
  }
}

// ---------------------------------------------------------------------
// Auth Endpoints
// ---------------------------------------------------------------------
export async function apiGetCurrentUser() {
  return request(`${API_BASE}?action=current_user`);
}

export async function apiLogin(identifier, password, remember = false) {
  // Directly post to login.php or use fetch
  const formData = new URLSearchParams();
  formData.append('identifier', identifier);
  formData.append('password', password);
  if (remember) formData.append('remember', '1');

  try {
    const res = await fetch(getEndpoint('login.php'), {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'text/html,application/json'
      }
    });

    // Check if session cookie is established by requesting current_user
    const userRes = await apiGetCurrentUser();
    if (userRes.success && userRes.data) {
      return { success: true, user: userRes.data };
    }
    return { success: false, message: 'Username atau kata sandi tidak cocok.' };
  } catch (e) {
    return { success: false, message: 'Koneksi ke server gagal: ' + e.message };
  }
}

export async function apiLogout() {
  await fetch(getEndpoint('logout.php'));
  window.location.reload();
}

// ---------------------------------------------------------------------
// Financial Dashboard & Projects
// ---------------------------------------------------------------------
export async function apiGetSummary() {
  return request(`${API_BASE}?action=summary`);
}

export async function apiGetProjects(filter = 'all', search = '') {
  const q = encodeURIComponent(search || '');
  return request(`${API_BASE}?action=projects&filter=${filter}&search=${q}`);
}

export async function apiGetProjectDetail(id) {
  return request(`${API_BASE}?action=project_detail&id=${id}`);
}

export async function apiCreateProject(data) {
  return request(`${API_BASE}?action=create_project`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiAddClientPayment(data) {
  return request(`${API_BASE}?action=add_client_payment`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiAddTeamMember(data) {
  return request(`${API_BASE}?action=add_team_member`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiAddTeamPayment(data) {
  return request(`${API_BASE}?action=add_team_payment`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateNotes(id, notes) {
  return request(`${API_BASE}?action=update_notes`, {
    method: 'POST',
    body: JSON.stringify({ id, notes })
  });
}

export async function apiToggleStatus(id, status) {
  return request(`${API_BASE}?action=toggle_status`, {
    method: 'POST',
    body: JSON.stringify({ id, status })
  });
}

export async function apiDeleteProject(id) {
  return request(`${API_BASE}?action=delete_project`, {
    method: 'POST',
    body: JSON.stringify({ id })
  });
}

// ---------------------------------------------------------------------
// User Management Endpoints
// ---------------------------------------------------------------------
export async function apiGetUsers() {
  return request(`${API_BASE}?action=get_users`);
}

export async function apiCreateUser(data) {
  return request(`${API_BASE}?action=create_user`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiUpdateUser(data) {
  return request(`${API_BASE}?action=update_user`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiDeleteUser(id) {
  return request(`${API_BASE}?action=delete_user`, {
    method: 'POST',
    body: JSON.stringify({ id })
  });
}

// ---------------------------------------------------------------------
// AI Tracker Endpoints
// ---------------------------------------------------------------------
export async function apiGetAiAnalysis() {
  return request(`${API_BASE}?action=ai_analysis`);
}

export async function apiGetAiProjectAnalysis(id) {
  return request(`${API_BASE}?action=ai_project_analysis&id=${id}`);
}

export async function apiValidatePayment(data) {
  return request(`${API_BASE}?action=ai_validate_payment`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ---------------------------------------------------------------------
// Google Gemini AI Endpoints
// ---------------------------------------------------------------------
export async function apiGetGeminiKey() {
  return request(`${API_BASE}?action=get_gemini_key`);
}

export async function apiSaveGeminiKey(apiKey) {
  return request(`${API_BASE}?action=save_gemini_key`, {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey })
  });
}

export async function apiTestGeminiKey(apiKey = null) {
  return request(`${API_BASE}?action=test_gemini_key`, {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey })
  });
}

export async function apiGeminiPrompt(data) {
  return request(`${API_BASE}?action=gemini_prompt`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
