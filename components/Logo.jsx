// Le sceau : verification. L'onde a l'interieur : la voix.
// Le mark dit le produit sans illustration superflue.
export default function Logo({ taille = 34 }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="18.25"
        stroke="var(--mil)"
        strokeWidth="1.5"
      />
      {/* Onde vocale : barres de hauteurs inegales, comme un signal. */}
      <g stroke="var(--mil)" strokeWidth="2.2" strokeLinecap="round">
        <line x1="12" y1="17" x2="12" y2="23" />
        <line x1="16.5" y1="13.5" x2="16.5" y2="26.5" />
        <line x1="21" y1="16" x2="21" y2="24" />
        <line x1="25.5" y1="11.5" x2="25.5" y2="28.5" />
        <line x1="30" y1="18" x2="30" y2="22" />
      </g>
    </svg>
  );
}
