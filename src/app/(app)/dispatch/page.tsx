import { PageHeader } from '@/components/layout/PageHeader';
import { DispatchMap } from '@/components/dispatch/DispatchMap';

export default function DispatchPage() {
  return (
    <div>
      <PageHeader title="Dispatch" subtitle="Three-panel dispatch surface with claims, lasso selection, map, and adjuster roster." />
      <DispatchMap />
    </div>
  );
}
