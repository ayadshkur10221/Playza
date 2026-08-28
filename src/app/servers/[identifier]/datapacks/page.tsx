import { notFound } from 'next/navigation'
import DatapacksClient from './DatapacksClient'

export default async function DatapacksPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  if (!identifier) notFound()

  return <DatapacksClient identifier={identifier} />
}