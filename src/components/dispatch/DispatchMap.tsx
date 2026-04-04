'use client';

import { useMemo, useState } from 'react';
import { demoAdjusters, demoClaims } from '@/lib/utils/demo-data';
import { Button } from '@/components/ui/Button';
import { ClaimsList } from '@/components/dispatch/ClaimsList';
import { AdjusterRoster } from '@/components/dispatch/AdjusterRoster';
import { LassoFilters } from '@/components/dispatch/LassoFilters';
import { AssignModal } from '@/components/dispatch/AssignModal';
import { OverrideModal } from '@/components/dispatch/OverrideModal';

export function DispatchMap() {
  const [selectedClaimId, setSelectedClaimId] = useState<string | undefined>(demoClaims[0]?.id);
  const [lassoFiltersOpen, setLassoFiltersOpen] = useState(false);
  const [lassoActive, setLassoActive] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [maxClaims, setMaxClaims] = useState(15);

  const dimmedClaimIds = useMemo(() => (lassoActive ? demoClaims.slice(maxClaims).map((claim) => claim.id) : []), [lassoActive, maxClaims]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '290px minmax(0, 1fr) 300px', minHeight: 'calc(100vh - var(--nav-h) - 56px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Unassigned Claims</div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>All · Residential · Commercial · SLA Risk · TWIA · Wind · Hail</div>
        </div>
        <ClaimsList selectedClaimId={selectedClaimId} onSelect={setSelectedClaimId} dimmedClaimIds={dimmedClaimIds} />
      </aside>

      <section style={{ position: 'relative', background: '#080F18', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'grid', gap: '6px', zIndex: 40 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button onClick={() => setLassoFiltersOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', color: lassoActive ? 'var(--sage)' : 'var(--muted)', background: lassoActive ? 'var(--sage-dim)' : 'transparent', borderBottom: '1px solid var(--border)', width: '100%', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>◎ Lasso Select</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', color: 'var(--muted)', width: '100%', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Claims On</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', color: 'var(--muted)', width: '100%', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Adjusters On</button>
          </div>
        </div>

        <LassoFilters
          open={lassoFiltersOpen}
          maxClaims={maxClaims}
          setMaxClaims={setMaxClaims}
          onApply={() => {
            setLassoFiltersOpen(false);
            setLassoActive(true);
          }}
          onCancel={() => setLassoFiltersOpen(false)}
        />

        {lassoActive ? (
          <div style={{ position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-hi)', border: '1px solid var(--sage)', borderRadius: '8px', padding: '8px 18px', zIndex: 60, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '24px', color: 'var(--sage)' }}>{Math.min(maxClaims, demoClaims.length)}</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Claims in polygon</div>
          </div>
        ) : null}

        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 2%), radial-gradient(circle at 60% 50%, rgba(255,255,255,0.04), transparent 2%), linear-gradient(transparent 49%, rgba(255,255,255,0.05) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.05) 50%, transparent 51%)', backgroundSize: '100% 100%, 100% 100%, 100% 84px, 84px 100%' }} />

        {demoClaims.map((claim, index) => (
          <button
            key={claim.id}
            onClick={() => setSelectedClaimId(claim.id)}
            style={{
              position: 'absolute',
              left: `${22 + index * 18}%`,
              top: `${28 + index * 11}%`,
              transform: 'translate(-50%, -100%)',
              cursor: 'pointer',
              opacity: dimmedClaimIds.includes(claim.id) ? 0.25 : 1,
              zIndex: selectedClaimId === claim.id ? 20 : 10,
            }}
          >
            <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', padding: '2px 7px', borderRadius: '4px', background: 'var(--card-hi)', border: '1px solid var(--border-hi)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', whiteSpace: 'nowrap' }}>{claim.number}</div>
            <div style={{ width: '26px', height: '26px', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', display: 'grid', placeItems: 'center', border: '2px solid rgba(255,255,255,0.2)', background: claim.slaHoursRemaining < 0 ? 'var(--red)' : claim.slaHoursRemaining < 48 ? 'var(--orange)' : 'var(--sage)' }}>
              <span style={{ transform: 'rotate(45deg)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '9px', color: '#0A0A0A' }}>C</span>
            </div>
          </button>
        ))}

        {demoAdjusters.map((adjuster, index) => (
          <div key={adjuster.id} style={{ position: 'absolute', left: `${54 + index * 18}%`, top: `${26 + index * 21}%`, transform: 'translate(-50%, -50%)', zIndex: 8 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--blue-dim)', border: '2px solid var(--blue)', color: 'var(--blue)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '11px' }}>{adjuster.initials}</div>
            <div style={{ position: 'absolute', top: '37px', left: '50%', transform: 'translateX(-50%)', padding: '2px 8px', borderRadius: '4px', background: 'var(--card-hi)', border: '1px solid var(--border-hi)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', whiteSpace: 'nowrap' }}>{adjuster.name}</div>
          </div>
        ))}

        <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
          {[
            ['var(--red)', 'Overdue claim'],
            ['var(--orange)', 'At-risk claim'],
            ['var(--sage)', 'Ready claim'],
            ['var(--blue)', 'Adjuster'],
          ].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: 'var(--muted)', marginBottom: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', right: '14px', bottom: '14px' }}>
          <Button onClick={() => setAssignOpen(true)}>Assign Selected</Button>
        </div>
      </section>

      <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Adjuster Roster</div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>All · Available · By Area · TWIA · Residential · Commercial · Favorites</div>
        </div>
        <AdjusterRoster onAssign={() => setOverrideOpen(true)} />
      </aside>

      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} />
      <OverrideModal open={overrideOpen} onClose={() => setOverrideOpen(false)} />
    </div>
  );
}
