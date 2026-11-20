# Mohit Kumar · personal website

Source for **[personal-website-rho-mocha.vercel.app](https://personal-website-rho-mocha.vercel.app)**, my personal site with my projects, experience and contact details.

It's plain HTML, CSS and JavaScript, with no framework, no build step and no dependencies.

## Run it locally

Open `index.html` in a browser. To serve it over HTTP instead:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Structure

```
index.html                  the page: all content, including the inline SVG project diagrams
assets/
  css/
    tokens.css              colours, fonts and layout variables
    base.css                reset, film grain, links, focus styles, shared type
    hero.css                nav, name, portrait animation, call-to-action buttons
    work.css                projects section: the card wheel and the glass project panels
    experience.css          internship timeline and leadership list
    about.css               bio, education, skills, certification badges
    contact.css             closing contact band
  js/
    in-page-links.js        smooth scrolling for in-page links, without changing the URL
    copy-email.js           "Copy email" button
    project-wheel.js        builds the projects wheel from the project panels
  images/
    portraits/              hero and contact portraits (880 × 1168)
    badges/                 certification badges
  icons/                    favicons and the Apple touch icon
```

The stylesheets are loaded in the order above, which is also their cascade order. Each section of the page has its own file.

## Editing

- **Text and projects** are in `index.html`, one `<section>` per part of the page. To add a project, copy one of the `<article class="holo proj">` panels in `#work` and give it a card colour with `data-theme` (`silver`, `ink`, `orange` or `violet`). Its diagram is an inline SVG that uses the `.viz` classes from `work.css`. The wheel builds each card from its panel (number, category, title and diagram), and without JavaScript the panels show as a grid.
- **Colours and fonts** are set in `assets/css/tokens.css`.
- **Scripts** are classic `defer` scripts, not ES modules, so the page still works when opened straight from the file system.

## Deployment

Vercel serves the repository root as a static site and redeploys on every push to `main`.

## Accessibility

The layout works down to 375px wide without horizontal scrolling. Every interactive element shows a visible keyboard focus. Under `prefers-reduced-motion`, the load animation, hover transitions and smooth scrolling are all turned off.
