-- SQL Script to set up Supabase (PostgreSQL) tables matching the Prisma schema

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "username" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT UNIQUE NOT NULL,
    "organization" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create CommunityPost table
CREATE TABLE IF NOT EXISTS "CommunityPost" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "crop" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Comment table
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT PRIMARY KEY,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "postId" TEXT NOT NULL REFERENCES "CommunityPost"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Like table
CREATE TABLE IF NOT EXISTS "Like" (
    "id" TEXT PRIMARY KEY,
    "isLike" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "postId" TEXT NOT NULL REFERENCES "CommunityPost"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "postId")
);

-- Create Scan table
CREATE TABLE IF NOT EXISTS "Scan" (
    "id" TEXT PRIMARY KEY,
    "disease" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "treatment" TEXT,
    "prevention" TEXT,
    "fieldId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Field table
CREATE TABLE IF NOT EXISTS "Field" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- Create Farm table
CREATE TABLE IF NOT EXISTS "Farm" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Disease table
CREATE TABLE IF NOT EXISTS "Disease" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL
);
