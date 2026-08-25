import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const posts = [
  {
    id: 1,
    user: "Brave Shaba",
    country: "Malawi",
    date: "22 Dec 2025",
    crop: "Cassava",
    image: "/cassava1.jpg",
    text: "Plantix detected a possible problem with my cassava. Options: Cassava Mosaic Disease, Cassava Gall Midge, or Healthy.",
  },
  {
    id: 2,
    user: "Beny Charles",
    country: "New Zealand",
    date: "7 Nov 2025",
    crop: "Cassava",
    image: "/cassava2.jpg",
    text: "Can someone help identify this issue?",
  },
];

function CommunityCard({ post }) {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/post/${post.id}`)}
      className="cursor-pointer overflow-hidden rounded-2xl shadow-sm transition hover:shadow-md"
    >
      <img
        src={post.image}
        alt="cassava"
        className="w-full h-auto max-h-[220px] sm:max-h-[260px] md:max-h-[300px] object-cover"
      />
      <CardContent className="p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
          <strong>{post.user}</strong>
          <span>• {post.country}</span>
        </div>
        <div className="text-xs text-gray-400">
          {post.date} • 🌱 {post.crop}
        </div>
        <p className="text-sm text-gray-800 line-clamp-3">{post.text}</p>
      </CardContent>
    </Card>
  );
}

export default function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {posts.map((post) => (
          <CommunityCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export function PostDetails({ params }) {
  const post = posts.find((p) => p.id === Number(params.id));

  if (!post) {
    return <div className="p-4">Post not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <img
        src={post.image}
        alt="cassava"
        className="w-full h-auto max-h-[70vh] object-cover"
      />
      <div className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg sm:text-xl font-semibold">{post.user}</h2>
        <p className="text-xs sm:text-sm text-gray-500">
          {post.date} • {post.country} • 🌱 {post.crop}
        </p>
        <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
          {post.text}
        </p>
      </div>
    </div>
  );
}
