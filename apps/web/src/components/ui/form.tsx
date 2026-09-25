import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

/**
 * shadcn v4 Form — react-hook-form bindings with accessible label +
 * description + error message wiring. This is the canonical shadcn
 * pattern, transcribed (not copy-pasted) so it matches our style.
 *
 * Use shape:
 *   <Form {...methods}>
 *     <form onSubmit={methods.handleSubmit(onSubmit)}>
 *       <FormField control={methods.control} name="email" render={...} />
 *     </form>
 *   </Form>
 *
 * VALIDATION UX PATTERNS (FR-22):
 * - FormLabel: Pass `required` prop to show red asterisk indicator
 * - FormMessage: Already shows inline error on blur (react-hook-form mode: 'onBlur')
 * - FormSuccess: Opt-in component for validated field feedback (green check)
 * - Success border: For per-field success visual, apply className to Input:
 *   <Input className={cn(fieldState.isDirty && !fieldState.error && 'border-success/50')} />
 * - Submit button: Use Button's `disabled` and `loading` props during submission
 */
export const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

/**
 * Hook into the surrounding FormField/FormItem so child inputs can
 * surface error state + accessible IDs without prop drilling.
 */
export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error('useFormField must be used inside a <FormField>');
  }
  if (!itemContext) {
    throw new Error('useFormField must be used inside a <FormItem>');
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = 'FormItem';

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return (
    <Label
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
    </Label>
  );
});
FormLabel.displayName = 'FormLabel';

export const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

/**
 * FormSuccess — Opt-in success feedback component for validated fields.
 *
 * Shows a subtle green check when field has been validated and has no error.
 * Use conditionally in FormField render based on fieldState:
 *
 * @example
 * <FormField
 *   render={({ field, fieldState }) => (
 *     <FormItem>
 *       <FormLabel>Email</FormLabel>
 *       <FormControl><Input {...field} /></FormControl>
 *       {fieldState.isDirty && !fieldState.error && <FormSuccess />}
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 */
export function FormSuccess() {
  const { error } = useFormField();
  // Only show success when field has no error
  // Caller should conditionally render based on isDirty/isTouched
  if (error) return null;
  return (
    <p className="text-[0.8rem] font-medium text-success flex items-center gap-1">
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M13.25 4.75L6 12L2.75 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Looks good
    </p>
  );
}
