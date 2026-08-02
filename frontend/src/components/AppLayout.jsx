import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ title, children }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar title={title} />
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
