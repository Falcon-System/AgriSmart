"use client";

import { useState } from "react";
import { Plus, Search, Filter, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CassavaCard } from "@/components/CassavaCard";
import { orpc, client } from "@/utils/orpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FieldsPage() {
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", description: "", crop: "Cassava", imageUrl: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const postsQuery = useQuery(orpc.community.list.queryOptions());
  const meQuery = useQuery(orpc.me.queryOptions());

  const posts = postsQuery.data;
  const isLoading = postsQuery.isLoading;
  const refetch = () => postsQuery.refetch();

  const createPostMutation = useMutation({
    mutationFn: (input: { title: string; description: string; crop: string; imageUrl?: string }) =>
      client.community.create(input),
    onSuccess: () => {
      toast.success("Post created successfully!");
      setIsCreateDialogOpen(false);
      setNewPost({ title: "", description: "", crop: "Cassava", imageUrl: "" });
      setImagePreview(null);
      queryClient.invalidateQueries({ queryKey: orpc.community.list.queryKey() });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create post");
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setNewPost({ ...newPost, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.description) {
      toast.error("Please fill in all fields");
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const filteredPosts = posts?.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase()) ||
      `${post.user.firstName} ${post.user.lastName}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4 sm:px-6 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Community</h1>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">Insights from cassava, tomato, and fruit growers across the region</p>
        </div>
        <div className="flex items-center gap-2">
          {meQuery.data?.id && (
            <Button
              className="flex-1 sm:flex-none rounded-full bg-primary hover:bg-primary/90 px-8 h-12 font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 size-5" />
              Ask Community
            </Button>
          )}
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 bg-card border-border rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 text-base font-medium placeholder:font-normal"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Filter className="size-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[400px] rounded-[2.5rem] bg-muted animate-pulse border border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
          {filteredPosts.map((post) => (
            <CassavaCard
              key={post.id}
              post={{
                id: post.id,
                user: {
                  name: `${post.user.firstName} ${post.user.lastName}`,
                  location: post.user.organization || "Independent Farmer",
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.firstName}`
                },
                date: new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' }),
                crop: post.crop,
                image: post.imageUrl || "/cassava_post_1.png",
                title: post.title,
                description: post.description,
                likes: post.likesCount,
                dislikes: post.dislikesCount,
                commentsCount: post.commentsCount,
                userLikeState: post.userLikeState as any
              }}
              onUpdate={refetch}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredPosts.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="size-10 text-muted-foreground opacity-50" />
          </div>
          <p className="text-muted-foreground font-bold text-lg">
            {search ? "No results found" : "No community posts yet"}
          </p>
          <p className="text-muted-foreground/60 text-sm max-w-xs mx-auto mt-1 mb-6">
            {search
              ? `We couldn't find any posts matching "${search}". Try a different keyword.`
              : "Sign in, then refresh. Demo farmer posts load automatically after login."}
          </p>
          {search && (
            <Button variant="outline" onClick={() => setSearch("")} className="rounded-full px-8 font-black border-2 transition-all active:scale-95">
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px] border-none shadow-2xl sm:rounded-[2.5rem] overflow-hidden p-0 dark:bg-card max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 pb-4 shrink-0">
            <DialogTitle className="text-3xl font-black tracking-tight">Ask Community</DialogTitle>
          </DialogHeader>

          <div className="p-8 pt-0 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
              <Input
                placeholder="Unusual spots on my leaves..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="h-14 border-border rounded-2xl bg-muted/20 focus:ring-4 focus:ring-primary/10 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
              <Textarea
                placeholder="Tell the community about what's happening..."
                value={newPost.description}
                onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                className="min-h-[150px] border-border rounded-2xl bg-muted/20 resize-none p-5 font-medium leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Photo Evidence</label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-3xl overflow-hidden aspect-video border-2 border-muted group transition-all">
                    <img src={imagePreview} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="Preview" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={() => { setImagePreview(null); setNewPost({ ...newPost, imageUrl: "" }); }}
                      className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-red-500 transition-all transform hover:rotate-90"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-4 border-dashed border-muted rounded-3xl bg-muted/5 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center space-y-3 text-muted-foreground group-hover:text-primary transition-all scale-100 group-hover:scale-110">
                      <div className="size-16 bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/10">
                        <Camera size={32} />
                      </div>
                      <span className="text-sm font-bold">Snap or Upload Photo</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/10 flex flex-col sm:flex-row gap-4 mt-0 shrink-0 border-t border-border/50">
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="flex-1 rounded-2xl h-14 font-bold text-muted-foreground hover:bg-muted/50">
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={createPostMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              {createPostMutation.isPending ? "Posting..." : "Share with Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
