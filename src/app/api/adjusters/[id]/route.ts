import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/mapbox/geocoding';
import { updateAdjusterProfile, updateAdjusterUser } from '@/lib/supabase/adjusters';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import type { AdjusterHomeBase, AdjusterProfileUpdate, AdjusterUserUpdate } from '@/lib/types';

interface UpdateAdjusterProfileBody {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  maxActiveClaims?: number;
  availability?: 'available' | 'busy' | 'remote' | 'on_leave';
  certifications?: string[];
  approvedClaimTypes?: string[];
  approvedCarrierIds?: string[];
  homeBases?: AdjusterHomeBase[];
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as UpdateAdjusterProfileBody;
  const { id } = await params;
  const geocodedHomeBases = await Promise.all(
    (body.homeBases ?? []).map(async (homeBase, index) => {
      const geocodedPoint = await geocodeAddress({
        lossAddress: homeBase.address,
        city: homeBase.city,
        state: homeBase.state,
        zip: homeBase.zip,
      });

      return {
        name: homeBase.name?.trim() || `Home Base ${index + 1}`,
        address: homeBase.address?.trim() || '',
        formattedAddress: homeBase.formattedAddress?.trim() || homeBase.address?.trim() || '',
        city: homeBase.city?.trim() || '',
        state: homeBase.state?.trim() || '',
        zip: homeBase.zip?.trim() || '',
        lat: geocodedPoint?.lat ?? homeBase.lat ?? null,
        lng: geocodedPoint?.lng ?? homeBase.lng ?? null,
        isPrimary: Boolean(homeBase.isPrimary),
      } satisfies AdjusterHomeBase;
    }),
  );

  const userUpdates: Partial<AdjusterUserUpdate> = {};
  if (typeof body.firstName === 'string') userUpdates.firstName = body.firstName;
  if (typeof body.lastName === 'string') userUpdates.lastName = body.lastName;
  if (typeof body.isActive === 'boolean') userUpdates.isActive = body.isActive;

  const profileUpdates: Partial<AdjusterProfileUpdate> = {};
  if (typeof body.maxActiveClaims === 'number' && Number.isFinite(body.maxActiveClaims)) {
    profileUpdates.maxActiveClaims = body.maxActiveClaims;
  }
  if (Array.isArray(body.certifications)) profileUpdates.certifications = body.certifications;
  if (Array.isArray(body.approvedClaimTypes)) profileUpdates.approvedClaimTypes = body.approvedClaimTypes;
  if (Array.isArray(body.approvedCarrierIds)) profileUpdates.approvedCarriers = body.approvedCarrierIds;
  if (Array.isArray(body.homeBases)) profileUpdates.homeBases = geocodedHomeBases;
  if (body.availability) profileUpdates.availability = body.availability;

  try {
    await Promise.all([
      updateAdjusterUser(firmUser.firmId, id, userUpdates),
      updateAdjusterProfile(firmUser.firmId, id, profileUpdates),
    ]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update adjuster.' },
      { status: 500 },
    );
  }

  revalidatePath('/adjusters');
  revalidatePath(`/adjusters/${id}`);
  revalidatePath('/dispatch');

  return NextResponse.json({ success: true });
}
