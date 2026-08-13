-- Full residential addresses are private. Existing profiles remain valid and
-- are prompted to add the address the next time they edit their profile.
ALTER TABLE "Profile" ADD COLUMN "streetAddress" TEXT;
