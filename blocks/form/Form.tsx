import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { spacing } from '../../../masicn';

/** A function that validates a single field value and returns an error string, or `undefined` if valid. */
export type FieldValidator<V = unknown> = (value: V) => string | undefined;

/**
 * Pairs a field name with its validator function.
 * Pass an array of these to `Form`'s `validations` prop.
 */
export interface FieldValidation<V = unknown> {
  /** Field name */
  name: string;
  /** Validation function */
  validate: FieldValidator<V>;
}

interface FormContextValue {
  /** Form values */
  values: Record<string, unknown>;
  /** Form errors */
  errors: Record<string, string>;
  /** Touch state for fields */
  touched: Record<string, boolean>;
  /** Update field value */
  setFieldValue: (name: string, value: unknown) => void;
  /** Set field error */
  setFieldError: (name: string, error: string | undefined) => void;
  /** Mark field as touched */
  setFieldTouched: (name: string, touched?: boolean) => void;
  /** Get field value */
  getFieldValue: (name: string) => unknown;
  /** Get field error */
  getFieldError: (name: string) => string | undefined;
  /** Check if field is touched */
  isFieldTouched: (name: string) => boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * useFormField — connects an individual input to the nearest Form context.
 *
 * Returns the field's current value, error, and touched state along with
 * imperative setters. Must be called inside a component that is rendered
 * within a `<Form>` tree.
 *
 * @example
 * function EmailField() {
 *   const { value, error, setValue, setTouched } = useFormField('email');
 *   return (
 *     <TextInput
 *       value={value as string}
 *       onChangeText={setValue}
 *       onBlur={() => setTouched(true)}
 *     />
 *   );
 * }
 */
export function useFormField(name: string) {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormField must be used within a Form component');
  }

  return {
    value: context.getFieldValue(name),
    error: context.getFieldError(name),
    touched: context.isFieldTouched(name),
    setValue: (value: unknown) => context.setFieldValue(name, value),
    setError: (error: string | undefined) => context.setFieldError(name, error),
    setTouched: (touched?: boolean) => context.setFieldTouched(name, touched),
  };
}

/**
 * useFormContext — returns the full Form context object.
 *
 * Use when you need low-level access to all field values, errors, and setters
 * from a component that is nested anywhere inside a `<Form>`. Prefer
 * `useFormField` for per-field access.
 *
 * @example
 * function SubmitButton() {
 *   const { values } = useFormContext();
 *   return <Button onPress={() => console.log(values)}>Submit</Button>;
 * }
 */
export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
}

interface FormProps<TValues extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<ViewProps, 'children'> {
  /** Initial form values */
  initialValues?: TValues;
  /** Field validations */
  validations?: FieldValidation[];
  /** Form submission handler — receives the typed values object */
  onSubmit: (values: TValues) => void | Promise<void>;
  /** Callback when form validation fails */
  onError?: (errors: Record<string, string>) => void;
  /** Form content - can be ReactNode or render function receiving handleSubmit */
  children: React.ReactNode | ((props: { handleSubmit: () => Promise<void> }) => React.ReactNode);
}

/**
 * Form.Field render-prop — connects any input to the nearest Form context.
 *
 * Receives a render function that is called with the field's current state
 * and change/blur handlers, eliminating boilerplate for each field.
 *
 * @example
 * <Form.Field name="email">
 *   {({ value, error, onChange, onBlur }) => (
 *     <TextInput value={value as string} onChangeText={onChange} onBlur={onBlur} />
 *   )}
 * </Form.Field>
 */
interface FormFieldProps<T = unknown> {
  /** The field name — must match a key in `initialValues` or a `validations` entry. */
  name: string;
  /** Render function that receives the field's state and interaction handlers. */
  children: (fieldProps: {
    value: T;
    error: string | undefined;
    touched: boolean;
    onChange: (value: T) => void;
    onBlur: () => void;
  }) => React.ReactNode;
}

function FormField<T = unknown>({ name, children }: FormFieldProps<T>) {
  const { value, error, touched, setValue, setTouched } = useFormField(name);
  return (
    <>
      {children({
        value: value as T,
        error,
        touched,
        onChange: setValue as (value: T) => void,
        onBlur: () => setTouched(true),
      })}
    </>
  );
}

/**
 * Form — context-based form with field-level validation and typed values.
 *
 * Maintains a shared context (`FormContext`) that stores values, errors, and
 * touch state for every registered field. Fields communicate with the form
 * through `useFormField` or the `Form.Field` render-prop helper.
 *
 * Validation runs per-field on change (once the field has been touched) and
 * across all fields on submit. `handleSubmit` marks every field as touched,
 * runs all validators, then either calls `onSubmit` with the values or calls
 * `onError` with the error map — never both.
 *
 * Children can be plain React nodes or a render function that receives
 * `handleSubmit`, making it easy to wire up a submit button anywhere in the tree.
 *
 * @example
 * type LoginValues = { email: string; password: string };
 *
 * <Form<LoginValues>
 *   initialValues={{ email: '', password: '' }}
 *   validations={[
 *     { name: 'email',    validate: (v) => !v ? 'Required' : undefined },
 *     { name: 'password', validate: (v) => (v as string).length < 8 ? 'Too short' : undefined },
 *   ]}
 *   onSubmit={(values) => login(values.email, values.password)}>
 *   {({ handleSubmit }) => (
 *     <>
 *       <Form.Field name="email">
 *         {({ value, error, onChange, onBlur }) => (
 *           <TextInput value={value as string} onChangeText={onChange} onBlur={onBlur} />
 *         )}
 *       </Form.Field>
 *       <Button onPress={handleSubmit}>Log in</Button>
 *     </>
 *   )}
 * </Form>
 */
function FormBase<TValues extends Record<string, unknown> = Record<string, unknown>>({
  initialValues = {} as TValues,
  validations = [],
  onSubmit,
  onError,
  children,
  style,
  ...rest
}: FormProps<TValues>) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    // Validate on change if field was touched
    if (touched[name]) {
      const validation = validations.find((v) => v.name === name);
      if (validation) {
        const error = validation.validate(value);
        setErrors((prev) => ({ ...prev, [name]: error || '' }));
      }
    }
  }, [validations, touched]);

  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [name]: error || '' }));
  }, []);

  const setFieldTouched = useCallback((name: string, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const getFieldValue = useCallback((name: string) => values[name], [values]);
  const getFieldError = useCallback((name: string) => errors[name], [errors]);
  const isFieldTouched = useCallback((name: string) => touched[name] || false, [touched]);

  // Returns { isValid, newErrors } directly — avoids stale closure in handleSubmit
  const validateForm = useCallback((): { isValid: boolean; newErrors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    validations.forEach((validation) => {
      const error = validation.validate(values[validation.name]);
      if (error) {
        newErrors[validation.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return { isValid, newErrors };
  }, [validations, values]);

  const handleSubmit = useCallback(async () => {
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach((key) => { allTouched[key] = true; });
    setTouched(allTouched);

    const { isValid, newErrors } = validateForm();

    if (isValid) {
      await onSubmit(values as TValues);
    } else {
      onError?.(newErrors);
    }
  }, [values, validateForm, onSubmit, onError]);

  const contextValue: FormContextValue = {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    getFieldValue,
    getFieldError,
    isFieldTouched,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <View style={[styles.form, style]} {...rest}>
        {typeof children === 'function' ? children({ handleSubmit }) : children}
      </View>
    </FormContext.Provider>
  );
}

export const Form = Object.assign(FormBase, { Field: FormField });

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
});
