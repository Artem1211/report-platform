import { MainLayout } from '@/shared/ui';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

import { RunsTable } from './components/runs-table';

export function RunsPage() {
  return (
    <>
      <Header />
      <MainLayout title="Запуски">
        <RunsTable />
      </MainLayout>
      <Footer />
    </>
  );
}
