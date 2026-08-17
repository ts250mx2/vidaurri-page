import React from "react";

// Iconos metálicos 3D para la barra de cifras y el panel de características del Hero

export function IconoCalendario3D({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="metal-grad-1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#d1d5db" />
          <stop offset="70%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="metal-dark-1" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <filter id="shadow-3d-cal" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <rect x="5" y="8" width="30" height="27" rx="4" fill="url(#metal-grad-1)" filter="url(#shadow-3d-cal)" stroke="#ffffff" strokeWidth="0.75" />
      <path d="M5 12C5 9.79086 6.79086 8 9 8H31C33.2091 8 35 9.79086 35 12V16H5V12Z" fill="url(#metal-dark-1)" />
      <rect x="11" y="5" width="3" height="6" rx="1.5" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.5" />
      <rect x="26" y="5" width="3" height="6" rx="1.5" fill="#ffffff" stroke="#9ca3af" strokeWidth="0.5" />
      <circle cx="12" cy="22" r="1.5" fill="#374151" />
      <circle cx="20" cy="22" r="1.5" fill="#374151" />
      <circle cx="28" cy="22" r="1.5" fill="#374151" />
      <circle cx="12" cy="28" r="1.5" fill="#374151" />
      <circle cx="20" cy="28" r="1.5" fill="#374151" />
      <circle cx="28" cy="28" r="1.5" fill="#374151" />
    </svg>
  );
}

export function IconoCaja3D({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="box-top" x1="0" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b0b7c0" />
        </linearGradient>
        <linearGradient id="box-left" x1="0" y1="10" x2="20" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="box-right" x1="20" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>

      <g filter="url(#shadow-3d-cal)">
        <path d="M20 5 L35 13 L20 21 L5 13 Z" fill="url(#box-top)" stroke="#ffffff" strokeWidth="0.5" />
        <path d="M5 13 L20 21 L20 35 L5 27 Z" fill="url(#box-left)" stroke="#9ca3af" strokeWidth="0.5" />
        <path d="M20 21 L35 13 L35 27 L20 35 Z" fill="url(#box-right)" stroke="#4b5563" strokeWidth="0.5" />
        <path d="M14 9 L29 17 L25 19 L10 11 Z" fill="#ffffff" opacity="0.4" />
      </g>
    </svg>
  );
}

export function IconoFoto3D({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="photo-frame" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="photo-bg" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>

      <rect x="5" y="7" width="30" height="26" rx="4" fill="url(#photo-frame)" filter="url(#shadow-3d-cal)" stroke="#ffffff" strokeWidth="0.75" />
      <rect x="8" y="10" width="24" height="20" rx="2" fill="url(#photo-bg)" />
      <circle cx="14" cy="15" r="2.5" fill="#ffffff" opacity="0.9" />
      <path d="M9 28 L17 19 L23 25 L27 21 L31 28 Z" fill="#d1d5db" opacity="0.8" />
    </svg>
  );
}

export function IconoUbicacion3D({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="pin-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e5e7eb" />
          <stop offset="80%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
      </defs>

      <ellipse cx="20" cy="33" rx="11" ry="3.5" fill="#000000" opacity="0.4" />
      <ellipse cx="20" cy="33" rx="10" ry="3" stroke="url(#pin-grad)" strokeWidth="1.5" fill="none" />

      <path
        d="M20 5 C13.3726 5 8 10.3726 8 17 C8 24.5 20 34 20 34 C20 34 32 24.5 32 17 C32 10.3726 26.6274 5 20 5 Z"
        fill="url(#pin-grad)"
        filter="url(#shadow-3d-cal)"
        stroke="#ffffff"
        strokeWidth="0.75"
      />
      <circle cx="20" cy="16" r="4" fill="#1f2937" />
    </svg>
  );
}

export function IconoFactura3D({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="doc-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>

      <g filter="url(#shadow-3d-cal)">
        <path
          d="M8 7 H24 L32 15 V33 C32 34.6569 30.6569 36 29 36 H11 C9.34315 36 8 34.6569 8 33 V7 Z"
          fill="url(#doc-grad)"
          stroke="#ffffff"
          strokeWidth="0.75"
        />
        <path d="M24 7 V15 H32 Z" fill="#6b7280" opacity="0.6" />
        <rect x="12" y="16" width="12" height="2" rx="1" fill="#374151" />
        <rect x="12" y="21" width="16" height="2" rx="1" fill="#374151" />
        <rect x="12" y="26" width="14" height="2" rx="1" fill="#374151" />
      </g>
    </svg>
  );
}

export function IconoClipboardGold3D({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="gold-clip-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="40%" stopColor="#f0d97d" />
          <stop offset="70%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6d1c" />
        </linearGradient>
      </defs>
      <g filter="url(#shadow-3d-cal)">
        <rect x="8" y="7" width="24" height="28" rx="4" stroke="url(#gold-clip-grad)" strokeWidth="2.5" fill="#181a20" />
        <rect x="15" y="4" width="10" height="5" rx="1.5" stroke="url(#gold-clip-grad)" strokeWidth="2" fill="#242832" />
        <rect x="14" y="14" width="4" height="4" rx="1" stroke="url(#gold-clip-grad)" strokeWidth="1.5" />
        <line x1="21" y1="16" x2="27" y2="16" stroke="url(#gold-clip-grad)" strokeWidth="2" strokeLinecap="round" />
        <rect x="14" y="22" width="4" height="4" rx="1" stroke="url(#gold-clip-grad)" strokeWidth="1.5" />
        <line x1="21" y1="24" x2="27" y2="24" stroke="url(#gold-clip-grad)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function IconoCajaGold3D({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="gold-box-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="40%" stopColor="#f0d97d" />
          <stop offset="70%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6d1c" />
        </linearGradient>
      </defs>
      <g filter="url(#shadow-3d-cal)">
        <path d="M20 6 L34 13 L20 20 L6 13 Z" stroke="url(#gold-box-grad)" strokeWidth="2" fill="#1e222a" strokeLinejoin="round" />
        <path d="M6 13 L20 20 L20 34 L6 27 Z" stroke="url(#gold-box-grad)" strokeWidth="2" fill="#14171d" strokeLinejoin="round" />
        <path d="M20 20 L34 13 L34 27 L20 34 Z" stroke="url(#gold-box-grad)" strokeWidth="2" fill="#101217" strokeLinejoin="round" />
        <path d="M16 13 L19 16 L24 10" stroke="url(#gold-box-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function IconoPinGold3D({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <defs>
        <linearGradient id="gold-pin-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="40%" stopColor="#f0d97d" />
          <stop offset="70%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6d1c" />
        </linearGradient>
      </defs>
      <g filter="url(#shadow-3d-cal)">
        <ellipse cx="20" cy="32" rx="10" ry="3" stroke="url(#gold-pin-grad)" strokeWidth="1.5" fill="none" />
        <path
          d="M20 6 C14 6 9 11 9 17 C9 24 20 33 20 33 C20 33 31 24 31 17 C31 11 26 6 20 6 Z"
          stroke="url(#gold-pin-grad)"
          strokeWidth="2"
          fill="#181a20"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="16" r="3.5" stroke="url(#gold-pin-grad)" strokeWidth="1.5" fill="#242832" />
      </g>
    </svg>
  );
}
