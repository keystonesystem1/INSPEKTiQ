'use client';

import { useState } from 'react';
import type { Claim, NoteItem, Role, TimelineItem } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { OverviewTab } from '@/components/claims/ClaimDetail/tabs/OverviewTab';
import { NotesTab } from '@/components/claims/ClaimDetail/tabs/NotesTab';
import { DocumentsTab } from '@/components/claims/ClaimDetail/tabs/DocumentsTab';
import { InspectionTab } from '@/components/claims/ClaimDetail/tabs/InspectionTab';
import { TimeExpenseTab } from '@/components/claims/ClaimDetail/tabs/TimeExpenseTab';
import { TasksTab } from '@/components/claims/ClaimDetail/tabs/TasksTab';
import { ReservesTab } from '@/components/claims/ClaimDetail/tabs/ReservesTab';
import { ClaimantsTab } from '@/components/claims/ClaimDetail/tabs/ClaimantsTab';
import { CoveragesTab } from '@/components/claims/ClaimDetail/tabs/CoveragesTab';
import { LossLocationsTab } from '@/components/claims/ClaimDetail/tabs/LossLocationsTab';
import { CarrierFormsTab } from '@/components/claims/ClaimDetail/tabs/CarrierFormsTab';
import { FirmFormsTab } from '@/components/claims/ClaimDetail/tabs/FirmFormsTab';
import { LinksTab } from '@/components/claims/ClaimDetail/tabs/LinksTab';
import { TimelineTab } from '@/components/claims/ClaimDetail/tabs/TimelineTab';
import { OverviewCustomizer } from '@/components/claims/ClaimDetail/OverviewCustomizer';

const tabs = ['Overview', 'Notes', 'Documents', 'Inspection', 'Time & Expense', 'Tasks', 'Reserves', 'Claimants', 'Coverages', 'Loss Locations', 'Carrier Forms', 'Firm Forms', 'Links', 'Timeline'] as const;

export function ClaimTabs({
  claim,
  role,
  notes,
  timeline,
}: {
  claim: Claim;
  role: Role;
  notes: NoteItem[];
  timeline: TimelineItem[];
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [customizerOpen, setCustomizerOpen] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              padding: '10px 14px',
              color: activeTab === tab ? 'var(--sage)' : 'var(--muted)',
              borderBottom: activeTab === tab ? '2px solid var(--sage)' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Button variant={customizerOpen ? 'primary' : 'ghost'} size="sm" onClick={() => setCustomizerOpen((value) => !value)} style={{ marginLeft: '12px' }}>
          Customize Overview
        </Button>
      </div>

      <div style={{ paddingTop: '20px' }}>
        {activeTab === 'Overview' ? <OverviewTab claim={claim} /> : null}
        {activeTab === 'Notes' ? <NotesTab role={role} notes={notes} /> : null}
        {activeTab === 'Documents' ? <DocumentsTab /> : null}
        {activeTab === 'Inspection' ? <InspectionTab claim={claim} /> : null}
        {activeTab === 'Time & Expense' ? <TimeExpenseTab role={role} /> : null}
        {activeTab === 'Tasks' ? <TasksTab /> : null}
        {activeTab === 'Reserves' ? <ReservesTab claim={claim} role={role} /> : null}
        {activeTab === 'Claimants' ? <ClaimantsTab /> : null}
        {activeTab === 'Coverages' ? <CoveragesTab /> : null}
        {activeTab === 'Loss Locations' ? <LossLocationsTab claim={claim} /> : null}
        {activeTab === 'Carrier Forms' ? <CarrierFormsTab /> : null}
        {activeTab === 'Firm Forms' ? <FirmFormsTab /> : null}
        {activeTab === 'Links' ? <LinksTab claim={claim} /> : null}
        {activeTab === 'Timeline' ? <TimelineTab items={timeline} /> : null}
      </div>

      <OverviewCustomizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
    </div>
  );
}
