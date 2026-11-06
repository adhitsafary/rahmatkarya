import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Key, 
  CheckCircle2, 
  X,
  Mail,
  User as UserIcon,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { apiGetUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } from '../../services/api';
import { getInitials, formatDate, formatDateTime } from '../../utils/format';
import FilamentRoleInfoModal from '../modals/FilamentRoleInfoModal';

export default function FilamentUserManagement({ currentUser, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  const [formCreate, setFormCreate] = useState({
    name: '',
    username: '',
    email: '',
    role: 'FINANCE',
    password: ''
  });

  const [formEdit, setFormEdit] = useState({
    id: 0,
    name: '',
    username: '',
    email: '',
    role: 'VIEWER',
    password: ''
  });

  const avatarPalettes = [
    'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
    'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
  ];

  const fetchUsers = async () => {
    setLoading(true);
    const res = await apiGetUsers();
    if (res.success) {
      setUsers(res.data);
    } else {
      showToast(res.message || 'Gagal memuat pengguna', 'danger');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      u.name.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q);
    return matchRole && matchQuery;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const res = await apiCreateUser(formCreate);
    if (res.success) {
      showToast(res.message || 'Pengguna berhasil ditambahkan!');
      setModalCreate(false);
      fetchUsers();
    } else {
      showToast(res.message || 'Gagal menambahkan pengguna', 'danger');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const res = await apiUpdateUser(formEdit);
    if (res.success) {
      showToast(res.message || 'Pengguna berhasil diperbarui!');
      setModalEdit(false);
      fetchUsers();
    } else {
      showToast(res.message || 'Gagal memperbarui pengguna', 'danger');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Hapus akun pengguna "${user.name}" (@${user.username})?`)) return;

    const res = await apiDeleteUser(user.id);
    if (res.success) {
      showToast(res.message || 'Pengguna berhasil dihapus.');
      fetchUsers();
    } else {
      showToast(res.message || 'Gagal menghapus pengguna', 'danger');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Pengguna & Hak Akses
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola akun, tingkat hak akses (Role), dan izin otentikasi tim
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowRoleInfo(true)}
            className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition cursor-pointer"
            title="Lihat matriks hak akses & perbandingan fitur role"
          >
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px]">!</span>
            <span>Panduan Role</span>
          </button>

          <button
            onClick={() => {
              setFormCreate({ name: '', username: '', email: '', role: 'FINANCE', password: '' });
              setModalCreate(true);
            }}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-amber-500/25 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 font-bold" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pengguna</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{users.length}</div>
          <span className="text-[10px] text-slate-400 font-bold">Akun Terdaftar</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Administrator</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Akses Penuh</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tim Finance</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {users.filter(u => u.role === 'FINANCE').length}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Kelola Arus Kas</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Viewer</span>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-300 font-mono mt-1">
            {users.filter(u => u.role === 'VIEWER').length}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Hanya Baca</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, username, email..."
            className="w-full text-xs font-semibold rounded-xl pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'ADMIN', 'FINANCE', 'VIEWER'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL' ? 'Semua Role' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b uppercase font-extrabold tracking-wider bg-slate-50/80 text-slate-500 border-slate-200/80 dark:bg-slate-950/80 dark:text-slate-400 dark:border-slate-800 text-[11px]">
                <th className="py-4 px-5">Nama Pengguna</th>
                <th className="py-4 px-4">Username & Email</th>
                <th className="py-4 px-4 text-center">Hak Akses (Role)</th>
                <th className="py-4 px-4">Terakhir Masuk</th>
                <th className="py-4 px-4">Terdaftar Pada</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono ${avatarPalettes[idx % avatarPalettes.length]}`}>
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.id === currentUser?.id && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              Anda
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-slate-800 dark:text-slate-200">@{u.username}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                      u.role === 'ADMIN'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                        : u.role === 'FINANCE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      <span>{u.role === 'ADMIN' ? '👑' : u.role === 'FINANCE' ? '💼' : '👁️'}</span>
                      <span>{u.role}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {u.last_login ? formatDateTime(u.last_login) : 'Belum pernah login'}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setFormEdit({
                            id: u.id,
                            name: u.name,
                            username: u.username,
                            email: u.email,
                            role: u.role,
                            password: ''
                          });
                          setModalEdit(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                      >
                        Edit
                      </button>

                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold text-rose-600 dark:text-rose-400 transition"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREATE USER */}
      {modalCreate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Tambah Pengguna Baru</h3>
              <button onClick={() => setModalCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formCreate.name}
                  onChange={(e) => setFormCreate({ ...formCreate, name: e.target.value })}
                  placeholder="misal: Siti Nurhaliza"
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formCreate.username}
                    onChange={(e) => setFormCreate({ ...formCreate, username: e.target.value })}
                    placeholder="sitifinance"
                    className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Role Akses</label>
                      <button
                        type="button"
                        onClick={() => setShowRoleInfo(true)}
                        className="w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] flex items-center justify-center transition shadow-xs cursor-pointer"
                        title="Klik untuk melihat penjelasan fitur & aksi setiap role"
                      >
                        !
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRoleInfo(true)}
                      className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500/10 border border-amber-400/50 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center font-black text-[9px]">!</span>
                      Panduan Fitur
                    </button>
                  </div>
                  <select
                    value={formCreate.role}
                    onChange={(e) => setFormCreate({ ...formCreate, role: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                  <div className="mt-1 text-[10px] font-semibold">
                    {formCreate.role === 'ADMIN' && (
                      <span className="text-blue-600 dark:text-blue-400">👑 Akses Penuh: Kelola Proyek, Kas & Pengguna</span>
                    )}
                    {formCreate.role === 'FINANCE' && (
                      <span className="text-emerald-600 dark:text-emerald-400">💼 Kelola Kas & Proyek (Akses Pengguna Ditolak)</span>
                    )}
                    {formCreate.role === 'VIEWER' && (
                      <span className="text-slate-500 dark:text-slate-400">👁️ Tamu: Hanya melihat saldo & unduh laporan PDF</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formCreate.email}
                  onChange={(e) => setFormCreate({ ...formCreate, email: e.target.value })}
                  placeholder="siti@procash.local"
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi (Min 6 karakter)</label>
                <input
                  type="password"
                  required
                  value={formCreate.password}
                  onChange={(e) => setFormCreate({ ...formCreate, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCreate(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/25"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {modalEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Pengguna</h3>
              <button onClick={() => setModalEdit(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formEdit.name}
                  onChange={(e) => setFormEdit({ ...formEdit, name: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formEdit.username}
                    onChange={(e) => setFormEdit({ ...formEdit, username: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Role Akses</label>
                      <button
                        type="button"
                        onClick={() => setShowRoleInfo(true)}
                        className="w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] flex items-center justify-center transition shadow-xs cursor-pointer"
                        title="Klik untuk melihat penjelasan fitur & aksi setiap role"
                      >
                        !
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRoleInfo(true)}
                      className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500/10 border border-amber-400/50 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center font-black text-[9px]">!</span>
                      Panduan Fitur
                    </button>
                  </div>
                  <select
                    value={formEdit.role}
                    onChange={(e) => setFormEdit({ ...formEdit, role: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                  <div className="mt-1 text-[10px] font-semibold">
                    {formEdit.role === 'ADMIN' && (
                      <span className="text-blue-600 dark:text-blue-400">👑 Akses Penuh: Kelola Proyek, Kas & Pengguna</span>
                    )}
                    {formEdit.role === 'FINANCE' && (
                      <span className="text-emerald-600 dark:text-emerald-400">💼 Kelola Kas & Proyek (Akses Pengguna Ditolak)</span>
                    )}
                    {formEdit.role === 'VIEWER' && (
                      <span className="text-slate-500 dark:text-slate-400">👁️ Tamu: Hanya melihat saldo & unduh laporan PDF</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formEdit.email}
                  onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ganti Kata Sandi (Opsional)</label>
                <input
                  type="password"
                  value={formEdit.password}
                  onChange={(e) => setFormEdit({ ...formEdit, password: e.target.value })}
                  placeholder="Kosongkan jika tidak diubah"
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalEdit(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/25"
                >
                  Perbarui Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Info Matrix Modal */}
      <FilamentRoleInfoModal
        isOpen={showRoleInfo}
        onClose={() => setShowRoleInfo(false)}
      />

    </div>
  );
}
