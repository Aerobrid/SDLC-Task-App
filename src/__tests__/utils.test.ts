import { normalizeStatus, generateInviteCode } from '@/lib/utils'

describe('utils', () => {
  test('normalizeStatus maps values correctly', () => {
    expect(normalizeStatus(undefined)).toBe('todo')
    expect(normalizeStatus('')).toBe('todo')
    expect(normalizeStatus('inprogress')).toBe('in-progress')
    expect(normalizeStatus('inreview')).toBe('in-review')
    expect(normalizeStatus('done')).toBe('done')
  })

  test('generateInviteCode returns correct length and charset', () => {
    const code = generateInviteCode(6)
    expect(code).toHaveLength(6)
    // only allow alphanumeric characters
    expect(/^[A-Za-z0-9]+$/.test(code)).toBe(true)
  })
})
