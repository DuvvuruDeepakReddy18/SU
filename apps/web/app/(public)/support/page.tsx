import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, Mail, MessageSquare, LifeBuoy } from 'lucide-react';

export const metadata = { title: 'SkillVerify · Support' };

// Helpline placeholders — fill these in once a dedicated number is provisioned
// and the support inbox is set up. Leaving them blank renders the "Coming soon"
// labels below instead of broken tel: / mailto: links.
const SUPPORT_PHONE: string | null = null;
const SUPPORT_EMAIL: string | null = null;

export default function SupportPage() {
  return (
    <div className="container max-w-2xl py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <LifeBuoy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Support &amp; helpline</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        We&apos;re a small team building SkillVerify. We respond to most questions within 24 hours.
      </p>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" /> Phone
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {SUPPORT_PHONE ? (
              <a
                href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`}
                className="text-primary hover:underline"
              >
                {SUPPORT_PHONE}
              </a>
            ) : (
              <span className="text-muted-foreground italic">
                Coming soon — a dedicated support number will be published here once we go live.
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" /> Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {SUPPORT_EMAIL ? (
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>
            ) : (
              <span className="text-muted-foreground italic">
                Coming soon — until then, message the founder directly via the link below.
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" /> Common issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Faq
              q="My institution isn't in the picker."
              a="On the signup form, click 'Don't see your college? Add it' inside the picker. Your institution will be created in pending state — you can finish signing up immediately, and we'll review the entry within 24 hours."
            />
            <Faq
              q="My college ID was rejected."
              a="Open the Verification Center, look for the rejection reason, and re-upload a clearer photo or a PDF. Common rejections: ID image is too blurry, name on the card doesn't match the name you typed, or the image looks digitally edited."
            />
            <Faq
              q="My CGPA shows UNVERIFIED."
              a="The dashboard CGPA only flips to VERIFIED after at least one semester marksheet passes our OCR + anti-tamper check. Upload your marksheets from Verification Center → Semester-wise CGPA verification."
            />
            <Faq
              q="The institute email I want to use isn't accepted."
              a="The picker enforces the institutional domain when one is on record. If your college uses a different email domain, contact us via the channels above and we'll update the institution record."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-medium text-foreground">{q}</div>
      <p className="mt-0.5">{a}</p>
    </div>
  );
}
