/*
 * SITE CONFIG — every replaceable DEANE detail lives here.
 *
 * The page reads this on load: elements marked data-cfg="path.to.value" get
 * their text from it, and the receipt, poster tabs, marquee and Deane's lines
 * are built from the arrays below.
 *
 * Until something is confirmed by the project, leave it empty or [bracketed]:
 *  - An empty `url` renders as a labelled placeholder that never links out.
 *  - An empty `contract.address` renders as "Not published yet" and the copy
 *    button refuses to copy anything.
 *  - Any value written as [like this] renders greyed out as an open placeholder.
 * Never paste an address, listing, partner or number that is not real.
 */
window.SITE_CONFIG = {
  // While true, buy buttons open a notice instead of linking anywhere, and the
  // preview labels stay visible. Flip only when every link below is verified.
  preview: true,

  brand: {
    name: 'DEANE',
    ticker: '$DEANE',
    metaTitle: 'DEANE ($DEANE)',
    metaDescription: 'Everybody knows a Deane. $DEANE is a meme coin. Links and token details are posted here once official.',
  },

  // Mirrored as defaults at the top of styles.css; keep both in sync.
  colors: {
    blue: '#2433ff',   // the brand ground
    cream: '#f4eedf',  // paper, Deane's face
    ink: '#121212',    // outlines and type
    yellow: '#ffd83d', // stickers, tape, the buy button
    grey: '#8a857a',   // placeholders and small print
  },

  // Official destinations. Leave url empty until it is real.
  links: {
    buy: { label: 'Buy $DEANE', url: '' },
    chart: { label: 'Chart', url: '' },
    x: { label: 'X', handle: '[handle TBD]', url: '' },
    telegram: { label: 'Telegram', handle: '[group TBD]', url: '' },
  },

  hero: {
    line: 'Everybody knows a Deane.',
    sub: 'He was here before you got here.',
    note: '← that’s him',
  },

  // What Deane says when you poke him. Last line repeats once he is fed up.
  deane: {
    // Path to supplied artwork (e.g. 'assets/deane.png') to replace the drawn
    // Deane in the hero and on the poster. Empty keeps the SVG.
    src: '',
    alt: 'Deane: a man with a cowlick, heavy-lidded eyes and a small smirk',
    lines: ['gm.', 'i was here first.', 'who asked.', 'deane.', 'not now. i’m early.', 'you wouldn’t get it.', 'ok that’s enough.'],
  },

  marquee: ['$DEANE', 'Deane is Deane', 'Don’t ask who Deane is', 'He’s already in the chat', 'Not financial advice'],

  about: {
    title: 'Who is Deane?',
    not: ['a dog', 'a frog', 'a cat in a hat', 'a guy with a roadmap'],
    is: 'Just Deane.',
    copy: 'Deane doesn’t explain himself. Deane doesn’t do threads. You either get it now or you get it later.',
    aside: '(we checked)',
  },

  token: {
    title: 'The boring part.',
    copy: 'Real numbers go here once they’re real. Until then, everything on the receipt is a placeholder.',
    rows: [
      { label: 'Ticker', value: '$DEANE' },
      { label: 'Chain', value: '[TBD]' },
      { label: 'Supply', value: '[TBD]' },
      { label: 'Tax', value: '[TBD]' },
      { label: 'Liquidity', value: '[TBD]' },
    ],
    howTo: [
      'Get a self-custody wallet on [chain].',
      'Fund it with [chain]’s native coin.',
      'Swap using only the contract address posted here.',
    ],
  },

  contract: {
    address: '', // leave empty until a real, verified address exists
  },

  community: {
    title: 'Find the others.',
    copy: 'Deane’s people are already online. Tear a tab.',
    poster: {
      lastSeen: 'Your group chat, 3:12 AM',
      answersTo: 'Deane. Sometimes “bro.”',
      ifFound: 'Do not explain anything to him.',
    },
  },

  footer: {
    preview: 'Preview build. Token details and links are placeholders until they are officially posted here and on DEANE’s own channels. Nothing on this page is a contract address, a listing or a partnership.',
    risk: 'Meme coins are extremely volatile and can go to zero. Only put in what you can afford to lose. Nothing here is financial advice.',
  },

  notice: {
    title: 'Not yet, bro.',
    body: 'The buy link hasn’t been posted, so this button doesn’t go anywhere yet. When it does, only trust the contract address shown on this site and DEANE’s official channels.',
    close: 'Fine',
  },
};
