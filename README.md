# @kaizenlabs/quinn-sdk

Typed TypeScript SDK for Quinn Platform.

`@kaizenlabs/quinn-sdk` is an organization-scoped client for Quinn business domains such as members, roles, courses, assignments, sign-off, groups, programs, and knowledge.

## Install

```bash
npm i @kaizenlabs/quinn-sdk
```

## Usage

```ts
import { Quinn } from "@kaizenlabs/quinn-sdk";

const quinn = new Quinn();

const org = await quinn.organizations.current();
const members = await quinn.members.list({ limit: 20 });
const signOff = await quinn.signOff.list({ limit: 10 });

console.log(org.organization?.name, members.items.length, signOff.items.length);
```

## Configuration

`new Quinn()` resolves configuration in this order:

1. constructor input
2. environment variables
3. config file

Supported environment variables:

- `QUINN_API_URL`
- `QUINN_API_TOKEN`
- `QUINN_ORG_ID`
- `QUINN_ALLOW_QUINN_MUTATION`
- `QUINN_API_CONTRACT`
- `QUINN_CONFIG_PATH`

Default config file path:

```text
~/.config/quinn/config.json
```

## API Contract

Every request the SDK sends carries `x-lp-client: quinn-sdk`, so the Quinn API
can tell SDK traffic apart from other callers.

The Quinn API speaks two contracts. They differ only in the names of the Skill
Rubric fields on the routes that carry them:

| Contract | Example: a sign-off field's Skill Rubrics |
|---|---|
| `1` (default) | `eskillIds` |
| `2` | `skillRubricIds` |

Choose contract 2 with the `contract` option, `QUINN_API_CONTRACT=2`, or
`"contract": 2` in the config file. The SDK then sends `x-lp-contract: 2`, and
you must use the contract 2 names in request bodies. The API rejects a request
that mixes the two with a 400.

```ts
const quinn = new Quinn({ contract: 2 });
```

If you pass your own `httpClient`, the SDK adds no headers to it. Set
`x-lp-client` and, for contract 2, `x-lp-contract: 2` yourself.

## Mutation Guard

To block write operations:

```ts
import { Quinn } from "@kaizenlabs/quinn-sdk";

const quinn = new Quinn({
  allowQuinnMutation: false,
});
```

## Mutation Receipts

The SDK can report successful business mutations without changing the return
shape of each service method.

```ts
import { Quinn, type QuinnMutationReceipt } from "@kaizenlabs/quinn-sdk";

const receipts: QuinnMutationReceipt[] = [];

const quinn = new Quinn({
  onMutationCommitted(receipt) {
    receipts.push(receipt);
  },
});

await quinn.signOff.createVersion("form_123", {
  inputDefs: [],
  schema: [],
  html: "<html></html>",
});

console.log(receipts);
// [
//   {
//     operation: "signOff.createVersion",
//     affectedResources: [{ type: "sign-off-form", id: "form_123" }],
//   },
// ]
```

For runtimes that cannot pass constructor callbacks into agent-generated
scripts, you can also register a process-wide observer before `new Quinn()`:

```ts
import { Quinn, setGlobalMutationObserver } from "@kaizenlabs/quinn-sdk";

setGlobalMutationObserver((receipt) => {
  console.log("mutation committed", receipt);
});

const quinn = new Quinn();
```
