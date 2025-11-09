import { redirect } from "next/navigation";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  redirect(`/portfolio/companies/${id}`);
}
