'use client';

import { useMemo, useState } from 'react';
import type { Claim } from '@/lib/types';
import type { DispatchAdjuster } from '@/lib/supabase/adjusters';
import { Button } from '@/components/ui/Button';
import { ClaimsList } from '@/components/dispatch/ClaimsList';
import { AdjusterRoster } from '@/components/dispatch/AdjusterRoster';
import { LassoFilters } from '@/components/dispatch/LassoFilters';
import { AssignModal } from '@/components/dispatch/AssignModal';

function getClaimPosition(claim: Claim, index: number, claims: Claim[]) {
  const validClaims = claims.filter((c) => c.lat !== 0 && c.lng !== 0);
  if (validClaims.length < 2 || claim.lat === 0) {
    return {
      left: `${15 + (index / Math.max(claims.length - 1, 1)) * 70}%`,
      top: `${20 + (index / Math.max(claims.length - 1, 1)) * 55}%`,
    };
  }
  const lats = validClaims.map((c) => c.lat);
  const lngs = validClaims.map((c) => c.lng);
  const latRange = Math.max(...lats) - Math.min(...lats) || 1;
  const lngRange = Math.max(...lngs) - Math.min(...lngs) || 1;
  return {
    left: `${10 + ((claim.lng - Math.min(...lngs)) / lngRange) * 80}%`,
    top: `${10 + ((Math.max(...lats) - claim.lat) / latRange) * 75}%`,
  };
}

export function DispatchMap({
  claims,
  adjusters,
}: {
  claims: Claim[];
  adjusters: DispatchAdjuster[];
}) {
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [lassoFiltersOpen, setLassoFiltersOpen] = useState(false);
  const [lassoActive, setLassoActive] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [maxClaims, setMaxClaims] = useState(15);

  const dimmedClaimIds = useMemo(
    () => (lassoActive ? claims.slice(maxClaims).map((claim) => claim.id) : []),
    [lassoActive, maxClaims, claims],
  );

  function toggleClaim(claimId: string) {
    setSelectedClaimIds((prev) =>
      prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId],
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '290px minmax(0, 1fr) 300px', minHeight: 'calc(100vh - var(--nav-h) - 56px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Unassigned Claims</div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>All · Residential · Commercial · SLA Risk · TWIA · Wind · Hail</div>
        </div>
        <ClaimsList claims={claims} selectedClaimIds={selectedClaimIds} onToggle={toggleClaim} dimmedClaimIds={dimmedClaimIds} />
      </aside>

      <section style={{ position: 'relative', background: '#080F18', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '14px', left: '14px', display: 'grid', gap: '6px', zIndex: 40 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button onClick={() => setLassoFiltersOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', color: lassoActive ? 'var(--sage)' : 'var(--muted)', background: lassoActive ? 'var(--sage-dim)' : 'transparent', borderBottom: '1px solid var(--border)', width: '100%', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>◎ Lasso Select</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', color: 'var(--muted)', width: '100%', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Claims On</button>
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
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '24px', color: 'var(--sage)' }}>{Math.min(maxClaims, claims.length)}</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Claims in polygon</div>
          </div>
        ) : null}

        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 2%), radial-gradient(circle at 60% 50%, rgba(255,255,255,0.04), transparent 2%), linear-gradient(transparent 49%, rgba(255,255,255,0.05) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.05) 50%, transparent 51%)', backgroundSize: '100% 100%, 100% 100%, 100% 84px, 84px 100%' }} />

        {claims.map((claim, index) => {
          const pos = getClaimPosition(claim, index, claims);
          return (
            <button
              key={claim.id}
              onClick={() => toggleClaim(claim.id)}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -100%)',
                cursor: 'pointer',
                opacity: dimmedClaimIds.includes(claim.id) ? 0.25 : 1,
                zIndex: selectedClaimIds.includes(claim.id) ? 20 : 10,
              }}
            >
              <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', padding: '2px 7px', borderRadius: '4px', background: selectedClaimIds.includes(claim.id) ? 'var(--sage-dim)' : 'var(--card-hi)', border: `1px solid ${selectedClaimIds.includes(claim.id) ? 'var(--sage)' : 'var(--border-hi)'}`, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', whiteSpace: 'nowrap' }}>{claim.number}</div>
              <div style={{ width: '26px', height: '26px', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', display: 'grid', placeItems: 'center', border: selectedClaimIds.includes(claim.id) ? '2px solid var(--sage)' : '2px solid rgba(255,255,255,0.2)', background: claim.slaHoursRemaining < 0 ? 'var(--red)' : claim.slaHoursRemaining < 48 ? 'var(--orange)' : 'var(--sage)' }}>
                <span style={{ transform: 'rotate(45deg)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '9px', color: '#0A0A0A' }}>C</span>
              </div>
            </button>
          );
        })}

        <div style={{ position: 'absolute', bottom: '14px', left: '14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
          {[
            ['var(--red)', 'Overdue claim'],
            ['var(--orange)', 'At-risk claim'],
            ['var(--sage)', 'Ready claim'],
          ].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: 'var(--muted)', marginBottom: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', right: '14px', bottom: '14px' }}>
          <Button disabled={selectedClaimIds.length === 0} onClick={() => setAssignOpen(true)}>
            Assign Selected{selectedClaimIds.length > 0 ? ` (${selectedClaimIds.length})` : ''}
          </Button>
        </div>
      </section>

      <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Adjuster Roster</div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>All · Available</div>
        </div>
        <AdjusterRoster adjusters={adjusters} onAssign={() => setAssignOpen(true)} />
      </aside>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        selectedClaimIds={selectedClaimIds}
        claims={claims}
        adjusters={adjusters}
        onAssigned={() => {
          setSelectedClaimIds([]);
          setAssignOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
