import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ReportsPage } from '@/pages/reports-page';
import { RunsPage } from '@/pages/runs-page';

import { NotificationProvider } from './providers/notification-provider';
import { QueryProvider } from './providers/query-provider';
import styles from './styles/app.module.scss';

export function App() {
  return (
    <QueryProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className={styles.layout}>
            <Routes>
              <Route path="/" element={<ReportsPage />} />
              <Route path="/runs" element={<RunsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </QueryProvider>
  );
}
