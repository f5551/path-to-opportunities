import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PORT = 4321;
const DIST_DIR = path.resolve('dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Start static HTTP server serving dist/
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

// Launch Chrome with CDP
function launchChrome(tempDir) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempDir}`
  ]);
  return chrome;
}

// Connect to CDP page session
async function createCdpSession(url) {
  const targetRes = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const events = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method && events.has(msg.method)) {
      events.get(msg.method)(msg.params);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const on = (method, handler) => {
    events.set(method, handler);
  };

  await new Promise((r) => { ws.onopen = r; });

  return { target, ws, send, on };
}

async function closeCdpSession(session) {
  try {
    session.ws.close();
    await fetch(`http://127.0.0.1:9222/json/close/${session.target.id}`);
  } catch (e) {}
}

const VIEWPORTS = [
  { name: '375px (Mobile)', width: 375, height: 667, mobile: true },
  { name: '768px (Tablet)', width: 768, height: 1024, mobile: true },
  { name: '1440px (Desktop)', width: 1440, height: 900, mobile: false },
  { name: '320px (Narrow Mobile Edge)', width: 320, height: 568, mobile: true },
];

const ORIENTATIONS = [
  { name: 'RTL (Arabic)', dir: 'rtl', lang: 'ar' },
  { name: 'LTR (English)', dir: 'ltr', lang: 'en' },
];

const PAGES = [
  { name: 'Home Landing', file: 'index.html', path: '/index.html' },
  { name: 'Opportunities Catalog', file: 'opportunities.html', path: '/opportunities.html' },
  { name: 'Opportunity Detail', file: 'detail.html', path: '/detail.html?id=opp-sch-001' },
  { name: 'User Guide', file: 'guide.html', path: '/guide.html' },
];

