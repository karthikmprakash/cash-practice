# Components

Tokens live in `replica/design/tokens.json` and `tokens.css`. Contrast: 13 pairs, 0 failing AA (2026-10-10).

Button
  variants  primary, secondary, ghost, danger
  sizes     md 40px
  states    default, hover, focus-visible (2px accent ring), disabled
  tokens    accent / on-accent, border-input, danger, radius sm
  a11y      real button or link, visible focus, label kept when disabled
  used on   all screens

Text field
  variants  text, email, password, date, time
  states    empty, filled, invalid
  tokens    surface, border-input, text, radius sm
  a11y      label wraps the control
  used on   S03, S04, S08, S09, S10, S12, S13

Select
  variants  time zone, duration
  states    default
  a11y      labelled
  used on   S04, S09

Checkbox
  variants  agreement, consent, reminder, video
  states    unchecked, checked, focus
  a11y      label text is the accessible name
  used on   S04, S09, S12, S13

Card
  variants  section
  states    empty, filled
  tokens    surface, border, shadow card, radius md
  used on   all

Notice
  variants  error, success
  states    hidden, shown
  a11y      role=alert for errors
  used on   forms

Calendar column
  variants  day, week
  states    empty ("Open"), filled
  used on   S06

Shell
  variants  sidebar, stacked under 800px
  states    signed in
  a11y      nav landmark, skip link
  used on   practice screens

Video room
  variants  link, connect
  states    ready, connecting
  a11y      named link and button
  used on   S11
