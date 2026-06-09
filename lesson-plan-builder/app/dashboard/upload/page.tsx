import { redirect } from "next/navigation";

export default function UploadPage() {
  redirect("/dashboard/projects/new");
}
