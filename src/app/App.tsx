import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import CursorSparkles from "./components/CursorSparkles";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <CursorSparkles />
      <Toaster position="bottom-center" richColors />
    </>
  );
}