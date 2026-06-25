# Integrating your app with OneCRM

OneCRM is a central **review desk**. It pulls inbound items from your app and lets a
team triage them on a Kanban board (*to review → under review → completed*).

It is **read-only**: OneCRM never writes to your app — it just performs HTTP `GET`s
against endpoints you expose. You add a small amount of code to your app, then
configure the connection once in the OneCRM UI.

---

## What OneCRM pulls

Two independent streams. Provide **whichever your app has** — one, the other, or both:

| Stream | What it is | Appears in OneCRM as |
| --- | --- | --- |
| **Contact-us submissions** | Your *"Contact Us" / "Get in touch"* form entries — inbound inquiries | the **Contacts** board |
| **Orders** | Your orders / transactions | the **Orders** board |

> ⚠️ OneCRM "contacts" are **contact-us form submissions**, *not* your user or
> customer accounts. If your app has no contact-us form, don't expose a contacts
> endpoint — OneCRM will simply show Orders only (and vice-versa).

---

## 1. Expose a GET list endpoint per stream

For each stream you want in OneCRM, expose an HTTP **`GET`** endpoint returning the
records. OneCRM accepts either:

- a **bare JSON array** — `[ { ... }, { ... } ]`, or
- a **paginated envelope** — OneCRM auto-unwraps the first array it finds under
  `results`, `items`, `data`, `records`, `rows`, or `content` (including one level
  nested). e.g. `{ "meta": { ... }, "results": [ ... ] }`.

**Pagination:** OneCRM reads a single response. To pull more than the default page,
include a high page size in the URL you register — e.g. `?limit=200`,
`?page_size=200`, `?size=100`.

**Stable id:** each record must carry a stable **`id`** — OneCRM uses it to remember
review status / assignees / notes across refreshes.

---

## 2. Field shapes OneCRM understands

Your field names do **not** have to match — you map them in the OneCRM UI. The target
fields are:

**Contact** (a contact-us submission)

| field | meaning |
| --- | --- |
| `id` | stable identifier |
| `name` | sender's name |
| `email` | sender's email |
| `phone` | sender's phone |
| `message` | the message they wrote |
| `date` | submitted-at (any date or ISO timestamp) |
| `status` | optional free-text status |

**Order**

| field | meaning |
| --- | --- |
| `id`, `customerName`, `customerEmail`, `product`, `amount`, `currency`, `date`, `status` | |

Mapping tips:

- A mapping value can **join several source fields**: map `name` → `first_name last_name`
  and OneCRM concatenates them with a space.
- Any source fields you don't map are passed through untouched.

---

## 3. Let OneCRM authenticate (static key — recommended)

OneCRM sends a fixed header on every request. The cleanest setup: accept a long-lived
**integration key** on your list endpoints, gated by an env var, acting as a
read-only principal. In OneCRM you then pick **API key** auth with header
`X-Onecrm-Key`.

> Already have a static API key or long-lived bearer token? Skip this and use it —
> OneCRM supports **API key**, **Bearer token**, **Basic**, and a **Login (JWT)** flow.

Gate the check behind `ONECRM_API_KEY` (empty = disabled) and resolve a fixed account
from `ONECRM_INTEGRATION_EMAIL`.

### Django / DRF

```python
# core/onecrm_auth.py
import os, secrets
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

class OnecrmKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = os.environ.get("ONECRM_API_KEY", "")
        key = request.headers.get("X-Onecrm-Key")
        if not (api_key and key):
            return None  # not us -> let normal auth run
        if not secrets.compare_digest(key, api_key):
            raise AuthenticationFailed("Invalid integration key")
        User = get_user_model()
        try:
            user = User.objects.get(email=os.environ.get("ONECRM_INTEGRATION_EMAIL", ""), is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed("OneCRM integration user not found")
        return (user, None)
```

```python
# settings: add it FIRST in the auth classes that are ACTUALLY loaded.
# (Some projects override REST_FRAMEWORK in settings/components/*.py or an
#  environment-specific module — edit the effective one.)
REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = (
    "core.onecrm_auth.OnecrmKeyAuthentication",
    *REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"],
)
```

