const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'pohon', 'jalan', 'parkir-liar', 'sampah',
      'administrasi-terkait-penanggulangan-kebakaran-dan-penyelamatan',
      'ambulans-gawat-darurat', 'arus-lalu-lintas', 'bahan-bakar-gas',
      'bahan-bakar-minyak', 'banjir', 'bantuan-pendidikan', 'bantuan-sosial',
      'batas-wilayah', 'bpjs', 'demam-berdarah-dengue',
      'fasilitas-kerjasama-kolaborasi-pemda-dki',
      'fasilitas-kesehatan-milik-pusat-swasta', 'fasilitas-olahraga',
      'fasilitas-pendidikan-milik-pemerintah-pusat-swasta',
      'fasilitas-sosial-fasilitas-umum', 'gangguan-ketenteraman-dan-ketertiban',
      'gedung-sekolah', 'hubungan-pekerja-pengusaha', 'imunisasi',
      'industri-kecil-dan-menengah', 'internal-dinas-pariwisata-dan-kebudayaan',
      'jak-wifi', 'jaringan-air-bersih', 'jaringan-komunikasi', 'jaringan-listrik-1',
      'jembatan-penyeberangan-orang-jpo-dan-atau-halte', 'kartu-jakarta-pintar',
      'kartu-jakarta-sehat-kjs', 'kartu-keluarga', 'kdm-dan-iklan-rokok',
      'kearsipan', 'kegiatan-seni-dan-budaya', 'keluarga-berencana',
      'keluhan-galian-sisa-proyek', 'kepemudaan', 'komunikasi-pemerintah',
      'konflik-sosial', 'koperasi', 'ktp-elektronik-ktp-el',
      'kurikulum-dan-kegiatan-sekolah', 'layanan-administrasi-kependudukan-orang-asing',
      'lembaga-kemasyarakatan', 'lokasi-binaan-dan-lokasi-sementara',
      'minimarket', 'orang-hilang', 'pajak-bumi-dan-bangunan',
      'pekerja-penanganan-prasarana-dan-sarana-umum-kelurahan',
      'pelatihan-kerja-dan-produktivitas-tenaga-kerja', 'pelayanan-perhubungan',
      'pembebasan-lahan', 'pemberdayaan-perempuan', 'penanganan-kebakaran',
      'penataan-dan-pengembangan-wilayah',
      'penataan-permukiman-kampung-deret-bedah-rumah-dll',
      'pencemaran-lingkungan', 'pendidikan-anak-usia-dini', 'pengolahan-ikan',
      'penyakit-masyarakat', 'penyandang-masalah-kesejahteraan-sosial-pmks',
      'penyelamatan', 'perdagangan', 'perizinan-ketenagakerjaan-dan-olahraga',
      'perpustakaan', 'pkl-liar', 'posyandu', 'ppdb',
      'prasarana-dan-sarana-penanggulangan-kebakaran', 'pungutan-liar',
      'puskesmas', 'reklame', 'rsud', 'ruang-publik-terpadu-ramah-anak-rptra',
      'rumah-potong-hewan', 'rumah-susun-hunian-vertikal', 'rupabumi',
      'saluran-air-kali-sungai', 'sanitasi-dan-keamanan-pangan', 'satwa-liar',
      'sembilan-bahan-pokok', 'sertifikasi-guru', 'sertifikat-atau-dokumen-kepemilikan',
      'sertifikat-laik-fungsi', 'statistik-daerah', 'sumur-resapan', 'taman',
      'taman-pemakaman-umum', 'tata-ruang-dan-bangunan', 'tempat-hiburan',
      'tempat-pelelangan-ikan', 'tempat-wisata', 'tenaga-kependidikan',
      'tindakan-asusila', 'transmigrasi', 'transportasi-publik', 'trotoar',
      'tutup-saluran', 'umkm'
    ]
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      accuracy: {
        type: Number
      }
    }
  },
  images: [{
    data: {
      type: String, // Base64 string
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);