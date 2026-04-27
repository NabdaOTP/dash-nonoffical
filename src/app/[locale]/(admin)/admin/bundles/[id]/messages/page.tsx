import AdminBundleMessagesPage from "@/features/admin/components/AdminBundleMessagesPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBundleMessagesPage bundleId={id} />;
}