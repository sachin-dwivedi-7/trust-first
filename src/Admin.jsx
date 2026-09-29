
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const emptyForm = {
  name: "",
  package_name: "",
  developer: "",
  website: "",
  claimed_lender: "",
  lender_linkage_status: "",
  rbi_dla_status: "",
  credit_reporting_status: "NOT_VERIFIED",
  risk_status: "YELLOW",
  risk_reason: "",
  description: "",
  loan_amount_min: "",
  loan_amount_max: "",
  tenure_min: "",
  tenure_max: "",
  tenure_unit: "",
  interest_min: "",
  interest_max: "",
  processing_fee: "",
  net_disbursal_info: "",
  permissions: "",
  concerns: "",
};

export default function Admin({ user, onLogout }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    setError("");

    const result = await supabase
      .from("loan_apps")
      .select("*")
      .order("name", { ascending: true });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setApps(result.data || []);
    setLoading(false);
  }

  function updateField(event) {
    const name = event.target.name;
    const value = event.target.value;

    setForm(function (current) {
      return {
        ...current,
        [name]: value,
      };
    });
  }

  function startAdd() {
    setEditingId("new");
    setForm(emptyForm);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEdit(app) {
    setEditingId(app.id);
    setError("");

    setForm({
      name: app.name || "",
      package_name: app.package_name || "",
      developer: app.developer || "",
      website: app.website || "",
      claimed_lender: app.claimed_lender || "",
      lender_linkage_status: app.lender_linkage_status || "",
      rbi_dla_status: app.rbi_dla_status || "",
      credit_reporting_status:
        app.credit_reporting_status || "NOT_VERIFIED",
      risk_status: app.risk_status || "YELLOW",
      risk_reason: app.risk_reason || "",
      description: app.description || "",
      loan_amount_min: app.loan_amount_min ?? "",
      loan_amount_max: app.loan_amount_max ?? "",
      tenure_min: app.tenure_min ?? "",
      tenure_max: app.tenure_max ?? "",
      tenure_unit: app.tenure_unit || "",
      interest_min: app.interest_min ?? "",
      interest_max: app.interest_max ?? "",
      processing_fee: app.processing_fee || "",
      net_disbursal_info: app.net_disbursal_info || "",
      permissions: app.permissions
        ? JSON.stringify(app.permissions, null, 2)
        : "",
      concerns: app.concerns || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return null;
    }

    return number;
  }

  async function saveApp(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("App name is required.");
      return;
    }

    setSaving(true);
    setError("");

    let permissions = null;

    if (form.permissions.trim()) {
      try {
        permissions = JSON.parse(form.permissions);
      } catch {
        setError("Permissions must be valid JSON.");
        setSaving(false);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      package_name: form.package_name.trim() || null,
      developer: form.developer.trim() || null,
      website: form.website.trim() || null,
      claimed_lender: form.claimed_lender.trim() || null,
      lender_linkage_status:
        form.lender_linkage_status.trim() || null,
      rbi_dla_status: form.rbi_dla_status.trim() || null,

      credit_reporting_status:
        form.credit_reporting_status || "NOT_VERIFIED",

      risk_status: form.risk_status || null,
      risk_reason: form.risk_reason.trim() || null,
      description: form.description.trim() || null,
      loan_amount_min: numberOrNull(form.loan_amount_min),
      loan_amount_max: numberOrNull(form.loan_amount_max),
      tenure_min: numberOrNull(form.tenure_min),
      tenure_max: numberOrNull(form.tenure_max),
      tenure_unit: form.tenure_unit.trim() || null,
      interest_min: numberOrNull(form.interest_min),
      interest_max: numberOrNull(form.interest_max),
      processing_fee: form.processing_fee.trim() || null,
      net_disbursal_info:
        form.net_disbursal_info.trim() || null,
      permissions: permissions,
      concerns: form.concerns.trim() || null,
      updated_at: new Date().toISOString(),
    };
    console.log("CIBIL BEFORE SAVE:", form.credit_reporting_status);
console.log("PAYLOAD CIBIL:", payload.credit_reporting_status);

    let result;

    if (editingId === "new") {
      result = await supabase
        .from("loan_apps")
        .insert({
          id: crypto.randomUUID(),
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
    } 
    else {
  result = await supabase
    .from("loan_apps")
    .update(payload)
    .eq("id", editingId)
    .select()
  

  console.log("SUPABASE UPDATE RESULT:", result);
}
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    await loadApps();

    setEditingId(null);
    setForm(emptyForm);
    setSaving(false);
  }

  async function deleteApp(app) {
    const confirmed = window.confirm(
      "Delete " + app.name + " permanently?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    const result = await supabase
      .from("loan_apps")
      .delete()
      .eq("id", app.id);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    await loadApps();
  }

  const filteredApps = useMemo(function () {
    const query = search.trim().toLowerCase();

    return apps.filter(function (app) {
      const name = app.name
        ? app.name.toLowerCase()
        : "";

      const developer = app.developer
        ? app.developer.toLowerCase()
        : "";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        developer.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        app.risk_status === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [apps, search, riskFilter]);

  const stats = {
    total: apps.length,
    green: apps.filter(function (app) {
      return app.risk_status === "GREEN";
    }).length,
    yellow: apps.filter(function (app) {
      return app.risk_status === "YELLOW";
    }).length,
    red: apps.filter(function (app) {
      return app.risk_status === "RED";
    }).length,
    black: apps.filter(function (app) {
      return app.risk_status === "BLACK";
    }).length,
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="brand-area">
          <div className="brand-logo">TF</div>

          <div>
            <h1>Trust First</h1>
            <p>Admin Panel</p>
          </div>
        </div>

        <div className="header-right">
          <span>{user?.email}</span>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="admin-container">
        <div className="page-heading">
          <div>
            <h2>Loan Apps</h2>
            <p>Manage apps shown on Trust First.</p>
          </div>

          <button
            className="primary-button"
            onClick={startAdd}
          >
            + Add App
          </button>
        </div>

        <div className="stats-grid">
          <Stat title="Total Apps" value={stats.total} />
          <Stat title="GREEN" value={stats.green} />
          <Stat title="YELLOW" value={stats.yellow} />
          <Stat title="RED" value={stats.red} />
          <Stat title="BLACK" value={stats.black} />
        </div>

        {editingId && (
          <section className="admin-card form-card">
            <div className="form-heading">
              <div>
                <h2>
                  {editingId === "new"
                    ? "Add Loan App"
                    : "Edit Loan App"}
                </h2>

                <p>
                  Update the information stored in Trust First.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={saveApp}>
              <div className="form-grid">
                <Field
                  label="App Name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                />

                <Field
                  label="Package Name"
                  name="package_name"
                  value={form.package_name}
                  onChange={updateField}
                />

                <Field
                  label="Developer"
                  name="developer"
                  value={form.developer}
                  onChange={updateField}
                />

                <Field
                  label="Official Website"
                  name="website"
                  value={form.website}
                  onChange={updateField}
                />

                <Field
                  label="Claimed Lender"
                  name="claimed_lender"
                  value={form.claimed_lender}
                  onChange={updateField}
                />

                <Field
                  label="Lender Linkage Status"
                  name="lender_linkage_status"
                  value={form.lender_linkage_status}
                  onChange={updateField}
                />

                <Field
                  label="RBI DLA Status"
                  name="rbi_dla_status"
                  value={form.rbi_dla_status}
                  onChange={updateField}
                />

                <div>
                  <label>CIBIL / Credit Reporting</label>

                  <select
                    name="credit_reporting_status"
                    value={form.credit_reporting_status}
                    onChange={updateField}
                  >
                    <option value="YES">
                      YES — Credit bureau reporting
                    </option>

                    <option value="NO">
                      NO — No reporting found
                    </option>

                    <option value="NOT_VERIFIED">
                      NOT VERIFIED — Unable to verify
                    </option>
                  </select>
                </div>

                <div>
                  <label>Risk Status</label>

                  <select
                    name="risk_status"
                    value={form.risk_status}
                    onChange={updateField}
                  >
                    <option value="GREEN">GREEN</option>
                    <option value="YELLOW">YELLOW</option>
                    <option value="RED">RED</option>
                    <option value="BLACK">BLACK</option>
                  </select>
                </div>

                <Field
                  label="Loan Amount Min"
                  name="loan_amount_min"
                  type="number"
                  value={form.loan_amount_min}
                  onChange={updateField}
                />

                <Field
                  label="Loan Amount Max"
                  name="loan_amount_max"
                  type="number"
                  value={form.loan_amount_max}
                  onChange={updateField}
                />

                <Field
                  label="Tenure Min"
                  name="tenure_min"
                  type="number"
                  value={form.tenure_min}
                  onChange={updateField}
                />

                <Field
                  label="Tenure Max"
                  name="tenure_max"
                  type="number"
                  value={form.tenure_max}
                  onChange={updateField}
                />

                <Field
                  label="Tenure Unit"
                  name="tenure_unit"
                  value={form.tenure_unit}
                  onChange={updateField}
                  placeholder="days / months"
                />

                <Field
                  label="Interest Min"
                  name="interest_min"
                  type="number"
                  step="0.01"
                  value={form.interest_min}
                  onChange={updateField}
                />

                <Field
                  label="Interest Max"
                  name="interest_max"
                  type="number"
                  step="0.01"
                  value={form.interest_max}
                  onChange={updateField}
                />

                <Field
                  label="Processing Fee"
                  name="processing_fee"
                  value={form.processing_fee}
                  onChange={updateField}
                />
              </div>

              <div className="textarea-area">
                <TextArea
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                />

                <TextArea
                  label="Risk Reason"
                  name="risk_reason"
                  value={form.risk_reason}
                  onChange={updateField}
                />

                <TextArea
                  label="Net Disbursal Info"
                  name="net_disbursal_info"
                  value={form.net_disbursal_info}
                  onChange={updateField}
                />

                <TextArea
                  label="Concerns"
                  name="concerns"
                  value={form.concerns}
                  onChange={updateField}
                />

                <TextArea
                  label="Permissions JSON"
                  name="permissions"
                  value={form.permissions}
                  onChange={updateField}
                  placeholder='{"contacts":"..."}'
                />
              </div>

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="admin-card table-card">
          <div className="table-toolbar">
            <input
              type="search"
              placeholder="Search app or developer..."
              value={search}
              onChange={function (e) {
                setSearch(e.target.value);
              }}
            />

            <select
              value={riskFilter}
              onChange={function (e) {
                setRiskFilter(e.target.value);
              }}
            >
              <option value="ALL">All Risk</option>
              <option value="GREEN">GREEN</option>
              <option value="YELLOW">YELLOW</option>
              <option value="RED">RED</option>
              <option value="BLACK">BLACK</option>
            </select>
          </div>

          {loading && (
            <div className="empty-state">
              Loading apps...
            </div>
          )}

          {!loading && error && !editingId && (
            <div className="error-box table-error">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredApps.length === 0 && (
              <div className="empty-state">
                No apps found.
              </div>
            )}

          {!loading &&
            filteredApps.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>App</th>
                      <th>Risk</th>
                      <th>Lender</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredApps.map(function (app) {
                      return (
                        <tr key={app.id}>
                          <td>
                            <strong>{app.name}</strong>

                            {app.developer && (
                              <small>
                                {app.developer}
                              </small>
                            )}
                          </td>

                          <td>
                            <RiskBadge
                              status={app.risk_status}
                            />
                          </td>

                          <td>
                            {app.claimed_lender || "—"}
                          </td>

                          <td>
                            {app.updated_at
                              ? new Date(
                                  app.updated_at
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—"}
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className="edit-button"
                                onClick={function () {
                                  startEdit(app);
                                }}
                              >
                                Edit
                              </button>

                              <button
                                className="delete-button"
                                onClick={function () {
                                  deleteApp(app);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  step,
}) {
  return (
    <div>
      <label>{label}</label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
        step={step}
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div className="textarea-field">
      <label>{label}</label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
      />
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskBadge({ status }) {
  const currentStatus = status || "BLACK";

  return (
    <span
      className={
        "risk-badge risk-" +
        currentStatus.toLowerCase()
      }
    >
      {currentStatus}
    </span>
  );
}

