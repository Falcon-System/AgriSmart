"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, LogOut, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { orpc, client } from "@/utils/orpc";
import { useState } from "react";

export default function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: user, isLoading } = useQuery(orpc.me.queryOptions());

  // Fallback to guest if no user
  const displayUser = {
    name: user?.name || "Guest",
    email: user?.email || "guest@example.com",
    organization: user?.organization || "No Organization",
    initial: (user?.name || "G").charAt(0).toUpperCase(),
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-[5px] hover:bg-muted transition-colors outline-none cursor-pointer"
      >
        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
          {isLoading ? <Loader2 className="size-3 animate-spin" /> : displayUser.initial}
        </div>
        <span>{isLoading ? "Loading..." : displayUser.name}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={displayUser.name}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={displayUser.email}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={displayUser.organization}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>
          </div>

        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
            toast.success("Signed out");
          }}>
            <LogOut className="mr-2 size-4" />
            Sign Out
          </Button>
          <DialogClose render={<Button type="button" variant="secondary">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
