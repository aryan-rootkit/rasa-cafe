import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/content/store";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Website Settings</h1>
      <p className="mt-1 text-sm text-stone-500">
        Contact details shown in the Visit section and footer.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
