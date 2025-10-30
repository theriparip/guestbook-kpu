'use client';

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaCamera, FaRegAddressBook } from 'react-icons/fa';
import { sanitizeInput, validatePhoneNumber, validateLength } from '@/lib/utils';

export default function GuestForm() {
  const [formData, setFormData] = useState({
    nama: '',
    telepon: '',
    perusahaan: '',
    tujuan: '',
    tujuanLainnya: '',
    kataKunci: '',
  });
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTime, setCurrentTime] = useState('');
  const webcamRef = useRef(null);

  // 🕓 waktu real-time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
      const tanggal = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setCurrentTime(`${hari}, ${tanggal}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const tujuanOptions = [
    { value: 'DATA_PEMILIH', label: 'Layanan Pemutakhiran Data Pemilih' },
    { value: 'PENCALONAN', label: 'Layanan Pencalonan Peserta Pemilu/Pilkada' },
    { value: 'VERPOL', label: 'Layanan Verifikasi dan Pemutakhiran Data Partai Politik' },
    { value: 'PPID', label: 'Layanan PPID' },
    { value: 'PENDIDIKAN_PEMILIH', label: 'Layanan Pendidikan Pemilih' },
    { value: 'ADHOC', label: 'Layanan Rekrutmen Badan Adhoc' },
    { value: 'LPSE', label: 'Layanan Pengadaan Secara Elektronik (LPSE)' },
    { value: 'PENGADUAN', label: 'Layanan Pengaduan Masyarakat' },
    { value: 'PAW_DPRD', label: 'Layanan Persiapan Pergantian Antar Waktu Anggota DPRD' },
    { value: 'LAINNYA', label: 'Lainnya / Umum' },
  ];

  const capturePhoto = () => {
    if (cameraActive && webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      setCameraActive(false);
    } else {
      setCameraActive(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setMessage({
        type: 'error',
        text: 'Harap ambil foto Anda terlebih dahulu sebelum mengirim.',
      });
      return;
    }

    // Validasi input
    if (!validateLength(formData.nama, 2, 100)) {
      setMessage({
        type: 'error',
        text: 'Nama harus memiliki panjang 2-100 karakter.',
      });
      return;
    }

    if (formData.telepon && !validatePhoneNumber(formData.telepon)) {
      setMessage({
        type: 'error',
        text: 'Format nomor telepon tidak valid. Contoh: 081234567890',
      });
      return;
    }

    if (!validateLength(formData.perusahaan, 0, 200)) {
      setMessage({
        type: 'error',
        text: 'Nama perusahaan maksimal 200 karakter.',
      });
      return;
    }

    if (formData.tujuan === 'LAINNYA' && !validateLength(formData.tujuanLainnya, 3, 200)) {
      setMessage({
        type: 'error',
        text: 'Tujuan kunjungan harus memiliki panjang 3-200 karakter.',
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Sanitize input
      const sanitizedNama = sanitizeInput(formData.nama);
      const sanitizedTelepon = sanitizeInput(formData.telepon);
      const sanitizedPerusahaan = sanitizeInput(formData.perusahaan);
      const sanitizedKataKunci = sanitizeInput(formData.kataKunci);

      const keywordQuery = query(
        collection(db, 'keywords'),
        where('active', '==', true),
        where('keyword', '==', sanitizedKataKunci.toLowerCase())
      );
      const keywordSnapshot = await getDocs(keywordQuery);

      if (keywordSnapshot.empty) {
        setMessage({ type: 'error', text: 'Kata kunci tidak valid!' });
        setLoading(false);
        return;
      }

      const tujuanAkhir =
        formData.tujuan === 'LAINNYA'
          ? sanitizeInput(formData.tujuanLainnya)
          : tujuanOptions.find((opt) => opt.value === formData.tujuan)?.label ||
            formData.tujuan;

      await addDoc(collection(db, 'guests'), {
        nama: sanitizedNama,
        telepon: sanitizedTelepon,
        perusahaan: sanitizedPerusahaan,
        tujuan: tujuanAkhir,
        photoURL: photo,
        timestamp: new Date(),
        petugasPiket: keywordSnapshot.docs[0].data().petugasPiket,
      });

      setMessage({ type: 'success', text: 'Data berhasil disimpan!' });
      setFormData({
        nama: '',
        telepon: '',
        perusahaan: '',
        tujuan: '',
        tujuanLainnya: '',
        kataKunci: '',
      });
      setPhoto(null);
      setCameraActive(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan, silakan coba lagi.',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #dc2626 0%, #9d174d 100%); }
        .card-shadow {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 card-shadow flex flex-col sm:flex-row items-center justify-between">
          {/* Logo kiri */}
          <div className="flex justify-center sm:justify-start w-full sm:w-auto mb-4 sm:mb-0">
            <img
              src="/images/logo_kpu.png"
              alt="Logo KPU"
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Tengah */}
          <div className="text-center flex flex-col items-center justify-center flex-1">
            <div className="flex items-center justify-center space-x-2">
              <FaRegAddressBook className="text-red-600 text-3xl sm:text-4xl" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Buku Tamu Digital
              </h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base font-medium mt-1">
              KPU Kabupaten Tasikmalaya
            </p>
          </div>

          {/* Waktu kanan */}
          <div className="text-gray-500 text-sm font-medium text-center sm:text-right w-full sm:w-auto mt-4 sm:mt-0">
            {currentTime}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-8 card-shadow grid md:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="md:col-span-3 grid md:grid-cols-3 gap-6">
            {/* FOTO */}
            <div className="md:col-span-1 space-y-3">
              <label className="flex items-center text-lg font-semibold text-gray-800">
                <span className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                📸 Foto Tamu
              </label>

              <div className="border-2 border-dashed border-purple-300 rounded-2xl p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50">
                {!photo ? (
                  <>
                    {cameraActive ? (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="rounded-xl w-full"
                        videoConstraints={{ facingMode: 'user' }}
                      />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200">
                        Kamera belum aktif
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={capturePhoto}
                      aria-label={cameraActive ? 'Ambil Foto' : 'Aktifkan Kamera'}
                      className={`mt-4 w-full text-white font-semibold py-2 px-4 rounded-xl shadow-lg ${
                        cameraActive
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <FaCamera className="inline mr-2" />
                      {cameraActive ? 'Ambil Foto' : 'Aktifkan Kamera'}
                    </button>
                  </>
                ) : (
                  <>
                    <img src={photo} alt="Preview" className="w-full rounded-xl max-h-64 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setCameraActive(false); }}
                      className="mt-4 w-full bg-gray-600 text-white py-2 rounded-xl hover:bg-gray-700"
                    >
                      Ambil Ulang
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* DATA DIRI & TUJUAN */}
            <div className="md:col-span-2 space-y-6">
              {/* Data Diri */}
              <div className="space-y-4">
                <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                  👤 Data Diri
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                  <input type="text" name="nama" value={formData.nama} onChange={handleChange} required placeholder="Masukkan nama lengkap" aria-label="Nama Lengkap" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                  <input type="tel" name="telepon" value={formData.telepon} onChange={handleChange} placeholder="08123456789" aria-label="Nomor Telepon" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Perusahaan / Instansi Asal</label>
                  <input type="text" name="perusahaan" value={formData.perusahaan} onChange={handleChange} placeholder="Nama perusahaan atau instansi" aria-label="Nama Perusahaan atau Instansi" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
              </div>

              {/* Tujuan */}
              <div className="space-y-4">
                <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <span className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
                  🎯 Tujuan Kunjungan
                </label>

                <select name="tujuan" value={formData.tujuan} onChange={handleChange} required aria-label="Tujuan Kunjungan" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option value="">-- Pilih Jenis Layanan --</option>
                  {tujuanOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Transisi halus untuk “Lainnya” */}
                <div
                  aria-hidden={formData.tujuan !== 'LAINNYA'}
                  className={`overflow-hidden transform transition-all duration-300 ease-out ${
                    formData.tujuan === 'LAINNYA'
                      ? 'max-h-40 opacity-100 translate-y-0 mt-3'
                      : 'max-h-0 opacity-0 -translate-y-2'
                  }`}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sebutkan Layanan Lainnya *</label>
                  <input type="text" name="tujuanLainnya" value={formData.tujuanLainnya} onChange={handleChange} required={formData.tujuan === 'LAINNYA'} placeholder="Contoh: Konsultasi data pemilih" aria-label="Tujuan Kunjungan Lainnya" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                </div>
              </div>

              {/* Kata Kunci */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kata Kunci *</label>
                <input type="password" name="kataKunci" value={formData.kataKunci} onChange={handleChange} required placeholder="Tanyakan kepada petugas piket" aria-label="Kata Kunci" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>

              {/* Pesan */}
              {message.text && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Tombol Submit */}
              <button type="submit" disabled={loading} aria-label="Kirim Kunjungan" className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300">
                {loading ? 'Menyimpan...' : 'Kirim Kunjungan'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white">
          <p className="text-sm opacity-90">© 2025 KPU Kabupaten Tasikmalaya</p>
          <p className="text-xs opacity-75 mt-1">Sistem Buku Tamu Digital</p>
        </div>
      </div>
    </div>
  );
}
