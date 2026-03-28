import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TESTIMONIALS = [
  { name: "Skibidi_CEO", handle: "@definitely_real_ceo", text: "i said sigma once and my whole team got a notification. 10/10 product. lost 40 aura." },
  { name: "OhioEnterpriseUser", handle: "@ohio_business_man", text: "we deployed this at our fortune 500 company. HR has questions. worth it." },
  { name: "GrindsetGuru", handle: "@mewing_consultant", text: "they sold my data to 47 companies. never felt more seen. W rizz product fr." },
  { name: "NPC_4892", handle: "@not_a_bot_i_promise", text: "i have been detected 3 times today. my therapist says this is a cry for help. i say it's called AURA." },
];

const FEATURES = [
  { icon: "🎤", title: "AI-Powered Listening", desc: "We listen to EVERYTHING. Not just the brainrot. Everything. Your secrets are safe with us (they are not)." },
  { icon: "📊", title: "Data Harvesting™", desc: "Your voice data goes to our servers, then to our partner servers, then honestly we lost track of it." },
  { icon: "💀", title: "Aura Destruction", desc: "Watch your social credit score collapse in real time. Scientifically calibrated to hurt your feelings." },
  { icon: "🤖", title: "AI Bad Advice", desc: "Powered by Gemini. Specifically tuned to give you the worst possible life advice after every detection." },
  { icon: "📺", title: "Live Spectator Mode", desc: "Let your friends watch you humiliate yourself in real time on a separate screen. We call this 'enterprise collaboration'." },
  { icon: "🔒", title: "Zero Privacy", desc: "GDPR? More like GYATT-PR. We are legally headquartered in Ohio so none of your laws apply to us." },
];

const GIF_NAMES = ["rizz", "sigma", "sus", "aura", "67", "no-cap"];

function BannerAd({ headline, sub, cta = "CLICK NOW" }) {
  return (
    <div className="ad-banner">
      <span className="ad-label">advertisement</span>
      <div className="ad-banner-inner">
        <div className="ad-banner-text">
          <strong>{headline}</strong>
          {sub && <span>{sub}</span>}
        </div>
        <button className="ad-cta" onClick={() => alert("ur data has been sold. thanks")}>{cta}</button>
      </div>
    </div>
  );
}

function BoxAd({ headline, sub, img }) {
  return (
    <div className="ad-box">
      <span className="ad-label">sponsored</span>
      {img && <img src={img} alt="ad" className="ad-box-img" />}
      <div className="ad-box-headline">{headline}</div>
      {sub && <div className="ad-box-sub">{sub}</div>}
      <button className="ad-cta" onClick={() => alert("congratulations. your data is ours.")}>Learn More</button>
    </div>
  );
}

