/*
 * SITE CONFIG — every replaceable DEANE detail lives here, once.
 *
 * Each official fact (network, contract, buy venue, chart, explorer, socials)
 * is defined in exactly one place below and rendered everywhere it appears:
 * the hero bar, the how-to-buy steps, the official-details receipt, the
 * community poster and the footer. Change it here and it changes everywhere.
 *
 * Until something is confirmed by the project, leave it empty or [bracketed]:
 *  - An empty `url` renders as a labelled placeholder that never links out.
 *  - An empty `contract.address` renders as "Not published yet" and every
 *    copy button refuses to copy anything.
 *  - Any value containing [brackets] renders greyed out as an open placeholder.
 *  - A token fact only shows a "verify" link when you give it a `proof` URL.
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
    metaDescription: 'Everybody knows a Deane. How to buy $DEANE, the official contract address and the official links, all in one place.',
  },

  // Mirrored as defaults at the top of styles.css; keep both in sync.
  colors: {
    blue: '#2433ff',   // the brand ground
    cream: '#f4eedf',  // paper, Deane's face
    ink: '#121212',    // outlines and type
    yellow: '#ffd83d', // stickers, tape, the buy button
    grey: '#8a857a',   // placeholders and small print
  },

  // The chain $DEANE lives on. Used in the hero bar, the steps and the receipt.
  network: {
    name: '[Network TBD]',         // e.g. the chain's name
    nativeCoin: '[native coin TBD]', // the coin used to buy and pay fees on it
  },

  contract: {
    address: '', // leave empty until a real, verified address exists
  },

  // Official destinations. Leave url empty until it is real.
  links: {
    buy: { label: 'Buy $DEANE', venue: '[DEX TBD]', url: '' },
    chart: { label: 'Chart', url: '' },
    explorer: { label: 'Explorer', url: '' },
    x: { label: 'X', cta: 'Follow on X', handle: '[handle TBD]', url: '' },
    telegram: { label: 'Telegram', cta: 'Join Telegram', handle: '[group TBD]', url: '' },
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
    copy: 'Every group chat has one. He was early, he won’t explain, and somehow he’s always right there. $DEANE is for everyone who knows a Deane, or is one.',
    aside: '(we checked)',
  },

  // The buying guide. {network}, {nativeCoin} and {venue} are filled in from
  // the values above, so the steps never disagree with the rest of the page.
  howToBuy: {
    title: 'How to buy $DEANE',
    copy: 'Never bought a meme coin? Four steps, about five minutes. No wallet connection needed to read this page.',
    steps: [
      {
        title: 'Get a wallet',
        body: 'Install a self-custody wallet that supports {network}. Write the recovery phrase on paper. Never type it into a website or share it with anyone.',
      },
      {
        title: 'Add {nativeCoin}',
        body: 'Buy {nativeCoin} on an exchange you already use and send it to your wallet. You swap it for $DEANE and keep a little for network fees.',
      },
      {
        title: 'Copy the official contract',
        body: 'Copy it from this page only. Fake tokens copy the name and the picture, never the address.',
        action: 'copy',
      },
      {
        title: 'Swap on {venue}',
        body: 'Open the official link, paste the address, check the first and last characters match, then swap.',
        action: 'buy',
      },
    ],
    warning: 'Deane will never DM you first, ask for your recovery phrase, or ask you to connect a wallet to “claim” anything. If a link is not on this page or pinned in the official channels, it is not ours.',
  },

  // Facts shown on the receipt. Add `proof: 'https://…'` to a row once there
  // is a public page that backs it up (an explorer page, a lock certificate,
  // an audit); only rows with proof get a "verify" link.
  token: {
    rows: [
      { label: 'Supply', value: '[TBD]', proof: '' },
      { label: 'Buy / sell tax', value: '[TBD]', proof: '' },
    ],
  },

  community: {
    title: 'Find the others.',
    copy: 'Deane’s people are already online. Tear a tab. These are the only official accounts.',
    poster: {
      lastSeen: 'Your group chat, 3:12 AM',
      answersTo: 'Deane. Sometimes “bro.”',
      ifFound: 'Do not explain anything to him.',
    },
  },

  footer: {
    preview: 'Preview build. The network, contract address, buy venue and links are placeholders until they are officially posted here and pinned in DEANE’s own channels. Nothing on this page is a listing or a partnership.',
    risk: 'Meme coins are extremely volatile and can go to zero. Only put in what you can afford to lose. Nothing here is financial advice.',
  },

  notice: {
    title: 'Not yet, bro.',
    body: 'The official buy link hasn’t been posted, so this button doesn’t go anywhere yet. When it does, it will open the official listing in a new tab. Nothing is bought on this website itself.',
    close: 'Fine',
    guide: 'Read how to buy',
  },
};
