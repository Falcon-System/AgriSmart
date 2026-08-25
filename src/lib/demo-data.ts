import { hash } from "bcrypt";
import { db } from "@/lib/db";
import { DEMO_LOGIN, findUserByIdentifier } from "@/lib/auth";

const DEMO_PASSWORD = DEMO_LOGIN.password;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function countDemo(table: string) {
  const { data } = await db.from(table).select("id").eq("isDemo", true);
  return Array.isArray(data) ? data.length : 0;
}

async function upsertDemoUser(input: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  organization: string;
}) {
  const existing = await findUserByIdentifier(input.username);
  if (existing) {
    return existing;
  }

  const password = await hash(DEMO_PASSWORD, 10);
  const { data } = await db
    .from("User")
    .insert({
      id: crypto.randomUUID(),
      ...input,
      password,
      isDemo: true,
    })
    .select()
    .single();
  return data;
}

let seeding: Promise<void> | null = null;

async function seedDemoDataset() {
  const abebe = await upsertDemoUser({
    username: DEMO_LOGIN.username,
    email: DEMO_LOGIN.email,
    firstName: DEMO_LOGIN.firstName,
    lastName: DEMO_LOGIN.lastName,
    phoneNumber: DEMO_LOGIN.phoneNumber,
    organization: DEMO_LOGIN.organization,
  });
  const amina = await upsertDemoUser({
    username: "amina",
    email: "amina@agrismart.demo",
    firstName: "Amina",
    lastName: "Mwangi",
    phoneNumber: "255712000002",
    organization: "Arusha Tomato Growers",
  });
  const jean = await upsertDemoUser({
    username: "jeanpierre",
    email: "jeanpierre@agrismart.demo",
    firstName: "Jean-Pierre",
    lastName: "Mbala",
    phoneNumber: "243810000003",
    organization: "Kisangani Mango Orchard",
  });
  const fatima = await upsertDemoUser({
    username: "fatima",
    email: "fatima@agrismart.demo",
    firstName: "Fatima",
    lastName: "Okonkwo",
    phoneNumber: "234801000004",
    organization: "Oyo Root Crop Farm",
  });

  const farmers = [abebe, amina, jean, fatima].filter(Boolean);
  if (farmers.length < 4) {
    console.warn("Demo users could not be created; skip remaining demo records.");
    return;
  }

  if ((await countDemo("Farm")) === 0) {
    await db.from("Farm").insert([
      { id: crypto.randomUUID(), name: "Hawassa Cassava Cooperative", areaHa: 12.4, location: "Hawassa, Ethiopia", isDemo: true },
      { id: crypto.randomUUID(), name: "Arusha Tomato Gardens", areaHa: 4.5, location: "Arusha, Tanzania", isDemo: true },
      { id: crypto.randomUUID(), name: "Kisangani Mango Orchard", areaHa: 8.2, location: "Kisangani, DR Congo", isDemo: true },
      { id: crypto.randomUUID(), name: "Oyo Root Crop Farm", areaHa: 20, location: "Oyo, Nigeria", isDemo: true },
    ]);
  }

  if ((await countDemo("CommunityPost")) === 0) {
    const postSpecs = [
      {
        userId: abebe.id,
        title: "Yellow mosaic showing up after the rains",
        crop: "Cassava",
        image: "/cassava_image/cmd.png",
        description:
          "Leaves on the east plot turned yellow with twisted margins. AgriSmart flagged Cassava Mosaic. Has anyone rogued infected stems this season?",
        days: 2,
      },
      {
        userId: amina.id,
        title: "Tomato blight after overhead watering",
        crop: "Tomato",
        image: "/cassava_post_1.png",
        description:
          "Dark lesions on lower leaves after evening irrigation. Looking for a biological spray that works before we try copper.",
        days: 4,
      },
      {
        userId: jean.id,
        title: "Black spots on mango fruit after harvest rains",
        crop: "Mango",
        image: "/cassava_post_2.png",
        description:
          "Anthracnose-like spots on Kent mangoes. We pruned and bagged fruit. What sanitation step helped you most before flowering?",
        days: 6,
      },
      {
        userId: fatima.id,
        title: "Healthy cassava check after switching cuttings",
        crop: "Cassava",
        image: "/cassava_image/healthy.png",
        description:
          "Used certified stem cuttings this cycle. Scan came back healthy. Sharing so others can compare leaf color against mosaic cases.",
        days: 8,
      },
      {
        userId: abebe.id,
        title: "Brown streak symptoms on storage roots",
        crop: "Cassava",
        image: "/cassava_image/cbsd.png",
        description:
          "Roots from last harvest had brown streaks. Leaves were not as obvious. Should we destroy the whole block or only symptomatic plants?",
        days: 11,
      },
    ];

    const posts = postSpecs.map((post) => ({
      id: crypto.randomUUID(),
      title: post.title,
      description: post.description,
      crop: post.crop,
      image: post.image,
      userId: post.userId,
      isDemo: true,
      createdAt: daysAgo(post.days),
      updatedAt: daysAgo(post.days),
    }));

    await db.from("CommunityPost").insert(posts);

    await db.from("Comment").insert([
      { id: crypto.randomUUID(), postId: posts[0].id, userId: fatima.id, text: "Rogue immediately and plant certified cuttings next cycle.", isDemo: true },
      { id: crypto.randomUUID(), postId: posts[0].id, userId: amina.id, text: "Whitefly pressure is high here too. Neem at dusk reduced new infections.", isDemo: true },
      { id: crypto.randomUUID(), postId: posts[1].id, userId: abebe.id, text: "Stop overhead watering and keep foliage dry at night.", isDemo: true },
      { id: crypto.randomUUID(), postId: posts[2].id, userId: amina.id, text: "Collect fallen fruit and prune crowded branches so the canopy dries faster.", isDemo: true },
      { id: crypto.randomUUID(), postId: posts[3].id, userId: jean.id, text: "Good result. Keep monitoring weekly; mosaic can still move in from neighboring farms.", isDemo: true },
      { id: crypto.randomUUID(), postId: posts[4].id, userId: fatima.id, text: "For CBSD we destroyed infected roots and changed varieties.", isDemo: true },
    ]);

    await db.from("Like").insert([
      { id: crypto.randomUUID(), postId: posts[0].id, userId: amina.id, isLike: true, isDemo: true },
      { id: crypto.randomUUID(), postId: posts[0].id, userId: jean.id, isLike: true, isDemo: true },
      { id: crypto.randomUUID(), postId: posts[0].id, userId: fatima.id, isLike: true, isDemo: true },
      { id: crypto.randomUUID(), postId: posts[1].id, userId: abebe.id, isLike: true, isDemo: true },
      { id: crypto.randomUUID(), postId: posts[2].id, userId: abebe.id, isLike: true, isDemo: true },
      { id: crypto.randomUUID(), postId: posts[3].id, userId: amina.id, isLike: true, isDemo: true },
    ]);
  }

  if ((await countDemo("Scan")) === 0) {
    await db.from("Scan").insert([
      {
        id: crypto.randomUUID(),
        disease: "Cassava Mosaic Disease (CMD)",
        detectedCrop: "Cassava",
        cropCategory: "Root & Tuber",
        isHealthy: false,
        confidence: 86,
        severity: 90,
        severityGrade: "Critical",
        imageUrl: "/cassava_image/cmd.png",
        treatment: "No chemical cure available. Uproot and destroy infected plants. Control whitefly population.",
        prevention: "Use CMD-resistant cassava varieties. Plant certified virus-free cuttings.",
        symptoms: ["Mosaic yellow patterns on leaf blades", "Distorted leaf margins"],
        source: "model",
        isDemo: true,
        createdAt: daysAgo(1),
      },
      {
        id: crypto.randomUUID(),
        disease: "Healthy Cassava Leaf",
        detectedCrop: "Cassava",
        cropCategory: "Root & Tuber",
        isHealthy: true,
        confidence: 72,
        severity: 0,
        severityGrade: "None",
        imageUrl: "/cassava_image/healthy.png",
        treatment: "No treatment required",
        prevention: "Continue regular monitoring and use disease-free planting materials.",
        symptoms: ["Uniform green leaves", "Normal leaf shape"],
        source: "model",
        isDemo: true,
        createdAt: daysAgo(2),
      },
    ]);
  }

  await db.from("Settings").update({
    orgName: "AgriSmart Farmer Network",
    locale: "en-US",
    currency: "ETB",
    isDemo: true,
  }).eq("id", "default");
}

export async function ensureDemoDataset() {
  if (!seeding) {
    seeding = seedDemoDataset().catch((error) => {
      seeding = null;
      console.warn("Demo dataset seed failed:", error);
    });
  }
  return seeding;
}
