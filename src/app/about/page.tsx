import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Why Frame separates enjoyment, execution, and the standard behind a review.",
};

export default function AboutPage() {
  return (
    <main className="page shell">
      <p className="kicker">About</p>
      <h1 className="display">A review should show the judgment, not only the conclusion.</h1>
      <div className="prose" style={{ marginTop: "1.5rem" }}>
        <p>
          One person can say a game is buggy, awkward, and badly taught, and still have been moved by it. Another can praise the music and the story and not want to play it again. Conventional scores often file both under a recommendation.
        </p>
        <p>
          Frame asks a shorter set of questions. What were you primarily evaluating? Did the work’s circumstances change your standards? Did you enjoy it? Did you think it was well executed? How much of it did you experience? Then: what worked, and what did not?
        </p>
        <p>
          Enjoyment is not quality. Execution is not the same thing as technical polish. A contextual standard is not automatically more generous or more legitimate. The site records the choice and leaves the weight of it to the reader.
        </p>
        <p>
          The Review Landscape is calculated from published evaluations. It keeps the distribution and the sample size. Fifty-fifty is not the same evidence as a room full of mixed judgments, even when a single average could make them look alike.
        </p>
        <p>
          The catalog starts small. An empty page for every game ever shipped would not explain the product. These works are here because the evaluations on them disagree in ways a single score hides.
        </p>
      </div>
    </main>
  );
}
