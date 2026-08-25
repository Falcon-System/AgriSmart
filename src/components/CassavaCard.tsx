"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Share2, Globe, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { client } from "@/utils/orpc";
import { useMutation } from "@tanstack/react-query";

export interface CassavaPost {
    id: string;
    user: {
        name: string;
        location: string;
        avatar?: string;
    };
    date: string;
    crop: string;
    image: string;
    title: string;
    description: string;
    likes: number;
    dislikes: number;
    commentsCount: number;
    userLikeState?: "like" | "dislike" | null;
}

interface CassavaCardProps {
    post: CassavaPost;
    onUpdate?: () => void;
}

export function CassavaCard({ post, onUpdate }: CassavaCardProps) {
    const router = useRouter();

    const toggleLikeMutation = useMutation({
        mutationFn: (input: { postId: string; isLike: boolean }) => (client as any).community.toggleLike(input),
        onSuccess: () => {
            onUpdate?.();
        }
    });

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLikeMutation.mutate({ postId: post.id, isLike: true });
    };

    const handleDislike = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLikeMutation.mutate({ postId: post.id, isLike: false });
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.description,
                url: window.location.origin + `/dashboard/fields/${post.id}`
            }).catch(() => { });
        } else {
            alert("Sharing post: " + post.title);
        }
    };

    return (
        <Card
            className="overflow-hidden border border-border rounded-3xl shadow-sm transition hover:shadow-md cursor-pointer bg-card text-card-foreground"
            onClick={() => router.push(`/dashboard/fields/${post.id}`)}
        >
            <div className="relative aspect-video w-full overflow-hidden">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                />
            </div>

            <CardContent className="p-5 space-y-4">
                {/* User Info Header */}
                <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={post.user.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {post.user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-foreground text-sm md:text-base">{post.user.name}</span>
                                <span className="text-muted-foreground/60 text-xs">•</span>
                                <span className="text-muted-foreground text-xs font-medium">{post.user.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span>{post.date}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[#8B4513]">🌱</span>
                                    <span>{post.crop}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                {/* Post Content */}
                <div className="space-y-1.5">
                    <h3 className="font-bold text-foreground leading-tight line-clamp-2 md:text-lg">
                        {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {post.description}
                    </p>
                </div>

                {/* Answers Count */}
                <div className="flex items-center justify-end pt-1">
                    <span className="text-muted-foreground text-xs font-medium">
                        {post.commentsCount} {post.commentsCount === 1 ? 'answer' : 'answers'}
                    </span>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-border w-full" />

                {/* Action Buttons */}
                <div className="flex items-center gap-6 pt-1">
                    <button
                        onClick={handleLike}
                        disabled={toggleLikeMutation.isPending}
                        className={`flex items-center gap-2 group transition-all transform active:scale-95 ${post.userLikeState === 'like' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                        <ThumbsUp size={19} className={post.userLikeState === 'like' ? 'fill-primary' : 'group-hover:fill-primary/10'} />
                        <span className="text-sm font-semibold">{post.likes}</span>
                    </button>

                    <button
                        onClick={handleDislike}
                        disabled={toggleLikeMutation.isPending}
                        className={`flex items-center gap-2 group transition-all transform active:scale-95 ${post.userLikeState === 'dislike' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                    >
                        <ThumbsDown size={19} className={post.userLikeState === 'dislike' ? 'fill-destructive' : 'group-hover:fill-destructive/10'} />
                        <span className="text-sm font-semibold">{post.dislikes}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group ml-auto"
                    >
                        <Share2 size={19} className="group-hover:fill-primary/10" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
