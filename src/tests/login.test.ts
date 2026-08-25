
import { POST } from "@/app/api/auth/login/route";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("POST /api/auth/login", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 404 if user does not exist", async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({
        username: "testuser",
        password: "password",
      }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("User with this username does not exist");
  });

  it("should return 401 if password is invalid", async () => {
    const hashedPassword = await hash("password", 10);
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      username: "testuser",
      password: hashedPassword,
    });
    (compare as jest.Mock).mockResolvedValue(false);

    const req = {
      json: async () => ({
        username: "testuser",
        password: "wrongpassword",
      }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Invalid password");
  });

  it("should return 200 and a token on successful login", async () => {
    const hashedPassword = await hash("password", 10);
    const user = {
      id: "1",
      username: "testuser",
      password: hashedPassword,
    };
    (db.user.findUnique as jest.Mock).mockResolvedValue(user);
    (compare as jest.Mock).mockResolvedValue(true);
    (sign as jest.Mock).mockReturnValue("test-token");

    const req = {
      json: async () => ({
        username: "testuser",
        password: "password",
      }),
    } as Request;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Login successful");
    expect(data.user.username).toBe("testuser");
    expect(response.cookies.get("token")?.value).toBe("test-token");
  });
});
