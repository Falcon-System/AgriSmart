import { os } from "@orpc/server";
import { z } from "zod";
import type { Context } from "@/api/context";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// Create the base os with context
const base = os.$context<Context>();

// Create the base router
export const appRouter = base.router({
    greeting: base
        .input(z.object({ name: z.string() }))
        .handler(async ({ input }) => {
            return `Hello, ${input.name}!`;
        }),

    me: base.handler(async ({ context }) => {
        if (!context.user) {
            return { id: null, name: "Guest", email: "guest@example.com", organization: null };
        }

        const fullName = `${context.user.firstName} ${context.user.lastName}`;
        return {
            id: context.user.id,
            name: fullName,
            email: context.user.email,
            organization: context.user.organization || null,
        };
    }),

    diseases: base.router({
        list: base.handler(async () => {
            return [
                {
                    id: "cbb",
                    name: "Cassava Bacterial Blight",
                    slug: "CBB",
                    description: "A serious bacterial disease caused by Xanthomonas axonopodis pv. manihotis. It can cause significant yield loss through leaf wilting and stem dieback.",
                    yieldLoss: "70%",
                    symptoms: [
                        "Angular, water-soaked leaf spots",
                        "Leaf wilting and blight",
                        "Gum exudation on stems",
                        "Tip dieback",
                        "Vascular browning"
                    ],
                    treatment: [
                        "Pruning infected parts",
                        "Copper-based bactericides (limited effect)",
                        "Destruction of infected crop residues"
                    ],
                    prevention: [
                        "Use of resistant varieties",
                        "Crop rotation (at least 1 year)",
                        "Use of disease-free planting materials",
                        "Clean farm tools"
                    ],
                    imageUrl: "/cassava_image/cbb.png"
                },
                {
                    id: "cbsd",
                    name: "Cassava Brown Streak Disease",
                    slug: "CBSD",
                    description: "A viral disease characterized by brown streaks on stems and necrotic rot in tubers, making them inedible. It is spread by whitefly (Bemisia tabaci).",
                    yieldLoss: "90%",
                    symptoms: [
                        "Chlorosis along the veins (feathery pattern)",
                        "Brown necrotic streaks on the stem",
                        "Root necrosis (corking and browning of tubers)",
                        "Stunted growth in severe cases"
                    ],
                    treatment: [
                        "Early harvesting to save some tubers",
                        "Removal and burning of infected plants"
                    ],
                    prevention: [
                        "Use of certified virus-free stem cuttings",
                        "Control of whitefly populations",
                        "Planting resistant or tolerant cultivars"
                    ],
                    imageUrl: "/cassava_image/cbsd.png"
                },
                {
                    id: "cgm",
                    name: "Cassava Green Mottle",
                    slug: "CGM",
                    description: "Caused by the Cassava Green Mottle Virus. It leads to leaf mottling and can affect plant vigor and tuber quality.",
                    yieldLoss: "30%",
                    symptoms: [
                        "Green and yellow mottling on young leaves",
                        "Leaf distortion and narrowing",
                        "Reduced leaf size",
                        "Slight stunting"
                    ],
                    treatment: [
                        "No direct chemical treatment for the virus",
                        "Elimination of infected plants (roguing)"
                    ],
                    prevention: [
                        "Ensure clean planting stock",
                        "Monitor for whitefly vectors",
                        "Isolate new plantations from known infected fields"
                    ],
                    imageUrl: "/cassava_image/cgm.png"
                },
                {
                    id: "cmd",
                    name: "Cassava Mosaic Disease",
                    slug: "CMD",
                    description: "The most common cassava disease in Africa, caused by several species of Cassava Mosaic Begomoviruses. It causes characteristic leaf mosaic patterns and curling.",
                    yieldLoss: "50%",
                    symptoms: [
                        "Mosaic pattern of light green, yellow, and white on leaves",
                        "Distorted and twisted leaves",
                        "Reduced leaf area",
                        "Overall stunting of the plant"
                    ],
                    treatment: [
                        "Roguing (uprooting and burning) infected plants early",
                        "No chemical cure for the virus itself"
                    ],
                    prevention: [
                        "Planting resistant varieties (e.g., TMS series)",
                        "Using healthy, certified stem cuttings",
                        "Intercropping with non-host plants to reduce vector spread"
                    ],
                    imageUrl: "/cassava_image/cmd.png"
                },
                {
                    id: "healthy",
                    name: "Healthy Cassava",
                    slug: "Healthy",
                    description: "A vigorous cassava plant showing no signs of disease or pest infestation. Optimal for maximizing yield.",
                    yieldLoss: "0%",
                    symptoms: [
                        "Dark green, expansive leaves",
                        "Smooth stem without lesions",
                        "Uniform growth pattern",
                        "Healthy tuber development"
                    ],
                    treatment: [
                        "Regular fertilizer application",
                        "Adequate weeding",
                        "Consistent monitoring"
                    ],
                    prevention: [
                        "Maintain good farm hygiene",
                        "Sustainable soil management",
                        "Regular field scouting"
                    ],
                    imageUrl: "/cassava_image/healthy.png"
                }
            ];
        }),
    }),

    scans: base.router({
        list: base.handler(async ({ context }) => {
            const { data, error } = await context.db
                .from("Scan")
                .select("*")
                .order("createdAt", { ascending: false });
            
            if (error) throw error;
            return data;
        }),

        create: base
            .input(
                z.object({
                    fieldId: z.string().nullable().optional(),
                    imageUrl: z.string(),
                    disease: z.string(),
                    severity: z.number(),
                    confidence: z.number(),
                    treatment: z.string().optional(),
                    prevention: z.string().optional(),
                })
            )
            .handler(async ({ input, context }) => {
                let savedImageUrl = input.imageUrl;

                // Check if imageUrl is a base64 string
                if (input.imageUrl.startsWith("data:image")) {
                    try {
                        const base64Data = input.imageUrl.split(",")[1];
                        if (base64Data) {
                            const buffer = Buffer.from(base64Data, "base64");
                            const fileName = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
                            const publicDir = path.join(process.cwd(), "public", "cassava_image");
                            await mkdir(publicDir, { recursive: true });
                            const filePath = path.join(publicDir, fileName);

                            await writeFile(filePath, buffer);
                            savedImageUrl = `/cassava_image/${fileName}`;
                        }
                    } catch (error) {
                        console.error("Failed to save image:", error);
                        // Fallback to original imageUrl if saving fails
                    }
                }

                // Ensure severity is an integer
                const severity = Math.round(input.severity);

                try {
                    const { data, error } = await context.db
                        .from("Scan")
                        .insert({
                            id: crypto.randomUUID(),
                            disease: input.disease,
                            severity: severity,
                            confidence: input.confidence,
                            imageUrl: savedImageUrl,
                            treatment: input.treatment,
                            prevention: input.prevention,
                            fieldId: input.fieldId,
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    return data;
                } catch (dbError) {
                    console.error("Supabase Create Error:", dbError);
                    throw dbError;
                }
            }),

        get: base
            .input(z.object({ id: z.string() }))
            .handler(async ({ input, context }) => {
                const { data, error } = await context.db
                    .from("Scan")
                    .select("*")
                    .eq("id", input.id)
                    .single();

                if (error || !data) {
                    throw new Error("Scan not found");
                }

                return data;
            }),

        delete: base
            .input(z.object({ id: z.string() }))
            .handler(async ({ input, context }) => {
                // First get the scan to find image URL
                const { data: scan, error: getError } = await context.db
                    .from("Scan")
                    .select("imageUrl")
                    .eq("id", input.id)
                    .single();

                if (scan && scan.imageUrl && scan.imageUrl.startsWith("/cassava_image/")) {
                    try {
                        const filePath = path.join(process.cwd(), "public", scan.imageUrl);
                        await unlink(filePath);
                    } catch (error) {
                        console.error("Failed to delete image file:", error);
                    }
                }

                const { data, error } = await context.db
                    .from("Scan")
                    .delete()
                    .eq("id", input.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }),
    }),

    farms: base.router({
        list: base.handler(async ({ context }) => {
            const { data, error } = await context.db
                .from("Farm")
                .select("*");
            if (error) throw error;
            return data;
        }),

        create: base
            .input(z.object({
                name: z.string().min(1, "Farm name is required"),
                areaHa: z.number().positive("Area must be positive"),
                location: z.string().min(1, "Location is required"),
            }))
            .handler(async ({ input, context }) => {
                const { data, error } = await context.db
                    .from("Farm")
                    .insert({
                        id: crypto.randomUUID(),
                        name: input.name,
                        areaHa: input.areaHa,
                        location: input.location,
                    })
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }),

        update: base
            .input(z.object({
                id: z.string(),
                name: z.string().min(1, "Farm name is required"),
                areaHa: z.number().positive("Area must be positive"),
                location: z.string().min(1, "Location is required"),
            }))
            .handler(async ({ input, context }) => {
                const { data, error } = await context.db
                    .from("Farm")
                    .update({
                        name: input.name,
                        areaHa: input.areaHa,
                        location: input.location,
                        updatedAt: new Date().toISOString(),
                    })
                    .eq("id", input.id)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }),

        delete: base
            .input(z.object({ id: z.string() }))
            .handler(async ({ input, context }) => {
                const { data, error } = await context.db
                    .from("Farm")
                    .delete()
                    .eq("id", input.id)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }),
    }),

    fields: base.router({
        list: base.handler(async ({ context }) => {
            const { data, error } = await context.db
                .from("Field")
                .select("*");
            if (error) throw error;
            return data;
        }),
    }),

    community: base.router({
        list: base.handler(async ({ context }) => {
            const { data: posts, error } = await context.db
                .from("CommunityPost")
                .select(`
                    *,
                    user:User(firstName, lastName, organization),
                    comments:Comment(id),
                    likes:Like(isLike, userId)
                `)
                .order("createdAt", { ascending: false });

            if (error) throw error;

            return posts.map((post: any) => {
                const likesCount = post.likes.filter((l: any) => l.isLike).length;
                const dislikesCount = post.likes.filter((l: any) => !l.isLike).length;
                const commentsCount = post.comments.length;
                
                let userLikeState = null;
                if (context.user) {
                    const userLike = post.likes.find((l: any) => l.userId === context.user?.id);
                    if (userLike) userLikeState = userLike.isLike ? "like" : "dislike";
                }

                return {
                    ...post,
                    imageUrl: post.image,
                    likesCount,
                    dislikesCount,
                    commentsCount,
                    userLikeState
                };
            });
        }),

        create: base
            .input(z.object({
                title: z.string(),
                description: z.string(),
                crop: z.string(),
                imageUrl: z.string().optional(),
            }))
            .handler(async ({ input, context }) => {
                if (!context.user) throw new Error("Unauthorized");

                let savedImageUrl = input.imageUrl;

                if (input.imageUrl?.startsWith("data:image")) {
                    try {
                        const base64Data = input.imageUrl.split(",")[1];
                        if (base64Data) {
                            const buffer = Buffer.from(base64Data, "base64");
                            const fileName = `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
                            const publicDir = path.join(process.cwd(), "public", "cassava_image");
                            await mkdir(publicDir, { recursive: true });
                            const filePath = path.join(publicDir, fileName);
                            await writeFile(filePath, buffer);
                            savedImageUrl = `/cassava_image/${fileName}`;
                        }
                    } catch (error) {
                        console.error("Failed to save post image:", error);
                    }
                }

                const { data, error } = await context.db
                    .from("CommunityPost")
                    .insert({
                        id: crypto.randomUUID(),
                        title: input.title,
                        description: input.description,
                        crop: input.crop,
                        image: savedImageUrl,
                        userId: context.user.id,
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }),

        get: base
            .input(z.object({ id: z.string() }))
            .handler(async ({ input, context }) => {
                const { data: post, error } = await context.db
                    .from("CommunityPost")
                    .select(`
                        *,
                        user:User(firstName, lastName, organization),
                        comments:Comment(
                            *,
                            user:User(firstName, lastName)
                        ),
                        likes:Like(*)
                    `)
                    .eq("id", input.id)
                    .single();

                if (error || !post) throw new Error("Post not found");

                // Sort comments manually if needed, or we could have ordered in select if Supabase supported it deeply
                const sortedComments = (post.comments || []).sort((a: any, b: any) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                const likesCount = (post.likes || []).filter((l: any) => l.isLike).length;
                const dislikesCount = (post.likes || []).filter((l: any) => !l.isLike).length;

                let userLikeState = null;
                if (context.user) {
                    const found = (post.likes || []).find((l: any) => l.userId === context.user?.id);
                    if (found) userLikeState = found.isLike ? "like" : "dislike";
                }

                return {
                    ...post,
                    comments: sortedComments,
                    imageUrl: post.image,
                    likesCount,
                    dislikesCount,
                    userLikeState
                };
            }),

        toggleLike: base
            .input(z.object({ postId: z.string(), isLike: z.boolean() }))
            .handler(async ({ input, context }) => {
                if (!context.user) throw new Error("Unauthorized");

                const { data: existingLike, error: findError } = await context.db
                    .from("Like")
                    .select("*")
                    .eq("userId", context.user.id)
                    .eq("postId", input.postId)
                    .maybeSingle();

                if (existingLike) {
                    if (existingLike.isLike === input.isLike) {
                        // Remove like/dislike if clicking the same one again
                        const { error: deleteError } = await context.db
                            .from("Like")
                            .delete()
                            .eq("id", existingLike.id);
                        if (deleteError) throw deleteError;
                        return { message: "Like removed" };
                    } else {
                        // Toggle from like to dislike or vice versa
                        const { data, error: updateError } = await context.db
                            .from("Like")
                            .update({ isLike: input.isLike })
                            .eq("id", existingLike.id)
                            .select()
                            .single();
                        if (updateError) throw updateError;
                        return data;
                    }
                }

                const { data, error: insertError } = await context.db
                    .from("Like")
                    .insert({
                        id: crypto.randomUUID(),
                        isLike: input.isLike,
                        userId: context.user.id,
                        postId: input.postId
                    })
                    .select()
                    .single();
                
                if (insertError) throw insertError;
                return data;
            }),

        addComment: base
            .input(z.object({ postId: z.string(), text: z.string() }))
            .handler(async ({ input, context }) => {
                if (!context.user) throw new Error("Unauthorized");

                const { data, error } = await context.db
                    .from("Comment")
                    .insert({
                        id: crypto.randomUUID(),
                        text: input.text,
                        userId: context.user.id,
                        postId: input.postId
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            }),
    }),
});

export type AppRouter = typeof appRouter;
