import BoutonMicro from "@/components/BoutonMicro";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center gap-3">
        <Logo />
        <span className="display text-xl">Cimi</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 pb-16">
        <div className="w-full max-w-xl text-center mb-10">
          <h1 className="display text-3xl sm:text-4xl leading-tight mb-3">
            Dites ce que vous avez entendu.
          </h1>
          <p
            className="text-base leading-relaxed mx-auto"
            style={{ color: "var(--coton-doux)", maxWidth: "34rem" }}
          >
            Cimi cherche les sources, vous dit ce qu&apos;elles racontent, et
            vous laisse les lire vous-meme.
          </p>
        </div>

        <BoutonMicro />
      </main>

      <footer
        className="px-6 py-5 text-xs text-center"
        style={{ color: "var(--coton-doux)" }}
      >
        Cimi veut dire verite en zarma. Francais et hausa.
      </footer>
    </div>
  );
}
