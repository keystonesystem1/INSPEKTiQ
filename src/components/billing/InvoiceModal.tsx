import { Modal } from '@/components/ui/Modal';

export function InvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New Invoice" subtitle="Draft invoice assembled from fee schedule and T&E entries.">
      <div style={{ display: 'grid', gap: '10px' }}>
        {[
          ['Estimate Tier', 'Residential 50k - 100k'],
          ['Service Fee', '$880.00'],
          ['Mileage', '$48.00'],
          ['Other', '$120.00'],
          ['Total Due', '$1,048.00'],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </Modal>
  );
}
