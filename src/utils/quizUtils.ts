
import { toast } from "@/hooks/use-toast";

export const handleLogoUpload = (
  event: React.ChangeEvent<HTMLInputElement>,
  setLogo: (logo: string) => void
) => {
  const file = event.target.files?.[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
};
