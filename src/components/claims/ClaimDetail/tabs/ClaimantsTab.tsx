import { Card } from '@/components/ui/Card';

export function ClaimantsTab() {
  const claimants = [
    ['Megan Miller', 'Primary', '(214) 555-0142', 'megan@example.com', '1420 Cottonwood Ct, Plano, TX'],
    ['Daniel Miller', 'Secondary', '(214) 555-0143', 'daniel@example.com', '1420 Cottonwood Ct, Plano, TX'],
  ];

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {claimants.map(([name, role, phone, email, address]) => (
        <Card key={name} style={{ background: 'var(--surface)' }}>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>{name}</div>
          <div style={{ marginTop: '8px', color: 'var(--muted)' }}>{role}</div>
          <div style={{ marginTop: '6px', color: 'var(--muted)' }}>{phone} · {email}</div>
          <div style={{ marginTop: '6px', color: 'var(--muted)' }}>{address}</div>
        </Card>
      ))}
    </div>
  );
}
