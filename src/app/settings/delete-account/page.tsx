import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Delete account",
  description: "Delete your Frame account. Published evaluations stay on the public reviewer page.",
};

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Delete account</h1>
        <p className="lede">
          Choose a reason, then confirm. You will be signed out, and this email can be used again. Published evaluations stay on your public reviewer page.
        </p>
        <DeleteAccountForm />
        <p className="meta">
          <a href="/settings">Back to settings</a>
        </p>
      </div>
    </main>
  );
}
