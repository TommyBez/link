import { CreateOrganization } from '@clerk/nextjs'

export default function NewStudioPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-semibold text-3xl tracking-tight">
          Set up your studio
        </h1>
      </header>

      <CreateOrganization
        afterCreateOrganizationUrl="/"
        path="/studio/new"
        skipInvitationScreen
      />
    </main>
  )
}
