import { createFileRoute } from "@tanstack/react-router";
import { UserPage } from "./-components/user/UserPage";

export const Route = createFileRoute("/_dashboard/$user/")({
  component: UserPage,
});
