import { Card } from '@/components/ui/Card';
import type { ClaimInspectionData } from '@/lib/supabase/inspections';

function formatInspectionTimestamp(value: string) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function formatLabel(label: string) {
  return label
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function SummarySection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  const visibleRows = rows.filter((row) => row.value && row.value.toLowerCase() !== 'none');

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <Card style={{ background: 'var(--surface)' }}>
      <div
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        {visibleRows.map((row) => (
          <div key={row.label} style={{ display: 'grid', gap: '2px' }}>
            <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{row.label}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{row.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function InspectionTab({ inspection }: { inspection: ClaimInspectionData }) {
  const data = readRecord(inspection.inspection?.data);
  const details = readRecord(data.details);
  const interview = readRecord(data.interview);
  const closeit = readRecord(data.closeit);
  const closeitSections = readRecord(closeit.sections);
  const inspektit = readRecord(data.inspektit);
  const dwelling = readRecord(inspektit.dwelling);
  const roof = readRecord(dwelling.roof);
  const personalProperty = readRecord(inspektit.personalProperty);

  const whoWasPresentRoles = readArray(interview.whoWasPresentRoles)
    .map(readString)
    .filter(Boolean)
    .join(', ');

  const riskDescription = readString(closeitSections.riskDescriptionNarrative)
    || readString(closeitSections.riskDescription)
    || readString(closeitSections.riskDescriptionText);

  const initialInspection = readString(closeitSections.initialInspectionNarrative)
    || readString(closeitSections.initialInspection)
    || readString(closeitSections.initialInspectionText);

  const testSquares = readArray(roof.testSquares)
    .map((item) => {
      const square = readRecord(item);
      const slopeName = readString(square.slopeName) || readString(square.slope);
      const hailHits = readString(square.hailHitsPerSquare) || String(square.hailHits ?? '').trim();

      if (!slopeName && !hailHits) {
        return '';
      }

      return `${slopeName || 'Slope'}${hailHits ? `: ${hailHits} hail hits/square` : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  const damagedElevations = ['front', 'back', 'left', 'right']
    .flatMap((side) => {
      const sideData = readRecord(dwelling[side]);

      return Object.entries(sideData)
        .filter(([, value]) => {
          const text = readString(value).toLowerCase();
          return text && text !== 'none' && text !== 'empty';
        })
        .map(([key, value]) => `${formatLabel(side)} ${formatLabel(key)}: ${readString(value)}`);
    })
    .join('\n');

  const interior = readRecord(dwelling.interior);
  const interiorRooms = readArray(interior.rooms)
    .flatMap((room) => {
      const roomData = readRecord(room);
      const roomName = readString(roomData.roomName) || readString(roomData.name);
      const damage = ['ceiling', 'walls', 'floor']
        .filter((field) => {
          const text = readString(roomData[field]).toLowerCase();
          return text && text !== 'none' && text !== 'empty';
        })
        .map((field) => formatLabel(field));

      if (!roomName || damage.length === 0) {
        return [];
      }

      return [`${roomName}: ${damage.join(', ')}`];
    })
    .join('\n');

  const personalPropertyItems = readArray(personalProperty.items)
    .flatMap((item) => {
      const itemData = readRecord(item);
      const description = readString(itemData.description) || readString(itemData.itemDescription);
      const notes = readString(itemData.notes);

      if (!description) {
        return [];
      }

      return [notes ? `${description}: ${notes}` : description];
    })
    .join('\n');

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {inspection.inspection ? (
        <Card style={{ background: 'var(--surface)' }}>
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Inspection Record
          </div>
          <div style={{ marginTop: '10px', color: 'var(--muted)' }}>
            {`Captured ${formatInspectionTimestamp(inspection.inspection.createdAt)} via INSPEKTiT.`}
          </div>
        </Card>
      ) : null}

      {!inspection.inspection ? (
        <Card style={{ background: 'var(--surface)' }}>
          <div style={{ color: 'var(--muted)' }}>No inspection data available yet.</div>
        </Card>
      ) : null}

      <SummarySection
        title="Details"
        rows={[
          { label: 'Carrier', value: readString(details.carrier) },
          { label: 'Loss Address', value: readString(details.lossAddress) },
          { label: 'Loss Type', value: readString(details.lossType) },
          { label: 'Date of Loss', value: readString(details.dateOfLoss) },
          { label: 'Examiner Name', value: readString(details.examinerName) },
          { label: 'Policy Number', value: readString(details.policyNumber) },
        ]}
      />

      <SummarySection
        title="Interview"
        rows={[
          { label: 'Who Was Present', value: whoWasPresentRoles },
          { label: 'Spoke To', value: readString(interview.spokeTo) },
          { label: 'Inspection Date', value: readString(interview.inspectionDate) },
          { label: 'Contact Date', value: readString(interview.contactDate) },
          { label: 'Property Type', value: readString(interview.propertyType) },
          { label: 'Construction Type', value: readString(interview.constructionType) },
          { label: 'Foundation Type', value: readString(interview.foundationType) },
          { label: 'Year Built', value: readString(interview.yearBuilt) || String(interview.yearBuilt ?? '') },
          { label: 'Number of Stories', value: readString(interview.numberOfStories) || String(interview.numberOfStories ?? '') },
          { label: 'Roof Age', value: readString(interview.roofAge) || String(interview.roofAge ?? '') },
          { label: 'Prior Loss', value: readString(interview.priorLoss) },
          { label: 'Subrogation', value: readString(interview.subrogation) },
        ]}
      />

      <SummarySection
        title="Narratives"
        rows={[
          { label: 'Risk Description', value: riskDescription },
          { label: 'Initial Inspection', value: initialInspection },
        ]}
      />

      <SummarySection
        title="Roof"
        rows={[
          { label: 'Test Squares', value: testSquares },
          { label: 'Roof Style', value: readString(roof.roofStyle) },
          { label: 'Material Type', value: readString(roof.materialType) },
          { label: 'Recommendation', value: readString(roof.recommendation) },
        ]}
      />

      <SummarySection
        title="Exterior Damage"
        rows={[{ label: 'Elevations', value: damagedElevations }]}
      />

      <SummarySection
        title="Interior Damage"
        rows={[{ label: 'Rooms', value: interiorRooms }]}
      />

      <SummarySection
        title="Personal Property"
        rows={[{ label: 'Items', value: personalPropertyItems }]}
      />
    </div>
  );
}
