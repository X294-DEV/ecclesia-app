import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass } from "@/components/ui/styles";

export const metadata = { title: "Sin acceso" };

export default function NoAutorizadoPage() {
  return (
    <>
      <PageHeader
        title="No tienes acceso a esta sección"
        description="Tu rol no incluye este permiso. Si crees que es un error, contacta al administrador."
      />
      <Link href="/inicio" className={buttonClass}>
        Volver al inicio
      </Link>
    </>
  );
}
