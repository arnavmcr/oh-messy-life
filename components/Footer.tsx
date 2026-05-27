import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h3 className="footer-title">
            oh <span className="accent">messy</span> life.
          </h3>
          <p className="footer-sub">
            an asynchronous, honest, (within reasonable bounds) meaningful way to remain
            in touch — mostly written at 2am.
          </p>
        </div>

        <div className="footer-col">
          <h4>archive</h4>
          <ul>
            <li><Link href="/writing">writing</Link></li>
            <li><Link href="/record">record</Link></li>
            <li><Link href="/music">signal</Link></li>
            <li><Link href="/projects">labs</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>signal</h4>
          <ul>
            <li><a href="/music/index.html">library</a></li>
            <li><Link href="/music/gig-archive">gig archive</Link></li>
            <li><span style={{ opacity: 0.35, cursor: 'not-allowed' }}>t-shirt archive</span></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>elsewhere</h4>
          <ul>
            <li><a href="https://arnavmcr.substack.com" target="_blank" rel="noreferrer">substack</a></li>
            <li><a href="https://github.com/arnavmcr" target="_blank" rel="noreferrer">github</a></li>
            <li><a href="#" target="_blank" rel="noreferrer">letterboxd</a></li>
            <li><a href="/rss.xml">rss</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2023 — 2026</span>
        <span>reply or don&rsquo;t, at your own pace</span>
      </div>
    </footer>
  );
}
