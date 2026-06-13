// Inline SVG icons — 24px grid, stroke currentColor, strokeWidth 1.75
const Icon = ({ d, size = 22, fill = 'none', stroke = 'currentColor', sw = 1.75, children, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d}/> : children}
  </svg>
);

// Library — each is a thin wrapper so you get semantic names
const I = {
  home:   (p) => <Icon {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-4v-6h-8v6H4a1 1 0 0 1-1-1z"/></Icon>,
  pantry: (p) => <Icon {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M12 3v18"/></Icon>,
  chef:   (p) => <Icon {...p}><path d="M6 13a4 4 0 1 1 3-7 4 4 0 0 1 6 0 4 4 0 1 1 3 7v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M8 17h8"/></Icon>,
  cart:   (p) => <Icon {...p}><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h11l2-8H6"/></Icon>,
  user:   (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Icon>,
  bell:   (p) => <Icon {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>,
  plus:   (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  camera: (p) => <Icon {...p}><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></Icon>,
  check:  (p) => <Icon {...p}><path d="M4 12l5 5L20 6"/></Icon>,
  close:  (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>,
  chevronR:(p)=> <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  chevronL:(p)=> <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  chevronD:(p)=> <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  clock:  (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></Icon>,
  flame:  (p) => <Icon {...p}><path d="M12 3s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/></Icon>,
  sparkle:(p) => <Icon {...p}><path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8z"/><path d="M19 15l.7 1.8L21.5 17l-1.8.7L19 19.5l-.7-1.8L16.5 17l1.8-.7z"/></Icon>,
  filter: (p) => <Icon {...p}><path d="M4 5h16l-6 8v5l-4 2v-7z"/></Icon>,
  more:   (p) => <Icon {...p} sw={2}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></Icon>,
  trash:  (p) => <Icon {...p}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/></Icon>,
  edit:   (p) => <Icon {...p}><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"/></Icon>,
  users:  (p) => <Icon {...p}><circle cx="9" cy="9" r="3.5"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0"/><path d="M16 10a3 3 0 0 0 0-6M21 19a5 5 0 0 0-4-5"/></Icon>,
  back:   (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  image:  (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 18l5-5 4 4 3-3 4 4"/></Icon>,
  bolt:   (p) => <Icon {...p}><path d="M13 3L4 14h6l-1 7 9-11h-6z"/></Icon>,
  list:   (p) => <Icon {...p}><path d="M4 6h16M4 12h16M4 18h11"/></Icon>,
  scan:   (p) => <Icon {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M3 12h18"/></Icon>,
  info:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></Icon>,
  warning:(p) => <Icon {...p}><path d="M12 3l10 17H2z"/><path d="M12 10v4M12 17h.01"/></Icon>,
  star:   (p) => <Icon {...p}><path d="M12 3l2.7 5.8 6.3.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.3-.9z"/></Icon>,
  leaf:   (p) => <Icon {...p}><path d="M4 20c0-9 5-16 16-16 0 11-7 16-16 16z"/><path d="M4 20c4-6 8-9 14-12"/></Icon>,
};

Object.assign(window, { Icon, I });
