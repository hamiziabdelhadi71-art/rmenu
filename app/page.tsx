import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  BarChart3,
  Bell,
  Smartphone,
  Clock,
  CreditCard,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FoodFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-1 flex-col items-center justify-center gap-8 py-24 text-center md:py-32">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your Restaurant,{" "}
            <span className="text-primary">Online in Minutes</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Create your digital menu, accept online orders, and manage
            everything from a single dashboard. No technical skills required.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="min-w-[200px]">
              Start Free Trial
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="min-w-[200px]">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Go Digital
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for local food businesses
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Utensils className="h-8 w-8" />}
              title="Easy Menu Builder"
              description="Create and customize your menu with categories, items, modifiers, and beautiful images. Update prices instantly."
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Real-time Orders"
              description="Receive instant notifications for new orders. Manage order status from confirmed to delivered."
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8" />}
              title="Mobile-First Design"
              description="Your customers get a fast, beautiful ordering experience on any device. No app download needed."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8" />}
              title="Business Hours"
              description="Set your operating hours and delivery zones. Automatically stop orders when you're closed."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Order Management"
              description="Track all orders in one place. View history, filter by status, and manage your workflow efficiently."
            />
            <FeatureCard
              icon={<CreditCard className="h-8 w-8" />}
              title="Cash on Delivery"
              description="Start accepting orders immediately with cash on delivery. Online payments coming soon."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Grow Your Business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join restaurants already using FoodFlow to reach more customers and
            streamline their operations.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">Create Your Store</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            <span className="font-semibold">FoodFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FoodFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
