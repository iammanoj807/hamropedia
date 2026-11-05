// A drawn (not real) person for the photo tool: the "right / too small / too big" examples
// on the page, and the practice photo in public/images/tools/ (scripts/make-photo-example.mjs).

/**
 * The person as SVG shapes. `headH` is the head height, chin to top of hair; `top` is where
 * the top of the hair is; `cx` is the middle of the face. All in the units of the frame.
 */
export function personShapes({ cx, top, headH: s, frameH }) {
  const y = (f) => (top + f * s).toFixed(1);
  const x = (f) => (cx + f * s).toFixed(1);
  const r = (f) => (f * s).toFixed(1);
  const bottom = frameH + s; // shoulders run past the bottom edge
  return `<path d="M${x(-1.05)} ${bottom} C${x(-1.02)} ${y(1.28)} ${x(-0.62)} ${y(1.12)} ${x(-0.2)} ${y(1.08)} L${x(0.2)} ${y(1.08)} C${x(0.62)} ${y(1.12)} ${x(1.02)} ${y(1.28)} ${x(1.05)} ${bottom} Z" fill="#2f3e5c"/>
<rect x="${x(-0.13)}" y="${y(0.86)}" width="${r(0.26)}" height="${r(0.3)}" fill="#cf9f7a"/>
<path d="M${x(-0.2)} ${y(1.08)} L${x(0)} ${y(1.32)} L${x(0.2)} ${y(1.08)} Z" fill="#f4f6fb"/>
<ellipse cx="${x(0)}" cy="${y(0.42)}" rx="${r(0.4)}" ry="${r(0.42)}" fill="#2b2622"/>
<ellipse cx="${x(-0.34)}" cy="${y(0.56)}" rx="${r(0.055)}" ry="${r(0.09)}" fill="#d9a983"/>
<ellipse cx="${x(0.34)}" cy="${y(0.56)}" rx="${r(0.055)}" ry="${r(0.09)}" fill="#d9a983"/>
<ellipse cx="${x(0)}" cy="${y(0.57)}" rx="${r(0.335)}" ry="${r(0.43)}" fill="#e3b791"/>
<path d="M${x(-0.33)} ${y(0.36)} C${x(-0.2)} ${y(0.16)} ${x(0.22)} ${y(0.14)} ${x(0.34)} ${y(0.34)} C${x(0.3)} ${y(0.2)} ${x(-0.28)} ${y(0.16)} ${x(-0.33)} ${y(0.36)} Z" fill="#2b2622"/>
<circle cx="${x(-0.13)}" cy="${y(0.52)}" r="${r(0.032)}" fill="#2a1d14"/>
<circle cx="${x(0.13)}" cy="${y(0.52)}" r="${r(0.032)}" fill="#2a1d14"/>
<path d="M${x(-0.2)} ${y(0.44)} Q${x(-0.13)} ${y(0.41)} ${x(-0.06)} ${y(0.44)} M${x(0.06)} ${y(0.44)} Q${x(0.13)} ${y(0.41)} ${x(0.2)} ${y(0.44)}" stroke="#3a2a20" stroke-width="${r(0.022)}" fill="none" stroke-linecap="round"/>
<path d="M${x(0)} ${y(0.56)} L${x(-0.03)} ${y(0.67)} L${x(0.03)} ${y(0.68)}" stroke="#b9876a" stroke-width="${r(0.018)}" fill="none" stroke-linecap="round"/>
<path d="M${x(-0.09)} ${y(0.8)} Q${x(0)} ${y(0.84)} ${x(0.09)} ${y(0.8)}" stroke="#9c5a4a" stroke-width="${r(0.022)}" fill="none" stroke-linecap="round"/>`;
}

/** The two DV ovals (head 50% and 69% of the height, centred at 46%), as drawn by the tool. */
export function guideOvals(W, H, shares = [0.5, 0.69], cy = 0.46) {
  return shares
    .map((share) => {
      const ry = (share * H) / 2;
      const rx = Math.min(ry * 0.74, W * 0.46);
      return `<ellipse cx="${W / 2}" cy="${cy * H}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 9"/><ellipse cx="${W / 2}" cy="${cy * H}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="#2453c4" stroke-width="5" stroke-dasharray="14 9" stroke-dashoffset="14"/>`;
    })
    .join('');
}

/** One example square (600 × 600) with the guide, for the page. */
export function exampleSvg({ headShare, label, ok }) {
  const W = 600;
  const H = 600;
  const s = headShare * H;
  const top = 0.46 * H - s / 2;
  return `<figure class="ph-example ${ok ? 'is-ok' : 'is-bad'}">
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"><rect width="${W}" height="${H}" fill="#f6f6f3"/>${personShapes({ cx: W / 2, top, headH: s, frameH: H })}${guideOvals(W, H)}</svg>
<figcaption><span aria-hidden="true">${ok ? '✓' : '✗'}</span> ${label}</figcaption>
</figure>`;
}
