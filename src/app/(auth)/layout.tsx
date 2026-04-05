import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden">
            <Image src="/logo.png" alt="Fridge Fitness" width={64} height={64} className="w-16 h-16 object-cover scale-110" />
          </div>
          <div className="text-center">
            <h1 className="text-display text-2xl">Fridge Fitness</h1>
            <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mt-1">SAVE FOOD. EAT SMART.</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
