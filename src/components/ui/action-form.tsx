"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { buttonClass, inputClass } from "@/components/ui/styles";

export type FieldOption = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "time" | "textarea" | "select" | "checkbox";
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  step?: string;
  autoComplete?: string;
  /** Con columns=2, ocupa el ancho completo. */
  full?: boolean;
};

type Props = {
  /** Server action con la firma (estado previo, FormData) => Promise<ActionState>. */
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: FieldDef[];
  submitLabel: string;
  /** Campos ocultos (por ejemplo el id del registro a editar). */
  hidden?: Record<string, string>;
  columns?: 1 | 2;
};

/**
 * Formulario genérico para todos los módulos: se define con una lista de campos y
 * una server action; muestra errores por campo, error general y mensaje de éxito.
 *
 * La server action devuelve un ActionState (ver src/lib/action-state.ts):
 *   - error / fieldErrors / values cuando algo falla (los valores se conservan en pantalla)
 *   - success cuando todo sale bien
 */
export function ActionForm({ action, fields, submitLabel, hidden, columns = 1 }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
        {fields.map((field) => {
          const id = `field-${field.name}`;
          const type = field.type ?? "text";
          const fieldError = state.fieldErrors?.[field.name]?.[0];
          const initial =
            type === "password"
              ? ""
              : (state.values?.[field.name] ??
                (field.defaultValue !== undefined ? String(field.defaultValue) : ""));
          const wrapperClass = field.full && columns === 2 ? "sm:col-span-2" : "";

          if (type === "checkbox") {
            return (
              <div key={field.name} className={wrapperClass}>
                <label htmlFor={id} className="flex items-center gap-2 text-sm">
                  <input
                    id={id}
                    name={field.name}
                    type="checkbox"
                    defaultChecked={
                      state.values ? state.values[field.name] === "on" : Boolean(field.defaultValue)
                    }
                  />
                  {field.label}
                </label>
                {fieldError && <p className="mt-1 text-xs text-danger">{fieldError}</p>}
              </div>
            );
          }

          return (
            <div key={field.name} className={wrapperClass}>
              <label htmlFor={id} className="mb-1 block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-danger"> *</span>}
              </label>

              {type === "textarea" ? (
                <textarea
                  id={id}
                  name={field.name}
                  rows={4}
                  required={field.required}
                  placeholder={field.placeholder}
                  defaultValue={initial}
                  className={inputClass}
                />
              ) : type === "select" ? (
                <select
                  id={id}
                  name={field.name}
                  required={field.required}
                  defaultValue={initial}
                  className={inputClass}
                >
                  <option value="">Selecciona...</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={type}
                  required={field.required}
                  placeholder={field.placeholder}
                  step={field.step}
                  autoComplete={field.autoComplete}
                  defaultValue={initial}
                  aria-invalid={fieldError ? true : undefined}
                  className={inputClass}
                />
              )}

              {fieldError && <p className="mt-1 text-xs text-danger">{fieldError}</p>}
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      )}
      {state.devLink && (
        <p className="break-all rounded-md border border-border bg-background p-3 text-xs">
          Modo demostración (sin correo configurado):{" "}
          <a className="underline" href={state.devLink}>
            {state.devLink}
          </a>
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Procesando..." : submitLabel}
      </button>
    </form>
  );
}
