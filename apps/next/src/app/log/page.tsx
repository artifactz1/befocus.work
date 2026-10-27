import { DEFAULT_LOOK } from '@repo/types/look'
import { headers } from 'next/headers'
import { LookPaintScript } from '~/components/customize/LookPaintScript'
import { LogPage } from '~/components/logs/LogPage'
import { lookToTokens } from '~/lib/customize/catalog'
import { getUserSettings } from '~/lib/server/getUserSettings'

// Middleware sets the header and overwrites any client value; account data still comes from the
// owner-scoped API, so a forged header can only show an error state.
export default async function Page() {
  const mode = (await headers()).get('x-befocus-mode') === 'account' ? 'account' : 'guest'
  const settings = mode === 'account' ? await getUserSettings() : null
  return (
    <>
      <LookPaintScript
        tokens={mode === 'account' ? lookToTokens(settings?.look ?? DEFAULT_LOOK) : null}
      />
      <LogPage mode={mode} />
    </>
  )
}
