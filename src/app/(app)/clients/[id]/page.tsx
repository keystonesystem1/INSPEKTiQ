import { notFound } from 'next/navigation';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  notFound();
}
