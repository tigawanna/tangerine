import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViewer } from "@/data-access-layer/auth/viewer";
import { UserCircle } from "lucide-react";

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CurrentUser() {
  const { viewer, logoutMutation } = useViewer();
  const user = viewer.user;

  if (!user) {
    return <UserCircle className="text-base-content/40 size-6" aria-hidden />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar data-test="current-user-avatar">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 border-none p-3">
        <DropdownMenuSeparator />
        <div className="flex h-full w-full gap-3">
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex h-full w-full flex-col p-1">
            <span className="text-xs">{user.email}</span>
            <span className="text-xs">{user.name}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="flex h-full w-full items-center justify-center gap-3">
            <button
              type="button"
              className="btn btn-error"
              data-test="current-user-logout"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? "Signing out…" : "Logout"}
            </button>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
