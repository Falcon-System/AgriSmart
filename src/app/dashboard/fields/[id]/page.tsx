"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, ThumbsUp, ThumbsDown, Share2, Globe, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { orpc, client } from "@/utils/orpc";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params) as any;
    const router = useRouter();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState("");

    const postId = resolvedParams?.id || resolvedParams?.params?.id;

    const postQuery = useQuery({
        queryKey: orpc.community.get.queryKey({ id: postId }),
        queryFn: () => {
            console.log("Fetching post with ID:", postId);
            return client.community.get({ id: postId });
        },
        enabled: !!postId
    });

    const post = postQuery.data;
    const isLoading = postQuery.isLoading;
    const error = postQuery.error;
    const refetch = () => postQuery.refetch();

    const toggleLikeMutation = useMutation({
        mutationFn: (input: { postId: string; isLike: boolean }) => (client as any).community.toggleLike(input),
        onSuccess: () => refetch()
    });

    const addCommentMutation = useMutation({
        mutationFn: (input: { postId: string; text: string }) => (client as any).community.addComment(input),
        onSuccess: () => {
            toast.success("Comment posted!");
            setCommentText("");
            refetch();
        }
    });

    if (isLoading) {
        return <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
            <div className="h-10 w-32 bg-muted animate-pulse rounded-full" />
            <div className="h-[300px] md:h-[450px] w-full bg-muted animate-pulse rounded-[2.5rem]" />
            <div className="space-y-4">
                <div className="h-10 w-3/4 bg-muted animate-pulse rounded-xl" />
                <div className="h-24 w-full bg-muted animate-pulse rounded-xl" />
            </div>
        </div>;
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4 text-center">
                <div className="size-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                    <AlertTriangle size={48} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Post not found</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto font-medium">The post you're looking for might have been removed or doesn't exist.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/fields')} className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                    <ArrowLeft className="mr-2 size-5" />
                    Back to Community
                </Button>
            </div>
        );
    }

    const handlePostComment = () => {
        if (!commentText.trim()) return;
        addCommentMutation.mutate({ postId: post.id, text: commentText });
    };

    const handleLike = () => toggleLikeMutation.mutate({ postId: post.id, isLike: true });
    const handleDislike = () => toggleLikeMutation.mutate({ postId: post.id, isLike: false });

    return (
        <div className="max-w-4xl mx-auto pb-20 px-0 sm:px-4 md:px-6">
            {/* Back Header - Sticky with glass effect */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-4 mb-2 flex items-center gap-3 px-4 sm:px-0 border-b sm:border-none border-border/50">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-muted/50 sm:bg-transparent">
                    <ArrowLeft className="size-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-black text-foreground truncate">{post.title}</h1>
                </div>
            </div>

            <div className="bg-card text-card-foreground sm:rounded-[2.5rem] overflow-hidden border-x-0 sm:border border-border shadow-sm">
                {/* Main Image - Higher aspect ratio on mobile */}
                <div className="relative aspect-[4/3] sm:aspect-video w-full bg-muted">
                    {post.imageUrl ? (
                        <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                            <ImageIcon className="size-12 opacity-20 mb-2" />
                            <span className="font-medium">No image provided</span>
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    {/* User & Meta - Better mobile stack */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/10">
                                <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                                    {post.user.firstName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <h3 className="font-black text-foreground text-lg leading-tight truncate">
                                        {post.user.firstName} {post.user.lastName}
                                    </h3>
                                    <span className="hidden xs:inline text-muted-foreground/30">•</span>
                                    <span className="text-primary font-bold text-sm truncate uppercase tracking-tight">
                                        {post.user.organization || "Private Farmer"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                                    <Clock className="size-3.5" />
                                    <span>{new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span>•</span>
                                    <span className="text-primary font-bold flex items-center gap-1">
                                        🌱 {post.crop}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:block">
                            <Button variant="outline" size="icon" className="rounded-full hover:bg-primary/5 border-border">
                                <Share2 className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Text Content */}
                    <div className="space-y-4 text-left">
                        <h2 className="text-2xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
                            {post.title}
                        </h2>
                        <p className="text-muted-foreground text-base sm:text-xl leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                            {post.description}
                        </p>
                    </div>

                    {/* Social Stats & Actions */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleLike}
                                    disabled={toggleLikeMutation.isPending}
                                    className={`p-3 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-bold ${post.userLikeState === 'like' ? 'bg-primary/10 text-primary' : 'bg-muted/50 hover:bg-primary/5 text-muted-foreground hover:text-primary'}`}
                                >
                                    <ThumbsUp className={`size-5 ${post.userLikeState === 'like' ? 'fill-primary' : ''}`} />
                                    <span className="text-sm">{post.likesCount}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDislike}
                                    disabled={toggleLikeMutation.isPending}
                                    className={`p-3 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-bold ${post.userLikeState === 'dislike' ? 'bg-destructive/20 text-destructive' : 'bg-muted/50 hover:bg-destructive/5 text-muted-foreground hover:text-destructive'}`}
                                >
                                    <ThumbsDown className={`size-5 ${post.userLikeState === 'dislike' ? 'fill-destructive' : ''}`} />
                                    <span className="text-sm">{post.dislikesCount}</span>
                                </button>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full sm:hidden">
                            <Share2 className="size-5" />
                        </Button>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Comments Section */}
                    <div className="space-y-10 pt-4">
                        <div className="flex items-center justify-between text-left">
                            <h4 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-3">
                                <MessageSquare className="size-6 text-primary" />
                                Community Answers
                                <span className="bg-primary/10 text-primary text-sm font-black py-1 px-3 rounded-full">
                                    {(post.comments as any).length}
                                </span>
                            </h4>
                        </div>

                        {/* Post Comment Input */}
                        <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 p-4 sm:p-6 rounded-[2rem] border border-border/50 text-left">
                            <Avatar className="h-10 w-10 shrink-0 hidden sm:block">
                                <AvatarFallback className="bg-primary/10 text-primary font-black">ME</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                                <Textarea
                                    placeholder="Share your expertise or ask a follow-up..."
                                    className="min-h-[120px] border-none bg-transparent focus-visible:ring-0 transition-all resize-none p-0 text-base sm:text-lg font-medium placeholder:text-muted-foreground/50"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest hidden sm:block">Be helpful & respectful</span>
                                    <Button
                                        onClick={handlePostComment}
                                        disabled={!commentText.trim() || addCommentMutation.isPending}
                                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 rounded-2xl px-8 h-12 font-black shadow-lg shadow-primary/20 gap-2"
                                    >
                                        {addCommentMutation.isPending ? "Posting..." : "Post Answer"}
                                        <Send className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-8 text-left">
                            {(post.comments as any).map((comment: any) => (
                                <div key={comment.id} className="flex gap-3 sm:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 shadow-sm">
                                        <AvatarFallback className="bg-muted text-muted-foreground font-black text-base">
                                            {comment.user.firstName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-muted/40 group-hover:bg-muted/60 transition-all p-5 sm:p-6 rounded-[1.8rem] rounded-tl-none border border-transparent group-hover:border-border/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-foreground text-sm sm:text-base">
                                                    {comment.user.firstName} {comment.user.lastName}
                                                </span>
                                                <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-tight">
                                                    {new Date(comment.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base font-medium opacity-90">{comment.text}</p>
                                        </div>
                                        <div className="flex items-center gap-6 mt-3 ml-2">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Helpful</button>
                                            <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Reply</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ImageIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
}
