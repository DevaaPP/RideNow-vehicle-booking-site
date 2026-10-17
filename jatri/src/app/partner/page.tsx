import { redirect } from "next/navigation";

export default function PartnerIndexRedirect() {
  redirect("/partners/dashboard");
}
