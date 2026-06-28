import type { Career, CareerCategory } from './types'
import raw from './careers.json'

// careers.json is produced from web-verified research (BLS figures, real tuition)
// plus authored simulations and score profiles. It is validated at generation
// time, so we trust the shape here.
export const careers = raw as unknown as Career[]

export const careerByKey = (key: string): Career | undefined =>
  careers.find((c) => c.key === key)

export const CATEGORY_ORDER: CareerCategory[] = [
  'Technology',
  'Healthcare',
  'Business & Finance',
  'Creative & Media',
  'Engineering',
  'Legal',
  'Education',
  'Skilled Trades',
  'Other',
]

export function careersByCategory(): { category: CareerCategory; items: Career[] }[] {
  const groups = new Map<CareerCategory, Career[]>()
  for (const c of careers) {
    const list = groups.get(c.category) ?? []
    list.push(c)
    groups.set(c.category, list)
  }
  return CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((category) => ({
    category,
    items: groups.get(category)!,
  }))
}
