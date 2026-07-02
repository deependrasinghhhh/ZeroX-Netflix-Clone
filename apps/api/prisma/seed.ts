import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Seed Genres
  const genres = [
    { name: "Action", slug: "action" },
    { name: "Comedy", slug: "comedy" },
    { name: "Drama", slug: "drama" },
    { name: "Horror", slug: "horror" },
    { name: "Romance", slug: "romance" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Thriller", slug: "thriller" },
    { name: "Documentary", slug: "documentary" },
    { name: "Fantasy", slug: "fantasy" },
  ];

  console.log("Seeding genres...");
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre,
    });
  }

  // Seed Default Admin User
  const adminEmail = "admin@zerox.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log("Seeding admin user...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("AdminPassword@123", salt);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        isEmailVerified: true,
        accountStatus: "ACTIVE",
      },
    });

    // Create default profile for admin
    await prisma.profile.create({
      data: {
        userId: adminUser.id,
        name: "Administrator",
        isKids: false,
        language: "en",
        subtitlePreference: "none",
      },
    });
    console.log("Admin user and profile seeded.");
  } else {
    console.log("Admin user already exists.");
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
