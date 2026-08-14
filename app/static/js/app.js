document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        window.location.href = '/dashboard';
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // Audits page: load audits and wire sync
  const auditsBody = document.getElementById('auditsBody');
  const syncBtn = document.getElementById('syncAudits');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageNumberSpan = document.getElementById('pageNumber');
  const pageSizeSelect = document.getElementById('pageSize');

  if (auditsBody) {
    let currentPage = 0;
    let pageSize = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) : 10;

    async function loadAudits(page = 0) {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const skip = page * pageSize;
        const res = await fetch(`/api/audits?skip=${skip}&limit=${pageSize}`, { headers });
        if (!res.ok) throw new Error('Could not fetch audits');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        const total = data.total || null;
        auditsBody.innerHTML = '';
        items.forEach(a => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${a.name || a.audit_id}</td>
            <td>${a.date || a.created_at || ''}</td>
            <td>${a.technician || ''}</td>
            <td>${a.device || ''}</td>
            <td>${a.audit_type || a.type || ''}</td>
            <td>${a.status || ''}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary btn-detail" data-audit='${encodeURIComponent(JSON.stringify(a))}'>Detalles</button>
              <button class="btn btn-sm btn-primary btn-generate" data-audit-id='${a.audit_id || a.id || a.auditId}'>PDF</button>
            </td>
          `;
          auditsBody.appendChild(tr);
        });

        // wire buttons
        document.querySelectorAll('.btn-detail').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const raw = decodeURIComponent(btn.getAttribute('data-audit'));
            const obj = JSON.parse(raw);
            const pre = document.getElementById('auditDetailPre');
            pre.innerText = JSON.stringify(obj, null, 2);
            // store current audit id for modal generate
            const modalGenerate = document.getElementById('modalGeneratePdf');
            modalGenerate.setAttribute('data-audit-id', obj.audit_id || obj.id || obj.auditId);
            const modalEl = document.getElementById('auditModal');
            const bsModal = new bootstrap.Modal(modalEl);
            bsModal.show();
          });
        });

        document.querySelectorAll('.btn-generate').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const aid = btn.getAttribute('data-audit-id');
            if (!aid) return alert('Audit id missing');
            try {
              btn.disabled = true;
              const token = localStorage.getItem('access_token');
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const res = await fetch(`/api/reports/generate/${aid}`, { method: 'POST', headers });
              if (!res.ok) throw new Error('Generate failed');
              const data = await res.json();
              if (data.report_id) {
                // trigger download
                window.location = `/api/reports/download/${data.report_id}`;
              } else {
                alert('Informe generado: ' + (data.path || ''));
              }
            } catch (err) {
              alert('Error: ' + err.message);
            } finally {
              btn.disabled = false;
            }
          });
        });
        // update pagination UI
        currentPage = page;
        if (pageNumberSpan) pageNumberSpan.innerText = (currentPage + 1).toString();
        // disable/enable prev/next
        if (prevBtn) prevBtn.disabled = currentPage <= 0;
        if (nextBtn) {
          if (total !== null) {
            const skip = currentPage * pageSize;
            nextBtn.disabled = (skip + items.length) >= total;
          } else {
            nextBtn.disabled = !(items && items.length === pageSize);
          }
        }
      } catch (err) {
        console.error(err);
        auditsBody.innerHTML = '<tr><td colspan="7">Error cargando auditorías</td></tr>';
      }
    }

    // initial load
    loadAudits(0);

    // pagination controls
    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 0) {
        loadAudits(currentPage - 1);
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadAudits(currentPage + 1);
    });
    if (pageSizeSelect) pageSizeSelect.addEventListener('change', (e) => {
      pageSize = parseInt(pageSizeSelect.value, 10);
      currentPage = 0;
      loadAudits(0);
    });

    if (syncBtn) {
      syncBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          syncBtn.disabled = true;
          const token = localStorage.getItem('access_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch('/api/audits/sync', { headers });
          if (!res.ok) throw new Error('Sync failed');
          const data = await res.json();
          alert(`Sincronizadas: ${data.synced}`);
          await loadAudits();
        } catch (err) {
          alert('Error: ' + err.message);
        } finally {
          syncBtn.disabled = false;
        }
      });
    }
  }
});
