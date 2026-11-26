import { HeaderLogo } from "@/components/solo/header-logo";
import { LogoSlot } from "@/components/solo/logo-slot";
import { SoloFrame } from "@/components/solo/shell";

/** One persistent frame (top bar, tabs, role switcher) for every Solo page. */
export default function SoloLayout({ children }: LayoutProps<"/">) {
  return (
    <LogoSlot logo={<HeaderLogo />}>
      <SoloFrame>{children}</SoloFrame>
    </LogoSlot>
  );
}
