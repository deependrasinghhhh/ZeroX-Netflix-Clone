import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BACKDROP_URLS = [
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1280&q=80",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1280&q=80",
  "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1280&q=80",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1280&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1280&q=80",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1280&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1280&q=80",
  "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=1280&q=80",
  "https://images.unsplash.com/photo-1545987796-200677ee1011?w=1280&q=80",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=1280&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&q=80",
  "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=1280&q=80",
  "https://images.unsplash.com/photo-1569459657521-66dfdcff2e1b?w=1280&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&q=80",
  "https://images.unsplash.com/photo-1594736797933-d0401e5b5ad4?w=1280&q=80",
  "https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?w=1280&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&q=80",
];

const POSTER_URLS = [
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
  "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400&q=80",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=400&q=80",
  "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=400&q=80",
  "https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=400&q=80",
  "https://images.unsplash.com/photo-1569459657521-66dfdcff2e1b?w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
  "https://images.unsplash.com/photo-1594736797933-d0401e5b5ad4?w=400&q=80",
  "https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?w=400&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
];

const movies = [
  { title: "Galactic Frontier", description: "In the far reaches of the cosmos, a team of astronauts discovers a signal from an ancient civilization—one that changes everything humanity thought it knew about the universe.", rating: "PG-13", durationMinutes: 148, releaseDate: new Date("2023-07-12"), genres: ["sci-fi", "action"], viewsCount: 94000, averageRating: 4.5 },
  { title: "The Last Detective", description: "A retired detective is drawn back into the shadows of crime when a serial killer begins leaving cryptic messages addressed directly to him.", rating: "R", durationMinutes: 122, releaseDate: new Date("2023-03-01"), genres: ["thriller", "drama"], viewsCount: 72000, averageRating: 4.2 },
  { title: "Moonrise Kingdom", description: "Two young misfits fall in love and run away together in a remote island off the coast of New England in the 1960s.", rating: "PG-13", durationMinutes: 94, releaseDate: new Date("2022-11-15"), genres: ["romance", "drama"], viewsCount: 61000, averageRating: 4.7 },
  { title: "Iron Citadel", description: "When an unstoppable war machine threatens the free world, a misfit squad of soldiers must infiltrate enemy territory on a suicide mission.", rating: "R", durationMinutes: 135, releaseDate: new Date("2023-06-22"), genres: ["action"], viewsCount: 115000, averageRating: 4.3 },
  { title: "The Garden of Forgetting", description: "A woman with early-onset amnesia races to solve the mystery of her own disappearance before her memories fade completely.", rating: "PG-13", durationMinutes: 112, releaseDate: new Date("2023-02-14"), genres: ["thriller", "drama"], viewsCount: 53000, averageRating: 4.1 },
  { title: "Neon Nights", description: "A neo-noir thriller set in the rain-soaked streets of a cyberpunk metropolis where a hacker uncovers a massive corporate conspiracy.", rating: "R", durationMinutes: 128, releaseDate: new Date("2023-09-08"), genres: ["sci-fi", "thriller"], viewsCount: 88000, averageRating: 4.4 },
  { title: "Laugh Track", description: "Three best friends embark on a cross-country road trip to attend their childhood idol's final stand-up show, with hilarious consequences.", rating: "PG-13", durationMinutes: 98, releaseDate: new Date("2023-04-20"), genres: ["comedy"], viewsCount: 45000, averageRating: 3.9 },
  { title: "Shadows of Everest", description: "Based on true events, this gripping survival story follows a mountaineering team caught in a deadly blizzard near the summit of Everest.", rating: "PG-13", durationMinutes: 141, releaseDate: new Date("2023-01-28"), genres: ["drama", "action"], viewsCount: 67000, averageRating: 4.6 },
  { title: "The Dragon's Heir", description: "A young orphan discovers she is the last heir to a dragon-bonded bloodline and must rise to stop an ancient sorcerer's return.", rating: "PG-13", durationMinutes: 158, releaseDate: new Date("2023-05-05"), genres: ["fantasy", "action"], viewsCount: 132000, averageRating: 4.8 },
  { title: "Haunt Me", description: "A family moves into their dream home—only to discover that the previous owner never truly left. A chilling tale of terror.", rating: "R", durationMinutes: 103, releaseDate: new Date("2023-10-13"), genres: ["horror"], viewsCount: 78000, averageRating: 4.0 },
  { title: "Parallel Lives", description: "A quantum physicist accidentally glimpses into parallel universes and must choose between his current life and the one he never got to live.", rating: "PG-13", durationMinutes: 120, releaseDate: new Date("2023-08-18"), genres: ["sci-fi", "drama"], viewsCount: 59000, averageRating: 4.3 },
  { title: "Wild at Heart", description: "Two people from opposite worlds meet in the untamed wilderness of Alaska and forge an unexpected bond while surviving against all odds.", rating: "PG", durationMinutes: 115, releaseDate: new Date("2022-12-25"), genres: ["romance", "drama"], viewsCount: 42000, averageRating: 4.1 },
  { title: "Zero Hour", description: "When a nuclear warhead goes missing in 24 hours, a disgraced intelligence officer must work outside the system to find it.", rating: "PG-13", durationMinutes: 130, releaseDate: new Date("2023-07-04"), genres: ["action", "thriller"], viewsCount: 98000, averageRating: 4.2 },
  { title: "The Comedy of Errors", description: "A modern retelling of Shakespeare's classic, reimagined as a whacky roommate comedy in a New York apartment block.", rating: "PG", durationMinutes: 95, releaseDate: new Date("2023-03-17"), genres: ["comedy"], viewsCount: 31000, averageRating: 3.8 },
  { title: "Fade to Black", description: "A documentary following three aspiring musicians from across the globe as they compete for a single spot at the world's most prestigious music conservatory.", rating: "PG", durationMinutes: 88, releaseDate: new Date("2023-09-22"), genres: ["documentary", "drama"], viewsCount: 22000, averageRating: 4.5 },
  { title: "Crimson Throne", description: "In a kingdom on the brink of civil war, a reluctant queen must balance political intrigue, dark magic, and a forbidden love.", rating: "PG-13", durationMinutes: 162, releaseDate: new Date("2023-11-10"), genres: ["fantasy", "drama"], viewsCount: 109000, averageRating: 4.7 },
  { title: "Backcountry Nightmare", description: "A group of friends' camping trip turns into a desperate fight for survival when they cross paths with something in the woods that isn't human.", rating: "R", durationMinutes: 97, releaseDate: new Date("2023-06-02"), genres: ["horror", "thriller"], viewsCount: 64000, averageRating: 3.9 },
  { title: "Hearts Collide", description: "A charming romantic comedy about two rival chefs who must collaborate on a fusion restaurant—and discover they have more in common than their recipes.", rating: "PG", durationMinutes: 105, releaseDate: new Date("2023-02-10"), genres: ["romance", "comedy"], viewsCount: 37000, averageRating: 4.0 },
  { title: "Submerged", description: "When a research submarine is trapped at the bottom of the ocean, its crew must work together to survive—and uncover what exactly attacked them.", rating: "PG-13", durationMinutes: 118, releaseDate: new Date("2023-08-04"), genres: ["sci-fi", "thriller"], viewsCount: 81000, averageRating: 4.1 },
  { title: "Atlas Unbound", description: "A visionary documentary following the construction of the world's most ambitious engineering project: a bridge spanning a 50-mile ocean strait.", rating: "G", durationMinutes: 92, releaseDate: new Date("2023-04-01"), genres: ["documentary"], viewsCount: 18000, averageRating: 4.4 },
];

