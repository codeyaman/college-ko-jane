import { db } from "@/db";
import { Doc, Chunk } from "@/db/schema";
import { getSessionUser, publicUser } from "@/lib/auth";
import Landing from "@/components/landing/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();

  await db();

  const docs = await Doc.countDocuments({ status: "ready" });
  const chunks = await Chunk.countDocuments();
  const topics = (await Doc.distinct("category")).length;

  return (
    <Landing
      user={user ? publicUser(user) : null}
      stats={{
        docs,
        chunks,
        topics,
      }}
    />
  );
}
