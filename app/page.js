import BoutonMicro from "@/components/BoutonMicro";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-2">Cimi</h1>
      <p className="text-gray-400 mb-10">
        Posez votre question, je vérifie.
      </p>
      <BoutonMicro />
    </main>
  );
}