# Sundew website

The marketing site for Sundew, a mobile spray tan business that partners with other businesses. Sundew is a brand of Sundew Group LLC. Live address: https://www.sundewgroup.com

Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Files

| File | What it controls |
| --- | --- |
| `index.html` | All page content and copy, one commented block per section |
| `css/styles.css` | The look. Colors, fonts and spacing are tokens in `:root` at the top |
| `js/config.js` | Contact email and optional form service URL |
| `js/main.js` | Mobile menu and contact form behavior |
| `assets/favicon.svg` | Browser tab icon |
| `404.html` | Page shown for broken links |
| `CNAME` | Tells GitHub Pages to serve the site at www.sundewgroup.com |
| `robots.txt`, `sitemap.xml` | Search engine basics |

## Before launch

Search `index.html` for `[` to find every placeholder (service area, rates, phone, insurance details, testimonial) and replace each with your real information. Set your real inbox in `js/config.js`.

## Preview on your computer

Open `index.html` in a browser, or from this folder run `python3 -m http.server 8000` and visit http://localhost:8000.

## Publish with GitHub Pages

1. Push this repository to GitHub.
2. In the repository, go to Settings > Pages. Under "Build and deployment", choose "Deploy from a branch", then branch `main` and folder `/ (root)`.
3. Under "Custom domain", enter `www.sundewgroup.com`.
4. At your domain registrar, add a DNS `CNAME` record for `www` pointing to `<your-github-username>.github.io`.
5. Once the domain check passes, tick "Enforce HTTPS".

## Contact form

A static site cannot send email by itself. By default the form opens the visitor's email app with their request filled in. To collect requests without that step, create a form at a service such as Formspree and paste its URL into `formEndpoint` in `js/config.js`.
