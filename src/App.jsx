import { useEffect, useMemo, useState } from 'react'

const PRICE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIF4_zf8CzPSI4xu1Et9eE3bg7YoD3hLS0CIr1IHdPOteg9lunyY5U4GcbJAtwwg/pub?gid=2002829009&single=true&output=csv'
const SHOP_LOCATION_URL = 'https://maps.app.goo.gl/R1La135fgLUqaeT76'
const SHOP_NAME = 'Bhavesh (Durga) Fruits and Vegetables'
const produceStyle = {
  tomato: ['🍅', 'coral'], potato: ['🥔', 'sand'], onion: ['🧅', 'lilac'],
  carrot: ['🥕', 'peach'], spinach: ['🥬', 'mint'], cauliflower: ['🥦', 'sage'],
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1 }
      else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(cell); cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(values => values.some(value => value.trim()))
}

function getVegetables(csv) {
  const rows = parseCsv(csv)
  const headerIndex = rows.findIndex(row => row.some(value => value.trim().toLowerCase() === 'vegetable') && row.some(value => value.trim().toLowerCase().includes('price')))
  if (headerIndex < 0) throw new Error('The sheet needs a Vegetable and Price header row.')
  const headers = rows[headerIndex].map(value => value.trim().toLowerCase())
  const column = name => headers.findIndex(value => value === name.toLowerCase())
  const nameCol = column('Vegetable')
  const hindiCol = column('Hindi Name')
  const priceCol = headers.findIndex(value => value.startsWith('price'))
  const unitCol = column('Unit')
  const categoryCol = column('Category')
  const availableCol = column('Available')
  return rows.slice(headerIndex + 1).flatMap(values => {
    const name = values[nameCol]?.trim()
    const price = Number((values[priceCol] || '').replace(/[^\d.-]/g, ''))
    if (!name || !Number.isFinite(price)) return []
    const available = (values[availableCol] || 'yes').trim().toLowerCase()
    if (['no', 'false', 'out', 'unavailable'].includes(available)) return []
    const [emoji, color] = produceStyle[name.toLowerCase()] || ['🥗', 'mint']
    return [{ name, hindi: values[hindiCol]?.trim() || '', price, unit: values[unitCol]?.trim() || 'kg', category: values[categoryCol]?.trim() || 'Vegetables', emoji, color }]
  })
}

function App() {
  const [vegetables, setVegetables] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [category, setCategory] = useState('All items')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(PRICE_SHEET_CSV_URL, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Could not load the published price list.'); return response.text() })
      .then(csv => { const rows = getVegetables(csv); if (!rows.length) throw new Error('No price rows were found in the sheet.'); setVegetables(rows); setLoadError('') })
      .catch(error => { if (error.name !== 'AbortError') setLoadError(error.message || 'Could not load prices.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const categories = useMemo(() => ['All items', ...new Set(vegetables.map(item => item.category))], [vegetables])
  const items = useMemo(() => vegetables.filter(item => (category === 'All items' || item.category === category) && `${item.name} ${item.hindi}`.toLowerCase().includes(query.toLowerCase())), [category, query, vegetables])

  return <main className="page">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">f</span> freshprice</a><span className={`live ${loadError ? 'offline' : ''}`}><i />{loading ? 'Loading prices' : loadError ? 'Prices unavailable' : 'Live prices'}</span></header>
    <section className="shop-head"><div className="eyebrow">YOUR NEIGHBOURHOOD MARKET</div><h1>{SHOP_NAME}</h1><p>Fresh vegetables. Honest prices.</p><div className="shop-meta"><a href={SHOP_LOCATION_URL} target="_blank" rel="noreferrer">📍&nbsp; View shop location in Maps ↗</a><span>Prices from the shop’s live list</span></div></section>
    <section className="catalog"><div className="catalog-title"><div><div className="eyebrow">WHAT’S FRESH</div><h2>Today’s vegetables</h2></div><label className="search"><span>⌕</span><input aria-label="Search vegetables" placeholder="Find a vegetable" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <nav className="filters" aria-label="Vegetable categories">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</nav>
      {loading && <p className="empty">Loading the latest prices…</p>}
      {loadError && <p className="empty error">{loadError} Check that the Prices tab is published as CSV, then refresh this page.</p>}
      {!loading && !loadError && <><div className="grid">{items.map(item => <article className="card" key={item.name}><div className={`produce ${item.color}`}><span>{item.emoji}</span><span className="fresh-tag">FRESH</span></div><div className="card-info"><div><h3>{item.name}</h3><p>{item.hindi}</p></div><div className="price"><strong>₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong><span>per {item.unit}</span></div></div></article>)}</div>{items.length === 0 && <p className="empty">No vegetables match your search.</p>}</>}
    </section><footer><span>🌱 &nbsp;Picked fresh for you</span><span>Prices may vary by availability</span></footer>
  </main>
}
export default App
