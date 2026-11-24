import type { TicketTier } from '@/types/api';

export const EVENT_COVER_FALLBACK_SRC = '/images/cover-techfest.png';

export type EventTheme = 'cybersec' | 'music' | 'natal' | 'techfest';

export interface DocumentationPhoto {
  id: string;
  src: string;
  title: string;
  caption: string;
  alt: string;
}

export interface EventVisuals {
  theme: EventTheme;
  coverSrc: string;
  gallery: DocumentationPhoto[];
  getTierPerks: (tier: TicketTier) => string[];
}

const TECHFEST_PHOTOS: DocumentationPhoto[] = [
  {
    id: 'techfest-seminar',
    src: '/images/doc-seminar.png',
    title: 'Sesi Keynote Auditorium',
    caption: 'Sudut pandang peserta saat menyimak materi keynote speaker di auditorium utama.',
    alt: 'Peserta seminar kampus menyimak presentasi keynote speaker dari kursi auditorium',
  },
  {
    id: 'techfest-workshop',
    src: '/images/doc-workshop.png',
    title: 'Workshop & Diskusi Teknis',
    caption: 'Diskusi kelompok kecil mahasiswa di depan laptop saat sesi praktik hands-on.',
    alt: 'Kelompok kecil mahasiswa berdiskusi di depan laptop saat workshop teknis',
  },
  {
    id: 'techfest-gate',
    src: '/images/doc-gate.png',
    title: 'Check-in QR Gerbang Utama',
    caption: 'Panitia memindai QR Code tiket langsung dari layar smartphone peserta di pintu masuk.',
    alt: 'Panitia event kampus memindai QR Code tiket dari ponsel peserta di meja registrasi',
  },
];

const CYBERSEC_PHOTOS: DocumentationPhoto[] = [
  {
    id: 'cybersec-lab',
    src: '/images/cover-cybersec.png',
    title: 'Praktikum Lab Keamanan Siber',
    caption: 'Suasana mahasiswa IT mengikuti sesi coding dan analisis keamanan di laboratorium komputer.',
    alt: 'Mahasiswa IT fokus mengikuti workshop keamanan siber di laboratorium komputer kampus',
  },
  {
    id: 'cybersec-workshop',
    src: '/images/doc-workshop.png',
    title: 'Kolaborasi Tim CTF',
    caption: 'Diskusi tim mahasiswa menyelesaikan tantangan Capture The Flag secara langsung.',
    alt: 'Mahasiswa berdiskusi dalam kelompok kecil di depan laptop selama sesi workshop CTF',
  },
  {
    id: 'cybersec-gate',
    src: '/images/doc-gate.png',
    title: 'Registrasi & Validasi Akses Lab',
    caption: 'Verifikasi QR Code tiket peserta di meja registrasi sebelum memasuki ruang lab.',
    alt: 'Panitia memindai QR Code tiket peserta di meja registrasi pintu masuk',
  },
];

const MUSICFEST_PHOTOS: DocumentationPhoto[] = [
  {
    id: 'music-stage',
    src: '/images/cover-musicfest.png',
    title: 'Panggung Utama Lapangan Kampus',
    caption: 'Atmosfer konser malam hari dengan tata cahaya biru-putih dan antusiasme penonton.',
    alt: 'Konser musik festival kampus malam hari dengan tata cahaya panggung biru-putih',
  },
  {
    id: 'music-talk',
    src: '/images/doc-seminar.png',
    title: 'Sesi Creative Sharing',
    caption: 'Diskusi inspiratif pelaku industri kreatif kampus sebelum pertunjukan utama dimulai.',
    alt: 'Penonton menyimak pemaparan pembicara di panggung acara kampus',
  },
  {
    id: 'music-gate',
    src: '/images/doc-gate.png',
    title: 'Fast-Track Check-in Gate',
    caption: 'Pemindaian cepat E-Ticket QR di meja registrasi gerbang lapangan kampus.',
    alt: 'Panitia memindai QR Code tiket peserta di meja registrasi pintu masuk festival',
  },
];

