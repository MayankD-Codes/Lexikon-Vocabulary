import { useState } from "react";
import { Phone, Lock, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/friendlyError";
import PasswordStrength, { passesAllChecks } from "@/components/PasswordStrength";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Common country dial codes. Extend as needed.
const COUNTRIES: { code: string; label: string; dial: string }[] = [
  { code: "IN", label: "🇮🇳 India", dial: "+91" },
  { code: "US", label: "🇺🇸 United States", dial: "+1" },
  { code: "GB", label: "🇬🇧 United Kingdom", dial: "+44" },
  { code: "CA", label: "🇨🇦 Canada", dial: "+1" },
  { code: "AU", label: "🇦🇺 Australia", dial: "+61" },
  { code: "AE", label: "🇦🇪 UAE", dial: "+971" },
  { code: "SG", label: "🇸🇬 Singapore", dial: "+65" },
  { code: "DE", label: "🇩🇪 Germany", dial: "+49" },
  { code: "FR", label: "🇫🇷 France", dial: "+33" },
  { code: "BR", label: "🇧🇷 Brazil", dial: "+55" },
  { code: "JP", label: "🇯🇵 Japan", dial: "+81" },
  { code: "NG", label: "🇳🇬 Nigeria", dial: "+234" },
  { code: "ZA", label: "🇿🇦 South Africa", dial: "+27" },
];

function toE164(dial: string, local: string): string | null {
  const digits = local.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return null;
  return `${dial}${digits}`;
}

type Props = { mode: "signin" | "signup" };

const PhoneAuth = ({ mode }: Props) => {
  const [dial, setDial] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [passwordRejected, setPasswordRejected] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164(dial, phone);
    if (!e164) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && !passesAllChecks(password)) {
      toast.error("Please meet all password requirements below.");
      return;
    }

    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ phone: e164, password });
      if (error) {
        const lower = (error.message || "").toLowerCase();
        if (lower.includes("weak") || lower.includes("pwned") || lower.includes("breach")) {
          setPasswordRejected(true);
        }
        toast.error(friendlyAuthError(error));
      } else {
        setPendingPhone(e164);
        setStage("otp");
        toast.success(`We sent a code to ${e164}`);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ phone: e164, password });
      if (error) {
        const lower = (error.message || "").toLowerCase();
        if (lower.includes("not confirmed") || lower.includes("verify")) {
          // Fall back to sending an OTP so the user can finish verification.
          const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: e164 });
          if (otpErr) {
            toast.error(friendlyAuthError(otpErr));
          } else {
            setPendingPhone(e164);
            setStage("otp");
            toast.message("Phone not verified yet — we sent a verification code.");
          }
        } else {
          toast.error(friendlyAuthError(error));
        }
      } else {
        toast.success("Signed in");
      }
    }
    setBusy(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPhone || otp.length !== 6) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: otp,
      type: "sms",
    });
    if (error) toast.error(friendlyAuthError(error));
    else toast.success("Phone verified — welcome!");
    setBusy(false);
  };

  const handleResend = async () => {
    if (!pendingPhone) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: pendingPhone });
    if (error) toast.error(friendlyAuthError(error));
    else toast.success("Code resent");
    setBusy(false);
  };

  if (stage === "otp") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{pendingPhone}</span>
        </div>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" className="w-full h-11" disabled={busy || otp.length !== 6}>
          <KeyRound className="h-4 w-4" />
          {busy ? "Verifying…" : "Verify & continue"}
        </Button>
        <div className="flex justify-between text-xs text-muted-foreground">
          <button type="button" onClick={() => { setStage("form"); setOtp(""); }} className="hover:text-foreground">
            ← Change number
          </button>
          <button type="button" onClick={handleResend} disabled={busy} className="hover:text-foreground disabled:opacity-50">
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <div className="flex gap-2">
          <Select value={dial} onValueChange={setDial}>
            <SelectTrigger className="w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code + c.dial} value={c.dial}>
                  <span className="text-xs">{c.label} {c.dial}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="9876543210"
              className="pl-9"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="phone-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone-password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="At least 8 characters"
            className="pl-9 pr-10"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordRejected) setPasswordRejected(false);
            }}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === "signup" && (
          <PasswordStrength password={password} serverRejected={passwordRejected} />
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={busy}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Send verification code"}
        <ArrowRight className="h-4 w-4" />
      </Button>
      {mode === "signup" && (
        <p className="text-[11px] text-muted-foreground text-center">
          We'll send a 6-digit code to your phone to verify it.
        </p>
      )}
    </form>
  );
};

export default PhoneAuth;
