import { redirect } from "next/navigation";

export default function Under1299Page() {
  redirect("/products?maxPrice=1299");
}
