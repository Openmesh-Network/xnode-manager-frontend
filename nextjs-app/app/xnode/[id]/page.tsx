import { XnodeDetailed } from "@/components/xnode/xnode-detailed";
import React from "react";

export default async function XnodePage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  return <XnodeDetailed id={(await params).id} />;
}
