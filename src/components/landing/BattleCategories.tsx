import Container from "@/components/common/Container";
import Section from "@/components/common/Section";
import SectionHeading from "@/components/common/SectionHeading";
import CategoryCard from "@/components/cards/CategoryCard";
import { categories } from "@/lib/categories";

export default function BattleCategories() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title="Choose Your Battle"
          subtitle="Select your favorite category and compete with players worldwide."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}