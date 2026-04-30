import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

export default function Layout({ children, title, actions }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header title={title} actions={actions} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
