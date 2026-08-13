import Container from "@/components/common/Container";
import Section from "@/components/common/Section";
import SectionHeading from "@/components/common/SectionHeading";
import FeatureCard from "@/components/cards/FeatureCard";
import { features } from "@/lib/features";

export default function Features() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title="Why Choose SkillBattle?"
          subtitle="Everything you need to prepare for placements while enjoying the learning journey."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}