import { HeroRosterTile } from "../../components/hero-roster-tile";
import { getHeroEntries } from "../../lib/hero-entries";
import { loadAllContent } from "../../lib/loaders";

export const metadata = {
  title: "Heroes | Counterlock",
  description: "Browse every hero in the Counterlock registry.",
};

export default function HeroesPage() {
  const content = loadAllContent();

  return (
    <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-text">
          Heroes
        </h1>
        <p className="mt-2 text-text-secondary">
          Every tracked hero, including those whose counterplay is still being
          curated.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {content.heroes.map((hero) => {
          const asset = content.assets[hero.slug];
          return (
            <HeroRosterTile
              key={hero.slug}
              href={`/heroes/${hero.slug}`}
              name={hero.name}
              entryCount={getHeroEntries(content.entries, hero).length}
              imagePath={asset?.imagePath}
              imageWebpPath={asset?.imageWebpPath}
            />
          );
        })}
      </div>
    </main>
  );
}
