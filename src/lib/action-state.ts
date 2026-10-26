/** Estado que devuelven las server actions usadas con <ActionForm>. */
export type ActionState = {
  /** Error general del formulario. */
  error?: string;
  /** Mensaje de éxito. */
  success?: string;
  /** Errores por campo (clave = nombre del campo). */
  fieldErrors?: Record<string, string[] | undefined>;
  /** Valores a repoblar el formulario cuando hay error (nunca contraseñas). */
  values?: Record<string, string>;
  /** Solo modo demostración: enlace de recuperación cuando no hay correo configurado. */
  devLink?: string;
};
