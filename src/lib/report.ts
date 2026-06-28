import { jsPDF } from 'jspdf'
import type { Career } from '../data/types'
import type { CareerProgress } from '../state/trial'
import { lifeMathFor, scoreFor, activePath } from '../state/selectors'
import { DIMENSION_META } from './score'
import { verdictSignal } from './signal'
import { usd } from './format'
import { regionById } from './regions'

const INK: [number, number, number] = [15, 23, 34]
const SOFT: [number, number, number] = [91, 101, 115]
const BRAND: [number, number, number] = [75, 71, 255]
const LINE: [number, number, number] = [214, 216, 222]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function generateReport(career: Career, progress: CareerProgress): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  const right = W - M
  let y = M

  const score = scoreFor(career, progress)
  const lm = lifeMathFor(career, progress)
  const path = activePath(career, progress)
  const region = regionById(progress.regionId)
  const vsig = hexToRgb(verdictSignal(score.verdict).hex)

  const ensure = (need: number) => {
    if (y + need > H - M) {
      doc.addPage()
      y = M
    }
  }
  const heading = (text: string) => {
    ensure(40)
    y += 10
    doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
    doc.text(text, M, y)
    y += 8
    doc.setDrawColor(...LINE).setLineWidth(1).line(M, y, right, y)
    y += 16
  }
  const body = (text: string, color = SOFT, size = 10.5) => {
    doc.setFont('helvetica', 'normal').setFontSize(size).setTextColor(...color)
    const lines = doc.splitTextToSize(text, right - M) as string[]
    for (const ln of lines) {
      ensure(size + 4)
      doc.text(ln, M, y)
      y += size + 4
    }
  }

  // --- Masthead ---
  doc.setFillColor(14, 26, 43).rect(0, 0, W, 96, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(124, 156, 255)
  doc.text('FUTUREPILOT AI', M, 40)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(180, 190, 205)
  doc.text('Career Reality Report', M, 56)
  doc.setFontSize(8).setTextColor(150, 162, 180)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(date, right, 40, { align: 'right' })
  if (career.generated) doc.text('AI-generated profile', right, 56, { align: 'right' })

  y = 130

  // --- Title + verdict ---
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(...INK)
  doc.text(career.title, M, y)
  y += 18
  doc.setFont('helvetica', 'italic').setFontSize(11).setTextColor(...SOFT)
  const oneLine = doc.splitTextToSize(`"${career.oneLineReality}"`, right - M) as string[]
  oneLine.forEach((ln) => {
    doc.text(ln, M, y)
    y += 15
  })

  y += 12
  // verdict chip + score
  ensure(70)
  doc.setFillColor(vsig[0], vsig[1], vsig[2]).roundedRect(M, y, 150, 54, 8, 8, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(28).setTextColor(255, 255, 255)
  doc.text(String(score.overall), M + 16, y + 36)
  doc.setFontSize(9).setFont('helvetica', 'normal')
  doc.text('/100', M + 16 + doc.getTextWidth(String(score.overall)) + 4, y + 36)
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...INK)
  doc.text(score.verdictLabel, M + 168, y + 24)
  doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...SOFT)
  const reason = doc.splitTextToSize(score.verdictReason, right - (M + 168)) as string[]
  let ry = y + 40
  reason.slice(0, 3).forEach((ln) => {
    doc.text(ln, M + 168, ry)
    ry += 12
  })
  y += 70

  // --- Reality Score breakdown ---
  heading('Reality Score breakdown')
  for (const dim of DIMENSION_META) {
    ensure(22)
    const val = score.dims[dim.key]
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
    doc.text(dim.label, M, y + 4)
    const barX = M + 110
    const barW = right - barX - 40
    doc.setFillColor(...LINE).roundedRect(barX, y - 5, barW, 8, 4, 4, 'F')
    doc.setFillColor(...BRAND).roundedRect(barX, y - 5, (barW * val) / 100, 8, 4, 4, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
    doc.text(String(val), right, y + 4, { align: 'right' })
    y += 20
  }

  // --- Snapshot ---
  heading('The reality snapshot')
  body(`Median pay: ${usd(career.medianPayUSD)}/yr (${career.medianPayYear}) · Entry level: ${usd(career.entryLevelPayUSD)} · Job outlook: ${career.outlookPercent > 0 ? '+' : ''}${career.outlookPercent}% (${career.outlookPeriod || 'BLS projection'})`)
  body(`AI exposure: ${career.aiImpact.riskLevel}/100. ${career.aiImpact.riskNote}`)
  body(`The part nobody tells you: ${career.boringHardPart}`)

  // --- Money plan ---
  heading('Your money plan')
  body(`Chosen path: ${path.label} (${path.durationLabel}, ${usd(path.totalCostUSD)} tuition) · Region: ${region.label}`)
  body(`Estimated debt after aid + part-time work: ${usd(lm.estimatedDebtUSD)} · Starting salary: ${usd(lm.startingSalaryUSD)} · Break-even: ${lm.breakEvenYears} years`)
  body(lm.headline)

  // --- 30-day plan ---
  heading('Your next 30 days')
  career.thirtyDayPlan.forEach((s, i) => {
    ensure(30)
    doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...INK)
    doc.text(`${i + 1}. ${s.title}`, M, y)
    y += 14
    body(s.detail)
    y += 2
  })

  // --- Sources / footer ---
  heading('Verify it yourself')
  body(`Primary source — U.S. Bureau of Labor Statistics: ${career.blsUrl}`, BRAND)
  career.sources.slice(0, 4).forEach((s) => body(s, SOFT, 8.5))

  // page footer
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...SOFT)
    doc.text('Generated by FuturePilot AI — test-drive your future before you bet years and money on it.', M, H - 24)
    doc.text(`${p} / ${pages}`, right, H - 24, { align: 'right' })
  }

  doc.save(`FuturePilot-${career.key}.pdf`)
}
