import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-red-500 items-center justify-center">
            <AlertCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-display tracking-wider">SYSTEM ERROR 404</h1>
          </div>
          
          <p className="mt-4 text-sm text-gray-400 text-center font-mono">
            The requested data fragment could not be located in the neural network.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
