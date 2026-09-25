import dayjs, { type Dayjs } from "dayjs";

export interface IdName {
  id: number;
  name: string;
}

/**
 * Form.Item props so a multi Select can edit a `[{ id, name }]` form value (what the zod schemas
 * and API payloads expect) while the Select itself works on ids.
 */
export const idNameSelectProps = (options: IdName[]) => ({
  getValueProps: (value?: IdName[]) => ({ value: (value ?? []).map((v) => v.id) }),
  normalize: (ids: number[]) =>
    (ids ?? [])
      .map((id) => options.find((o) => o.id === id))
      .filter((o): o is IdName => !!o)
      .map((o) => ({ id: o.id, name: o.name })),
});

/** Form.Item props so a DatePicker edits a `YYYY-MM-DD` string (or null) form value. */
export const dateStringProps = (empty: null | "" = null) => ({
  getValueProps: (value?: string | null) => {
    const d = value ? dayjs(value) : null;
    return { value: d?.isValid() ? d : null };
  },
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : empty),
});

/** `{ id, name }` rows → Select options with string values (legacy SelectField stored `String(id)`). */
export const toStringOptions = (rows: { id: number | string; name: string }[] = []) => rows.map((r) => ({ value: String(r.id), label: r.name }));

export const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const REFERRED_OPTIONS = [
  { value: "1", label: "External" },
  { value: "2", label: "Internal" },
  { value: "3", label: "Others" },
];
