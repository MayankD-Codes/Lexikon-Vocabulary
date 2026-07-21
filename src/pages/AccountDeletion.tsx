import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const BUSINESS = "Lexikon";
const CONTACT = "mr.lonsdaleite@outlook.com";

const AccountDeletion = () => (
  <main className="container max-w-3xl py-10 prose prose-neutral dark:prose-invert">
    <SEO
      title="Delete Your Account — Lexikon"
      description="How to delete your Lexikon account and all associated data."
    />
    <h1>Delete Your {BUSINESS} Account</h1>
    <p>
      You can delete your Lexikon account and all associated personal data at any
      time — whether or not you still have the app installed.
    </p>

    <h2>Option 1: Delete in-app (fastest)</h2>
    <p>
      Open Lexikon → go to <strong>Profile</strong> → scroll to{" "}
      <strong>Danger zone</strong> → tap <strong>Delete account</strong> → confirm.
      Your account and data are deleted immediately and cannot be recovered.
    </p>

    <h2>Option 2: Request deletion by email</h2>
    <p>
      If you no longer have the app installed, email{" "}
      <a href={`mailto:${CONTACT}?subject=Delete%20my%20Lexikon%20account`}>{CONTACT}</a>{" "}
      from the address associated with your account (or include your username). We will
      delete your account within <strong>30 days</strong> and reply to confirm.
    </p>

    <h2>What gets deleted</h2>
    <ul>
      <li>Your account, username, display name, avatar</li>
      <li>All saved vocabulary words and personal notes</li>
      <li>Quiz history, statistics, and Memory Palace data</li>
      <li>Community messages you posted</li>
      <li>Subscription records (payment history retained only where legally required)</li>
    </ul>

    <h2>What may be retained</h2>
    <ul>
      <li>Anonymised, aggregated usage statistics that cannot identify you</li>
      <li>Transaction/tax records required by law (typically up to 7 years in India)</li>
    </ul>

    <p className="text-sm text-muted-foreground mt-8">
      <Link to="/privacy">Privacy Policy</Link> ·{" "}
      <Link to="/terms">Terms of Service</Link>
    </p>
  </main>
);

export default AccountDeletion;
