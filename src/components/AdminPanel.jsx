'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaKey, FaUserCog, FaUsers, FaTrash, FaEye, FaFileExcel, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaChartLine, FaBuilding, FaClipboardList } from 'react-icons/fa';
import * as XLSX from 'xlsx';

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [petugasPiket, setPetugasPiket] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showGuests, setShowGuests] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [statistics, setStatistics] = useState({
    today: 0,
    yesterday: 0,
    week: 0,
    month: 0,
    total: 0,
    topPurposes: [],
    topCompanies: [],
    topOfficers: [],
    peakHours: []
  });

  // Password admin hardcoded (untuk keamanan lebih baik, simpan di environment variable)
  const ADMIN_PASSWORD = 'admin123'; // Ganti dengan password yang kuat

  useEffect(() => {
    // Cek apakah sudah login sebelumnya
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
      setAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchCurrentKeyword();
      fetchGuests();
    }
  }, [authenticated]);

  useEffect(() => {
    applyFilter();
    calculateStatistics();
  }, [guests, filterType, customStartDate, customEndDate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
      setMessage({ type: 'success', text: 'Login berhasil!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } else {
      setMessage({ type: 'error', text: 'Password salah!' });
    }
  };

  const fetchCurrentKeyword = async () => {
    try {
      const q = query(collection(db, 'keywords'), where('active', '==', true));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setCurrentKeyword({ id: snapshot.docs[0].id, ...data });
        setKeyword(data.keyword);
        setPetugasPiket(data.petugasPiket);
      }
    } catch (error) {
      console.error('Error fetching keyword:', error);
    }
  };

  const fetchGuests = async () => {
    try {
      const q = query(collection(db, 'guests'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const guestData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setGuests(guestData);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  const handleSetKeyword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currentKeyword) {
        // Update keyword yang sudah ada (tidak buat baru)
        await updateDoc(doc(db, 'keywords', currentKeyword.id), {
          keyword: keyword.toLowerCase(),
          petugasPiket: petugasPiket,
          active: true,
          updatedAt: new Date()
        });
        setMessage({ type: 'success', text: 'Kata kunci berhasil diperbarui!' });
      } else {
        // Buat keyword baru (hanya jika belum ada sama sekali)
        await addDoc(collection(db, 'keywords'), {
          keyword: keyword.toLowerCase(),
          petugasPiket: petugasPiket,
          active: true,
          createdAt: new Date()
        });
        setMessage({ type: 'success', text: 'Kata kunci berhasil dibuat!' });
      }

      fetchCurrentKeyword();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan!' });
    }

    setLoading(false);
  };

  const handleDeleteGuest = async (guestId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      await deleteDoc(doc(db, 'guests', guestId));
      setMessage({ type: 'success', text: 'Data berhasil dihapus!' });
      fetchGuests();
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error deleting guest:', error);
      setMessage({ type: 'error', text: 'Gagal menghapus data!' });
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...guests];

    switch (filterType) {
      case 'today':
        filtered = guests.filter(guest => {
          if (!guest.timestamp) return false;
          const guestDate = new Date(guest.timestamp);
          return guestDate.toDateString() === now.toDateString();
        });
        break;

      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Minggu
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sabtu
        weekEnd.setHours(23, 59, 59, 999);

        filtered = guests.filter(guest => {
          if (!guest.timestamp) return false;
          const guestDate = new Date(guest.timestamp);
          return guestDate >= weekStart && guestDate <= weekEnd;
        });
        break;

      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        filtered = guests.filter(guest => {
          if (!guest.timestamp) return false;
          const guestDate = new Date(guest.timestamp);
          return guestDate >= monthStart && guestDate <= monthEnd;
        });
        break;

      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);

          filtered = guests.filter(guest => {
            if (!guest.timestamp) return false;
            const guestDate = new Date(guest.timestamp);
            return guestDate >= startDate && guestDate <= endDate;
          });
        }
        break;

      case 'all':
      default:
        filtered = guests;
        break;
    }

    setFilteredGuests(filtered);
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'today':
        return 'Hari Ini';
      case 'week':
        return 'Minggu Ini';
      case 'month':
        return 'Bulan Ini';
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const end = new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          return `${start} - ${end}`;
        }
        return 'Custom';
      case 'all':
      default:
        return 'Semua Data';
    }
  };

  const calculateStatistics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Hitung statistik periode
    const todayGuests = guests.filter(g => {
      if (!g.timestamp) return false;
      const date = new Date(g.timestamp);
      return date >= today;
    });

    const yesterdayGuests = guests.filter(g => {
      if (!g.timestamp) return false;
      const date = new Date(g.timestamp);
      return date >= yesterday && date < today;
    });

    const weekGuests = guests.filter(g => {
      if (!g.timestamp) return false;
      const date = new Date(g.timestamp);
      return date >= weekStart;
    });

    const monthGuests = guests.filter(g => {
      if (!g.timestamp) return false;
      const date = new Date(g.timestamp);
      return date >= monthStart;
    });

    // Top 5 Tujuan Kunjungan
    const purposeCount = {};
    guests.forEach(g => {
      if (g.tujuan) {
        purposeCount[g.tujuan] = (purposeCount[g.tujuan] || 0) + 1;
      }
    });
    const topPurposes = Object.entries(purposeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Top 5 Perusahaan/Instansi
    const companyCount = {};
    guests.forEach(g => {
      if (g.perusahaan) {
        companyCount[g.perusahaan] = (companyCount[g.perusahaan] || 0) + 1;
      }
    });
    const topCompanies = Object.entries(companyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Petugas Piket
    const officerCount = {};
    guests.forEach(g => {
      if (g.petugasPiket) {
        officerCount[g.petugasPiket] = (officerCount[g.petugasPiket] || 0) + 1;
      }
    });
    const topOfficers = Object.entries(officerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Peak Hours (jam sibuk)
    const hourCount = {};
    guests.forEach(g => {
      if (g.timestamp) {
        const hour = new Date(g.timestamp).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      }
    });
    const peakHours = Object.entries(hourCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ 
        hour: `${hour.padStart(2, '0')}:00 - ${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`, 
        count 
      }));

    setStatistics({
      today: todayGuests.length,
      yesterday: yesterdayGuests.length,
      week: weekGuests.length,
      month: monthGuests.length,
      total: guests.length,
      topPurposes,
      topCompanies,
      topOfficers,
      peakHours
    });
  };

  const handleExportToExcel = () => {
    try {
      // Gunakan data yang sudah difilter
      const dataToExport = filteredGuests;

      if (dataToExport.length === 0) {
        setMessage({ type: 'error', text: 'Tidak ada data untuk diekspor!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      // Siapkan data untuk Excel (tanpa foto)
      const excelData = dataToExport.map((guest, index) => ({
        'No': index + 1,
        'Nama Lengkap': guest.nama,
        'Nomor Telepon': guest.telepon,
        'Perusahaan/Instansi': guest.perusahaan,
        'Tujuan Kunjungan': guest.tujuan,
        'Petugas Piket': guest.petugasPiket,
        'Waktu Kunjungan': formatDate(guest.timestamp)
      }));

      // Buat worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set lebar kolom
      const columnWidths = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 15 }, // Telepon
        { wch: 30 }, // Perusahaan
        { wch: 25 }, // Tujuan
        { wch: 20 }, // Petugas
        { wch: 20 }  // Waktu
      ];
      worksheet['!cols'] = columnWidths;

      // Buat workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Tamu');

      // Generate nama file dengan tanggal dan filter
      const today = new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replace(/\//g, '-');
      
      const filterLabel = getFilterLabel().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      const fileName = `Buku_Tamu_KPU_${filterLabel}_${today}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      setMessage({ type: 'success', text: `${dataToExport.length} data berhasil diekspor ke ${fileName}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setMessage({ type: 'error', text: 'Gagal mengekspor data!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserCog className="text-white text-4xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Buku Tamu KPU</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password Admin
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan password"
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Kelola kata kunci dan data tamu</p>
            </div>
            <button
              onClick={() => {
                setAuthenticated(false);
                sessionStorage.removeItem('adminLoggedIn');
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Dashboard Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Hari Ini */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Hari Ini</p>
                <h3 className="text-4xl font-bold mt-2">{statistics.today}</h3>
                <p className="text-blue-100 text-xs mt-1">
                  {statistics.today > statistics.yesterday ? '↑' : statistics.today < statistics.yesterday ? '↓' : '='} 
                  {' '}{Math.abs(statistics.today - statistics.yesterday)} dari kemarin
                </p>
              </div>
              <FaCalendarDay className="text-5xl text-blue-300 opacity-50" />
            </div>
          </div>

          {/* Minggu Ini */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Minggu Ini</p>
                <h3 className="text-4xl font-bold mt-2">{statistics.week}</h3>
                <p className="text-green-100 text-xs mt-1">Minggu berjalan</p>
              </div>
              <FaCalendarWeek className="text-5xl text-green-300 opacity-50" />
            </div>
          </div>

          {/* Bulan Ini */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Bulan Ini</p>
                <h3 className="text-4xl font-bold mt-2">{statistics.month}</h3>
                <p className="text-purple-100 text-xs mt-1">
                  {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <FaCalendarAlt className="text-5xl text-purple-300 opacity-50" />
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Tamu</p>
                <h3 className="text-4xl font-bold mt-2">{statistics.total}</h3>
                <p className="text-orange-100 text-xs mt-1">Semua waktu</p>
              </div>
              <FaUsers className="text-5xl text-orange-300 opacity-50" />
            </div>
          </div>
        </div>

        {/* Statistik Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Tujuan Kunjungan */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaClipboardList className="mr-2 text-blue-600" />
              Top Tujuan Kunjungan
            </h3>
            {statistics.topPurposes.length > 0 ? (
              <div className="space-y-3">
                {statistics.topPurposes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Belum ada data</p>
            )}
          </div>

          {/* Top Instansi */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaBuilding className="mr-2 text-green-600" />
              Top Instansi
            </h3>
            {statistics.topCompanies.length > 0 ? (
              <div className="space-y-3">
                {statistics.topCompanies.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Belum ada data</p>
            )}
          </div>

          {/* Petugas & Peak Hours */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaUserCog className="mr-2 text-purple-600" />
              Petugas Aktif
            </h3>
            {statistics.topOfficers.length > 0 ? (
              <div className="space-y-3 mb-6">
                {statistics.topOfficers.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-6">Belum ada data</p>
            )}

            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center mt-6">
              <FaChartLine className="mr-2 text-orange-600" />
              Jam Sibuk
            </h3>
            {statistics.peakHours.length > 0 ? (
              <div className="space-y-2">
                {statistics.peakHours.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.hour}</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {item.count} tamu
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Set Kata Kunci */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <FaKey className="mr-3 text-blue-600" />
            Atur Kata Kunci Hari Ini
          </h2>

          {currentKeyword && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
              <p className="text-sm text-gray-600">Kata Kunci Aktif:</p>
              <p className="font-bold text-lg text-blue-900">{currentKeyword.keyword}</p>
              <p className="text-sm text-gray-600 mt-1">Petugas: {currentKeyword.petugasPiket}</p>
            </div>
          )}

          <form onSubmit={handleSetKeyword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Petugas Piket
              </label>
              <input
                type="text"
                value={petugasPiket}
                onChange={(e) => setPetugasPiket(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama petugas piket hari ini"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kata Kunci Baru
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan kata kunci"
              />
              <p className="text-sm text-gray-500 mt-1">
                Kata kunci ini akan digunakan oleh tamu untuk mengisi buku tamu
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Perbarui Kata Kunci'}
            </button>
          </form>
        </div>

        {/* Daftar Tamu */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaUsers className="mr-3 text-blue-600" />
              Daftar Tamu ({filteredGuests.length} dari {guests.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportToExcel}
                disabled={filteredGuests.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaFileExcel className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => setShowGuests(!showGuests)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <FaEye className="mr-2" />
                {showGuests ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter Periode
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Data</option>
                  <option value="today">Hari Ini</option>
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filterType === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Reset Filter
                </button>
              </div>
            </div>

            {filterType !== 'all' && (
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-semibold">Filter aktif:</span> {getFilterLabel()}
              </div>
            )}
          </div>

          {showGuests && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Foto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telepon</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Perusahaan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tujuan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Waktu</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Petugas</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredGuests.map((guest, index) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3">
                        {guest.photoURL ? (
                          <img 
                            src={guest.photoURL} 
                            alt={guest.nama}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer"
                            onClick={() => setSelectedGuest(guest)}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <FaUsers className="text-gray-600" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{guest.nama}</td>
                      <td className="px-4 py-3 text-sm">{guest.telepon}</td>
                      <td className="px-4 py-3 text-sm">{guest.perusahaan}</td>
                      <td className="px-4 py-3 text-sm">{guest.tujuan}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(guest.timestamp)}</td>
                      <td className="px-4 py-3 text-sm">{guest.petugasPiket}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredGuests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {filterType === 'all' ? 'Belum ada data tamu' : 'Tidak ada data tamu untuk periode yang dipilih'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Detail Foto */}
        {selectedGuest && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGuest(null)}
          >
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{selectedGuest.nama}</h3>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <img 
                src={selectedGuest.photoURL} 
                alt={selectedGuest.nama}
                className="w-full rounded-lg"
              />
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Telepon:</strong> {selectedGuest.telepon}</p>
                <p><strong>Perusahaan:</strong> {selectedGuest.perusahaan}</p>
                <p><strong>Tujuan:</strong> {selectedGuest.tujuan}</p>
                <p><strong>Waktu:</strong> {formatDate(selectedGuest.timestamp)}</p>
                <p><strong>Petugas:</strong> {selectedGuest.petugasPiket}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}