import { DEFAULT_LOOK, DENSITY_IDS, PROGRESS_IDS } from '@repo/types/look'
import { lookToTokens } from './catalog'
import { GUEST_PAINT_KEY } from './guest-look'

export type PaintTokens = ReturnType<typeof lookToTokens>

// Embedded in a <script>: escape < and the JS line separators so a value cannot end the element.
const safeJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/[\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16)}`)

// First-frame script: sets the look's tokens on <html> before the dashboard markup paints. With
// null tokens (guest) it reads the lookPaint cache, which is untrusted, so names, values and
// attributes are allow-listed. Plain ES5 on purpose: it runs before any module loads.
export function buildPaintScript(tokens: PaintTokens | null): string {
  const names = Object.keys(lookToTokens(DEFAULT_LOOK).props)
  return `try{(function(){var t=${safeJson(tokens)},n=${safeJson(names)},p=${safeJson(PROGRESS_IDS)},d=${safeJson(DENSITY_IDS)},k=${safeJson(GUEST_PAINT_KEY)};if(t===null){t=JSON.parse(localStorage.getItem(k)||'null')}if(!t||typeof t!=='object')return;var r=document.documentElement,o=t.props||{},a=t.attrs||{},i,v;for(i=0;i<n.length;i++){v=o[n[i]];if(typeof v==='string'&&/^[^;{}<>\\\\]{0,200}$/.test(v)&&v.indexOf('url(')<0)r.style.setProperty(n[i],v)}if(p.indexOf(a['data-progress'])>=0)r.setAttribute('data-progress',a['data-progress']);if(d.indexOf(a['data-density'])>=0)r.setAttribute('data-density',a['data-density'])})()}catch(e){}`
}
