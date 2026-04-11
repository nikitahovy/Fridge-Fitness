import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 py-6 px-4 md:py-8 md:px-10 overflow-y-auto h-screen pb-24 md:pb-8">{children}</main>
    </>
  );
}
