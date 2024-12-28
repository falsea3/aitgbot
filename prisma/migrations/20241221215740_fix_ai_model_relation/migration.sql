-- DropForeignKey
ALTER TABLE "ai_models" DROP CONSTRAINT "ai_models_id_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ai_model_id_fkey" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
