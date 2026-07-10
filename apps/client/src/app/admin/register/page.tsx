import { AdminRegisterForm } from '../../../components/auth/AdminRegisterForm';

export default function AdminRegisterPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Abstract background elements */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[120px] mix-blend-screen opacity-20 pointer-events-none"
        style={{ backgroundColor: '#ff8c42' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-[120px] mix-blend-screen opacity-10 pointer-events-none"
        style={{ backgroundColor: '#ff4545' }}
      />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        <AdminRegisterForm />
      </div>
    </main>
  );
}
