import { SignInForm } from "./SignInForm";

// import logo from "@/assets/react.svg";

const SignInPage = () => {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto space-y-4 sm:mx-0 sm:w-64 lg:w-80">
      <img
        src="logo-magtel.webp"
        alt="logo"
        className="object-cover w-64 p-6 mx-auto mb-4 rounded-lg bg-background"
      />

      <div className="flex flex-col gap-4">
        <SignInForm />
      </div>
    </div>
  );
};

export default SignInPage;
