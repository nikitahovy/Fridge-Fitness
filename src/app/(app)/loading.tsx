// Experimental: route transition loading animation for the main app.
// To try a different variant, swap the import + JSX below:
//   import { LogoOrbit } from "@/components/loading/LoadingVariants";
//   import { MinimalDots } from "@/components/loading/LoadingVariants";

import { LogoPulse } from "@/components/loading/LoadingVariants";

export default function AppLoading() {
  return <LogoPulse />;
}
