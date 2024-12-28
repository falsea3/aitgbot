-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_ai_model_id_fkey";

-- DropIndex
DROP INDEX "users_ai_model_id_key";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ai_model_id_fkey" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