async function main() {
  console.log("🎬 Seeding movies...");

  // Get all genres from DB
  const genreMap: Record<string, string> = {};
  const allGenres = await prisma.genre.findMany();
  for (const g of allGenres) {
    genreMap[g.slug] = g.id;
  }

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];
    const backdropUrl = BACKDROP_URLS[i % BACKDROP_URLS.length];
    const posterUrl = POSTER_URLS[i % POSTER_URLS.length];

    const existing = await prisma.movie.findFirst({ where: { title: m.title } });
    if (existing) {
      console.log(`  ✓ Already exists: ${m.title}`);
      continue;
    }

    const movie = await prisma.movie.create({
      data: {
        title: m.title,
        description: m.description,
        releaseDate: m.releaseDate,
        durationMinutes: m.durationMinutes,
        backdropUrl,
        posterUrl,
        rating: m.rating,
        viewsCount: m.viewsCount,
        averageRating: m.averageRating,
      },
    });

    // Link genres
    for (const slug of m.genres) {
      const genreId = genreMap[slug];
      if (genreId) {
        await prisma.movieGenre.create({
          data: { movieId: movie.id, genreId },
        });
      }
    }

    console.log(`  ✅ Seeded: ${m.title}`);
  }

  console.log(`\n🎉 Movie seeding complete! ${movies.length} movies processed.`);
}

main()
  .catch((e) => {
    console.error("Error during movie seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
