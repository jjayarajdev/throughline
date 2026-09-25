import type { FormInstance, Rule } from "antd/es/form";
import type { z } from "zod";

/**
 * Run the existing zod schemas as Ant Design Form rules.
 *
 *   const schema = z.object({ email: z.string().email(), age: z.number().min(18) });
 *   <Form form={form} onFinish={onFinish}>
 *     <Form.Item name="email" rules={zodRules(schema, "email")}>…</Form.Item>
 *
 * Per-field rules validate the field's own schema (`schema.shape[name]`). Object-level
 * refinements (cross-field checks) are applied on submit with `validateWithZod`.
 */
export function zodRules<S extends z.ZodObject<any>>(schema: S, name: keyof S["shape"] & string, extra: Rule[] = []): Rule[] {
  const field = schema.shape[name] as z.ZodTypeAny | undefined;
  if (!field) return extra;
  const required = !field.isOptional() && !field.isNullable();
  return [
    ...(required ? [{ required: true, message: `${humanize(name)} is required` }] : []),
    {
      validator: async (_: unknown, value: unknown) => {
        const v = value === "" ? undefined : value;
        const result = field.safeParse(v);
        if (!result.success) throw new Error(result.error.issues[0]?.message || `${humanize(name)} is invalid`);
      },
    },
    ...extra,
  ];
}

/** Validate the whole form against the object schema (refinements included) and push errors to Ant. */
export function validateWithZod<S extends z.ZodTypeAny>(schema: S, form: FormInstance, values: unknown): z.infer<S> | null {
  const result = schema.safeParse(values);
  if (result.success) return result.data;
  form.setFields(
    result.error.issues.map((issue) => ({
      name: issue.path as (string | number)[],
      errors: [issue.message],
    }))
  );
  const first = result.error.issues[0];
  if (first?.path?.length) form.scrollToField(first.path as (string | number)[]);
  return null;
}

function humanize(name: string) {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
