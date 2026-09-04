import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button className={twMerge(" bg-green-900 p-6", className)} {...props}>
      fancy button
    </button>
  );
}
