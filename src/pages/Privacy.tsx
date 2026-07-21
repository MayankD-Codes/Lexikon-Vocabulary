import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const BUSINESS = "Lexikon";
const LOCATION = "Mumbai, Maharashtra, India";
const CONTACT = "mr.lonsdaleite@outlook.com";
const EFFECTIVE = "21 July 2026";

const Privacy = () => (
  <main className="container max-w-3xl py-10 prose prose-neutral dark:prose-invert">
    <SEO
      title="Privacy Policy — Lexikon"
      description="How Lexikon collects, uses, and protects your data."
    />
    <h1>Privacy Policy</h1>
    <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}</p>

    <p>
      This Privacy Policy explains how <strong>{BUSINESS}</strong> ("the App", "we", "us")
      collects, uses, and protects information when you use our vocabulary-learning
      application, available on the web and via the Google Play Store.
    </p>
    <p>
      Lexikon is operated by {BUSINESS}, based in {LOCATION}. Contact us at{" "}
      <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
    </p>

    <h2>1. Information We Collect</h2>
    <h3>1.1 Account Information</h3>
    <ul>
      <li>Username and (optionally) full display name you provide at sign-up</li>
      <li>Securely hashed password (we never see or store plaintext passwords)</li>
      <li>If you sign in with Google: your name, email, and profile picture provided by Google</li>
      <li>Optional avatar photo you upload</li>
    </ul>

    <h3>1.2 Content You Create</h3>
    <ul>
      <li>Vocabulary entries: words, definitions, pronunciations, examples, synonyms/antonyms, personal notes</li>
      <li>Quiz activity: dates, scores, per-word performance (for adaptive difficulty)</li>
      <li>Memory Palace placements and imagery prompts</li>
      <li>Community wall messages (public to other signed-in users)</li>
    </ul>

    <h3>1.3 Camera & Photos (Capture Word)</h3>
    <p>
      Capture Word uses your device camera or gallery to extract text from an image.
      Images are sent to our secure servers and to Google's Gemini API for text
      recognition, and are <strong>not stored</strong> after processing. Only the
      selected text words you confirm are saved to your dictionary.
    </p>

    <h3>1.4 Technical Data</h3>
    <ul>
      <li>Basic device/browser info and IP address for security & abuse prevention</li>
      <li>Authentication tokens (session cookies / secure storage)</li>
    </ul>

    <h2>2. How We Use Your Data</h2>
    <ul>
      <li>Provide, personalise, and improve Lexikon features</li>
      <li>Generate AI definitions, explanations, and imagery via Google Gemini</li>
      <li>Enforce free/Pro plan limits and prevent abuse</li>
      <li>Communicate service-related updates</li>
    </ul>

    <h2>3. Third-Party Services (Subprocessors)</h2>
    <table>
      <thead>
        <tr><th>Service</th><th>Purpose</th><th>Data shared</th></tr>
      </thead>
      <tbody>
        <tr><td>Supabase (Lovable Cloud)</td><td>Database, auth, storage</td><td>Account & content data</td></tr>
        <tr><td>Google Gemini API</td><td>AI word explanations, OCR, Memory Palace imagery</td><td>Word text, images (transient)</td></tr>
        <tr><td>Google Sign-In</td><td>Authentication</td><td>Name, email, profile picture</td></tr>
        <tr><td>Instamojo (web only)</td><td>Payment processing for Pro plan</td><td>Payment info handled by Instamojo</td></tr>
        <tr><td>Google Play Billing (Android)</td><td>In-app purchases on Android</td><td>Handled by Google Play</td></tr>
      </tbody>
    </table>

    <h2>4. Data Retention & Deletion</h2>
    <p>
      We retain your data while your account is active. You may delete your account and
      all associated personal data at any time from{" "}
      <strong>Profile → Delete Account</strong> or by visiting our{" "}
      <Link to="/account-deletion">Account Deletion</Link> page. Deletion is
      immediate and irreversible.
    </p>

    <h2>5. Security</h2>
    <p>
      Data is transmitted over HTTPS. Passwords are hashed. Access to your data is
      protected by row-level security policies in our database. No system is 100%
      secure — please use a strong, unique password.
    </p>

    <h2>6. Children</h2>
    <p>
      Lexikon is not directed at children under 13 (or the minimum digital consent age
      in your country). If we learn we've collected data from a child under that age
      without parental consent, we will delete it.
    </p>

    <h2>7. Your Rights</h2>
    <p>
      You may access, correct, export, or delete your data at any time via the app or
      by emailing <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. If you're in the EU/UK,
      you have rights under GDPR; in India, rights under the DPDP Act 2023.
    </p>

    <h2>8. Changes</h2>
    <p>
      We may update this policy. Material changes will be posted in-app or by email.
      Continued use after changes constitutes acceptance.
    </p>

    <h2>9. Contact</h2>
    <p>
      Questions? Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
    </p>

    <p className="text-sm text-muted-foreground mt-8">
      <Link to="/terms">Terms of Service</Link> ·{" "}
      <Link to="/account-deletion">Account Deletion</Link>
    </p>
  </main>
);

export default Privacy;
