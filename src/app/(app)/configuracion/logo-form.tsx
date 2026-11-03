"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { buttonClass, inputClass } from "@/components/ui/styles";

/** Subida del logo: ActionForm no maneja archivos, así que este formulario lo hace aparte. */
export function LogoForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const fieldError = state.fieldErrors?.logo?.[0];

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="field-logo" className="mb-1 block text-sm font-medium">
          Subir nuevo logo
        </label>
        <input
          id="field-logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
          aria-invalid={fieldError ? true : undefined}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">PNG, JPG, WEBP o GIF, menos de 500 KB.</p>
        {fieldError && <p className="mt-1 text-xs text-danger">{fieldError}</p>}
      </div>
      {state.success && (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Subiendo..." : "Guardar logo"}
      </button>
    </form>
  );
}
