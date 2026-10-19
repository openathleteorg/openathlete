-- Accepted or refused coach invitations kept their link's token, and the
-- link kept working. The API now refuses them; this clears the tokens left
-- in the database so no spent link remains usable in any version.
UPDATE "coach_invitation" SET "token" = NULL WHERE "status" <> 'PENDING';
