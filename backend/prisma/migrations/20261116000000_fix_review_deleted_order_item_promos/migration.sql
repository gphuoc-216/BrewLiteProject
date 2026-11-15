-- AlterEnum
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'DELETED';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sugarLevel" TEXT DEFAULT '100%';
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "iceLevel" TEXT DEFAULT '100%';
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "toppings" JSONB;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "secondaryPromotionId" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_secondaryPromotionId_fkey'
  ) THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_secondaryPromotionId_fkey"
      FOREIGN KEY ("secondaryPromotionId") REFERENCES "promotions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
