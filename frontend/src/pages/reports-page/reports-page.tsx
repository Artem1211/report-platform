import { MainLayout } from '@/shared/ui';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

import { ReportsTable } from './components/reports-table';

export function ReportsPage() {
  return (
    <>
      <Header />
      <MainLayout title="Шаблоны">
        <ReportsTable />
      </MainLayout>
      <Footer />
    </>
  );
}
