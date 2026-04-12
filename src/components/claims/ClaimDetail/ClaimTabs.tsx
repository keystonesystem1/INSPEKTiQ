'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClaimDocuments } from '@/lib/supabase/documents';
import type { ClaimInspectionData } from '@/lib/supabase/inspections';
import type { Claim, ClaimContactsData, NoteItem, Role, TimelineItem } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { OverviewTab } from '@/components/claims/ClaimDetail/tabs/OverviewTab';
import { ContactsTab } from '@/components/claims/ClaimDetail/tabs/ContactsTab';
import { NotesTab } from '@/components/claims/ClaimDetail/tabs/NotesTab';
import { DocumentsTab } from '@/components/claims/ClaimDetail/tabs/DocumentsTab';
import { PhotosTab } from '@/components/claims/ClaimDetail/tabs/PhotosTab';
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

const ALL_TABS = ['Overview', 'Contacts', 'Notes', 'Documents', 'Photos', 'Inspection', 'Time & Expense', 'Tasks', 'Reserves', 'Claimants', 'Coverages', 'Loss Locations', 'Carrier Forms', 'Firm Forms', 'Links', 'Timeline'] as const;

type Tab = (typeof ALL_TABS)[number];

const TAB_SLUGS: Record<Tab, string> = {
  'Overview': 'overview',
  'Contacts': 'contacts',
  'Notes': 'notes',
  'Documents': 'documents',
  'Photos': 'photos',
  'Inspection': 'inspection',
  'Time & Expense': 'time-expense',
  'Tasks': 'tasks',
  'Reserves': 'reserves',
  'Claimants': 'claimants',
  'Coverages': 'coverages',
  'Loss Locations': 'loss-locations',
  'Carrier Forms': 'carrier-forms',
  'Firm Forms': 'firm-forms',
  'Links': 'links',
  'Timeline': 'timeline',
};

const SLUG_TO_TAB = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([tab, slug]) => [slug, tab as Tab]),
) as Record<string, Tab>;

// Tabs that contain firm-internal financial or operational data.
// Hidden entirely from carrier roles — they must not see reserves, adjuster
// time/cost entries, or internal firm document templates.
const CARRIER_HIDDEN_TABS = new Set<Tab>(['Time & Expense', 'Reserves', 'Firm Forms']);

const CARRIER_ROLES = new Set<Role>(['carrier', 'carrier_admin', 'carrier_desk_adjuster']);

export function ClaimTabs({
  claim,
  role,
  notes,
  documents,
  inspection,
  timeline,
  contacts,
  initialTab,
}: {
  claim: Claim;
  role: Role;
  notes: NoteItem[];
  documents: ClaimDocuments;
  inspection: ClaimInspectionData;
  timeline: TimelineItem[];
  contacts: ClaimContactsData;
  initialTab?: string;
}) {
  const router = useRouter();
  const isCarrierRole = CARRIER_ROLES.has(role);
  const tabs = isCarrierRole
    ? ALL_TABS.filter((tab) => !CARRIER_HIDDEN_TABS.has(tab))
    : ALL_TABS;

  function resolveInitialTab(): Tab {
    if (!initialTab) return 'Overview';
    const resolved = SLUG_TO_TAB[initialTab];
    if (!resolved || !tabs.includes(resolved)) return 'Overview';
    return resolved;
  }

  const [activeTab, setActiveTab] = useState<Tab>(resolveInitialTab);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    router.replace(`?tab=${TAB_SLUGS[tab]}`, { scroll: false });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.12em',
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
        {!isCarrierRole ? (
          <Button variant={customizerOpen ? 'primary' : 'ghost'} size="sm" onClick={() => setCustomizerOpen((value) => !value)} style={{ marginLeft: '12px' }}>
            Customize Overview
          </Button>
        ) : null}
      </div>

      <div style={{ paddingTop: '20px' }}>
        {activeTab === 'Overview' ? <OverviewTab claim={claim} role={role} documentCount={documents.reports.length} /> : null}
        {activeTab === 'Contacts' ? <ContactsTab claimId={claim.id} contacts={contacts} /> : null}
        {activeTab === 'Notes' ? <NotesTab role={role} notes={notes} claimId={claim.id} /> : null}
        {activeTab === 'Documents' ? <DocumentsTab claimId={claim.id} role={role} documents={documents} /> : null}
        {activeTab === 'Photos' ? <PhotosTab documents={documents} /> : null}
        {activeTab === 'Inspection' ? <InspectionTab inspection={inspection} /> : null}
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
