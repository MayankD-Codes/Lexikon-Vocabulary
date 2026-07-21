import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const BUSINESS = "Lexikon";
const LOCATION = "Mumbai, Maharashtra, India";
const CONTACT = "mr.lonsdaleite@outlook.com";
const EFFECTIVE = "21 July 2026";

const Terms = () => (
  <main className="container max-w-3xl py-10 prose prose-neutral dark:prose-invert">
    <SEO
      title="Terms of Service — Lexikon"
      description="Terms and conditions governing your use of Lexikon."
    />
    <h1>Terms of Service</h1>
    <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE}</p>

    <p>
      These Terms of Service ("Terms") govern your use of {BUSINESS} (the "App"),
      operated from {LOCATION}. By creating an account or using the App, you agree
      to these Terms.
    </p>

    <h2>1. Eligibility</h2>
    <p>You must be at least 13 years old (or the minimum digital consent age in your country) to use Lexikon.</p>

    <h2>2. Your Account</h2>
    <ul>
      <li>You're responsible for keeping your credentials secure and for all activity under your account.</li>
      <li>Provide accurate information when registering.</li>
      <li>You may delete your account at any time via <Link to="/account-deletion">Account Deletion</Link>.</li>
      <li>We may suspend accounts that violate these Terms or abuse the service.</li>
    </ul>

    <h2>3. The Service</h2>
    <p>
      Lexikon lets you save vocabulary words, receive AI-generated definitions and
      explanations, take quizzes, build a "Memory Palace," chat with Lexi, participate
      in a community wall, and appear on a leaderboard.
    </p>

    <h3>3.1 AI-Generated Content</h3>
    <p>
      Definitions, explanations, quiz content, and Memory Palace imagery are generated
      using Google Gemini. AI-generated content may occasionally be incorrect,
      incomplete, or inappropriate. Verify critical information independently.
    </p>

    <h3>3.2 Free and Pro Plans</h3>
    <table>
      <thead><tr><th>Plan</th><th>Limits</th></tr></thead>
      <tbody>
        <tr><td>Free</td><td>Up to 2,000 saved words. Core learning features.</td></tr>
        <tr><td>Pro</td><td>Unlimited saved words, unlimited imports, Capture Word, Memory Palace imagery, Ask Lexi.</td></tr>
      </tbody>
    </table>
    <p>
      Pro on the web is billed via Instamojo as fixed-duration access (30/90/365 days).
      Pro on the Android app is billed via Google Play Billing. Refunds are handled per
      the applicable store's policy (Google Play refund policy for Android purchases).
    </p>

    <h2>4. Acceptable Use</h2>
    <ul>
      <li>No unlawful, harassing, hateful, sexual, or violent content on the community wall.</li>
      <li>No spam, scraping, or automated abuse of the AI features.</li>
      <li>No attempt to bypass plan limits or reverse-engineer the service.</li>
    </ul>

    <h2>5. Your Content</h2>
    <p>
      You retain ownership of vocabulary entries, notes, and community posts you create.
      You grant us a limited license to store, display, and process this content solely
      to operate the service.
    </p>

    <h2>6. Termination</h2>
    <p>
      You may stop using Lexikon at any time. We may suspend or terminate accounts that
      violate these Terms. Upon termination, your data is deleted per our{" "}
      <Link to="/privacy">Privacy Policy</Link>.
    </p>

    <h2>7. Disclaimers</h2>
    <p>
      The App is provided "as is" without warranties. We do not guarantee accuracy of
      AI-generated content, uninterrupted availability, or fitness for a particular
      purpose.
    </p>

    <h2>8. Limitation of Liability</h2>
    <p>
      To the fullest extent permitted by law, {BUSINESS} will not be liable for
      indirect, incidental, special, or consequential damages arising from your use of
      the App.
    </p>

    <h2>9. Governing Law</h2>
    <p>
      These Terms are governed by the laws of India. Disputes are subject to the
      exclusive jurisdiction of the courts of Mumbai, Maharashtra.
    </p>

    <h2>10. Changes</h2>
    <p>We may update these Terms; continued use constitutes acceptance.</p>

    <h2>11. Contact</h2>
    <p>Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>

    <p className="text-sm text-muted-foreground mt-8">
      <Link to="/privacy">Privacy Policy</Link> ·{" "}
      <Link to="/account-deletion">Account Deletion</Link>
    </p>
  </main>
);

export default Terms;
