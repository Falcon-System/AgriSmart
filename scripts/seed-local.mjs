import { config } from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "agrismart_local";
const DEMO_PASSWORD = "FarmDemo123";

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const collections = ["User", "Farm", "Field", "CommunityPost", "Comment", "Like", "Scan", "Settings"];
  for (const name of collections) {
    await db.collection(name).deleteMany({ isDemo: true });
  }

  const farmers = [
    {
      id: randomUUID(),
      username: "farmer",
      email: "abebe@agrismart.demo",
      firstName: "Abebe",
      lastName: "Tadesse",
      phoneNumber: "251911000001",
      organization: "Hawassa Cassava Cooperative",
    },
    {
      id: randomUUID(),
      username: "amina",
      email: "amina@agrismart.demo",
      firstName: "Amina",
      lastName: "Mwangi",
      phoneNumber: "255712000002",
      organization: "Arusha Tomato Growers",
    },
    {
      id: randomUUID(),
      username: "jeanpierre",
      email: "jeanpierre@agrismart.demo",
      firstName: "Jean-Pierre",
      lastName: "Mbala",
      phoneNumber: "243810000003",
      organization: "Kisangani Mango Orchard",
    },
    {
      id: randomUUID(),
      username: "fatima",
      email: "fatima@agrismart.demo",
      firstName: "Fatima",
      lastName: "Okonkwo",
      phoneNumber: "234801000004",
      organization: "Oyo Root Crop Farm",
    },
  ].map((user) => ({
    ...user,
    password,
    isDemo: true,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  }));

  const farms = [
    {
      id: randomUUID(),
      name: "Hawassa Cassava Cooperative",
      areaHa: 12.4,
      location: "Hawassa, Ethiopia",
      ownerId: farmers[0].id,
    },
    {
      id: randomUUID(),
      name: "Arusha Tomato Gardens",
      areaHa: 4.5,
      location: "Arusha, Tanzania",
      ownerId: farmers[1].id,
    },
    {
      id: randomUUID(),
      name: "Kisangani Mango Orchard",
      areaHa: 8.2,
      location: "Kisangani, DR Congo",
      ownerId: farmers[2].id,
    },
    {
      id: randomUUID(),
      name: "Oyo Root Crop Farm",
      areaHa: 20,
      location: "Oyo, Nigeria",
      ownerId: farmers[3].id,
    },
  ].map((farm) => ({ ...farm, isDemo: true, createdAt: daysAgo(18), updatedAt: daysAgo(2) }));

  const fields = [
    { name: "Zone A — CMD watch", crop: "Cassava", farmId: farms[0].id, areaHa: 3.2 },
    { name: "Greenhouse 2", crop: "Tomato", farmId: farms[1].id, areaHa: 1.1 },
    { name: "East orchard block", crop: "Mango", farmId: farms[2].id, areaHa: 2.8 },
    { name: "Lowland cassava", crop: "Cassava", farmId: farms[3].id, areaHa: 6.0 },
  ].map((field) => ({
    id: randomUUID(),
    ...field,
    isDemo: true,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(3),
  }));

  const posts = [
    {
      userId: farmers[0].id,
      title: "Yellow mosaic showing up after the rains",
      crop: "Cassava",
      image: "/cassava_image/cmd.png",
      description:
        "Leaves on the east plot turned yellow with twisted margins. AgriSmart flagged Cassava Mosaic. Has anyone rogued infected stems this season and still kept yield?",
      days: 2,
    },
    {
      userId: farmers[1].id,
      title: "Tomato blight after overhead watering",
      crop: "Tomato",
      image: "/cassava_post_1.png",
      description:
        "Dark lesions on lower leaves after evening irrigation. Looking for a biological spray that works before we try copper. Severity looked moderate on the scan.",
      days: 4,
    },
    {
      userId: farmers[2].id,
      title: "Black spots on mango fruit after harvest rains",
      crop: "Mango",
      image: "/cassava_post_2.png",
      description:
        "Anthracnose-like spots on Kent mangoes. We pruned and bagged fruit. What sanitation step helped you most before flowering?",
      days: 6,
    },
    {
      userId: farmers[3].id,
      title: "Healthy cassava check after switching cuttings",
      crop: "Cassava",
      image: "/cassava_image/healthy.png",
      description:
        "Used certified stem cuttings this cycle. Scan came back healthy. Sharing so others can compare leaf color and shape against mosaic cases.",
      days: 8,
    },
    {
      userId: farmers[0].id,
      title: "Brown streak symptoms on storage roots",
      crop: "Cassava",
      image: "/cassava_image/cbsd.png",
      description:
        "Roots from last harvest had brown streaks. Leaves were not as obvious. Should we destroy the whole block or only symptomatic plants?",
      days: 11,
    },
  ].map((post) => ({
    id: randomUUID(),
    title: post.title,
    description: post.description,
    crop: post.crop,
    image: post.image,
    userId: post.userId,
    isDemo: true,
    createdAt: daysAgo(post.days),
    updatedAt: daysAgo(post.days),
  }));

  const comments = [
    { post: 0, user: 3, text: "Rogue immediately and plant certified cuttings next cycle. We lost a whole hectare by waiting." },
    { post: 0, user: 1, text: "Whitefly pressure is high here too. Neem at dusk reduced new infections." },
    { post: 1, user: 0, text: "Stop overhead watering and keep foliage dry at night. That slowed blight for us." },
    { post: 2, user: 1, text: "Collect fallen fruit and prune crowded branches so the canopy dries faster." },
    { post: 3, user: 2, text: "Good result. Keep monitoring weekly; mosaic can still move in from neighboring farms." },
    { post: 4, user: 3, text: "For CBSD we destroyed infected roots and changed varieties. Do not use those stems again." },
  ].map((item, index) => ({
    id: randomUUID(),
    text: item.text,
    postId: posts[item.post].id,
    userId: farmers[item.user].id,
    isDemo: true,
    createdAt: daysAgo(index + 1),
    updatedAt: daysAgo(index + 1),
  }));

  const likes = [
    { post: 0, user: 1, isLike: true },
    { post: 0, user: 2, isLike: true },
    { post: 0, user: 3, isLike: true },
    { post: 1, user: 0, isLike: true },
    { post: 1, user: 2, isLike: false },
    { post: 2, user: 0, isLike: true },
    { post: 2, user: 3, isLike: true },
    { post: 3, user: 1, isLike: true },
    { post: 4, user: 1, isLike: true },
  ].map((item) => ({
    id: randomUUID(),
    postId: posts[item.post].id,
    userId: farmers[item.user].id,
    isLike: item.isLike,
    isDemo: true,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }));

  const scans = [
    {
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
    },
    {
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
    },
  ].map((scan, index) => ({
    id: randomUUID(),
    ...scan,
    fieldId: fields[index].id,
    isDemo: true,
    createdAt: daysAgo(index + 1),
    updatedAt: daysAgo(index + 1),
  }));

  await db.collection("User").insertMany(farmers);
  await db.collection("Farm").insertMany(farms);
  await db.collection("Field").insertMany(fields);
  await db.collection("CommunityPost").insertMany(posts);
  await db.collection("Comment").insertMany(comments);
  await db.collection("Like").insertMany(likes);
  await db.collection("Scan").insertMany(scans);
  await db.collection("Settings").updateOne(
    { id: "default" },
    {
      $set: {
        id: "default",
        orgName: "AgriSmart Farmer Network",
        locale: "en-US",
        currency: "ETB",
        isDemo: true,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  await client.close();

  console.log("Seeded AgriSmart demo data.");
  console.log("Login: username farmer  password FarmDemo123");
  console.log(`Farmers: ${farmers.length}  Farms: ${farms.length}  Posts: ${posts.length}  Scans: ${scans.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