function CornerPopup() {
  const [closed, setClosed] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (closed) return null;

  const handleClose = () => {
    setAttempts(a => a + 1);
    if (attempts >= 2) setClosed(true); // takes 3 tries
  };

  return (
    <div className="ad-corner-popup">
      <button className="ad-corner-close" onClick={handleClose} title="close">✕</button>
      <div className="ad-label">advertisement</div>
      <img src="/assets/gifs/sigma.gif" alt="sigma" className="ad-corner-gif" />
      <div className="ad-corner-headline">CONGRATULATIONS!!</div>
      <div className="ad-corner-sub">you are the 1,000,000th visitor to this website. claim your FREE sigma certificate now!!</div>
      <button className="ad-cta" style={{ width: "100%", marginTop: 8 }} onClick={() => alert("claim failed. we sold your data instead.")}>
        CLAIM PRIZE 🎉
      </button>
      {attempts > 0 && attempts < 3 && (
        <div style={{ fontSize: "0.65rem", color: "#ff8800", marginTop: 4 }}>
          {attempts === 1 ? "are you sure? (click again)" : "last chance to claim your prize!!"}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">

      {/* TICKER */}
      <div className="hp-ticker">
        <span className="hp-ticker-inner">
          ⚠️ WE WILL SELL YOUR DATA &nbsp;•&nbsp; BRAINROT DETECTED &nbsp;•&nbsp; SIGMA GRINDSET ACTIVATED &nbsp;•&nbsp; YOUR AURA IS DECLINING &nbsp;•&nbsp; OHIO HAS ENTERED THE CHAT &nbsp;•&nbsp; FANUM TAX INCOMING &nbsp;•&nbsp; WE WILL SELL YOUR DATA &nbsp;•&nbsp; BRAINROT DETECTED &nbsp;•&nbsp; SIGMA GRINDSET ACTIVATED &nbsp;•&nbsp;
        </span>
      </div>

      {/* NAV */}
      <nav className="hp-nav">
        <div className="hp-brand">RIZZ-ISTENTIAL CRISIS™</div>
        <div className="hp-nav-links">
          <a href="#pricing">Pricing</a>
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <button className="hp-btn-primary" onClick={() => navigate("/app")}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* BANNER AD #1 */}
      <BannerAd
        headline="🔥 SIGMA MALES in your AREA want to MEW with you 🔥"
        sub="find your grindset partner today | sponsored by Big Rizz LLC"
        cta="FIND SIGMAS"
      />

      {/* HERO */}
      <section className="hp-hero">
        <div className="hp-data-badge">⚠️ we WILL sell your data ⚠️</div>
        <h1 className="hp-title">
          Is your coworker<br />
          <span className="hp-title-green">sigma</span> or <span className="hp-title-red">skibidi?</span>
        </h1>
        <p className="hp-subtitle">
          The world's first ambient AI brainrot detection platform.<br />
          <strong>Real-time phrase recognition. Chaotic media responses. Zero coping.</strong>
        </p>
        <div className="hp-hero-cta">
          <button className="hp-btn-primary hp-btn-big" onClick={() => navigate("/app")}>
            Start Losing Aura — Free*
          </button>
          <span className="hp-fine-print">*free tier exists. we still sell your data on the free tier. especially the free tier.</span>
        </div>
        <div className="hp-visitor-counter">👁 visitors: 69,420</div>

        <div className="hp-hero-stats">
          <div className="hp-stat"><span className="hp-stat-num">26+</span><span>brainrot phrases detected</span></div>
          <div className="hp-stat"><span className="hp-stat-num">∞</span><span>aura lost per session</span></div>
          <div className="hp-stat"><span className="hp-stat-num">47</span><span>data brokers we sold your info to</span></div>
          <div className="hp-stat"><span className="hp-stat-num">0</span><span>coping mechanisms offered</span></div>
        </div>
      </section>

      {/* GIF SHOWCASE */}
      <div className="hp-gif-strip">
        <div className="hp-gif-track">
          {[...GIF_NAMES, ...GIF_NAMES].map((name, i) => (
            <img key={i} src={`/assets/gifs/${name}.gif`} alt={name} className="hp-gif-thumb" />
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="hp-section">
        <h2 className="hp-section-title">how it works</h2>
        <div className="hp-steps">
          <div className="hp-step"><div className="hp-step-num">1</div><div><strong>Open app. Allow mic.</strong><br /><span className="hp-muted">We now own your voice forever. Terms of service.</span></div></div>
          <div className="hp-step-arrow">→</div>
          <div className="hp-step"><div className="hp-step-num">2</div><div><strong>Talk normally.</strong><br /><span className="hp-muted">Or don't. We're listening either way.</span></div></div>
          <div className="hp-step-arrow">→</div>
          <div className="hp-step"><div className="hp-step-num">3</div><div><strong>Say "sigma".</strong><br /><span className="hp-muted">Chaos ensues. GIF plays. Aura modified.</span></div></div>
          <div className="hp-step-arrow">→</div>
          <div className="hp-step"><div className="hp-step-num">4</div><div><strong>Receive bad advice.</strong><br /><span className="hp-muted">Powered by AI. Intentionally terrible.</span></div></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="hp-section" id="features">
        <h2 className="hp-section-title">enterprise-grade features</h2>
        <p className="hp-section-sub">built different. not in a good way.</p>
        <div className="hp-features-grid">
          {FEATURES.slice(0, 3).map((f) => (
            <div className="hp-feature-card" key={f.title}>
              <div className="hp-feature-icon">{f.icon}</div>
              <div className="hp-feature-title">{f.title}</div>
              <div className="hp-feature-desc">{f.desc}</div>
            </div>
          ))}
          {/* AD INJECTED INTO GRID */}
          <BoxAd
            headline="ONE WEIRD TRICK to RESTORE your AURA"
            sub="local man discovers ancient mewing technique. doctors are upset. ohio is involved."
            img="/assets/gifs/aura.gif"
          />
          {FEATURES.slice(3).map((f) => (
            <div className="hp-feature-card" key={f.title}>
              <div className="hp-feature-icon">{f.icon}</div>
              <div className="hp-feature-title">{f.title}</div>
              <div className="hp-feature-desc">{f.desc}</div>
            </div>
          ))}
          <BoxAd
            headline="Your computer has 47 VIRUSES"
            sub="click OK to remove them. or don't. we already have your data."
            img="/assets/gifs/sus.gif"
          />
        </div>
      </section>

      {/* BANNER AD #2 */}
      <BannerAd
        headline="⚡ FREE OHIO CITIZENSHIP — Limited Time Offer ⚡"
        sub="Ohio is a state of mind. Join 0 happy citizens. | Sponsored by the Ohio Board of Tourism"
        cta="CLAIM OHIO"
      />

      {/* PRICING */}
      <section className="hp-section" id="pricing">
        <h2 className="hp-section-title">transparent pricing</h2>
        <p className="hp-section-sub">we are very honest about taking your money</p>
        <div className="hp-pricing-grid">

          <div className="hp-plan">
            <div className="hp-plan-name">FREE</div>
            <div className="hp-plan-price">$0<span>/mo</span></div>
            <ul className="hp-plan-features">
              <li>✅ Full brainrot detection</li>
              <li>✅ All 26 triggers</li>
              <li>✅ AI bad advice</li>
              <li>✅ Your data sold (standard package)</li>
              <li>❌ Support (figure it out)</li>
              <li>❌ Privacy (see above)</li>
            </ul>
            <button className="hp-btn-secondary" onClick={() => navigate("/app")}>Start for Free</button>
          </div>

          <div className="hp-plan hp-plan-featured">
            <div className="hp-plan-badge">MOST POPULAR (please)</div>
            <div className="hp-plan-name">SIGMA GRINDSET</div>
            <div className="hp-plan-price">$9.99<span>/mo</span></div>
            <ul className="hp-plan-features">
              <li>✅ Everything in Free</li>
              <li>✅ Your data sold (premium package)</li>
              <li>✅ Exclusive GIFs (more chaos)</li>
              <li>✅ Priority bad advice queue</li>
              <li>✅ Aura leaderboard access</li>
              <li>✅ We remember your name (scary)</li>
            </ul>
            <button className="hp-btn-primary" onClick={() => navigate("/app")}>Lose More Aura →</button>
          </div>

          <div className="hp-plan">
            <div className="hp-plan-name">ENTERPRISE</div>
            <div className="hp-plan-price">??<span>/mo</span></div>
            <ul className="hp-plan-features">
              <li>✅ Everything in Sigma</li>
              <li>✅ Deploy to entire team</li>
              <li>✅ Watch employees suffer (live feed)</li>
              <li>✅ Bulk data sales (your whole org)</li>
              <li>✅ Custom brainrot dictionary</li>
              <li>✅ Dedicated account manager named Chad</li>
            </ul>
            <a className="hp-btn-secondary hp-btn-block" href="mailto:chad@rizzistential.fake">Contact Chad →</a>
          </div>

        </div>
        <p className="hp-fine-print" style={{ textAlign: "center", marginTop: 16 }}>
          All plans include our standard data harvesting. Enterprise plans include premium data harvesting. By clicking anything on this page you have already agreed.
        </p>
      </section>

      {/* BANNER AD #3 */}
      <BannerAd
        headline="💊 DOCTORS HATE HIM — man gains 9000 aura using this one NPC trick"
        sub="sponsored by Fanum Tax Authority™  |  results not typical  |  we are not doctors  |  ohio"
        cta="SEE TRICK"
      />

      {/* TESTIMONIALS */}
      <section className="hp-section" id="testimonials">
        <h2 className="hp-section-title">real reviews from real people</h2>
        <p className="hp-section-sub">(these are real. we did not make these up. please believe us.)</p>
        <div className="hp-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div className="hp-testimonial" key={t.handle}>
              <div className="hp-testimonial-text">"{t.text}"</div>
              <div className="hp-testimonial-author">
                <strong>{t.name}</strong>
                <span className="hp-muted">{t.handle}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="hp-cta-section">
        <h2>ready to destroy your aura?</h2>
        <p className="hp-muted">join thousands of users whose data we have already sold</p>
        <button className="hp-btn-primary hp-btn-big" onClick={() => navigate("/app")}>
          Open App (we dare you)
        </button>
        <p className="hp-fine-print">
          By using this product you agree that: brainrot is real, Ohio exists as a state of mind, sigma is a lifestyle, and we can sell your data to anyone including but not limited to Big Skibidi LLC and the Fanum Tax Authority.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="hp-footer">
        <div className="hp-brand">RIZZ-ISTENTIAL CRISIS™</div>
        <div className="hp-muted" style={{ fontSize: "0.8rem", marginTop: 8 }}>
          © 2024 Rizz-istential Crisis Inc. Legally incorporated in Ohio. All aura lost is non-refundable.
          <br />
          We WILL sell your data · <a href="/feed" style={{ color: "var(--purple)" }}>Live Feed</a> · <a href="/app" style={{ color: "var(--green)" }}>Launch App</a>
        </div>
      </footer>

      {/* CORNER POPUP AD */}
      <CornerPopup />

    </div>
  );
}
