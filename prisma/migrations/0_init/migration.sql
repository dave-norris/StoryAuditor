-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT
);
