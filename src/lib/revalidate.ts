import "server-only";

import { revalidatePath } from "next/cache";

export function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/menu");
}
