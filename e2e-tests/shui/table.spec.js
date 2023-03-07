import { expect } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { test } from '../fixtures'
import { randomString, editFirstBlock, navigateToStartOfBlock, createRandomPage } from '../utils'

// The following function assumes that the block is currently in edit mode, 
// and it just enters a simple table
const inputSimpleTable = async (page) => {
  await page.keyboard.type('| Header A | Header B |')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('| A1 | B1 |') 
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('| A2 | B2 |')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
}

// The folowing function does not assume any state, and will prepend the provided lines to the 
// first block of the document 
const prependPropsToFirstBlock = async (page, block, ...props) => {
  await editFirstBlock(page) 
  await page.waitForTimeout(100) 
  await navigateToStartOfBlock(page, block)
  await page.waitForTimeout(100) 

  for (const prop of props) {
    await page.keyboard.type(prop)
    await page.waitForTimeout(100)
    await page.keyboard.press('Shift+Enter')
    await page.waitForTimeout(100)
  }

  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
}

const setPropInFirstBlock = async (page, block, prop, value) => {
  await editFirstBlock(page)
  await page.waitForTimeout(100)
  await navigateToStartOfBlock(page, block)
  await page.waitForTimeout(100)

  const inputValue = await page.inputValue('textarea >> nth=0')

  const match = inputValue.match(new RegExp(`${prop}::(.*)(\n|$)`))

  if (!match) {
    await page.keyboard.type(prop + ':: ' + value)
    await page.waitForTimeout(100)
    await page.keyboard.press('Shift+Enter')
    await page.waitForTimeout(100)
    await page.keyboard.press('Escape')
    return await page.waitForTimeout(100)
  }

  const [propLine, propValue, propTernary] = match
  const startIndex = match.index
  const endIndex = startIndex + propLine.length - propTernary.length

  // Go to the of the prop
  for (let i = 0; i < endIndex; i++) {
    await page.keyboard.press('ArrowRight')
  }

  // Delete the value of the prop 
  for (let i = 0; i < propValue.length; i++) {
    await page.keyboard.press('Backspace')
  }

  // Input the new value of the prop
  await page.keyboard.type(" " + value.trim())
  await page.waitForTimeout(100)
  await page.keyboard.press('Escape')
  return await page.waitForTimeout(100)
}


test('table can have it\'s version changed via props', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  inputSimpleTable(page)

  // find and confirm existance of first data cell
  expect(await page.locator('table tbody tr >> nth=0').innerHTML()).toContain('A1</td>')

  // change to a version 2 table
  await setPropInFirstBlock(page, block, 'logseq.table.version', '2')

  // find and confirm existance of first data cell in new format
  expect(await page.locator('[data-test-id="v2-table-container"]').innerHTML()).toContain('A1</div>')
  // await page.keyboard.press('Shift+Enter')
  // await page.keyboard.type('logseq.table.version:: 2') 
})

test('table can configure logseq.color::', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // check for default general config 
  expect(await page.locator('[data-test-id="v2-table-gradient-accent"]')).not.toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.color', 'red')

  // check for gradient accent 
  expect(await page.locator('[data-test-id="v2-table-gradient-accent"]')).toBeVisible()
})

test('table can configure logseq.table.hover::', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  await page.waitForTimeout(100)
  await page.locator('text=A1').hover()
  // await page.waitForTimeout(100)
  // await page.pause()
  expect(await page.locator('text=A1').getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  expect(await page.locator('text=B1').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=A2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=B2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'row')

  await page.waitForTimeout(100)
  await page.locator('text=A1').hover()
  expect(await page.locator('text=A1').getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  expect(await page.locator('text=B1').getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=A2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=B2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'col')

  await page.waitForTimeout(100)
  await page.locator('text=A1').hover()
  expect(await page.locator('text=A1').getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  expect(await page.locator('text=B1').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=A2').getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=B2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'both')

  await page.waitForTimeout(100)
  await page.locator('text=A1').hover()
  expect(await page.locator('text=A1').getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  expect(await page.locator('text=B1').getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=A2').getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=B2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'none')

  await page.waitForTimeout(100)
  await page.locator('text=A1').hover()
  expect(await page.locator('text=A1').getAttribute('class')).not.toContain('bg-[color:var(--ls-quaternary-background-color)]')
  expect(await page.locator('text=B1').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=A2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  expect(await page.locator('text=B2').getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
})

test('table can configure logseq.table.headers', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // Check none (default)
  expect(await page.locator('text="Header A"')).toBeVisible()

  // Check none (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'none')
  expect(await page.locator('text="Header A"')).toBeVisible()

  // Check uppercase
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'uppercase')
  expect(await page.locator('text="HEADER A"')).toBeVisible()

  // Check lowercase
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'lowercase')
  expect(await page.locator('text="header a"')).toBeVisible()

  // Check capitalize
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'capitalize')
  expect(await page.locator('text="Header A"')).toBeVisible()

  // Check capitalize-first
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'capitalize-first')
  expect(await page.locator('text="Header a"')).toBeVisible()
})

test('table can configure logseq.table.borders', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // Check true (default)
  expect(await page.locator('[data-test-id="v2-table-container"]')).toHaveCSS("gap", /^[^1-9]*/)

  // Check true (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.borders', 'true')
  expect(await page.locator('[data-test-id="v2-table-container"]')).toHaveCSS("gap", /^[^1-9]*/)

  // Check false
  await setPropInFirstBlock(page, block, 'logseq.table.borders', 'false')
  expect(await page.locator('[data-test-id="v2-table-container"]')).not.toHaveCSS("gap", /^[^1-9]*/)
})

test('table can configure logseq.table.stripes', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)
  await page.waitForTimeout(100)

  // Check false (default)
  await expect(await page.locator('text=A1').getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")
  await expect(await page.locator('text=A2').getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")

  // Check false (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.stripes', 'false')
  await expect(await page.locator('text=A1').getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")
  await expect(await page.locator('text=A2').getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")

  // Check false
  await setPropInFirstBlock(page, block, 'logseq.table.stripes', 'true')
  await expect(await page.locator('text=A1').getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")
  await expect(await page.locator('text=A2').getAttribute('class')).toContain("bg-[color:var(--ls-secondary-background-color)]")
})

test('table can configure logseq.table.compact', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)
  await page.waitForTimeout(100)

  // Check false (default)
  const defaultClasses = await page.locator('text=A1').getAttribute('class')

  // Check false (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.compact', 'false')
  const falseClasses = await page.locator('text=A1').getAttribute('class')

  // Check false
  await setPropInFirstBlock(page, block, 'logseq.table.compact', 'true')
  const trueClasses = await page.locator('text=A1').getAttribute('class')

  const getPX = (str) => {
    const match = str.match(/px-\[([0-9\.]*)[a-z]*\]/)
    return match ? parseFloat(match[1]) : null
  }

  expect(getPX(defaultClasses)).toEqual(getPX(falseClasses))
  expect(getPX(defaultClasses)).toBeGreaterThan(getPX(trueClasses))
})

test('table can configure logseq.table.cols::', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // check for default general config 
  expect(await page.locator('text=A1')).toBeVisible()
  expect(await page.locator('text=B1')).toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.table.cols', 'Header A, Header B')
  expect(await page.locator('text=A1')).toBeVisible()
  expect(await page.locator('text=B1')).toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.table.cols', 'Header A')
  expect(await page.locator('text=A1')).toBeVisible()
  expect(await page.locator('text=B1')).not.toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.table.cols', 'Header B')
  expect(await page.locator('text=A1')).not.toBeVisible()
  expect(await page.locator('text=B1')).toBeVisible()
})