const NATAL_PHOTOS: DocumentationPhoto[] = [
  {
    id: 'natal-gathering',
    src: '/images/cover-natal.png',
    title: 'Perayaan Bersama di Aula Kampus',
    caption: 'Momen kebersamaan mahasiswa yang hangat dan tertib di aula utama kampus.',
    alt: 'Suasana perayaan bersama mahasiswa yang hangat di aula kampus',
  },
  {
    id: 'natal-session',
    src: '/images/doc-seminar.png',
    title: 'Sesi Refleksi & Apresiasi',
    caption: 'Peserta menyimak sesi utama bersama pembicara dan paduan suara mahasiswa.',
    alt: 'Peserta acara kampus menyimak sesi pembicara dari kursi aula',
  },
  {
    id: 'natal-gate',
    src: '/images/doc-gate.png',
    title: 'Penyambutan & Scan QR Kehadiran',
    caption: 'Proses registrasi ulang tamu dan peserta menggunakan QR Code di pintu masuk aula.',
    alt: 'Panitia memindai QR Code tiket peserta di meja registrasi pintu masuk',
  },
];

export const PREVIOUS_EDITION_PHOTOS: DocumentationPhoto[] = TECHFEST_PHOTOS;

export function getTierPerks(tier: TicketTier): string[] {
  const lower = tier.name.toLowerCase();
  const basePerks = [
    'E-Ticket QR Code unik instan',
    'Akses penuh ke seluruh sesi utama',
    'Sertifikat keikutsertaan digital',
  ];

  if (lower.includes('vip') || lower.includes('priority') || tier.price >= 100000) {
    return [
      ...basePerks,
      'Kursi baris depan area prioritas',
      'Modul materi & rekaman sesi eksklusif',
    ];
  }

  return basePerks;
}

export function getEventVisuals(eventTitle: string): EventVisuals {
  const normalized = eventTitle.toLowerCase();

  if (normalized.includes('cybersec') || normalized.includes('ctf') || normalized.includes('keamanan')) {
    return {
      theme: 'cybersec',
      coverSrc: '/images/cover-cybersec.png',
      gallery: CYBERSEC_PHOTOS,
      getTierPerks: (tier: TicketTier) => {
        const lower = tier.name.toLowerCase();
        const base = [
          'E-Ticket QR Code akses Lab Gedung B',
          'Akses environment lab & challenge CTF',
          'Sertifikat workshop keamanan siber',
        ];
        if (lower.includes('bundle') || lower.includes('team') || tier.price >= 100000) {
          return [
            ...base,
            'Slot kolaborasi tim & write-up eksklusif',
            'Mentoring langsung dengan instruktur lab',
          ];
        }
        return base;
      },
    };
  }

  if (
    normalized.includes('music') ||
    normalized.includes('musik') ||
    normalized.includes('konser') ||
    normalized.includes('creative fest')
  ) {
    return {
      theme: 'music',
      coverSrc: '/images/cover-musicfest.png',
      gallery: MUSICFEST_PHOTOS,
      getTierPerks: (tier: TicketTier) => {
        const lower = tier.name.toLowerCase();
        const base = [
          'E-Ticket QR Code akses gerbang utama',
          'Akses penuh area panggung & bazaar kreatif',
          'Wristband penukaran di gate masuk',
        ];
        if (lower.includes('vip') || lower.includes('front row') || tier.price >= 150000) {
          return [
            ...base,
            'Zona berdiri paling depan (Front Row)',
            'Jalur fast-track check-in & merchandise kit',
          ];
        }
        return base;
      },
    };
  }

  if (
    normalized.includes('natal') ||
    normalized.includes('christmas') ||
    normalized.includes('perayaan')
  ) {
    return {
      theme: 'natal',
      coverSrc: '/images/cover-natal.png',
      gallery: NATAL_PHOTOS,
      getTierPerks: (tier: TicketTier) => {
        const lower = tier.name.toLowerCase();
        const base = [
          'E-Ticket QR Code masuk aula kampus',
          'Konsumsi acara & buku panduan kegiatan',
          'Sesi ramah tamah dan foto bersama',
        ];
        if (lower.includes('vip') || lower.includes('panitia') || tier.price >= 100000) {
          return [
            ...base,
            'Area duduk depan dekat panggung utama',
            'Paket souvenir spesial edisi perayaan',
          ];
        }
        return base;
      },
    };
  }

  return {
    theme: 'techfest',
    coverSrc: EVENT_COVER_FALLBACK_SRC,
    gallery: TECHFEST_PHOTOS,
    getTierPerks,
  };
}
