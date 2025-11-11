import {
  FieldValues,
  FormProvider as Form,
  UseFormReturn,
} from 'react-hook-form';

export const FormProvider = <T extends FieldValues>({
  children,
  onSubmit,
  methods,
  id,
  ...formElementProps
}: {
  children: React.ReactNode;
  methods: UseFormReturn<T>;
  onSubmit?: (e?: React.BaseSyntheticEvent) => Promise<void> | void;
  id?: string;
} & React.HTMLAttributes<HTMLFormElement>) => {
  return (
    <Form {...methods}>
      <form id={id} onSubmit={onSubmit} {...formElementProps}>
        {children}
      </form>
    </Form>
  );
};
