CREATE TYPE "DimensionFamily" AS ENUM ('WORK', 'ENJOYMENT');

ALTER TABLE "Dimension" ADD COLUMN "family" "DimensionFamily" NOT NULL DEFAULT 'WORK';

INSERT INTO "Dimension" ("id", "slug", "name", "description", "sortOrder", "appliesTo", "family")
VALUES
  ('enjoyment-engagement', 'engagement', 'Engagement', 'Did it hold your attention?', 1, ARRAY['GAME', 'MOVIE']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-fun', 'fun', 'Fun', 'Was the moment-to-moment experience enjoyable?', 2, ARRAY['GAME']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-pacing', 'pacing', 'Pacing', 'Did the moment-to-moment flow feel good to sit inside?', 2, ARRAY['MOVIE']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-immersion', 'immersion', 'Immersion', 'Did you feel inside the work?', 3, ARRAY['GAME', 'MOVIE']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-investment', 'investment', 'Investment', 'Did you care about the people, and about what happened to them?', 4, ARRAY['MOVIE']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-emotional-impact', 'emotional-impact', 'Emotional impact', 'Did it make you feel something that mattered to you?', 5, ARRAY['GAME', 'MOVIE']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-replay-appeal', 'replay-appeal', 'Replay Value', 'Would you want to experience it again?', 6, ARRAY['GAME']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-resonance', 'resonance', 'Resonance', 'After it ended, did the experience linger or feel complete?', 6, ARRAY['MOVIE']::"WorkType"[], 'ENJOYMENT'),
  ('enjoyment-satisfaction', 'satisfaction', 'Satisfaction', 'Did the experience feel rewarding or worthwhile?', 7, ARRAY['GAME']::"WorkType"[], 'ENJOYMENT')
ON CONFLICT ("slug") DO NOTHING;
