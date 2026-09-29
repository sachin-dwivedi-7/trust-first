
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./index.css";

function App() {
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [riskApp, setRiskApp] = useState(null);
  const [loanApps, setLoanApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appSources, setAppSources] = useState([]);

  useEffect(() => {
    const fetchLoanApps = async () => {
      setLoading(true);
      setError("");

      // -----------------------------
      // 1. FETCH LOAN APPS
      // -----------------------------

      const {
        data: loanAppData,
        error: loanAppError,
      } = await supabase
        .from("loan_apps")
        .select("*")
        .order("name");

      if (loanAppError) {
        console.error("LOAN APPS ERROR:", loanAppError);
        setError("Failed to load loan apps.");
        setLoading(false);
        return;
      }

      console.log("LOAN APPS:", loanAppData);
      setLoanApps(loanAppData || []);

      // -----------------------------
      // 2. FETCH APP-SOURCE LINKS
      // -----------------------------

      const {
        data: appSourceData,
        error: appSourceError,
      } = await supabase
        .from("app_sources")
        .select("*");

      console.log("APP SOURCE DATA:", appSourceData);
      console.log("APP SOURCE ERROR:", appSourceError);

      if (appSourceError) {
        console.error("App sources error:", appSourceError);
        setLoading(false);
        return;
      }

      // -----------------------------
      // 3. FETCH SOURCES
      // -----------------------------

      const {
        data: sourceData,
        error: sourceError,
      } = await supabase
        .from("sources")
        .select("*");

      console.log("SOURCE DATA:", sourceData);
      console.log("SOURCE ERROR:", sourceError);

      if (sourceError) {
        console.error("Sources error:", sourceError);
        setLoading(false);
        return;
      }

      // -----------------------------
      // 4. COMBINE SOURCES
      // -----------------------------

      const combinedSources = (appSourceData || []).map(
        (appSource) => {
          const matchedSource = (sourceData || []).find(
            (source) =>
              String(source.id) ===
              String(appSource.source_id)
          );

          return {
            ...appSource,
            sources: matchedSource || null,
          };
        }
      );

      console.log(
        "COMBINED SOURCES:",
        combinedSources
      );

      setAppSources(combinedSources);
      setLoading(false);
    };

    fetchLoanApps();
  }, []);

  // -----------------------------
  // SEARCH RESULTS
  // -----------------------------

  const results = loanApps.filter((app) =>
    app.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // -----------------------------
  // FORMATTING HELPERS
  // -----------------------------

  const formatLoanAmount = (app) => {
    if (
      !app.loan_amount_min &&
      !app.loan_amount_max
    ) {
      return "Not publicly verified";
    }

    if (!app.loan_amount_min) {
      return `Up to ₹${Number(
        app.loan_amount_max
      ).toLocaleString("en-IN")}`;
    }

    if (!app.loan_amount_max) {
      return `From ₹${Number(
        app.loan_amount_min
      ).toLocaleString("en-IN")}`;
    }

    return `₹${Number(
      app.loan_amount_min
    ).toLocaleString(
      "en-IN"
    )} – ₹${Number(
      app.loan_amount_max
    ).toLocaleString("en-IN")}`;
  };

  const formatTenure = (app) => {
    if (
      app.tenure_unit === "days/months"
    ) {
      return "61 days to 9 months";
    }

    if (
      !app.tenure_min &&
      !app.tenure_max
    ) {
      return "Not publicly verified";
    }

    if (!app.tenure_min) {
      return `Up to ${app.tenure_max} ${app.tenure_unit}`;
    }

    if (!app.tenure_max) {
      return `From ${app.tenure_min} ${app.tenure_unit}`;
    }

    return `${app.tenure_min}–${app.tenure_max} ${app.tenure_unit}`;
  };

  const formatInterest = (app) => {
    if (
      !app.interest_min &&
      !app.interest_max
    ) {
      return "Not publicly verified";
    }

    if (!app.interest_max) {
      return `From ${app.interest_min}%`;
    }

    if (!app.interest_min) {
      return `Up to ${app.interest_max}%`;
    }

    return `${app.interest_min}% – ${app.interest_max}%`;
  };

  const getRiskClass = (status) => {
    if (status === "GREEN") return "green";
    if (status === "YELLOW") return "yellow";
    if (status === "RED") return "red";
    if (status === "BLACK") return "black";

    return "black";
  };

  // -----------------------------
  // CIBIL / CREDIT REPORTING
  // -----------------------------

  const getCreditReportingText = (status) => {
    if (status === "YES") {
      return "YES — Credit bureau reporting";
    }

    if (status === "NO") {
      return "NO — No reporting found";
    }

    return "NOT VERIFIED — Unable to verify";
  };

  const getCreditReportingClass = (status) => {
    if (status === "YES") {
      return "credit-yes";
    }

    if (status === "NO") {
      return "credit-no";
    }

    return "credit-not-verified";
  };

  // -----------------------------
  // RISK ALERT SCREEN
  // -----------------------------

  const RiskAlertScreen = ({
    app,
    onComplete,
  }) => {
    const risk = getRiskClass(
      app?.risk_status
    );

    const riskConfig = {
      green: {
        icon: "👍",
        eyebrow: "RISK CHECK COMPLETE",
        title: "Looks Safer",
        copy:
          "We found no major risk signal in the available information.",
        verdict:
          "Lena consider kar sakte hain",
      },

      yellow: {
        icon: "⚠",
        eyebrow: "CAUTION REQUIRED",
        title: "Proceed Carefully",
        copy:
          "Some details need your attention before you make a decision.",
        verdict:
          "Terms samajhkar hi lein",
      },

      red: {
        icon: "!",
        eyebrow: "HIGH RISK ALERT",
        title: "High Risk Detected",
        copy:
          "Important risk signals were found in the available information.",
        verdict:
          "Avoid karein",
      },

      black: {
        icon: "?",
        eyebrow: "LIMITED INFORMATION",
        title: "Not Enough Information",
        copy:
          "There is not enough reliable information to make a confident assessment.",
        verdict:
          "Sirf bahut urgent ho tabhi consider karein",
      },
    };

    const config =
      riskConfig[risk] ||
      riskConfig.black;

    useEffect(() => {
      const timer = setTimeout(() => {
        onComplete();
      }, 5500);

      return () => clearTimeout(timer);
    }, [onComplete]);

    return (
      <main
        className={`risk-screen ${
          risk || "black"
        }`}
      >
        <div className="risk-result-page">

          <div className="risk-orb" />

          <div className="risk-app-mini">
            <div className="app-avatar">
              {app?.name?.charAt(0)}
            </div>

            <div>
              <span>CHECKING</span>

              <strong>
                {app?.name}
              </strong>
            </div>
          </div>

          <div className="risk-alert-icon">
            <span>
              {config.icon}
            </span>
          </div>

          <div className="risk-result-content">

            <div className="risk-eyebrow">
              {config.eyebrow}
            </div>

            <h1>
              {config.title}
            </h1>

            <p className="risk-result-copy">
              {config.copy}
            </p>

            <div className="risk-verdict">
              <span>
                VERDICT
              </span>

              <strong>
                {config.verdict}
              </strong>
            </div>

            <div className="risk-breakdown">

              <div>
                <span>
                  APP
                </span>

                <strong>
                  {app?.name}
                </strong>
              </div>

              <div>
                <span>
                  RISK STATUS
                </span>

                <strong>
                  {app?.risk_status ||
                    "UNKNOWN"}
                </strong>
              </div>

              <div>
                <span>
                  CHECK
                </span>

                <strong>
                  Trust First
                </strong>
              </div>

            </div>

            <p className="risk-disclaimer">
              This alert is based on the
              information currently available
              in Trust First. Always review the
              full details before borrowing.
            </p>

            <button
              className="risk-details-btn"
              onClick={onComplete}
            >
              View full details →
            </button>

          </div>
        </div>
      </main>
    );
  };

  // -----------------------------
  // RISK ALERT PAGE
  // -----------------------------

  if (riskApp) {
    return (
      <RiskAlertScreen
        app={riskApp}
        onComplete={() => {
          setSelectedApp(riskApp);
          setRiskApp(null);
        }}
      />
    );
  }

  // -----------------------------
  // PROFILE PAGE
  // -----------------------------

  if (selectedApp) {
    const selectedSources =
      appSources.filter(
        (item) =>
          String(item.app_id) ===
          String(selectedApp.id)
      );

    console.log(
      "SELECTED APP:",
      selectedApp.name
    );

    console.log(
      "SELECTED APP ID:",
      selectedApp.id
    );

    console.log(
      "SELECTED SOURCES:",
      selectedSources
    );

    return (
      <main className="site">

        {/* NAVBAR */}

        <header className="navbar">

          <button
            className="logo"
            onClick={() =>
              setSelectedApp(null)
            }
          >
            <span className="logo-mark">
              TF
            </span>

            <span>
              Trust<span>First</span>
            </span>
          </button>

          <button
            className="nav-back"
            onClick={() =>
              setSelectedApp(null)
            }
          >
            ← Back to search
          </button>

        </header>

        {/* PROFILE */}

        <section className="profile-page">

          <button
            className="mobile-back"
            onClick={() =>
              setSelectedApp(null)
            }
          >
            ← Search
          </button>

          {/* PROFILE HEADING */}

          <div className="profile-heading">

            <div className="app-avatar large">
              {selectedApp.name.charAt(0)}
            </div>

            <div>

              <span className="label">
                LOAN APP PROFILE
              </span>

              <h1>
                {selectedApp.name}
              </h1>

              <p>
                {selectedApp.description}
              </p>

            </div>

            <div
              className={`risk-badge ${getRiskClass(
                selectedApp.risk_status
              )}`}
            >
              <span />

              {selectedApp.risk_status}
            </div>

          </div>

          <div className="profile-grid">

            {/* MAIN COLUMN */}

            <div className="main-column">

              {/* LENDER IDENTITY */}

              <div className="glass-card lender-card">

                <span className="label">
                  LENDER IDENTITY
                </span>

                <h3>
                  {selectedApp.claimed_lender}
                </h3>

                <p>
                  Trust First separates the loan
                  app from the actual lending
                  entity. Always check who is
                  providing the loan.
                </p>

              </div>

              {/* RISK STATUS */}

              <div
                className={`risk-explanation ${getRiskClass(
                  selectedApp.risk_status
                )}`}
              >

                <div className="risk-explanation-top">

                  <div>

                    <span className="label">
                      RISK STATUS
                    </span>

                    <h3>
                      {selectedApp.risk_status}
                    </h3>

                  </div>

                  <div className="risk-status-dot">
                    <span />
                  </div>

                </div>

                <p>
                  {selectedApp.risk_reason}
                </p>

              </div>

              {/* VERIFICATION SUMMARY */}

              <div className="verification-summary">

                <div className="verification-summary-item">

                  <span>
                    RBI DLA STATUS
                  </span>

                  <strong>
                    {selectedApp.rbi_dla_status ||
                      "Not independently verified"}
                  </strong>

                </div>

                <div className="verification-summary-item">

                  <span>
                    LENDER LINKAGE
                  </span>

                  <strong>
                    {selectedApp.lender_linkage_status ||
                      "Not verified"}
                  </strong>

                </div>

              </div>

              {/* CIBIL / CREDIT REPORTING */}

              <div
                className={`credit-reporting-card ${getCreditReportingClass(
                  selectedApp.credit_reporting_status
                )}`}
              >

                <div className="credit-reporting-header">

                  <div>

                    <span className="label">
                      CIBIL / CREDIT REPORTING
                    </span>

                    <h3>
                      Does this loan affect your credit report?
                    </h3>

                  </div>

                  <div className="credit-reporting-status">
                    {selectedApp.credit_reporting_status ===
                    "YES"
                      ? "YES"
                      : selectedApp.credit_reporting_status ===
                        "NO"
                      ? "NO"
                      : "?"}
                  </div>

                </div>

                <strong className="credit-reporting-result">
                  {getCreditReportingText(
                    selectedApp.credit_reporting_status
                  )}
                </strong>

                <p>
                  {selectedApp.credit_reporting_status ===
                  "YES"
                    ? "The available information indicates that this loan may be reported to a credit bureau. Your repayment behaviour may therefore appear in your credit report."
                    : selectedApp.credit_reporting_status ===
                      "NO"
                    ? "Trust First did not find evidence of credit bureau reporting for this loan based on the information currently available."
                    : "Trust First could not verify whether this loan is reported to a credit bureau."}
                </p>

              </div>

              {/* LOAN DETAILS */}

              <div className="section-title">

                <span className="label">
                  LOAN DETAILS
                </span>

                <h2>
                  Important facts
                </h2>

              </div>

              <div className="details-grid">

                <div className="detail-card">

                  <span>
                    Loan amount
                  </span>

                  <strong>
                    {formatLoanAmount(
                      selectedApp
                    )}
                  </strong>

                </div>

                <div className="detail-card">

                  <span>
                    Tenure
                  </span>

                  <strong>
                    {formatTenure(
                      selectedApp
                    )}
                  </strong>

                </div>

                <div className="detail-card">

                  <span>
                    Interest / APR
                  </span>

                  <strong>
                    {formatInterest(
                      selectedApp
                    )}
                  </strong>

                </div>

                <div className="detail-card">

                  <span>
                    Processing fee
                  </span>

                  <strong>
                    {selectedApp.processing_fee ||
                      "Not publicly verified"}
                  </strong>

                </div>

                <div className="detail-card">

                  <span>
                    NET DISBURSAL
                  </span>

                  <strong>
                    {selectedApp.net_disbursal_info ||
                      "Not publicly verified"}
                  </strong>

                </div>

              </div>

              {/* CONCERNS */}

              <div className="concerns-card">

                <span className="label">
                  CONCERNS
                </span>

                <h3>
                  What to watch
                </h3>

                <p>
                  {selectedApp.concerns ||
                    "No verified concerns identified."}
                </p>

              </div>

              {/* SOURCES */}

              <div className="sources-card">

                <span className="label">
                  SOURCES & EVIDENCE
                </span>

                <h3>
                  Where this information comes from
                </h3>

                {selectedSources.length > 0 ? (

                  selectedSources.map(
                    (item) => (

                      <div
                        className="source-item"
                        key={`${item.app_id}-${item.source_id}`}
                      >

                        <div className="source-info">

                          <strong>
                            {item.sources?.title ||
                              "Source"}
                          </strong>

                          <p>
                            {item.sources?.publisher ||
                              "Unknown publisher"}
                            {" · "}
                            {item.sources?.source_type ||
                              "Source"}
                          </p>

                          {item.evidence_note && (
                            <small>
                              {item.evidence_note}
                            </small>
                          )}

                        </div>

                        {item.sources?.url && (

                          <a
                            href={
                              item.sources.url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View source →
                          </a>

                        )}

                      </div>

                    )
                  )

                ) : (

                  <p className="no-sources">
                    No linked source available
                    for this app.
                  </p>

                )}

              </div>

            </div>

            {/* RIGHT SIDEBAR */}

            <aside className="side-column">

              <div className="verification-card">

                <span className="label">
                  VERIFICATION
                </span>

                <div className="verification-icon">
                  ✓
                </div>

                <h3>
                  Last verified
                </h3>

                <strong>
                  {selectedApp.last_verified_at}
                </strong>

                <p>
                  Verification dates help you
                  understand how recent the
                  available information is.
                </p>

              </div>

              <div className="source-card">

                <span className="label">
                  TRUST LAYER
                </span>

                <h3>
                  Sources matter.
                </h3>

                <p>
                  Important Trust First
                  information will show its
                  source, verification status
                  and last reviewed date.
                </p>

              </div>

            </aside>

          </div>

        </section>

      </main>
    );
  }

  // -----------------------------
  // HOME PAGE
  // -----------------------------

  return (
    <main className="site">

      {/* NAVBAR */}

      <header className="navbar">

        <div className="logo">

          <span className="logo-mark">
            TF
          </span>

          <span>
            Trust<span>First</span>
          </span>

        </div>

        <nav>

          <a href="#how">
            How it works
          </a>

          <a href="#trust">
            Trust & sources
          </a>

        </nav>

        <button
          className="nav-action"
          onClick={() => {

            const searchInput =
              document.querySelector(
                ".search-box input"
              );

            searchInput?.focus();

          }}
        >
          Check an app
        </button>

      </header>

      {/* HERO */}

      <section className="hero">

        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />

        <div className="hero-content">

          <div className="hero-pill">

            <span className="pulse" />

            Financial safety intelligence

          </div>

          <h1>

            Know the loan.

            <br />

            <span>
              Before you borrow.
            </span>

          </h1>

          <p>
            Understand the lender, costs,
            risks and important facts about a
            loan app — before you put your money
            or data at risk.
          </p>

          {/* SEARCH */}

          <div className="search-box">

            <div className="search-symbol">
              ⌕
            </div>

            <input
              type="text"
              placeholder="Search any loan app..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (

              <button
                className="clear"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>

            )}

            <div className="search-shortcut">
              ⌘ K
            </div>

          </div>

          {/* POPULAR SEARCHES */}

          {!search && (

            <div className="suggestions">

              <span>
                Popular searches
              </span>

              <button
                onClick={() =>
                  setSearch("Pocketly")
                }
              >
                Pocketly
              </button>

              <button
                onClick={() =>
                  setSearch("Moneyview")
                }
              >
                Moneyview
              </button>

              <button
                onClick={() =>
                  setSearch("KreditBee")
                }
              >
                KreditBee
              </button>

            </div>

          )}

        </div>

      </section>

      {/* LOADING */}

      {loading && (

        <section className="results-section">

          <div className="empty">

            <div>...</div>

            <h3>
              Loading loan apps
            </h3>

            <p>
              Fetching verified information
              from Trust First.
            </p>

          </div>

        </section>

      )}

      {/* ERROR */}

      {error && !loading && (

        <section className="results-section">

          <div className="empty">

            <div>!</div>

            <h3>
              {error}
            </h3>

            <p>
              Please check your Supabase
              connection.
            </p>

          </div>

        </section>

      )}

      {/* SEARCH RESULTS */}

      {search &&
        !loading &&
        !error && (

          <section className="results-section">

            <div className="results-header">

              <div>

                <span className="label">
                  SEARCH RESULTS
                </span>

                <h2>
                  Matching loan apps
                </h2>

              </div>

              <span className="count">
                {results.length} results
              </span>

            </div>

            {results.length ? (

              <div className="result-list">

                {results.map((app) => (

                  <button
                    className="result-card"
                    key={
                      app.id ||
                      app.name
                    }
                    onClick={() => {
                      setRiskApp(app);
                    }}
                  >

                    <div className="app-avatar">
                      {app.name.charAt(0)}
                    </div>

                    <div className="result-info">

                      <strong>
                        {app.name}
                      </strong>

                      <span>
                        {app.claimed_lender}
                      </span>

                    </div>

                    <div
                      className={`risk-badge ${getRiskClass(
                        app.risk_status
                      )}`}
                    >

                      <span />

                      {app.risk_status}

                    </div>

                    <div className="result-arrow">
                      ↗
                    </div>

                  </button>

                ))}

              </div>

            ) : (

              <div className="empty">

                <div>?</div>

                <h3>
                  No matching app found
                </h3>

                <p>
                  Try another spelling or
                  search for a different
                  loan app.
                </p>

              </div>

            )}

          </section>

        )}

      {/* TRUST SECTION */}

      {!search &&
        !loading &&
        !error && (

          <section
            className="trust-section"
            id="trust"
          >

            <div className="trust-heading">

              <span className="label">
                WHY Trust First
              </span>

              <h2>
                Information you can actually
                understand.
              </h2>

            </div>

            <div className="trust-grid">

              <div className="trust-card blue">

                <div className="trust-icon">
                  ⌕
                </div>

                <h3>
                  Search first
                </h3>

                <p>
                  Open Trust First, search the
                  app and get the important
                  information without filling
                  out forms.
                </p>

              </div>

              <div className="trust-card dark">

                <div className="trust-icon">
                  ✓
                </div>

                <h3>
                  Evidence first
                </h3>

                <p>
                  Important information is
                  connected to sources and
                  verification dates.
                </p>

              </div>

              <div className="trust-card cyan">

                <div className="trust-icon">
                  !
                </div>

                <h3>
                  Clear risk
                </h3>

                <p>
                  Verified information, caution
                  and reported concerns are kept
                  distinct.
                </p>

              </div>

            </div>

          </section>

        )}

    </main>
  );
}

export default App;

