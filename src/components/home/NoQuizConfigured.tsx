
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const NoQuizConfigured = () => {
  return (
    <div className="min-h-screen bg-millionaire-dark text-millionaire-light">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Card className="bg-millionaire-secondary border-millionaire-accent max-w-md w-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="w-16 h-16 text-millionaire-accent mb-4" />
              <h2 className="text-xl font-semibold text-millionaire-gold mb-2">No Quiz Configured</h2>
              <p className="text-millionaire-light mb-6 text-center">
                Please create or load a quiz configuration to start playing.
              </p>
              <div className="flex space-x-4">
                <Button
                  asChild
                  className="bg-millionaire-gold hover:bg-yellow-500 text-millionaire-primary"
                >
                  <Link to="/setup">
                    <Plus size={16} className="mr-2" />
                    Create Quiz
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-millionaire-accent"
                >
                  <Link to="/manager">
                    <Settings size={16} className="mr-2" />
                    Load Quiz
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NoQuizConfigured;
