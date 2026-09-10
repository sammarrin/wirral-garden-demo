import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Shovel,
  Fence,
  Sprout,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="landing">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="green-dot" /> LOCAL LANDSCAPING · WIRRAL
            </div>
            <h1>
              A little more life.
              <br />A lot more <em>garden.</em>
            </h1>
            <p>
              From a fresh patch of lawn to a whole new outdoor space.
              Thoughtful landscaping for the place you call home.
            </p>
            <Link href="/quote" className="button">
              Tell us about your garden <ArrowUpRight size={19} />
            </Link>
            <div className="hero-promises">
              <span>
                <Check size={16} /> No-obligation quotes
              </span>
              <span>
                <Check size={16} /> Projects big & small
              </span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/garden.jpg"
              alt="A thoughtfully landscaped garden with paving, planting and an outdoor seating area"
            />
            <div className="image-caption">
              <MapPin size={18} />
              <span>
                Made for everyday living.
                <small>Your garden, with a little more possibility.</small>
              </span>
            </div>
          </div>
        </section>
        <section className="services">
          <div>
            <div className="eyebrow">ROOM TO GROW</div>
            <h2>
              Good gardens start
              <br />
              with a conversation.
            </h2>
          </div>
          <div className="service">
            <Shovel />
            <h3>Landscaping & patios</h3>
            <p>
              Practical spaces for quiet mornings, family time and everything in
              between.
            </p>
          </div>
          <div className="service">
            <Sprout />
            <h3>Lawns & maintenance</h3>
            <p>
              Fresh turf, tidy borders and a helping hand to keep your garden
              looking its best.
            </p>
          </div>
          <div className="service">
            <Fence />
            <h3>Fencing & finishing touches</h3>
            <p>
              A little privacy, a new gate or the final detail that brings it
              all together.
            </p>
          </div>
        </section>
        <section className="local-strip">
          <MapPin />
          <p>
            Based around the Wirral. Working with gardens in West Kirby,
            Heswall, Hoylake, Bebington and beyond.
          </p>
          <Link href="/quote">
            Let’s talk <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
      <footer className="public-footer">
        <span>© {new Date().getFullYear()} Wirral Garden Co.</span>
        <span>Thoughtful gardens. Locally grown.</span>
      </footer>
    </>
  );
}
