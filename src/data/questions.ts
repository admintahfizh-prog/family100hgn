import type { Question } from '../types/game.ts';

export const INITIAL_QUESTIONS: Question[] = [
  // ==========================================
  // KATEGORI A: HARI GURU NASIONAL
  // ==========================================
  {
    id: 1,
    round: 'BABAK_1',
    category: 'Hari Guru Nasional',
    categoryIcon: 'Award',
    question: 'Apa simbol atau lambang yang paling sering ada pada peringatan Hari Guru Nasional?',
    answers: [
      { id: 101, rank: 1, text: 'Buku Terbuka', points: 100, keywords: ['buku', 'kitab', 'buku terbuka', 'lembaran buku'] },
      { id: 102, rank: 2, text: 'Obor / Api Pembelajaran', points: 80, keywords: ['obor', 'api', 'cahaya', 'lentera', 'api abadi'] },
      { id: 103, rank: 3, text: 'Pena / Pena Bulu / Pensil', points: 60, keywords: ['pena', 'pulpen', 'pensil', 'alat tulis', 'pena emas'] },
      { id: 104, rank: 4, text: 'Pita Merah Putih', points: 40, keywords: ['pita', 'merah putih', 'bendera', 'selendang'] },
      { id: 105, rank: 5, text: 'Topi Toga / Lambang PGRI', points: 20, keywords: ['toga', 'topi toga', 'pgri', 'lambang pgri', 'bintang'] },
    ],
    trivia: 'Hari Guru Nasional diperingati setiap 25 November bertepatan dengan hari lahir PGRI pada tahun 1945.'
  },
  {
    id: 2,
    round: 'BABAK_1',
    category: 'Hari Guru Nasional',
    categoryIcon: 'Calendar',
    question: 'Apa kegiatan yang biasanya diadakan sekolah saat merayakan Hari Guru Nasional?',
    answers: [
      { id: 201, rank: 1, text: 'Upacara Bendera Khusus', points: 100, keywords: ['upacara', 'upacara bendera', 'apel', 'apel pagi'] },
      { id: 202, rank: 2, text: 'Lomba Antar Guru / Pentas Seni', points: 80, keywords: ['lomba', 'lomba guru', 'pentas seni', 'perlombaan', 'karaoke'] },
      { id: 203, rank: 3, text: 'Pemberian Bunga & Kado dari Murid', points: 60, keywords: ['bunga', 'kado', 'hadiah', 'cokelat', 'surat cinta murid'] },
      { id: 204, rank: 4, text: 'Makan Bersama / Potong Tumpeng', points: 40, keywords: ['makan bersama', 'potong tumpeng', 'tumpeng', 'ramah tamah', 'traktiran'] },
      { id: 205, rank: 5, text: 'Siswa Menggantikan Guru Mengajar', points: 20, keywords: ['murid mengajar', 'siswa jadi guru', 'tukar peran', 'roleplay'] },
    ],
    trivia: 'Peringatan HGN ditetapkan melalui Keputusan Presiden No. 78 Tahun 1994.'
  },
  {
    id: 3,
    round: 'BABAK_2',
    category: 'Hari Guru Nasional',
    categoryIcon: 'BookOpen',
    question: 'Sebutkan ajaran atau semboyan trilogi pendidikan dari Ki Hajar Dewantara!',
    answers: [
      { id: 301, rank: 1, text: 'Ing Ngarso Sung Tulodo (Di depan memberi teladan)', points: 100, keywords: ['ing ngarso sung tulodo', 'ing ngarsa sung tulada', 'teladan', 'di depan'] },
      { id: 302, rank: 2, text: 'Ing Madyo Mangun Karso (Di tengah membangkitkan semangat)', points: 80, keywords: ['ing madyo mangun karso', 'ing madya mangun karsa', 'semangat', 'di tengah'] },
      { id: 303, rank: 3, text: 'Tut Wuri Handayani (Di belakang memberi dorongan)', points: 60, keywords: ['tut wuri handayani', 'tut wuri', 'handayani', 'dorongan', 'di belakang'] },
      { id: 304, rank: 4, text: 'Taman Siswa', points: 40, keywords: ['taman siswa', 'perguruan kebangsaan'] },
      { id: 305, rank: 5, text: 'Pendidikan Menghamba Pada Anak (Kodrat Anak)', points: 20, keywords: ['kodrat anak', 'menghamba pada anak', 'merdeka belajar', 'budi pekerti'] },
    ],
    trivia: 'Semboyan Tut Wuri Handayani kini menjadi lambang resmi Kementerian Pendidikan Indonesia.'
  },
  {
    id: 4,
    round: 'BABAK_1',
    category: 'Hari Guru Nasional',
    categoryIcon: 'HeartHandshake',
    question: 'Selain "Guru", sebutan penghormatan apa yang sering diberikan kepada guru di Indonesia?',
    answers: [
      { id: 401, rank: 1, text: 'Pahlawan Tanpa Tanda Jasa', points: 100, keywords: ['pahlawan tanpa tanda jasa', 'tanpa tanda jasa', 'pahlawan'] },
      { id: 402, rank: 2, text: 'Ustadz / Ustadzah', points: 80, keywords: ['ustadz', 'ustadzah', 'ustad', 'guru ngaji'] },
      { id: 403, rank: 3, text: 'Pendidik / Pengajar', points: 60, keywords: ['pendidik', 'pengajar', 'edukator'] },
      { id: 404, rank: 4, text: 'Orang Tua Kedua di Sekolah', points: 40, keywords: ['orang tua kedua', 'orang tua', 'wali murid', 'bunda/ayah'] },
      { id: 405, rank: 5, text: 'Pelita Kegelapan / Penerang Jiwa', points: 20, keywords: ['pelita', 'penerang', 'pembimbing', 'mentor'] },
    ],
    trivia: 'Lagu "Hymne Guru" diciptakan oleh Sartono, guru seni musik asal Madiun.'
  },
  {
    id: 5,
    round: 'BABAK_2',
    category: 'Hari Guru Nasional',
    categoryIcon: 'Compass',
    question: 'Di kota manakah Kongres Guru Indonesia pertama kali digelar pada 24-25 November 1945?',
    answers: [
      { id: 501, rank: 1, text: 'Surakarta / Solo', points: 100, keywords: ['surakarta', 'solo', 'kota solo'] },
      { id: 502, rank: 2, text: 'Yogyakarta', points: 80, keywords: ['jogja', 'yogyakarta', 'diy'] },
      { id: 503, rank: 3, text: 'Jakarta', points: 60, keywords: ['jakarta', 'batavia'] },
      { id: 504, rank: 4, text: 'Bandung', points: 40, keywords: ['bandung', 'kota kembang'] },
      { id: 505, rank: 5, text: 'Surabaya', points: 20, keywords: ['surabaya', 'kota pahlawan'] },
    ],
    trivia: 'Kongres diselenggarakan di Sekolah Guru Putri (SGP) Surakarta hanya 100 hari setelah proklamasi kemerdekaan.'
  },

  // ==========================================
  // KATEGORI B: PENGETAHUAN UMUM & SEJARAH
  // ==========================================
  {
    id: 6,
    round: 'BABAK_1',
    category: 'Pengetahuan Umum',
    categoryIcon: 'Globe',
    question: 'Sebutkan pahlawan nasional wanita yang paling dikenal dalam sejarah Indonesia!',
    answers: [
      { id: 601, rank: 1, text: 'R.A. Kartini', points: 100, keywords: ['kartini', 'ra kartini', 'raden ajeng kartini'] },
      { id: 602, rank: 2, text: 'Cut Nyak Dien', points: 80, keywords: ['cut nyak dien', 'cut nyak dhien', 'aceh'] },
      { id: 603, rank: 3, text: 'Dewi Sartika', points: 60, keywords: ['dewi sartika', 'raden dewi sartika'] },
      { id: 604, rank: 4, text: 'Cut Meutia', points: 40, keywords: ['cut meutia', 'cut mutia'] },
      { id: 605, rank: 5, text: 'Martha Christina Tiahahu', points: 20, keywords: ['martha christina', 'tiahahu', 'maluku'] },
    ],
    trivia: 'Dewi Sartika mendirikan Sakola Istri di Bandung pada tahun 1904.'
  },
  {
    id: 7,
    round: 'BABAK_2',
    category: 'Pengetahuan Umum',
    categoryIcon: 'MapPin',
    question: 'Sebutkan pulau-pulau besar utama di wilayah Negara Kesatuan Republik Indonesia!',
    answers: [
      { id: 701, rank: 1, text: 'Pulau Kalimantan', points: 100, keywords: ['kalimantan', 'borneo'] },
      { id: 702, rank: 2, text: 'Pulau Sumatera', points: 80, keywords: ['sumatera', 'sumatra', 'andalas'] },
      { id: 703, rank: 3, text: 'Pulau Papua', points: 60, keywords: ['papua', 'irian', 'irian jaya'] },
      { id: 704, rank: 4, text: 'Pulau Sulawesi', points: 40, keywords: ['sulawesi', 'celebes'] },
      { id: 705, rank: 5, text: 'Pulau Jawa', points: 20, keywords: ['jawa', 'java'] },
    ],
    trivia: 'Indonesia memiliki lebih dari 17.000 pulau, menjadikannya negara kepulauan terbesar di dunia.'
  },
  {
    id: 8,
    round: 'BABAK_1',
    category: 'Pengetahuan Umum',
    categoryIcon: 'Landmark',
    question: 'Apa warisan budaya asli Indonesia yang telah diakui oleh UNESCO sebagai Warisan Takbenda Dunia?',
    answers: [
      { id: 801, rank: 1, text: 'Batik Indonesia', points: 100, keywords: ['batik', 'kain batik', 'baju batik'] },
      { id: 802, rank: 2, text: 'Wayang Kulit', points: 80, keywords: ['wayang', 'wayang kulit', 'pertunjukan wayang'] },
      { id: 803, rank: 3, text: 'Keris', points: 60, keywords: ['keris', 'senjata keris'] },
      { id: 804, rank: 4, text: 'Angklung', points: 40, keywords: ['angklung', 'alat musik angklung'] },
      { id: 805, rank: 5, text: 'Gamelan / Tari Saman / Pencak Silat', points: 20, keywords: ['gamelan', 'tari saman', 'pencak silat', 'silat', 'noken'] },
    ],
    trivia: 'Hari Batik Nasional diperingati setiap tanggal 2 Oktober setelah pengakuan resmi UNESCO pada 2009.'
  },
  {
    id: 9,
    round: 'BABAK_2',
    category: 'Pengetahuan Umum',
    categoryIcon: 'Building',
    question: 'Sebutkan nama gedung atau tempat bersejarah di Indonesia yang sering jadi destinasi study tour sekolah!',
    answers: [
      { id: 901, rank: 1, text: 'Candi Borobudur', points: 100, keywords: ['borobudur', 'candi borobudur', 'magelang'] },
      { id: 902, rank: 2, text: 'Monas (Monumen Nasional)', points: 80, keywords: ['monas', 'monumen nasional', 'tugu monas'] },
      { id: 903, rank: 3, text: 'Candi Prambanan', points: 60, keywords: ['prambanan', 'candi prambanan', 'roro jonggrang'] },
      { id: 904, rank: 4, text: 'Museum Nasional / Gedung Gajah', points: 40, keywords: ['museum nasional', 'gedung gajah', 'museum'] },
      { id: 905, rank: 5, text: 'Gedung Sate / Lawang Sewu', points: 20, keywords: ['gedung sate', 'lawang sewu', 'benteng vredebug', 'kraton'] },
    ],
    trivia: 'Candi Borobudur dibangun pada abad ke-8 oleh Dinasti Syailendra.'
  },
  {
    id: 10,
    round: 'BABAK_2',
    category: 'Pengetahuan Umum',
    categoryIcon: 'Flag',
    question: 'Siapa saja tokoh pahlawan perumus teks Proklamasi Kemerdekaan Indonesia?',
    answers: [
      { id: 1001, rank: 1, text: 'Ir. Soekarno (Bung Karno)', points: 100, keywords: ['soekarno', 'bung karno', 'presiden soekarno'] },
      { id: 1002, rank: 2, text: 'Drs. Mohammad Hatta (Bung Hatta)', points: 80, keywords: ['hatta', 'bung hatta', 'mohammad hatta'] },
      { id: 1003, rank: 3, text: 'Achmad Soebardjo', points: 60, keywords: ['achmad soebardjo', 'soebardjo', 'ahmad subardjo'] },
      { id: 1004, rank: 4, text: 'Sayuti Melik (Pengetik Teks)', points: 40, keywords: ['sayuti melik', 'sayuti', 'pengetik proklamasi'] },
      { id: 1005, rank: 5, text: 'Laksamana Maeda (Penyedia Tempat)', points: 20, keywords: ['laksamana maeda', 'maeda', 'sukarni', 'bm diah'] },
    ],
    trivia: 'Naskah asli teks proklamasi tulisan tangan Bung Karno sempat dibuang ke tempat sampah lalu diselamatkan oleh BM Diah.'
  },

  // ==========================================
  // KATEGORI C: AGAMA ISLAM
  // ==========================================
  {
    id: 11,
    round: 'BABAK_1',
    category: 'Pendidikan Agama Islam',
    categoryIcon: 'Moon',
    question: 'Sebutkan 5 rukun Islam yang wajib diketahui dan diamalkan setiap muslim!',
    answers: [
      { id: 1101, rank: 1, text: 'Mengucapkan Dua Kalimat Syahadat', points: 100, keywords: ['syahadat', 'dua kalimat syahadat', 'bersaksi'] },
      { id: 1102, rank: 2, text: 'Mendirikan Salat 5 Waktu', points: 80, keywords: ['salat', 'sholat', 'sholat lima waktu', 'solat'] },
      { id: 1103, rank: 3, text: 'Menunaikan Zakat', points: 60, keywords: ['zakat', 'zakat fitrah', 'bayar zakat'] },
      { id: 1104, rank: 4, text: 'Berpuasa di Bulan Ramadhan', points: 40, keywords: ['puasa', 'puasa ramadhan', 'shaum'] },
      { id: 1105, rank: 5, text: 'Menunaikan Ibadah Haji Bagi yang Mampu', points: 20, keywords: ['haji', 'ibadah haji', 'pergi ke mekkah', 'mampu'] },
    ],
    trivia: 'Hadits Rukun Islam diriwayatkan oleh Abdullah bin Umar radhiyallahu anhuma.'
  },
  {
    id: 12,
    round: 'BABAK_2',
    category: 'Pendidikan Agama Islam',
    categoryIcon: 'BookCheck',
    question: 'Sebutkan 5 nabi dan rasul yang mendapat gelar kehormatan "Ulul Azmi" karena keteguhan hatinya!',
    answers: [
      { id: 1201, rank: 1, text: 'Nabi Muhammad SAW', points: 100, keywords: ['muhammad', 'nabi muhammad', 'rasulullah'] },
      { id: 1202, rank: 2, text: 'Nabi Ibrahim AS', points: 80, keywords: ['ibrahim', 'nabi ibrahim'] },
      { id: 1203, rank: 3, text: 'Nabi Musa AS', points: 60, keywords: ['musa', 'nabi musa'] },
      { id: 1204, rank: 4, text: 'Nabi Isa AS', points: 40, keywords: ['isa', 'nabi isa'] },
      { id: 1205, rank: 5, text: 'Nabi Nuh AS', points: 20, keywords: ['nuh', 'nabi nuh'] },
    ],
    trivia: 'Disingkat sering menggunakan jembatan keledai MIMIN: Muhammad, Ibrahim, Musa, Isa, Nuh.'
  },
  {
    id: 13,
    round: 'BABAK_2',
    category: 'Pendidikan Agama Islam',
    categoryIcon: 'Sparkles',
    question: 'Apa saja 4 sifat wajib yang dimiliki oleh para Rasul Allah?',
    answers: [
      { id: 1301, rank: 1, text: 'Siddiq (Selalu Benar / Jujur)', points: 100, keywords: ['siddiq', 'shiddiq', 'jujur', 'benar'] },
      { id: 1302, rank: 2, text: 'Amanah (Dapat Dipercaya)', points: 80, keywords: ['amanah', 'terpercaya', 'dapat dipercaya'] },
      { id: 1303, rank: 3, text: 'Tabligh (Menyampaikan Wahyu)', points: 60, keywords: ['tabligh', 'tablig', 'menyampaikan'] },
      { id: 1304, rank: 4, text: 'Fathanah (Cerdas / Bijaksana)', points: 40, keywords: ['fathanah', 'fatonah', 'cerdas', 'pandai'] },
      { id: 1305, rank: 5, text: 'Ma\'shum (Terpelihara dari Dosa)', points: 20, keywords: ['mashum', 'maksum', 'terpelihara', 'terjaga'] },
    ],
    trivia: 'Sifat-sifat ini juga merupakan pilar karakter ideal bagi seorang pendidik sejati.'
  },
  {
    id: 14,
    round: 'BABAK_1',
    category: 'Pendidikan Agama Islam',
    categoryIcon: 'Sun',
    question: 'Sebutkan waktu salat fardhu yang lima dalam sehari semalam!',
    answers: [
      { id: 1401, rank: 1, text: 'Salat Subuh', points: 100, keywords: ['subuh', 'sholat subuh', 'fajar'] },
      { id: 1402, rank: 2, text: 'Salat Dzuhur', points: 80, keywords: ['dzuhur', 'zuhur', 'sholat dzuhur'] },
      { id: 1403, rank: 3, text: 'Salat Ashar', points: 60, keywords: ['ashar', 'asar', 'sholat ashar'] },
      { id: 1404, rank: 4, text: 'Salat Maghrib', points: 40, keywords: ['maghrib', 'magrib', 'sholat maghrib'] },
      { id: 1405, rank: 5, text: 'Salat Isya', points: 20, keywords: ['isya', 'sholat isya', 'isa'] },
    ],
    trivia: 'Perintah salat 5 waktu diterima Rasulullah SAW langsung saat peristiwa Isra Mi\'raj.'
  },
  {
    id: 15,
    round: 'BABAK_2',
    category: 'Pendidikan Agama Islam',
    categoryIcon: 'FileText',
    question: 'Sebutkan 4 Kitab Suci yang diturunkan Allah SWT kepada para Rasul-Nya!',
    answers: [
      { id: 1501, rank: 1, text: 'Al-Qur\'an (Nabi Muhammad SAW)', points: 100, keywords: ['al quran', 'al-quran', 'quran'] },
      { id: 1502, rank: 2, text: 'Taurat (Nabi Musa AS)', points: 80, keywords: ['taurat', 'torah'] },
      { id: 1503, rank: 3, text: 'Injil (Nabi Isa AS)', points: 60, keywords: ['injil', 'bible'] },
      { id: 1504, rank: 4, text: 'Zabur (Nabi Daud AS)', points: 40, keywords: ['zabur', 'mazmur'] },
      { id: 1505, rank: 5, text: 'Shuhuf (Lembaran Nabi Ibrahim & Musa)', points: 20, keywords: ['shuhuf', 'suhuf', 'lembaran'] },
    ],
    trivia: 'Al-Qur\'an diturunkan sebagai penyempurna dan penjaga bagi kitab-kitab sebelumnya.'
  },

  // ==========================================
  // KATEGORI D: UNDANG-UNDANG & DUNIA PENDIDIKAN
  // ==========================================
  {
    id: 16,
    round: 'BABAK_2',
    category: 'Regulasi & Profesi Guru',
    categoryIcon: 'Scale',
    question: 'Berdasarkan UU No. 14 Tahun 2005, sebutkan 4 Kompetensi Standar yang wajib dimiliki guru!',
    answers: [
      { id: 1601, rank: 1, text: 'Kompetensi Pedagogik', points: 100, keywords: ['pedagogik', 'pedagogi', 'mengajar', 'ilmu mendidik'] },
      { id: 1602, rank: 2, text: 'Kompetensi Profesional', points: 80, keywords: ['profesional', 'keahlian', 'penguasaan materi'] },
      { id: 1603, rank: 3, text: 'Kompetensi Kepribadian', points: 60, keywords: ['kepribadian', 'akhlak', 'karakter', 'teladan'] },
      { id: 1604, rank: 4, text: 'Kompetensi Sosial', points: 40, keywords: ['sosial', 'komunikasi', 'masyarakat', 'hubungan'] },
      { id: 1605, rank: 5, text: 'Sertifikasi Pendidik / PPG', points: 20, keywords: ['sertifikasi', 'ppg', 'akta', 'sertifikat pendidik'] },
    ],
    trivia: 'UU Guru dan Dosen disahkan pada tanggal 30 Desember 2005.'
  },
  {
    id: 17,
    round: 'BABAK_1',
    category: 'Regulasi & Profesi Guru',
    categoryIcon: 'Briefcase',
    question: 'Apa saja dokumen atau perangkat pembelajaran yang wajib disiapkan guru sebelum mengajar?',
    answers: [
      { id: 1701, rank: 1, text: 'Modul Ajar / RPP (Rencana Pelaksanaan Pembelajaran)', points: 100, keywords: ['modul ajar', 'rpp', 'rencana pembelajaran', 'lesson plan'] },
      { id: 1702, rank: 2, text: 'Silabus / Alur Tujuan Pembelajaran (ATP)', points: 80, keywords: ['atp', 'silabus', 'alur tujuan pembelajaran', 'capaian pembelajaran'] },
      { id: 1703, rank: 3, text: 'Buku Nilai / Lembar Asesmen', points: 60, keywords: ['buku nilai', 'asesmen', 'rubrik penilaian', 'daftar nilai'] },
      { id: 1704, rank: 4, text: 'Daftar Hadir / Absensi Siswa', points: 40, keywords: ['absensi', 'daftar hadir', 'presensi'] },
      { id: 1705, rank: 5, text: 'Buku Jurnal Mengajar / Agenda Harian', points: 20, keywords: ['jurnal', 'agenda', 'buku jurnal', 'catatan kasus'] },
    ],
    trivia: 'Dalam Kurikulum Merdeka, RPP disederhanakan dan diperkaya menjadi Modul Ajar.'
  },
  {
    id: 18,
    round: 'BABAK_2',
    category: 'Regulasi & Profesi Guru',
    categoryIcon: 'FileCheck',
    question: 'Apa istilah-istilah baru yang paling sering terdengar dalam implementasi Kurikulum Merdeka?',
    answers: [
      { id: 1801, rank: 1, text: 'P5 (Projek Penguatan Profil Pelajar Pancasila)', points: 100, keywords: ['p5', 'projek penguatan', 'profil pelajar pancasila', 'pelajar pancasila'] },
      { id: 1802, rank: 2, text: 'CP (Capaian Pembelajaran)', points: 80, keywords: ['cp', 'capaian pembelajaran', 'capaian'] },
      { id: 1803, rank: 3, text: 'Pembelajaran Berdiferensiasi', points: 60, keywords: ['berdiferensiasi', 'diferensiasi', 'diferensial'] },
      { id: 1804, rank: 4, text: 'Platform Merdeka Mengajar (PMM)', points: 40, keywords: ['pmm', 'platform merdeka mengajar', 'merdeka mengajar'] },
      { id: 1805, rank: 5, text: 'Asesmen Diagnostik / Formatif', points: 20, keywords: ['asesmen diagnostik', 'diagnostik', 'formatif', 'sumatif'] },
    ],
    trivia: 'Kurikulum Merdeka mengedepankan fleksibilitas dan fokus pada materi esensial.'
  },
  {
    id: 19,
    round: 'BABAK_2',
    category: 'Regulasi & Profesi Guru',
    categoryIcon: 'Award',
    question: 'Berdasarkan UU Nomor 20 Tahun 2003 (Sisdiknas), apa saja jenjang pendidikan formal di Indonesia?',
    answers: [
      { id: 1901, rank: 1, text: 'Pendidikan Dasar (SD/MI & SMP/MTs)', points: 100, keywords: ['pendidikan dasar', 'sd', 'smp', 'dasar', 'dikdas'] },
      { id: 1902, rank: 2, text: 'Pendidikan Menengah (SMA/SMK/MA)', points: 80, keywords: ['pendidikan menengah', 'sma', 'smk', 'menengah', 'dikmen'] },
      { id: 1903, rank: 3, text: 'Pendidikan Tinggi (Universitas/Institut/Politeknik)', points: 60, keywords: ['pendidikan tinggi', 'kuliah', 'perguruan tinggi', 'universitas'] },
      { id: 1904, rank: 4, text: 'Pendidikan Anak Usia Dini (PAUD / TK)', points: 40, keywords: ['paud', 'tk', 'usia dini', 'taman kanak-kanak'] },
      { id: 1905, rank: 5, text: 'Pendidikan Vokasi / Khusus (SLB)', points: 20, keywords: ['vokasi', 'khusus', 'slb', 'kejuruan'] },
    ],
    trivia: 'Pendidikan nasional berfungsi mengembangkan kemampuan dan membentuk watak serta peradaban bangsa yang bermartabat.'
  },
  {
    id: 20,
    round: 'BABAK_1',
    category: 'Regulasi & Profesi Guru',
    categoryIcon: 'Smile',
    question: 'Apa hak utama yang diperoleh guru menurut Undang-Undang Guru dan Dosen?',
    answers: [
      { id: 2001, rank: 1, text: 'Penghasilan di Atas Kebutuhan Hidup Minimum & Tunjangan', points: 100, keywords: ['gaji', 'tunjangan', 'penghasilan', 'sertifikasi', 'tpg'] },
      { id: 2002, rank: 2, text: 'Perlindungan Hukum & Keselamatan Kerja', points: 80, keywords: ['perlindungan', 'hukum', 'keamanan', 'keselamatan kerja'] },
      { id: 2003, rank: 3, text: 'Kesempatan Mengembangkan Kompetensi / Pelatihan', points: 60, keywords: ['pelatihan', 'pengembangan diri', 'kompetensi', 'beasiswa'] },
      { id: 2004, rank: 4, text: 'Hak Cuti & Penghargaan Prestasi', points: 40, keywords: ['cuti', 'penghargaan', 'apresiasi', 'libur'] },
      { id: 2005, rank: 5, text: 'Kebebasan Berserikat di Organisasi Profesi', points: 20, keywords: ['organisasi profesi', 'berserikat', 'pgri', 'komunitas'] },
    ],
    trivia: 'Tunjangan Profesi Guru (TPG) diberikan setara dengan satu kali gaji pokok bagi guru bersertifikat.'
  },

  // ==========================================
  // KATEGORI E: PENDIDIKAN KARAKTER & KEBUDAYAAN
  // ==========================================
  {
    id: 21,
    round: 'BABAK_2',
    category: 'Pendidikan Karakter',
    categoryIcon: 'Heart',
    question: 'Sebutkan 6 dimensi utama Profil Pelajar Pancasila yang wajib ditanamkan guru kepada murid!',
    answers: [
      { id: 2101, rank: 1, text: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia', points: 100, keywords: ['beriman', 'bertakwa', 'akhlak mulia', 'tuhan', 'berakhlak'] },
      { id: 2102, rank: 2, text: 'Berkebinekaan Global', points: 80, keywords: ['berkebinekaan global', 'kebinekaan', 'kebhinekaan', 'global'] },
      { id: 2103, rank: 3, text: 'Bergotong Royong', points: 60, keywords: ['gotong royong', 'kolaborasi', 'kerjasama'] },
      { id: 2104, rank: 4, text: 'Mandiri', points: 40, keywords: ['mandiri', 'kemandirian'] },
      { id: 2105, rank: 5, text: 'Bernalar Kritis & Kreatif', points: 20, keywords: ['bernalar kritis', 'kritis', 'kreatif', 'kreativitas', 'inovatif'] },
    ],
    trivia: 'Profil Pelajar Pancasila merupakan kompas penuntun arah seluruh kebijakan pendidikan di Indonesia.'
  },
  {
    id: 22,
    round: 'BABAK_2',
    category: 'Bahasa & Sastra Indonesia',
    categoryIcon: 'BookOpen',
    question: 'Sebutkan sastrawan atau penulis karya legendaris Indonesia yang sering diajarkan dalam pelajaran sastra!',
    answers: [
      { id: 2201, rank: 1, text: 'Chairil Anwar (Pelopor Angkatan 45 - "Aku")', points: 100, keywords: ['chairil anwar', 'chairil', 'si binatang jalang', 'aku'] },
      { id: 2202, rank: 2, text: 'Pramoedya Ananta Toer (Tetralogi Buru)', points: 80, keywords: ['pramoedya', 'pram', 'bumi manusia', 'pramoedya ananta toer'] },
      { id: 2203, rank: 3, text: 'Buya Hamka (Tenggelamnya Kapal Van der Wijck)', points: 60, keywords: ['hamka', 'buya hamka', 'van der wijck'] },
      { id: 2204, rank: 4, text: 'Sapardi Djoko Damono (Hujan Bulan Juni)', points: 40, keywords: ['sapardi', 'sapardi djoko damono', 'hujan bulan juni'] },
      { id: 2205, rank: 5, text: 'Marah Rusli / Taufiq Ismail / WS Rendra', points: 20, keywords: ['marah rusli', 'siti nurbaya', 'taufiq ismail', 'ws rendra', 'rendra'] },
    ],
    trivia: 'Puisi "Aku" karya Chairil Anwar pertama kali ditulis pada Maret 1943 di masa pendudukan Jepang.'
  },
  {
    id: 23,
    round: 'BABAK_2',
    category: 'Seni Budaya Nusantara',
    categoryIcon: 'Music',
    question: 'Sebutkan alat musik tradisional khas daerah di Indonesia yang paling sering dipelajari di sekolah!',
    answers: [
      { id: 2301, rank: 1, text: 'Angklung (Jawa Barat)', points: 100, keywords: ['angklung', 'bambu', 'jawa barat', 'sunda'] },
      { id: 2302, rank: 2, text: 'Gamelan (Jawa & Bali)', points: 80, keywords: ['gamelan', 'gong', 'saron', 'kendang', 'jawa', 'bali'] },
      { id: 2303, rank: 3, text: 'Kolintang (Sulawesi Utara)', points: 60, keywords: ['kolintang', 'kulintang', 'minahasa', 'sulawesi utara'] },
      { id: 2304, rank: 4, text: 'Sasando (Nusa Tenggara Timur / Rote)', points: 40, keywords: ['sasando', 'ntt', 'rote', 'alat musik petik'] },
      { id: 2305, rank: 5, text: 'Tifa (Papua & Maluku) / Kendang', points: 20, keywords: ['tifa', 'papua', 'maluku', 'kendang', 'gendang', 'saluang'] },
    ],
    trivia: 'Angklung telah diakui oleh UNESCO sebagai Warisan Budaya Takbenda Dunia sejak November 2010.'
  },
  {
    id: 24,
    round: 'BABAK_2',
    category: 'Wawasan Kebangsaan',
    categoryIcon: 'Flag',
    question: 'Apa saja 3 butir ikrar bersejarah Sumpah Pemuda 28 Oktober 1928?',
    answers: [
      { id: 2401, rank: 1, text: 'Bertumpah Darah yang Satu, Tanah Air Indonesia', points: 100, keywords: ['tanah air', 'tanah air indonesia', 'bertumpah darah', 'satu tanah air'] },
      { id: 2402, rank: 2, text: 'Berbangsa yang Satu, Bangsa Indonesia', points: 80, keywords: ['bangsa indonesia', 'berbangsa', 'satu bangsa', 'bangsa'] },
      { id: 2403, rank: 3, text: 'Menjunjung Bahasa Persatuan, Bahasa Indonesia', points: 60, keywords: ['bahasa indonesia', 'bahasa persatuan', 'menjunjung bahasa', 'bahasa'] },
      { id: 2404, rank: 4, text: 'Lagu Indonesia Raya Pertama Kali Dikumandangkan', points: 40, keywords: ['indonesia raya', 'wr supratman', 'lagu kebangsaan', 'biola'] },
      { id: 2405, rank: 5, text: 'Persatuan Jong Java, Jong Sumatranen Bond, Jong Celebes', points: 20, keywords: ['jong java', 'jong celebes', 'jong sumatera', 'pemuda'] },
    ],
    trivia: 'Sumpah Pemuda dibacakan di Gedung Indonesische Clubgebouw, Jalan Kramat Raya 106 Jakarta.'
  },
  {
    id: 25,
    round: 'BABAK_2',
    category: 'Etika & Profesi Guru',
    categoryIcon: 'Award',
    question: 'Sikap atau kepribadian apa yang paling membuat seorang guru disegani dan dicintai para muridnya?',
    answers: [
      { id: 2501, rank: 1, text: 'Sabar, Ramah, dan Tidak Mudah Marah', points: 100, keywords: ['sabar', 'ramah', 'tidak pemarah', 'lemah lembut', 'senyum'] },
      { id: 2502, rank: 2, text: 'Adil dan Tidak Pilih Kasih kepada Semua Murid', points: 80, keywords: ['adil', 'tidak pilih kasih', 'merata', 'objektif', 'bijak'] },
      { id: 2503, rank: 3, text: 'Humoris dan Cara Mengajarnya Asyik Menyenangkan', points: 60, keywords: ['humoris', 'lucu', 'menyenangkan', 'seru', 'tidak membosankan'] },
      { id: 2504, rank: 4, text: 'Menguasai Materi dan Menjelaskan dengan Jelas', points: 40, keywords: ['jelas', 'paham', 'menguasai materi', 'mudah dipahami', 'pintar'] },
      { id: 2505, rank: 5, text: 'Disiplin, Tepat Waktu, dan Menjadi Teladan Nyata', points: 20, keywords: ['disiplin', 'tepat waktu', 'teladan', 'konsisten', 'akhlak'] },
    ],
    trivia: 'Guru yang dirindukan adalah guru yang mampu menyentuh hati sebelum mengasah pikiran.'
  },

  // ==========================================
  // KATEGORI F: BAHASA DAN SAINS
  // ==========================================
  {
    id: 26,
    round: 'BABAK_1',
    category: 'Bahasa & Sains',
    categoryIcon: 'Feather',
    question: 'Lengkapi peribahasa terkenal ini: "Tong kosong nyaring ..."',
    answers: [
      { id: 2601, rank: 1, text: 'Bunyinya', points: 100, keywords: ['bunyinya', 'bunyi', 'suaranya'] },
      { id: 2602, rank: 2, text: 'Artinya: Orang banyak bicara biasanya kurang berilmu', points: 80, keywords: ['artinya', 'kurang ilmu', 'banyak bicara', 'sombong'] },
      { id: 2603, rank: 3, text: 'Suaranya', points: 60, keywords: ['suaranya', 'bising'] },
      { id: 2604, rank: 4, text: 'Ketukannya', points: 40, keywords: ['ketukannya', 'gema'] },
      { id: 2605, rank: 5, text: 'Gendangnya', points: 20, keywords: ['gendangnya', 'tabuh'] },
    ],
    trivia: 'Peribahasa Indonesia sarat akan nasihat bijak untuk tetap rendah hati dan berilmu.'
  },
  {
    id: 27,
    round: 'BABAK_2',
    category: 'Bahasa & Sains',
    categoryIcon: 'Atom',
    question: 'Apa saja 3 wujud utama zat benda di alam semesta beserta contohnya?',
    answers: [
      { id: 2701, rank: 1, text: 'Benda Padat (Batu, Meja, Kayu)', points: 100, keywords: ['padat', 'zat padat', 'benda padat'] },
      { id: 2702, rank: 2, text: 'Benda Cair (Air, Minyak, Sirup)', points: 80, keywords: ['cair', 'zat cair', 'benda cair', 'air'] },
      { id: 2703, rank: 3, text: 'Benda Gas (Udara, Oksigen, Uap)', points: 60, keywords: ['gas', 'zat gas', 'udara', 'oksigen'] },
      { id: 2704, rank: 4, text: 'Plasma (Petir, Api Matahari)', points: 40, keywords: ['plasma', 'api', 'bintang'] },
      { id: 2705, rank: 5, text: 'Perubahan Wujud (Mencair, Membeku, Menguap)', points: 20, keywords: ['mencair', 'membeku', 'menguap', 'menyublim'] },
    ],
    trivia: 'Plasma merupakan wujud zat keempat yang membentuk lebih dari 99% materi di alam semesta.'
  },
  {
    id: 28,
    round: 'BABAK_1',
    category: 'Bahasa & Sains',
    categoryIcon: 'Sun',
    question: 'Sebutkan nama-nama planet dalam tata surya kita yang mengelilingi matahari!',
    answers: [
      { id: 2801, rank: 1, text: 'Bumi (Planet Tempat Kita Hidup)', points: 100, keywords: ['bumi', 'earth'] },
      { id: 2802, rank: 2, text: 'Mars (Planet Merah)', points: 80, keywords: ['mars', 'planet merah'] },
      { id: 2803, rank: 3, text: 'Yupiter / Jupiter (Planet Terbesar)', points: 60, keywords: ['jupiter', 'yupiter', 'planet terbesar'] },
      { id: 2804, rank: 4, text: 'Saturnus (Planet Bercincin Cantik)', points: 40, keywords: ['saturnus', 'cincin'] },
      { id: 2805, rank: 5, text: 'Merkurius / Venus / Neptunus', points: 20, keywords: ['merkurius', 'venus', 'neptunus', 'uranus'] },
    ],
    trivia: 'Sejak 2006, Pluto tidak lagi dikategorikan sebagai planet utama melainkan planet kerdil (dwarf planet).'
  },
  {
    id: 29,
    round: 'BABAK_2',
    category: 'Bahasa & Sains',
    categoryIcon: 'Activity',
    question: 'Organ tubuh manusia apa yang berfungsi memompa darah ke seluruh tubuh tanpa pernah istirahat?',
    answers: [
      { id: 2901, rank: 1, text: 'Jantung (Cor)', points: 100, keywords: ['jantung', 'heart', 'cor'] },
      { id: 2902, rank: 2, text: 'Paru-paru (Organ Pernapasan)', points: 80, keywords: ['paru-paru', 'paru paru', 'pulmo'] },
      { id: 2903, rank: 3, text: 'Otak (Pusat Kendali Saraf)', points: 60, keywords: ['otak', 'brain', 'cerebrum'] },
      { id: 2904, rank: 4, text: 'Ginjal (Penyaring Darah)', points: 40, keywords: ['ginjal', 'ren'] },
      { id: 2905, rank: 5, text: 'Hati / Liver (Penawar Racun)', points: 20, keywords: ['hati', 'liver', 'hepar'] },
    ],
    trivia: 'Jantung manusia berdetak rata-rata 100.000 kali dalam sehari!'
  },
  {
    id: 30,
    round: 'BABAK_1',
    category: 'Bahasa & Sains',
    categoryIcon: 'BookOpen',
    question: 'Lengkapi peribahasa ini: "Sedikit demi sedikit, lama-lama menjadi ..."',
    answers: [
      { id: 3001, rank: 1, text: 'Bukit', points: 100, keywords: ['bukit', 'sebuah bukit'] },
      { id: 3002, rank: 2, text: 'Gunung', points: 80, keywords: ['gunung'] },
      { id: 3003, rank: 3, text: 'Banyak / Tabungan', points: 60, keywords: ['banyak', 'kaya', 'tabungan'] },
      { id: 3004, rank: 4, text: 'Lelah / Habis', points: 40, keywords: ['lelah', 'capek', 'habis'] },
      { id: 3005, rank: 5, text: 'Batu', points: 20, keywords: ['batu'] },
    ],
    trivia: 'Peribahasa ini mengajarkan konsistensi dan kesabaran, nilai utama seorang guru teladan.'
  },

  // ==========================================
  // KATEGORI G: DUNIA GURU & HUMOR EDUKATIF (BABAK 3: SUPER BONUS HGN - 2x POINTS)
  // ==========================================
  {
    id: 31,
    round: 'BABAK_3',
    category: 'Humor & Dunia Guru',
    categoryIcon: 'ShoppingBag',
    isJackpot: true,
    question: 'Benda apa yang PASTI SELALU ada di dalam tas seorang guru saat berangkat ke sekolah?',
    answers: [
      { id: 3101, rank: 1, text: 'Laptop / Charger Laptop', points: 100, keywords: ['laptop', 'notebook', 'charger', 'casan', 'kabel data'] },
      { id: 3102, rank: 2, text: 'Spidol Boardmarker & Penghapus Papan', points: 80, keywords: ['spidol', 'spidol papan', 'boardmarker', 'penghapus', 'refill spidol'] },
      { id: 3103, rank: 3, text: 'Pulpen Merah untuk Mengoreksi', points: 60, keywords: ['pulpen merah', 'pulpen', 'pena', 'ballpoint merah', 'alat tulis'] },
      { id: 3104, rank: 4, text: 'Botol Minum / Tumbler', points: 40, keywords: ['tumbler', 'botol minum', 'tempat minum', 'tupperware', 'air putih'] },
      { id: 3105, rank: 5, text: 'Minyak Angin / Tolak Angin / Obat Sakit Kepala', points: 20, keywords: ['minyak angin', 'freshcare', 'tolak angin', 'kayu putih', 'paracetamol', 'bodrex'] },
    ],
    trivia: 'Minyak angin adalah sahabat sejati guru saat mengoreksi 150 lembar jawaban ujian siswa!'
  },
  {
    id: 32,
    round: 'BABAK_3',
    category: 'Humor & Dunia Guru',
    categoryIcon: 'MessageCircle',
    question: 'Kalimat apa yang paling sering diucapkan guru ketika suasana kelas sedang ribut?',
    answers: [
      { id: 3201, rank: 1, text: '"Tolong diam! Suara kalian terdengar sampai kantor kepala sekolah!"', points: 100, keywords: ['diam', 'tolong diam', 'kantor kepala sekolah', 'kepala sekolah', 'jangan ribut'] },
      { id: 3202, rank: 2, text: '"Yang mau bicara di depan, silakan gantikan ibu/bapak mengajar!"', points: 80, keywords: ['gantikan di depan', 'bicara di depan', 'silakan ke depan', 'gantiin guru'] },
      { id: 3203, rank: 3, text: '"Ibu/Bapak tunggu sampai kalian selesai mengobrol ya!"', points: 60, keywords: ['tunggu selesai ngobrol', 'ibu tunggu', 'silakan lanjutkan ngobrol'] },
      { id: 3204, rank: 4, text: '"Perhatikan papan tulis! Soal ini pasti keluar di ujian!"', points: 40, keywords: ['perhatikan papan tulis', 'keluar di ujian', 'papan tulis', 'lihat ke depan'] },
      { id: 3205, rank: 5, text: '"Keluar saja yang tidak mau belajar!"', points: 20, keywords: ['keluar saja', 'silakan keluar', 'jangan ikut pelajaran'] },
    ],
    trivia: 'Momen hening sejenak guru di depan kelas seringkali lebih menakutkan daripada bentakan keras!'
  },
  {
    id: 33,
    round: 'BABAK_3',
    category: 'Humor & Dunia Guru',
    categoryIcon: 'Smile',
    question: 'Apa alasan klasik murid ketika ditanya guru kenapa belum mengerjakan PR?',
    answers: [
      { id: 3301, rank: 1, text: 'Bukunya ketinggalan di rumah / Tertinggal', points: 100, keywords: ['ketinggalan', 'bukunya ketinggalan', 'tertinggal', 'ketinggalan di rumah'] },
      { id: 3302, rank: 2, text: 'Lupa kalau ada PR / Mengira tidak ada PR', points: 80, keywords: ['lupa', 'lupa ada pr', 'ngira gak ada pr', 'kelupaan'] },
      { id: 3303, rank: 3, text: 'Sudah selesai tapi bukunya tertukar / basah', points: 60, keywords: ['tertukar', 'bukunya basah', 'hilang', 'sudah ngerjain'] },
      { id: 3304, rank: 4, text: 'Semalam mati lampu / Ketiduran', points: 40, keywords: ['mati lampu', 'ketiduran', 'ngantuk', 'listrik padam'] },
      { id: 3305, rank: 5, text: 'Sakit / Ikut orang tua ke luar kota', points: 20, keywords: ['sakit', 'ke luar kota', 'ada acara keluarga', 'kondangan'] },
    ],
    trivia: 'Padahal 90% buku yang "ketinggalan" biasanya memang belum diisi sama sekali!'
  },
  {
    id: 34,
    round: 'BABAK_3',
    category: 'Humor & Dunia Guru',
    categoryIcon: 'Coffee',
    question: 'Hal apa yang paling dicari atau diperebutkan para guru saat sedang istirahat di ruang guru?',
    answers: [
      { id: 3401, rank: 1, text: 'Gorengan / Snack Makanan Ringan yang Baru Datang', points: 100, keywords: ['gorengan', 'snack', 'makanan', 'bakwan', 'tahu', 'kue'] },
      { id: 3402, rank: 2, text: 'Colokan Listrik / Stop Kontak untuk Charger Laptop', points: 80, keywords: ['colokan', 'stop kontak', 'charger', 'terminal listrik'] },
      { id: 3403, rank: 3, text: 'Air Panas / Kopi / Teh Manis Hangat', points: 60, keywords: ['kopi', 'teh', 'air panas', 'dispenser'] },
      { id: 3404, rank: 4, text: 'Tanda Tangan Kepala Sekolah', points: 40, keywords: ['tanda tangan', 'ttd', 'kepsek', 'kepala sekolah', 'paraf'] },
      { id: 3405, rank: 5, text: 'Info Pencairan Sertifikasi / Tunjangan', points: 20, keywords: ['sertifikasi', 'tpg', 'gaji', 'tunjangan cair', 'info cair'] },
    ],
    trivia: 'Gorengan hangat di meja tengah ruang guru selalu lenyap dalam waktu kurang dari 3 menit!'
  },
  {
    id: 35,
    round: 'BABAK_3',
    category: 'Humor & Dunia Guru',
    categoryIcon: 'Heart',
    question: 'Apa momen yang paling membuat hati guru meleleh bahagia dan terharu saat mengajar?',
    answers: [
      { id: 3501, rank: 1, text: 'Murid yang tadinya kesulitan tiba-tiba paham dan tersenyum', points: 100, keywords: ['murid paham', 'ngerti', 'bisa jawab', 'tersenyum', 'paham'] },
      { id: 3502, rank: 2, text: 'Mantan murid sukses datang kembali berkunjung dan mencium tangan', points: 80, keywords: ['murid sukses', 'berkunjung', 'alumni', 'cium tangan', 'reuni'] },
      { id: 3503, rank: 3, text: 'Diberi ucapan terima kasih tulus / Surat kecil dari murid', points: 60, keywords: ['surat murid', 'ucapan terima kasih', 'terima kasih guru', 'catatan kecil'] },
      { id: 3504, rank: 4, text: 'Mendengar bunyi bel istirahat / Bel pulang berbunyi', points: 40, keywords: ['bel pulang', 'bel istirahat', 'pulang', 'istirahat'] },
      { id: 3505, rank: 5, text: 'Notifikasi SMS / M-Banking gaji sertifikasi sudah masuk', points: 20, keywords: ['gaji masuk', 'notifikasi m-banking', 'sertifikasi masuk', 'rekening'] },
    ],
    trivia: 'Pahala ilmu yang bermanfaat mengalir tanpa henti untuk para guru yang ikhlas mengajar.'
  },
  {
    id: 36,
    round: 'BABAK_3',
    category: 'Humor & Dunia Guru',
    categoryIcon: 'Sparkles',
    question: 'Kebiasaan unik apa yang sering dilakukan guru saat mengawasi ujian di kelas?',
    answers: [
      { id: 3601, rank: 1, text: 'Berjalan keliling perlahan sambil berdiri di belakang murid', points: 100, keywords: ['keliling', 'di belakang murid', 'berdiri di belakang', 'patroli', 'mondar mandir'] },
      { id: 3602, rank: 2, text: 'Sambil mengoreksi tumpukan lembar jawaban kelas lain', points: 80, keywords: ['mengoreksi', 'koreksi', 'periksa nilai', 'meriksa tugas'] },
      { id: 3603, rank: 3, text: 'Membaca buku atau mengerjakan tugas di laptop', points: 60, keywords: ['baca buku', 'laptop', 'mengerjakan rpp', 'mengetik'] },
      { id: 3604, rank: 4, text: 'Melihat jam dinding berulang kali', points: 40, keywords: ['lihat jam', 'melihat jam dinding', 'hitung waktu'] },
      { id: 3605, rank: 5, text: 'Menatap tajam murid yang pura-pura menjatuhkan pulpen', points: 20, keywords: ['menatap', 'tatapan mata', 'jatuhin pulpen', 'noleh'] },
    ],
    trivia: 'Ketika guru berdiri tepat di belakang meja murid, detak jantung murid seketika naik 200%!'
  },

  // ==========================================
  // KATEGORI H: SOAL RINGAN & KESEHARIAN SEKOLAH
  // ==========================================
  {
    id: 37,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Smile',
    question: 'Apa benda yang paling sering tertinggal di meja guru saat masuk kelas?',
    answers: [
      { id: 3701, rank: 1, text: 'Spidol / Penghapus', points: 100, keywords: ['spidol', 'penghapus', 'spidol papan', 'penghapus papan', 'boardmarker'] },
      { id: 3702, rank: 2, text: 'Buku Absensi / Jurnal', points: 80, keywords: ['buku absensi', 'absensi', 'jurnal', 'daftar hadir', 'presensi', 'buku nilai'] },
      { id: 3703, rank: 3, text: 'Ponsel / HP', points: 60, keywords: ['ponsel', 'hp', 'handphone', 'telepon', 'gawai'] },
      { id: 3704, rank: 4, text: 'Kacamata', points: 40, keywords: ['kacamata', 'kaca mata'] },
      { id: 3705, rank: 5, text: 'Botol Minum / Tumbler', points: 20, keywords: ['botol minum', 'tumbler', 'botol', 'air minum', 'tempat minum'] },
    ],
    trivia: 'Tak jarang siswa yang langsung berinisiatif mengejar ke ruang guru untuk mengembalikan spidol atau kacamata yang tertinggal!'
  },
  {
    id: 38,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Clock',
    question: 'Sebutkan alasan paling klasik murid saat terlambat masuk sekolah!',
    answers: [
      { id: 3801, rank: 1, text: 'Ban Bocor / Motor Mogok', points: 100, keywords: ['ban bocor', 'motor mogok', 'bocor', 'mogok', 'ban kempes', 'sepeda rusak'] },
      { id: 3802, rank: 2, text: 'Macet di Jalan', points: 80, keywords: ['macet', 'macet di jalan', 'kemacetan', 'lalu lintas'] },
      { id: 3803, rank: 3, text: 'Bangun Kesiangan', points: 60, keywords: ['bangun kesiangan', 'kesiangan', 'telat bangun', 'ketiduran', 'alarm mati'] },
      { id: 3804, rank: 4, text: 'Mengantar Adik / Orang Tua', points: 40, keywords: ['mengantar adik', 'antar adik', 'orang tua', 'antar saudara', 'menunggu orang tua'] },
      { id: 3805, rank: 5, text: 'Hujan Deras', points: 20, keywords: ['hujan', 'hujan deras', 'gerimis', 'kehujanan', 'banjir'] },
    ],
    trivia: 'Alasan ban bocor sudah melegenda lintas generasi dari zaman orang tua hingga murid sekarang!'
  },
  {
    id: 39,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Coffee',
    question: 'Apa kegiatan yang paling sering dilakukan guru saat jam kosong di ruang guru?',
    answers: [
      { id: 3901, rank: 1, text: 'Mengoreksi Tugas / Nilai', points: 100, keywords: ['mengoreksi tugas', 'koreksi', 'mengoreksi', 'nilai', 'periksa tugas', 'menilai'] },
      { id: 3902, rank: 2, text: 'Membuat Perangkat Ajar / RPP', points: 80, keywords: ['perangkat ajar', 'rpp', 'modul ajar', 'administrasi', 'buat soal', 'mengetik'] },
      { id: 3903, rank: 3, text: 'Ngobrol / Bercanda dengan Rekan', points: 60, keywords: ['ngobrol', 'bercanda', 'mengobrol', 'curhat', 'diskusi', 'rekan'] },
      { id: 3904, rank: 4, text: 'Ngopi / Ngeteh / Makan Camilan', points: 40, keywords: ['ngopi', 'ngeteh', 'makan camilan', 'camilan', 'gorengan', 'ngemil', 'kopi', 'teh'] },
      { id: 3905, rank: 5, text: 'Mengecek Ponsel', points: 20, keywords: ['mengecek ponsel', 'cek hp', 'main hp', 'ponsel', 'hp', 'whatsapp'] },
    ],
    trivia: 'Di balik obrolan santai di ruang guru, sering lahir ide pembelajaran kreatif untuk kelas berikutnya.'
  },
  {
    id: 40,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Gift',
    question: 'Apa hadiah yang paling sering diterima guru saat Hari Guru Nasional?',
    answers: [
      { id: 4001, rank: 1, text: 'Buket Bunga / Cokelat', points: 100, keywords: ['buket bunga', 'bunga', 'cokelat', 'coklat', 'mawar', 'buket'] },
      { id: 4002, rank: 2, text: 'Mug / Tumbler / Alat Makan', points: 80, keywords: ['mug', 'tumbler', 'alat makan', 'gelas', 'cangkir', 'kotak makan'] },
      { id: 4003, rank: 3, text: 'Pakaian / Kain Batik / Hijab', points: 60, keywords: ['pakaian', 'kain batik', 'batik', 'hijab', 'baju', 'kerudung', 'jilbab'] },
      { id: 4004, rank: 4, text: 'Kue / Makanan', points: 40, keywords: ['kue', 'makanan', 'bolu', 'cake', 'roti', 'snack'] },
      { id: 4005, rank: 5, text: 'Alat Tulis / Pulpen', points: 20, keywords: ['alat tulis', 'pulpen', 'pena', 'spidol', 'buku catatan'] },
    ],
    trivia: 'Selain hadiah fisik, doa dan ucapan tulus dari murid selalu menjadi kado paling berharga bagi guru.'
  },
  {
    id: 41,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Coffee',
    question: 'Menu sarapan atau jajan pagi apa yang paling sering dibeli guru sebelum bel masuk?',
    answers: [
      { id: 4101, rank: 1, text: 'Nasi Uduk / Nasi Kuning', points: 100, keywords: ['nasi uduk', 'nasi kuning', 'uduk', 'nasi bungkus'] },
      { id: 4102, rank: 2, text: 'Bubur Ayam', points: 80, keywords: ['bubur ayam', 'bubur'] },
      { id: 4103, rank: 3, text: 'Gorengan & Kopi / Teh Hangat', points: 60, keywords: ['gorengan', 'bakwan', 'tempe', 'kopi', 'teh'] },
      { id: 4104, rank: 4, text: 'Lontong Sayur / Ketoprak', points: 40, keywords: ['lontong sayur', 'lontong', 'ketoprak', 'kupat tahu'] },
      { id: 4105, rank: 5, text: 'Roti / Kue Basah / Lemper', points: 20, keywords: ['roti', 'kue basah', 'lemper', 'risoles', 'pastel'] },
    ],
    trivia: 'Sarapan yang cukup adalah modal utama guru agar tetap bertenaga mengajar sejak jam pertama!'
  },
  {
    id: 42,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Bell',
    question: 'Apa yang pertama kali dilakukan guru begitu mendengar bel pulang berbunyi?',
    answers: [
      { id: 4201, rank: 1, text: 'Memimpin Doa Pulang Bersama Siswa', points: 100, keywords: ['doa pulang', 'berdoa', 'doa', 'salam'] },
      { id: 4202, rank: 2, text: 'Merapikan Buku & Laptop ke Dalam Tas', points: 80, keywords: ['merapikan buku', 'beres-beres', 'rapikan tas', 'masukkan laptop'] },
      { id: 4203, rank: 3, text: 'Mengucap Hamdalah / Menghela Napas Lega', points: 60, keywords: ['hamdalah', 'alhamdulillah', 'lega', 'tarik napas'] },
      { id: 4204, rank: 4, text: 'Menuju Ruang Guru / Presensi Pulang (Finger Print)', points: 40, keywords: ['presensi', 'finger print', 'absen pulang', 'ke ruang guru'] },
      { id: 4205, rank: 5, text: 'Mengecek HP / Pesan WhatsApp', points: 20, keywords: ['cek hp', 'whatsapp', 'ponsel', 'buka hp'] },
    ],
    trivia: 'Meski bel pulang sudah berbunyi, tugas guru seringkali berlanjut di rumah untuk menyiapkan materi esok hari.'
  },
  {
    id: 43,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Sparkles',
    question: 'Reaksi apa yang paling sering muncul dari murid saat guru mengumumkan "Hari ini ulangan dadakan!"?',
    answers: [
      { id: 4301, rank: 1, text: 'Berteriak Protes Serentak ("Yaaah Bu/Pak!")', points: 100, keywords: ['protes', 'berteriak', 'yaaah', 'menolak', 'teriak'] },
      { id: 4302, rank: 2, text: 'Minta Waktu Belajar 5 Menit Dulu', points: 80, keywords: ['minta waktu', '5 menit', 'belajar dulu', 'tunggu sebentar'] },
      { id: 4303, rank: 3, text: 'Panik Membuka Buku Catatan Cepat-Cepat', points: 60, keywords: ['panik', 'buka buku', 'baca cepat', 'hafalan'] },
      { id: 4304, rank: 4, text: 'Pura-pura Sakit Perut / Izin ke Toilet', points: 40, keywords: ['izin toilet', 'ke kamar mandi', 'sakit perut', 'toilet'] },
      { id: 4305, rank: 5, text: 'Pasrah Sambil Tersenyum Kecut', points: 20, keywords: ['pasrah', 'senyum kecut', 'diam', 'bengong'] },
    ],
    trivia: 'Kata "ulangan dadakan" adalah kalimat sakti yang langsung membuat seluruh kelas mendadak sunyi!'
  },
  {
    id: 44,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Users',
    question: 'Di mana tempat favorit siswa berkumpul saat jam istirahat di sekolah?',
    answers: [
      { id: 4401, rank: 1, text: 'Kantin Sekolah', points: 100, keywords: ['kantin', 'koperasi', 'warung sekolah'] },
      { id: 4402, rank: 2, text: 'Lapangan Olahraga / Taman Sekolah', points: 80, keywords: ['lapangan', 'taman', 'halaman', 'main bola'] },
      { id: 4403, rank: 3, text: 'Pojok Kelas / Teras Kelas', points: 60, keywords: ['kelas', 'teras kelas', 'depan kelas', 'pojok kelas'] },
      { id: 4404, rank: 4, text: 'Perpustakaan', points: 40, keywords: ['perpustakaan', 'perpus', 'pojok baca'] },
      { id: 4405, rank: 5, text: 'Masjid / Mushola Sekolah', points: 20, keywords: ['masjid', 'mushola', 'musala'] },
    ],
    trivia: 'Kantin sekolah selalu menjadi pusat keramaian paling padat tepat 30 detik setelah bel istirahat berbunyi.'
  },
  {
    id: 45,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Heart',
    question: 'Apa yang sering membuat guru senyum-senyum sendiri saat mengoreksi lembar jawaban ujian siswa?',
    answers: [
      { id: 4501, rank: 1, text: 'Jawaban Siswa yang Mengarang Bebas / Lucu', points: 100, keywords: ['mengarang', 'jawaban lucu', 'ngaco', 'kocak', 'lucu'] },
      { id: 4502, rank: 2, text: 'Siswa Menulis Pesan / Curhat / Doa untuk Guru', points: 80, keywords: ['pesan', 'curhat', 'doa', 'surat', 'maaf bu'] },
      { id: 4503, rank: 3, text: 'Tulisan Tangan Siswa yang Super Rapi atau Unik', points: 60, keywords: ['tulisan tangan', 'tulisan rapi', 'tulisan jelek', 'kaligrafi'] },
      { id: 4504, rank: 4, text: 'Siswa Mendapat Nilai 100 Sempurna', points: 40, keywords: ['nilai 100', 'sempurna', 'benar semua', 'seratus'] },
      { id: 4505, rank: 5, text: 'Kertas Jawaban Kosong Tapi Diberi Gambar Emoticon', points: 20, keywords: ['kosong', 'gambar', 'emoticon', 'senyum'] },
    ],
    trivia: 'Mengoreksi ujian selalu penuh kejutan—mulai dari jawaban super cerdas hingga jawaban penuh kreativitas!'
  },
  {
    id: 46,
    round: 'BABAK_1',
    category: 'Soal Ringan',
    categoryIcon: 'Sun',
    question: 'Hal kecil apa yang paling membuat guru semangat berangkat mengajar di pagi hari?',
    answers: [
      { id: 4601, rank: 1, text: 'Senyum & Sapaan Hangat Murid di Gerbang Sekolah', points: 100, keywords: ['senyum murid', 'sapaan', 'salim', 'sambutan murid', 'murid'] },
      { id: 4602, rank: 2, text: 'Niat Ibadah & Mengabdi Mencerdaskan Anak Bangsa', points: 80, keywords: ['niat ibadah', 'ibadah', 'pahala', 'mengabdi', 'ikhlas'] },
      { id: 4603, rank: 3, text: 'Suasana Kekeluargaan Bersama Rekan Guru', points: 60, keywords: ['rekan guru', 'teman guru', 'kekeluargaan', 'kompak'] },
      { id: 4604, rank: 4, text: 'Semangat Menunggu Tanggal Gajian / Tunjangan', points: 40, keywords: ['gajian', 'gaji', 'tunjangan', 'sertifikasi', 'tanggal muda'] },
      { id: 4605, rank: 5, text: 'Secangkir Kopi / Teh Hangat Sebelum Berangkat', points: 20, keywords: ['kopi', 'teh', 'sarapan', 'minum kopi'] },
    ],
    trivia: 'Semangat seorang guru di pagi hari adalah energi positif yang menular ke seluruh ruang kelas!'
  }
];

