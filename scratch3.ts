import { db } from "./src/db";
import { User } from "./src/db/schema";

async function main() {
  await db();
  const users = await User.find({});
  console.log("Users:", users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}

main().catch(console.error);
