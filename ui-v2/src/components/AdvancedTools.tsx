import React from "react";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { VStack } from "@astryxdesign/core/VStack";
import { workflow } from "./Workflow.stylex";

/** Keep specialist actions out of the daily workflow while retaining state. */
export function AdvancedTools({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <Collapsible trigger={title} defaultIsOpen={false} xstyle={workflow.disclosure}>
    <VStack gap={3} paddingBlock={3}>{children}</VStack>
  </Collapsible>;
}
