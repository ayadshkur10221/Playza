export async function POST() {
  return Response.json({ error: 'Datapack downloads are unavailable.' }, { status: 501 })
}