-- AddForeignKey
ALTER TABLE "Webhook" ADD FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
