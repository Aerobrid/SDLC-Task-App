interface SignInLayoutProps {
  children: React.ReactNode;
}

const SignInLayout  = ({ children }: SignInLayoutProps) => {
  return (
    <div className="flex flex-col">
      <nav className="bg-red-500 h-10">
        <p> Nav Bar</p>
      </nav>
      {children}
    </div>
  );
};

export default SignInLayout;