### FastAPI

```python
# inside your current-user dependency, before the JWT decode:
import os, secrets
key = request.headers.get("X-Onecrm-Key")
if os.environ.get("ONECRM_API_KEY") and key:
    if not secrets.compare_digest(key, os.environ["ONECRM_API_KEY"]):
        raise HTTPException(status_code=401, detail="Invalid integration key")
    return await get_user_by_email(os.environ.get("ONECRM_INTEGRATION_EMAIL", ""))
# Make the bearer scheme optional — HTTPBearer(auto_error=False) — so a request
# carrying only X-Onecrm-Key isn't rejected before this runs.
```

### Express

```ts
import crypto from 'node:crypto'

export function onecrmKeyOrAuth(req, res, next) {
  const key = req.header('X-Onecrm-Key')
  const want = process.env.ONECRM_API_KEY
  if (want && key) {
    const a = Buffer.from(key), b = Buffer.from(want)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return next(httpUnauthorized())
    User.findOne({ where: { email: process.env.ONECRM_INTEGRATION_EMAIL } })
      .then((u) => {
        if (!u) return next(httpUnauthorized())
        req.user = { id: u.id, email: u.email, role: u.role }
        next()
      })
      .catch(next)
    return
  }
  return yourNormalAuthGuard(req, res, next) // fall back to JWT / session
}
```

Then set in your app's environment and redeploy:

```bash
ONECRM_API_KEY=$(openssl rand -hex 32)      # a long random secret
ONECRM_INTEGRATION_EMAIL=svc-onecrm@you.app # an existing read-only account
```

**Security:** keep the key in env (never commit it), compare in **constant time**, and
point `ONECRM_INTEGRATION_EMAIL` at a **least-privilege, read-only** account.

---

## 4. Contact-us form that only sends an email?

If your contact-us endpoint only validates and emails (no DB row), OneCRM has nothing
to pull. Persist submissions and add a key-protected list endpoint:

```text
1. Model:    ContactMessage(name, email, phone, message, status, created_at)
2. On submit: ContactMessage.objects.create(**data)   # in addition to emailing
3. List:     GET /api/v1/contact-us
             -> [ { id, name, email, phone, message, created_at, status }, ... ]
```

---

## 5. Register it in OneCRM

Once your endpoint(s) + auth are live:

1. Open **https://onecrm.neothons.com** → **Services → Add service**.
2. Set **Name**, brand **color**, and **icon**.
3. **Contact-us submissions endpoint** *(optional)* — your `GET` URL (add `?limit=200`).
   Leave blank if your app has no contact-us form.
4. **Orders endpoint** *(optional)* — your `GET` URL. Leave blank if none.
5. **Auth type** → **API key**, header name `X-Onecrm-Key`, paste the key.
   *(Or Bearer / Basic / Login.)*
6. **Save**, then **Map fields** — line up your field names with OneCRM's
   (`name`, `email`, `phone`, `message`, …). The dialog previews your real fields.
7. Open the service — your submissions / orders appear on the review board.

---

## Checklist

- [ ] `GET` endpoint(s) return a JSON array (or a `{ results: [...] }` envelope)
- [ ] Every record has a stable `id`
- [ ] Endpoints are reachable over HTTPS from the OneCRM server
- [ ] `X-Onecrm-Key` is accepted (gated by `ONECRM_API_KEY`), acting as a read-only account
- [ ] Registered in OneCRM with endpoint(s) + auth + field mapping

## FAQ

**Does OneCRM write to my app?** No — read-only `GET`s.

**My response is paginated — is that a problem?** No; OneCRM unwraps
`results` / `items` / `data`. Add `?limit=` (or your param) to pull more per call.

**My field names differ from OneCRM's?** Map them in the UI. You can also join
fields, e.g. `name` → `first_name last_name`.

**No contact-us form, or no orders?** Expose only the stream you have — OneCRM shows
only that board.