async function run() {
  console.log('================================================================');
  console.log('   EMPIRICAL RESPONSIVENESS & ZERO-OVERFLOW STRESS TEST SUITE   ');
  console.log('================================================================\n');

  const server = await startServer();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-stress-'));
  const chrome = launchChrome(tempDir);
  await new Promise((r) => setTimeout(r, 1500));

  const suiteResults = [];

  try {
    for (const page of PAGES) {
      console.log(`\n>>> Testing Page: [${page.name}] (${page.path})`);
      const session = await createCdpSession(`http://127.0.0.1:${PORT}${page.path}`);

      await session.send('Page.enable');
      await session.send('Runtime.enable');
      await session.send('DOM.enable');

      for (const vp of VIEWPORTS) {
        for (const ori of ORIENTATIONS) {
          const testLabel = `${page.name} | ${vp.name} | ${ori.name}`;

          // Set viewport
          await session.send('Emulation.setDeviceMetricsOverride', {
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 1,
            mobile: vp.mobile,
          });

          // Set orientation & language, trigger relayout and font ready
          await session.send('Runtime.evaluate', {
            expression: `
              (async () => {
                document.documentElement.setAttribute('dir', '${ori.dir}');
                document.documentElement.setAttribute('lang', '${ori.lang}');
                if (window.i18next && typeof window.i18next.changeLanguage === 'function') {
                  try { await window.i18next.changeLanguage('${ori.lang}'); } catch(e){}
                }
                // Dispatch resize event
                window.dispatchEvent(new Event('resize'));
                await document.fonts.ready;
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              })()
            `,
            awaitPromise: true,
          });

          // Wait 150ms for animations and layout adjustments
          await new Promise((r) => setTimeout(r, 150));

          // Run comprehensive layout inspection in browser context
          const evalRes = await session.send('Runtime.evaluate', {
            expression: `
              (() => {
                const innerWidth = window.innerWidth;
                const innerHeight = window.innerHeight;
                const docScrollWidth = document.documentElement.scrollWidth;
                const docClientWidth = document.documentElement.clientWidth;
                const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
                const bodyClientWidth = document.body ? document.body.clientWidth : 0;

                // Test horizontal scroll attempt
                window.scrollTo(500, 0);
                const actualScrollX = window.scrollX;
                window.scrollTo(0, 0);

                // Find overflowing elements
                const overflowingElements = [];
                const allElements = document.querySelectorAll('*');
                
                function isClippingAncestor(el) {
                  let p = el.parentElement;
                  while (p && p !== document.documentElement && p !== document.body) {
                    const cs = window.getComputedStyle(p);
                    if (cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.overflow === 'hidden' || cs.overflow === 'clip' || cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflow === 'auto' || cs.overflow === 'scroll') {
                      return true;
                    }
                    p = p.parentElement;
                  }
                  return false;
                }

                allElements.forEach((el) => {
                  if (el === document.documentElement || el === document.body) return;
                  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'HEAD' || el.tagName === 'META') return;
                  
                  const cs = window.getComputedStyle(el);
                  if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
                  
                  const rect = el.getBoundingClientRect();
                  if (rect.width === 0 || rect.height === 0) return;

                  // Check horizontal boundary violation
                  const overflowsRight = rect.right > innerWidth + 0.75;
                  const overflowsLeft = rect.left < -0.75;

                  if ((overflowsRight || overflowsLeft) && !isClippingAncestor(el)) {
                    overflowingElements.push({
                      tag: el.tagName.toLowerCase(),
                      id: el.id || null,
                      classes: el.className || null,
                      rect: {
                        left: Math.round(rect.left * 10) / 10,
                        right: Math.round(rect.right * 10) / 10,
                        width: Math.round(rect.width * 10) / 10,
                      },
                      overflowDirection: overflowsRight ? 'RIGHT' : 'LEFT',
                      overflowAmount: Math.round((overflowsRight ? (rect.right - innerWidth) : -rect.left) * 10) / 10,
                    });
                  }
                });

                // Specific Component Inspect: Hero Visual & Badges
                const heroCard = document.querySelector('.hero-visual-card');
                let heroCardInfo = null;
                if (heroCard) {
                  const r = heroCard.getBoundingClientRect();
                  const badges = [...heroCard.querySelectorAll('.hero-floating-badge')].map(b => {
                    const br = b.getBoundingClientRect();
                    return {
                      classes: b.className,
                      text: b.textContent.trim().replace(/\\s+/g, ' '),
                      left: Math.round(br.left * 10) / 10,
                      right: Math.round(br.right * 10) / 10,
                      width: Math.round(br.width * 10) / 10,
                      overflowsViewport: br.right > innerWidth || br.left < 0,
                    };
                  });
                  heroCardInfo = {
                    left: Math.round(r.left * 10) / 10,
                    right: Math.round(r.right * 10) / 10,
                    width: Math.round(r.width * 10) / 10,
                    overflowsViewport: r.right > innerWidth || r.left < 0,
                    badges,
                  };
                }

                // Specific Component Inspect: About Grid
                const aboutGrid = document.querySelector('.about-values-grid');
                let aboutGridInfo = null;
                if (aboutGrid) {
                  const r = aboutGrid.getBoundingClientRect();
                  const cs = window.getComputedStyle(aboutGrid);
                  const cards = [...aboutGrid.querySelectorAll('.about-value-card, .about-value-item')].map(c => {
                    const cr = c.getBoundingClientRect();
                    return {
                      width: Math.round(cr.width * 10) / 10,
                      height: Math.round(cr.height * 10) / 10,
                    };
                  });
                  aboutGridInfo = {
                    gridTemplateColumns: cs.gridTemplateColumns,
                    columnCount: cs.gridTemplateColumns.split(' ').length,
                    cardCount: cards.length,
                    firstCardWidth: cards[0]?.width || 0,
                    overflowsViewport: r.right > innerWidth || r.left < 0,
                  };
                }

                // Specific Component Inspect: Footer Grid & Elements
                const footer = document.querySelector('.site-footer');
                let footerInfo = null;
                if (footer) {
                  const fr = footer.getBoundingClientRect();
                  const fGrid = footer.querySelector('.footer-grid');
                  const fgStyle = fGrid ? window.getComputedStyle(fGrid) : null;
                  const brandAr = footer.querySelector('.brand-ar');
                  const brandEn = footer.querySelector('.brand-en');
                  const integrityBox = footer.querySelector('.footer-integrity-box');
                  const bottomBar = footer.querySelector('.footer-bottom-bar');
                  
                  footerInfo = {
                    overflowsViewport: fr.right > innerWidth || fr.left < 0,
                    gridColumns: fgStyle ? fgStyle.gridTemplateColumns : 'none',
                    brandArVisible: brandAr ? window.getComputedStyle(brandAr).display !== 'none' : false,
                    brandEnVisible: brandEn ? window.getComputedStyle(brandEn).display !== 'none' : false,
                    integrityBoxWidth: integrityBox ? Math.round(integrityBox.getBoundingClientRect().width * 10) / 10 : 0,
                    bottomBarWrap: bottomBar ? window.getComputedStyle(bottomBar).flexWrap : 'none',
                  };
                }

                // Check Hero SVG vs Raster
                const heroSvg = document.querySelector('.hero-illustration-svg');
                const heroImg = document.querySelector('.hero-banner-image');

                return {
                  innerWidth,
                  docScrollWidth,
                  docClientWidth,
                  bodyScrollWidth,
                  bodyClientWidth,
                  actualScrollX,
                  hasDocOverflow: docScrollWidth > innerWidth + 0.5,
                  hasBodyOverflow: bodyScrollWidth > innerWidth + 0.5,
                  overflowingElementsCount: overflowingElements.length,
                  overflowingElements: overflowingElements.slice(0, 10), // sample up to 10
                  heroCardInfo,
                  aboutGridInfo,
                  footerInfo,
                  heroArtwork: {
                    hasSvg: !!heroSvg,
                    hasRasterImg: !!heroImg,
                    imgSrc: heroImg ? heroImg.getAttribute('src') : null,
                  }
                };
              })()
            `,
            returnByValue: true,
          });

          const res = evalRes.result?.result?.value;
          const passed = !res?.hasDocOverflow && !res?.hasBodyOverflow && res?.actualScrollX === 0 && res?.overflowingElementsCount === 0;

          const testRecord = {
            page: page.name,
            viewport: vp.name,
            viewportWidth: vp.width,
            orientation: ori.name,
            dir: ori.dir,
            passed,
            innerWidth: res?.innerWidth,
            docScrollWidth: res?.docScrollWidth,
            bodyScrollWidth: res?.bodyScrollWidth,
            actualScrollX: res?.actualScrollX,
            overflowingElementsCount: res?.overflowingElementsCount,
            overflowingElements: res?.overflowingElements,
            heroCardInfo: res?.heroCardInfo,
            aboutGridInfo: res?.aboutGridInfo,
            footerInfo: res?.footerInfo,
            heroArtwork: res?.heroArtwork,
          };

          suiteResults.push(testRecord);

          const statusBadge = passed ? '[PASS]' : '[FAIL]';
          console.log(`${statusBadge} ${testLabel} -> docScroll: ${res?.docScrollWidth}px / ${res?.innerWidth}px, elements overflow: ${res?.overflowingElementsCount}`);
          if (!passed) {
            console.error(`       Overflow details:`, JSON.stringify(res?.overflowingElements, null, 2));
          }
        }
      }

      await closeCdpSession(session);
    }

    // Now test Micro-interactions: Hover lift and translateX under RTL and LTR at 375px & 1440px
    console.log(`\n>>> Testing Micro-interactions & Transform Overflow (Hover States)`);
    const hoverSession = await createCdpSession(`http://127.0.0.1:${PORT}/index.html`);
    await hoverSession.send('Page.enable');
    await hoverSession.send('Runtime.enable');

    for (const ori of ORIENTATIONS) {
      await hoverSession.send('Runtime.evaluate', {
        expression: `
          (async () => {
            document.documentElement.setAttribute('dir', '${ori.dir}');
            document.documentElement.setAttribute('lang', '${ori.lang}');
          })()
        `,
        awaitPromise: true,
      });

      // Hover on each about-value-card and footer link and hero card
      const hoverEval = await hoverSession.send('Runtime.evaluate', {
        expression: `
          (() => {
            const results = [];
            // About cards
            document.querySelectorAll('.about-value-card').forEach((card, idx) => {
              card.classList.add('hover-test');
              card.style.transform = 'translateY(-3px)';
              const r = card.getBoundingClientRect();
              results.push({
                element: 'about-value-card-' + idx,
                overflows: r.right > window.innerWidth || r.left < 0,
              });
              card.style.transform = '';
            });

            // Footer links
            document.querySelectorAll('.footer-link').forEach((link, idx) => {
              const shift = document.documentElement.dir === 'rtl' ? -4 : 4;
              link.style.transform = 'translateX(' + shift + 'px)';
              const r = link.getBoundingClientRect();
              results.push({
                element: 'footer-link-' + idx,
                overflows: r.right > window.innerWidth || r.left < 0,
              });
              link.style.transform = '';
            });

            // Hero visual card
            const heroCard = document.querySelector('.hero-visual-card');
            if (heroCard) {
              heroCard.style.transform = 'translateY(-3px)';
              const r = heroCard.getBoundingClientRect();
              results.push({
                element: 'hero-visual-card',
                overflows: r.right > window.innerWidth || r.left < 0,
              });
              heroCard.style.transform = '';
            }

            return results;
          })()
        `,
        returnByValue: true,
      });

      const hoverItems = hoverEval.result?.result?.value || [];
      const anyHoverOverflow = hoverItems.some(h => h.overflows);
      console.log(`Hover Transform Test [${ori.name}]: ${anyHoverOverflow ? '[FAIL]' : '[PASS]'} (${hoverItems.length} elements tested)`);
    }

    // Now test Hero SVG In-Memory Injection Simulation
    console.log(`\n>>> Testing Hero SVG Illustration In-Memory Replacement (Hypothesis Verification)`);
    const svgSession = await createCdpSession(`http://127.0.0.1:${PORT}/index.html`);
    await svgSession.send('Page.enable');
    await svgSession.send('Runtime.enable');

    // Inject SVG into DOM
    await svgSession.send('Runtime.evaluate', {
      expression: `
        (() => {
          const wrap = document.querySelector('.hero-image-wrapper');
          if (wrap) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 460 360');
            svg.setAttribute('class', 'hero-illustration-svg');
            svg.setAttribute('style', 'width: 100%; height: auto; display: block;');
            svg.setAttribute('aria-label', 'طريق الفرص - الرسم التوضيحي');
            svg.innerHTML = '<rect x=\"6\" y=\"6\" width=\"448\" height=\"348\" rx=\"20\" fill=\"#0F766E\"/>';
            wrap.replaceWith(svg);
          }
        })()
      `,
    });

    for (const vp of VIEWPORTS.slice(0, 3)) {
      for (const ori of ORIENTATIONS) {
        await svgSession.send('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.mobile,
        });
        await svgSession.send('Runtime.evaluate', {
          expression: `
            document.documentElement.setAttribute('dir', '${ori.dir}');
            document.documentElement.setAttribute('lang', '${ori.lang}');
          `,
        });
        await new Promise(r => setTimeout(r, 100));

        const svgEval = await svgSession.send('Runtime.evaluate', {
          expression: `
            (() => {
              const innerWidth = window.innerWidth;
              const docScrollWidth = document.documentElement.scrollWidth;
              const card = document.querySelector('.hero-visual-card');
              const cardRect = card ? card.getBoundingClientRect() : null;
              const badges = [...document.querySelectorAll('.hero-floating-badge')].map(b => {
                const br = b.getBoundingClientRect();
                return {
                  classes: b.className,
                  left: Math.round(br.left * 10) / 10,
                  right: Math.round(br.right * 10) / 10,
                  overflows: br.right > innerWidth || br.left < 0,
                };
              });

              return {
                innerWidth,
                docScrollWidth,
                hasOverflow: docScrollWidth > innerWidth + 0.5,
                cardWidth: cardRect ? Math.round(cardRect.width * 10) / 10 : 0,
                badgesOverflow: badges.some(b => b.overflows),
                badges,
              };
            })()
          `,
          returnByValue: true,
        });

        const v = svgEval.result?.result?.value;
        const pass = !v?.hasOverflow && !v?.badgesOverflow;
        console.log(`[${pass ? 'PASS' : 'FAIL'}] SVG In-Memory Simulation | ${vp.name} | ${ori.name} -> docScroll: ${v?.docScrollWidth}px / ${v?.innerWidth}px, badges overflow: ${v?.badgesOverflow}`);
      }
    }
    await closeCdpSession(svgSession);

    // Reduced Motion Test
    console.log(`\n>>> Testing prefers-reduced-motion: reduce Media Query Guard`);
    const motionSession = await createCdpSession(`http://127.0.0.1:${PORT}/index.html`);
    await motionSession.send('Page.enable');
    await motionSession.send('Runtime.enable');
    await motionSession.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });

    const motionEval = await motionSession.send('Runtime.evaluate', {
      expression: `
        (() => {
          const badge = document.querySelector('.hero-floating-badge');
          const aboutCard = document.querySelector('.about-value-card');
          const footerLink = document.querySelector('.footer-link');

          const badgeAnim = badge ? window.getComputedStyle(badge).animationName : null;
          const aboutTrans = aboutCard ? window.getComputedStyle(aboutCard).transitionProperty : null;
          const footerTrans = footerLink ? window.getComputedStyle(footerLink).transitionProperty : null;

          return {
            badgeAnimationDeactivated: !badgeAnim || badgeAnim === 'none',
            aboutTransitionDeactivated: !aboutTrans || aboutTrans === 'none' || aboutTrans === 'all 0s ease 0s',
            footerTransitionDeactivated: !footerTrans || footerTrans === 'none' || footerTrans === 'all 0s ease 0s',
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Reduced motion check:', motionEval.result?.result?.value);
    await closeCdpSession(motionSession);

  } finally {
    chrome.kill();
    server.close();
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }, 600);
  }

  // Print Summary Table
  console.log('\n================================================================');
  console.log('                 OVERFLOW STRESS TEST SUMMARY                   ');
  console.log('================================================================');

  let totalTests = suiteResults.length;
  let passedTests = suiteResults.filter(r => r.passed).length;
  let failedTests = totalTests - passedTests;

  console.log(`Total Scenarios Tested: ${totalTests}`);
  console.log(`Scenarios Passed (Zero Overflow): ${passedTests}`);
  console.log(`Scenarios Failed: ${failedTests}`);

  // Inspect Hero Artwork Findings across Home Landing scenarios
  const homeResults = suiteResults.filter(r => r.page === 'Home Landing');
  const artworkSample = homeResults[0]?.heroArtwork;
  console.log('\n----------------------------------------------------------------');
  console.log('HERO ARTWORK AUDIT:');
  console.log(`Has SVG (.hero-illustration-svg): ${artworkSample?.hasSvg}`);
  console.log(`Has Raster Image (.hero-banner-image): ${artworkSample?.hasRasterImg} (src: "${artworkSample?.imgSrc}")`);
  console.log('----------------------------------------------------------------\n');

  // Breakdown by Viewport
  for (const vp of VIEWPORTS) {
    const vpResults = suiteResults.filter(r => r.viewport === vp.name);
    const vpPassed = vpResults.filter(r => r.passed).length;
    console.log(`- ${vp.name.padEnd(30)}: ${vpPassed} / ${vpResults.length} scenarios PASS`);
  }

  // Breakdown by Orientation
  for (const ori of ORIENTATIONS) {
    const oriResults = suiteResults.filter(r => r.orientation === ori.name);
    const oriPassed = oriResults.filter(r => r.passed).length;
    console.log(`- ${ori.name.padEnd(30)}: ${oriPassed} / ${oriResults.length} scenarios PASS`);
  }

  // Save full results to JSON in tests/ for inspection
  fs.writeFileSync('tests/responsive-stress-results.json', JSON.stringify(suiteResults, null, 2));
  console.log('\nDetailed JSON saved to tests/responsive-stress-results.json');
}

run().catch(err => {
  console.error('Fatal stress test runner error:', err);
  process.exit(1);
});
