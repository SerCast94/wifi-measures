import { useForm } from "react-hook-form";

import _ from "lodash";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, LogIn } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/atomic-components/form";
import { Input } from "@/core/atomic-components/input";
import { useLogin } from "@/features/auth/hooks/use-login";
import { Checkbox } from "@/core/atomic-components/checkbox";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { PasswordInput } from "@/core/atomic-components/password-input";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/core/atomic-components/alert";

const formSchema = z.object({
  email: z.string().email().min(1, "You must enter a valid email."),
  password: z.string().min(1, "Please enter your password."),
});

type FormType = {
  email: string;
  password: string;
  remember?: boolean;
};

const defaultValues = {
  email: "",
  password: "",
  remember: true,
};

export const SignInForm = () => {
  const form = useForm<FormType>({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(formSchema),
  });

  const {
    formState: { errors, dirtyFields, isValid },
  } = form;

  const { mutate, isPending, error } = useLogin();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: () => {
        toast.success("Login successful!", { duration: 5000 });
      },
    });
  };

  return (
    <Form {...form}>
      <form
        name="sign-in-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-center w-full space-y-10"
      >
        <div className="flex flex-col justify-center space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Login failed!</AlertTitle>
              <AlertDescription>
                {error?.message ||
                  "Connection Server error. Please try again later."}
              </AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="mb-24"
                    autoFocus
                    type="text"
                    required
                    placeholder="Enter your email address"
                  />
                </FormControl>
                <FormMessage className="text-xs">
                  {errors.email?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    required
                    placeholder="Enter your password"
                  />
                </FormControl>
                <FormMessage className="text-xs">
                  {errors.password?.message}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Remember me</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* <a
            className="font-medium text-md hover:underline text-primary"
            href="/auth/forgot-password"
          >
            Forgot password?
          </a> */}
        </div>

        <LoadingButton
          color="secondary"
          className="w-full mt-16 bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Sign in"
          disabled={_.isEmpty(dirtyFields) || !isValid || isPending}
          type="submit"
          loading={isPending}
          icon={<LogIn className="mr-4" />}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </LoadingButton>
      </form>
    </Form>
  );
};
