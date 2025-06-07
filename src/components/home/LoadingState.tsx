
import { UserMenu } from "@/components/auth/UserMenu";

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-millionaire-gold">Loading...</h1>
          <UserMenu />
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-millionaire-light">Loading your quiz data...</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
