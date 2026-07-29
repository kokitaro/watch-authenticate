# Horologe

An append-only chain of custody for individual luxury timepieces, recorded on [GenLayer](https://genlayer.com). Each watch opens its own hash-linked chain. For an appraisal, every validator fetches the submitted image, sends the actual bytes to GenLayer's multimodal prompt API, and agrees on both the evidence digest and the substantive result before it is written.

## How it works

1. Mint a piece: the owner opens a new chain keyed to the piece and pays a small GEN fee. The brand must be one the contract recognizes, and the caller becomes the first owner.
2. Appraise: an owner-approved appraiser files a grade with a direct image URI. Validators independently fetch and inspect the image bytes, require an identical SHA-256 digest, compare the grade/confidence, and append the digest with the result.
3. Extend the chain: co-appraisals, service records, transfers, verifications, and authentications each append a new entry whose `prev_hash` is the hash of the entry before it.
4. Read the chronology: anyone can read a piece's full custody chain, its latest entry, the pieces registered under a brand, or registry-wide recent activity.

## Architecture

```
backend/watch-authenticate.py   GenLayer Intelligent Contract (Python, runs on the GenVM)
frontend/                       React + Vite + TypeScript front end (genlayer-js, wagmi/RainbowKit, Cesium, three)
```

Every event is appended as a new hash-linked entry rather than edited in place, so no prior link can change without breaking the hashes that follow.

## Deployment status

The recorded Studionet contract at `0xf27f4E0a14B022CbD9E2a9fC8a7E092fdB1e4Ea5` predates the authenticated-provenance hardening in this source tree. It is retained for read-only historical access and **must not be described as authenticated provenance**. Frontend writes are intentionally disabled while `VITE_SECURITY_RELEASE=legacy-v1`.

Redeploy `backend/watch-authenticate.py`, update `VITE_CONTRACT_ADDRESS`, and set `VITE_SECURITY_RELEASE=authenticated-provenance-v2` only after the validation commands below pass.

## Reproducible contract validation

Python 3.12 is required. The GenLayer client, direct-test framework, GenVM linter, and pytest versions are exact published pins in `requirements-contract.txt`; the contract itself also pins the concrete GenVM runner hash on its first line.

```bash
python -m pip install --requirement requirements-contract.txt
genvm-lint check backend/watch-authenticate.py --json
python -m pytest tests/direct -v
```

The same path runs in `.github/workflows/contract-validation.yml`. The direct suite covers owner-only role approval, fail-closed credential parsing, wallet-bound authentication houses, persisted evidence digests, and consensus rejection when validators receive different image bytes.

## Run locally

```bash
cd frontend
npm install
npm run dev
npm run build
```

The committed `.env` holds the public Studionet config; no secrets are required. Copy `.env.example` to `.env.local` only to override.

## Environment variables

| Name | Required | Description |
|------|----------|-------------|
| `VITE_CONTRACT_ADDRESS` | yes | Deployed Horologe contract on Studionet |
| `VITE_CHAIN_ID` | yes | GenLayer chain id (61999) |
| `VITE_RPC_URL` | yes | Studionet JSON-RPC endpoint |
| `VITE_SECURITY_RELEASE` | yes | Set to `authenticated-provenance-v2` only for a redeployed, validated hardened contract. |

## Deploy the contract

```bash
npx genlayer deploy --contract backend/watch-authenticate.py
```

After deployment, replace the legacy address in `frontend/.env` and
`frontend/src/lib/deployment.ts`, record the new transaction/source hash in
`backend/deployment.json`, then enable the v2 security release flag.

## Role credential schema

Role registration is fail-closed and callable only by the registry owner. The selected credential URI must return a JSON object whose role, wallet, and optional entity id match the registration request:

```json
{
  "active": true,
  "role": "APPRAISER",
  "subject_address": "0x...",
  "entity_id": ""
}
```

Allowed roles are `APPRAISER`, `SERVICE_CENTER`, and `AUTHENTICATION_HOUSE`. Service-center and authentication-house credentials must set `entity_id` to the requested `shop_id` or `house_id`. Non-JSON documents, missing/non-boolean `active`, inactive credentials, and mismatched roles, wallets, or entity ids are rejected.

## Contract methods (`Horologe`)

| Method | Type | Description |
|--------|------|-------------|
| `mint_piece` | payable | Open a new custody chain for a piece; the caller becomes its first owner. |
| `append_appraisal` | payable | An approved appraiser files a grade; validators inspect the fetched image bytes and agree on its digest and result. |
| `append_co_appraisal` | payable | A second appraiser dissents from a prior appraisal; an LLM reconciles the two grades. |
| `append_service` | payable | A registered service center logs work; an LLM checks the work and parts for internal consistency. |
| `append_transfer` | payable | The current owner hands a piece to a new address. |
| `append_verification` | payable | Anyone records a community verification note against a piece. |
| `append_authentication` | payable | A registered, wallet-bound house records an authentication statement. |
| `register_appraiser` | write | Registry owner approves a candidate wallet after a bound credential check. |
| `register_service_center` | write | Registry owner approves a shop id and candidate wallet after a bound credential check. |
| `register_authentication_house` | write | Registry owner approves a house id and candidate wallet after a bound credential check. |
| `update_piece_metadata` | write | The owner updates a piece's off-chain reference URI. |
| `custody_chain` | view | Return the full append-only chain for a piece. |
| `piece` | view | Return a piece's metadata dossier. |
| `chain_length` | view | Return the number of entries in a piece's chain. |
| `latest_entry` | view | Return the most recent entry for a piece. |
| `entry_at` | view | Return the entry at a given chain index. |
| `appraiser` | view | Return an appraiser's registration record. |
| `service_center` | view | Return a service center's registration record. |
| `authentication_house` | view | Return an authentication house's wallet-bound registration record. |
| `registry_owner` | view | Return the wallet authorized to approve roles. |
| `pieces_by_brand` | view | List the piece ids registered under a brand. |
| `recent_registry_activity` | view | Return the tail of registry-wide activity, most recent first. |

## License

MIT


## Deployment

- **App**: https://kokitaro.github.io/watch-authenticate/