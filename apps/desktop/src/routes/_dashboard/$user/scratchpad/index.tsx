import { createFileRoute } from '@tanstack/react-router'
import { Scratchpad } from './-components/Scratchpad.tsx'
export const Route = createFileRoute('/_dashboard/$user/scratchpad/')({
  component: Scratchpad,
})
