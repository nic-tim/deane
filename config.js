/*
 * SITE CONFIG — the one file to edit when rebranding.
 *
 * Everything a client will eventually supply lives here: name, ticker,
 * colours, copy, token figures, links. The page reads this object on load and
 * fills every element marked with data-cfg="path.to.value", and builds the
 * tokenomics ledger, the buy steps and the social rows from the arrays below.
 *
 * Rules for this file while it is still a demo:
 *  - Leave `contract.address` empty until a real, verified address exists.
 *    An empty value renders as "Not yet published", never a made-up string.
 *  - Leave social `url` values empty until the client gives real accounts.
 *    An empty URL renders as a labelled demo placeholder, not a dead link.
 *  - Keep `demo: true` until launch. It drives every "illustrative" label and
 *    the notice shown when someone presses a buy button.
 */
window.SITE_CONFIG = {
  demo: true,

  brand: {
    name: 'MOONROT',
    ticker: '$ROT',
    tagline: 'The moon went bad. We moved in.',
    // Shown in the browser tab and link previews.
    metaTitle: 'MOONROT ($ROT) — concept site',
    metaDescription:
      'MOONROT is a fictional meme coin concept built to demonstrate a launch website. No token exists.',
  },

  // Written to CSS custom properties on load. The same values are the
  // defaults in styles.css, so the page looks right before this runs.
  colors: {
    ink: '#0b0c0a',       // page background
    charcoal: '#141612',  // raised bands
    line: '#2a2e25',      // rules and outlines
    bone: '#e8eadf',      // primary text
    fog: '#9a9e8f',       // secondary text
    acid: '#c8ff1f',      // the accent — spend it sparingly
    moss: '#4d5a1f',      // mascot shadow, secondary chart tone
  },

  // Set `src` to an image path (e.g. 'assets/mascot.png') to replace the
  // drawn moon with the client's own mascot art. Empty keeps the SVG.
  mascot: {
    src: '',
    alt: 'The MOONROT mascot: a cratered, half-rotten moon with one wide eye and a crooked grin',
  },

  hero: {
    // Each string is one line of the headline. Line breaks are deliberate.
    headline: ['The internet', 'has a new', 'problem.'],
    copy:
      'Someone left the moon out too long. It went soft, grew an eye and started posting. ' +
      'MOONROT is what happens when the thing everyone promised turns up late and slightly off.',
    primaryCta: 'Buy $ROT',
    secondaryCta: 'Join the cult',
    // Where Buy goes once `demo` is false. Must be the client's verified
    // official listing. While demo is true this is ignored.
    buyUrl: '',
  },

  marquee: [
    'Demo concept',
    'No token exists',
    'The moon is off',
    'Do not refrigerate',
    'Not financial advice',
    'Best before: never',
  ],

  about: {
    eyebrow: 'The lore',
    headline: 'Everyone promised the moon. Nobody checked the date on it.',
    chapters: [
      {
        title: 'The moon got old.',
        body: 'Every cycle, a thousand projects swore they were going there. Years of rockets and promises later, it sat in the sky going quietly green.',
      },
      {
        title: 'Something moved in.',
        body: 'A crater opened an eye. A worm took the lease. The moon stopped reflecting the sun and started reflecting the timeline.',
      },
      {
        title: 'Now it is your problem.',
        body: 'MOONROT does not go to the moon. MOONROT is the moon, and it would like a word about the smell.',
      },
    ],
    pullQuote: 'Ripe is a feeling.',
  },

  // Every figure here is a placeholder for layout only.
  tokenomics: {
    headline: 'How the rot is portioned',
    totalSupply: '1,000,000,000',
    supplyLabel: 'Total supply (illustrative)',
    allocations: [
      { label: 'Community & public', percent: 70, note: 'Placeholder split for layout' },
      { label: 'Liquidity', percent: 15, note: 'Lock status to be confirmed by client' },
      { label: 'Marketing', percent: 8, note: 'Placeholder split for layout' },
      { label: 'Treasury', percent: 7, note: 'Vesting terms to be confirmed' },
    ],
    // Rows in the facts strip. Values in [brackets] are open placeholders.
    facts: [
      { label: 'Network', value: '[To be confirmed]' },
      { label: 'Buy / sell tax', value: '[To be confirmed]' },
      { label: 'Ownership', value: '[To be confirmed]' },
      { label: 'Audit', value: '[None — not yet audited]' },
    ],
  },

  contract: {
    address: '', // leave empty until a real, verified address exists
    network: '[Network to be confirmed]',
  },

  howToBuy: {
    headline: 'Three steps to catching it',
    steps: [
      {
        title: 'Set up a compatible wallet',
        body: 'Install a self-custody wallet that supports [NETWORK]. Write your recovery phrase on paper and never share it with anyone, including us.',
      },
      {
        title: 'Fund it with the network asset',
        body: 'Add [NETWORK ASSET] to the wallet so you can pay for the swap and its network fees.',
      },
      {
        title: 'Buy from the official listing',
        body: 'Only use the contract address published on this site and our official channels. Paste it, check every character, then swap.',
      },
    ],
  },

  community: {
    headline: ['Join', 'the cult.'],
    subline: 'Bring snacks. Ignore the smell.',
    copy: 'The moon is loud online. Come for the memes, stay because the door is stuck.',
    socials: [
      { name: 'X', handle: '@moonrot', url: '' },
      { name: 'Telegram', handle: 't.me/moonrot', url: '' },
    ],
  },

  footer: {
    disclaimer:
      'MOONROT and $ROT are fictional placeholder branding created to demonstrate a website design. ' +
      'No token, contract, trading market, liquidity, partnership or community exists. All figures are illustrative.',
    risk:
      'Cryptocurrencies, and meme coins in particular, are highly speculative and volatile. You can lose all of the money you put in. ' +
      'Nothing on this site is financial, investment or legal advice. Do your own research.',
  },

  // What the buy buttons say while demo is true.
  demoNotice: {
    title: 'This one is for show.',
    body: '$ROT does not exist. This site is a design demonstration, so there is nothing to buy, no wallet will be connected and no transaction will be made.',
    close: 'Got it',
  },
};
