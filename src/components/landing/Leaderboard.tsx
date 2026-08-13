import Container from "@/components/common/Container";
import Section from "@/components/common/Section";
import SectionHeading from "@/components/common/SectionHeading";
import LeaderboardCard from "@/components/cards/LeaderboardCard";
import { leaderboard } from "@/lib/leaderboard";

export default function Leaderboard() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title="Global Leaderboard"
          subtitle="See who's dominating the arena this week."
        />

        <div className="space-y-5">
          {leaderboard.map((player) => (
            <LeaderboardCard
              key={player.rank}
              {...player}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}