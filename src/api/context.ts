import { db } from "@/lib/db";
import { type NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  organization: string | null;
}

export type Context = {
    db: typeof db;
    user?: User;
};

export const createContext = async (req: NextRequest): Promise<Context> => {
    let user: User | undefined;
    
    try {
        const token = req.cookies.get("token")?.value || "";
        
        if (token && process.env.JWT_SECRET) {
            const decoded = verify(token, process.env.JWT_SECRET) as { userId: string };
            if (typeof decoded === "object" && decoded.userId) {
                const { data: foundUser, error } = await db
                    .from("User")
                    .select("*")
                    .eq("id", decoded.userId)
                    .single();

                if (foundUser && !error) {
                    const { password, createdAt, updatedAt, ...userData } = foundUser;
                    user = userData as User;
                }
            }
        }
    } catch (error) {
        // Token invalid or expired, user remains undefined
    }
    
    return {
        db,
        user,
    };
};
