import './globals.css';
import Sidebar from '../components/Sidebar';
import WSInitializer from '../components/WSInitializer';
import { ToastProvider } from '../components/Toast';

export const metadata = {
  title: 'VedaAI - Premium AI Assessment Creator',
  description: 'Design dynamic, structured assessments and question papers in seconds using advanced AI workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {/* WS Connection Hook */}
          <WSInitializer />

          <div className="veda-layout">
            {/* Permanent Navigation Sidebar */}
            <Sidebar />

            {/* Main workspace frame */}
            <main className="veda-workspace">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
