// Brilhos de fundo quentes e textura granulada fixos em toda a página.
// Gradiente radial em vez de filter: blur, que pesa muito no celular.
export function Background() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60vmax_60vmax_at_0%_0%,rgb(234_162_76/0.10),transparent_70%),radial-gradient(55vmax_55vmax_at_100%_70%,rgb(255_92_138/0.08),transparent_70%)]"
      />
      <div aria-hidden className="grain hidden md:block" />
    </>
  )
}
