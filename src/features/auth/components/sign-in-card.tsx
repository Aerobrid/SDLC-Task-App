"use client";

// importing link utility from nextjs for navigation
import Link from "next/link";
// sign-in icons
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
// z schema and react-hook-form for form validation
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// our dotted separator component
import { DottedSeparator } from "@/components/dotted-separator";

// UI components for the sign-in card
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";

// form components for structured form handling when sigining in
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// more UI components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// importing the login schema for validation (contains rules for email and password fields)
import { loginSchema } from "../schemas";
// importing the useLogin hook for handling login requests
import { useLogin } from "../api/use-login";

// SignInCard component for rendering the sign-in form
// it uses the login schema for validation and the useLogin hook for handling login requests
export const SignInCard = () => {
  // destructuring the mutate function from the useLogin hook
  // this function will be used to send the login request with the form values
  const { mutate, isPending } = useLogin();

  // the form will have fields for email and password, both of which are required and by default empty
  // z.infer means figure out what the types are from loginSchema (for type safety)
  const form = useForm<z.infer<typeof loginSchema>>({
    // connect the form to check if the input values match the loginSchema
    // zodResolver is a function that connects zod schema with react-hook-form
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // onSubmit function that will be called when the form is submitted to log in user
  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    mutate({
      json: values
    });
  };

  // rendering the sign-in card 
  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">
          Welcome Back!
        </CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> 
            {/* FormField component is used to create a controlled input field */}
            <FormField 
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isPending} size={"lg"} className="w-full">
              Login
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex items-center justify-center">
        <p>
          Don&apos;t have an account?
          {/* Link to the sign-up page */}
          <Link href="/sign-up">
            <span className="text-blue-700">&nbsp;Sign Up</span>
          </Link>
        </p>        
      </CardContent>
    </Card>
  );
};