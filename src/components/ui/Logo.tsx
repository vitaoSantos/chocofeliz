import { useId } from 'react'

// Marca: um pirulito de chocolate sorrindo
export function LogoMark({ className = '' }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-c`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#8a4f2e" />
          <stop offset="1" stopColor="#3d1f12" />
        </radialGradient>
      </defs>
      <rect x="29.5" y="36" width="5" height="27" rx="2.5" fill="#f3dfbd" />
      <circle cx="32" cy="25" r="22" fill={`url(#${id}-c)`} />
      <circle cx="32" cy="25" r="16.5" fill="none" stroke="#2a140b" strokeOpacity=".45" strokeWidth="2" />
      <path d="M17 15a17 17 0 0 1 10-6" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="25.5" cy="22" r="2.6" fill="#f7e9d7" />
      <circle cx="38.5" cy="22" r="2.6" fill="#f7e9d7" />
      <path d="M23.5 28.5c4.6 6 12.4 6 17 0" fill="none" stroke="#ff6f9a" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M32 48l-7 -4.2v8.4zM32 48l7 -4.2v8.4z" fill="#ff6f9a" />
    </svg>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-[1.6em] w-auto" />
      <span className="font-display font-semibold tracking-tight">
        Choco<span className="wonk text-berry">Feliz</span>
      </span>
    </span>
  )
}
