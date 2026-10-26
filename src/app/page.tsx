import { redirect } from "next/navigation";

// La raíz solo redirige; el panel principal vive en /inicio (dentro del layout con menú).
export default function Home() {
  redirect("/inicio");
}
