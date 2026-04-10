// Experimental: route transition loading animation for auth pages.
// To try a different variant, swap the import + JSX below:
//   import { LogoOrbit } from "@/components/loading/LoadingVariants";
//   import { MinimalDots } from "@/components/loading/LoadingVariants";

import { LogoPulse } from "@/components/loading/LoadingVariants";

export default function AuthLoading() {
  return <LogoPulse />;
}
