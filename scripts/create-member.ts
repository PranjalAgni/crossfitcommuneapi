/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: requireEnv("DATABASE_URL"),
  }),
});

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  // Usage: pnpm tsx scripts/create-member.ts member@email.com Temp@12345 "Member Name"
  const email = process.argv[2];
  const tempPassword = process.argv[3];
  const fullName = process.argv[4] ?? null;

  if (!email || !tempPassword) {
    console.log(
      'Usage: pnpm tsx scripts/create-member.ts "member@email.com" "Temp@12345" "Member Name"',
    );
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Create user in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (error) {
    // If user already exists in Auth, you may see an error here.
    throw new Error(`Supabase createUser failed: ${error.message}`);
  }

  const authUser = data.user;
  if (!authUser?.id) throw new Error("Supabase returned no user id");

  // 2) Upsert into your Profiles table (Prisma)
  const profile = await prisma.profile.upsert({
    where: { id: authUser.id },
    update: {
      email,
      fullName: fullName ?? undefined,
      accountStatus: "ACTIVE",
      role: "member",
    },
    create: {
      id: authUser.id,
      email,
      fullName: fullName ?? undefined,
      accountStatus: "ACTIVE",
      role: "member",
      firstLoginAt: null,
      lastLoginAt: null,
    },
  });

  console.log("✅ Created member user");
  console.log({
    authUserId: authUser.id,
    email: profile.email,
    role: profile.role,
    accountStatus: profile.accountStatus,
  });
}

main()
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
